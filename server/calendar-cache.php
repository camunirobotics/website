<?php
// The cache lives outside the public website and stores only the public feed.
function cur_valid_calendar($body) {
    return is_string($body) && strlen($body) <= 5 * 1024 * 1024
        && preg_match('/^(?:\xEF\xBB\xBF)?BEGIN:VCALENDAR\r?\n/', $body)
        && strpos($body, 'END:VCALENDAR') !== false;
}
function cur_fetch_calendar($url) {
    $limit = 5 * 1024 * 1024;
    if (function_exists('curl_init')) {
        $request = curl_init($url);
        $body = '';
        curl_setopt_array($request, [CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 8, CURLOPT_USERAGENT => 'CUR website calendar/1.0',
            CURLOPT_WRITEFUNCTION => function ($handle, $chunk) use (&$body, $limit) {
                if (strlen($body) + strlen($chunk) > $limit) return 0;
                $body .= $chunk; return strlen($chunk);
            }]);
        $ok = curl_exec($request);
        $status = curl_getinfo($request, CURLINFO_RESPONSE_CODE);
        unset($request);
        if ($ok === false || $status !== 200) throw new RuntimeException('Calendar fetch failed');
    } else {
        $context = stream_context_create(['http' => ['timeout' => 8, 'follow_location' => 0,
            'header' => "User-Agent: CUR website calendar/1.0\r\n"]]);
        $body = @file_get_contents($url, false, $context, 0, $limit + 1);
        $headers = http_get_last_response_headers() ?? [];
        if ($body === false || !isset($headers[0]) ||
            !preg_match('/\s200\s/', $headers[0])) throw new RuntimeException('Calendar fetch failed');
    }
    if (!cur_valid_calendar($body)) throw new RuntimeException('Invalid calendar feed');
    return $body;
}
function cur_read_cache($file) {
    $data = @file_get_contents($file);
    $entry = $data === false ? null : json_decode($data, true);
    return is_array($entry) && isset($entry['fetchedAt']) && cur_valid_calendar($entry['calendar'] ?? null) ? $entry : null;
}
function cur_save_cache($file, $entry) {
    $temporary = @tempnam(dirname($file), 'cur-');
    if ($temporary === false) throw new RuntimeException('Cache directory is not writable');
    if (@file_put_contents($temporary, json_encode($entry, JSON_THROW_ON_ERROR)) === false || !@rename($temporary, $file)) {
        @unlink($temporary); throw new RuntimeException('Calendar cache write failed');
    }
}
function cur_calendar_payload($entry, $now) {
    return ['calendar' => $entry['calendar'], 'updatedAt' => gmdate('c', $entry['fetchedAt']),
        'stale' => $now - $entry['fetchedAt'] >= 300];
}
function cur_calendar_cached($file, $fetch, $now) {
    $entry = cur_read_cache($file);
    if ($entry && ($now - $entry['fetchedAt'] < 300 || ($entry['retryAfter'] ?? 0) > $now)) return cur_calendar_payload($entry, $now);
    $directory = dirname($file);
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Cannot create calendar cache');
    $lock = @fopen($file . '.lock', 'c');
    if (!$lock) throw new RuntimeException('Cannot lock calendar cache');
    if (!flock($lock, LOCK_EX | LOCK_NB)) {
        fclose($lock);
        if ($entry) return cur_calendar_payload($entry, $now);
        throw new RuntimeException('Calendar is loading');
    }
    try {
        $entry = cur_read_cache($file);
        if ($entry && ($now - $entry['fetchedAt'] < 300 || ($entry['retryAfter'] ?? 0) > $now)) return cur_calendar_payload($entry, $now);
        try {
            $calendar = $fetch();
            if (!cur_valid_calendar($calendar)) throw new RuntimeException('Invalid calendar feed');
            $next = ['calendar' => $calendar, 'fetchedAt' => $now];
            cur_save_cache($file, $next);
            return cur_calendar_payload($next, $now);
        } catch (Throwable $error) {
            if (!$entry) throw $error;
            $entry['retryAfter'] = $now + 30;
            try { cur_save_cache($file, $entry); } catch (Throwable $ignored) {}
            return cur_calendar_payload($entry, $now);
        }
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}
