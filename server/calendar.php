<?php
require_once __DIR__ . '/calendar-cache.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405); header('Allow: GET'); echo '{"error":"Method not allowed"}'; exit;
}
$config = json_decode(file_get_contents(__DIR__ . '/calendar-config.json'), true, 512, JSON_THROW_ON_ERROR);
$url = $config['feedUrl'];
$directory = getenv('CUR_CALENDAR_CACHE_DIR') ?: sys_get_temp_dir() . '/cur-calendar-' . substr(hash('sha256', __DIR__ . $url), 0, 16);
try {
    $payload = cur_calendar_cached($directory . '/calendar.json', function () use ($url) { return cur_fetch_calendar($url); }, time());
    echo json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    error_log('CUR calendar: ' . $error->getMessage());
    http_response_code(503); header('Retry-After: 30');
    echo '{"error":"Calendar temporarily unavailable"}';
}
