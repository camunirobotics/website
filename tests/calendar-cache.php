<?php
require __DIR__ . '/../server/calendar-cache.php';
function check($ok, $message) { if (!$ok) throw new RuntimeException($message); }
$folder = sys_get_temp_dir() . '/cur-cache-test-' . bin2hex(random_bytes(6));
$file = $folder . '/calendar.json';
$body = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n";
$calls = 0;
$fetch = function () use (&$calls, $body) { $calls++; return $body; };
try {
    $first = cur_calendar_cached($file, $fetch, 1000);
    check(!$first['stale'] && $calls === 1, 'Initial fetch');
    cur_calendar_cached($file, $fetch, 1299);
    check($calls === 1, 'Five-minute cache');
    cur_calendar_cached($file, $fetch, 1300);
    check($calls === 2, 'Refresh after expiry');
    $failure = function () use (&$calls) { $calls++; throw new RuntimeException('Offline'); };
    $stale = cur_calendar_cached($file, $failure, 1600);
    check($stale['stale'] && $stale['calendar'] === $body && $calls === 3, 'Retain last good feed on outage');
    cur_calendar_cached($file, $failure, 1610);
    check($calls === 3, 'Failure backoff');
    cur_calendar_cached($file, function () { return '<html>Bad gateway</html>'; }, 1640);
    check(cur_read_cache($file)['calendar'] === $body, 'Invalid feed cannot replace the cache');
    $lock = fopen($file . '.lock', 'c'); flock($lock, LOCK_EX);
    $locked = cur_calendar_cached($file, $failure, 1700);
    check($locked['calendar'] === $body && $calls === 3, 'Concurrent requests use saved feed');
    flock($lock, LOCK_UN); fclose($lock);
    cur_calendar_cached($file, $fetch, 1800);
    check(!cur_calendar_cached($file, $fetch, 1801)['stale'], 'Recovery from outage');
    $emptyFailure = false;
    try { cur_calendar_cached($folder . '/other.json', $failure, 1801); } catch (Throwable $e) { $emptyFailure = true; }
    check($emptyFailure, 'No cache fails explicitly');
    echo "Calendar cache tests passed.\n";
} finally {
    foreach (glob($folder . '/*') ?: [] as $path) unlink($path);
    if (is_dir($folder)) rmdir($folder);
}
