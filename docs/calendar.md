# Live events calendar

Events live in the public CUR events Google Calendar, owned by camunirobotics@gmail.com. On PHP hosting, update the calendar to update the website; no site rebuild is needed for timetable edits. Static hosting uses a bundled snapshot when the PHP endpoint is unavailable.

## Adding events

Select the CUR events calendar. Enter a title, start/end time and location. Use the event description for public information, with the signup link on its own line:

    Sign up: https://your-signup-form

The page recognises labelled `Sign up:`, `Register:`, `Registration:`, `Booking:` and `Tickets:` links. Links embedded in Google's formatted descriptions work too. With no signup link, no signup button appears. Use Calendar's repeat options and edit/cancel individual sessions normally.

The site shows the next 120 days, up to 80 occurrences, in Europe/London time. All-day events remain all-day events. Past/cancelled occurrences are excluded. The bundled, unmodified ICAL.js 2.2.1 parser handles recurrence, exclusions and moved occurrences. License: assets/vendor/ICAL_LICENSE.txt. Upstream: https://github.com/kewisch/ical.js

## One-time SRCF deployment

Local development was updated to PHP 8.5.12 (released 21 October 2026). Use PHP 8.5.12 or a newer security release on hosting; a maintained PHP 8.4 installation must be at least 8.4.27. The HTTPS stream fetch uses the PHP 8.4+ response-header API. The hosting provider controls the server runtime; uploading this website does not upgrade SRCF's PHP installation.

Build with `npm run build`, then upload the contents of dist/ to the society's SRCF public_html. Keep dist/server/ and dist/assets/ alongside the HTML pages. SRCF regular hosting executes PHP automatically; no database, Google API key, cron job or permanently running application is needed.

The endpoint server/calendar.php reads the public feed configured in server/calendar-config.json. PHP needs either cURL or HTTPS streams with OpenSSL, and a writable temporary directory. It stores the feed outside public_html, using a private per-installation folder under PHP's system temporary directory. An optional CUR_CALENDAR_CACHE_DIR environment variable can point to another private writable directory.

A successful feed refresh is cached for 300 seconds. A nonblocking file lock avoids simultaneous refreshes. Failed refreshes retain the last good calendar and wait 30 seconds before retrying. The page notes when saved data is stale; if no cache exists, it shows a link to Google Calendar. HTTP fetches have an eight-second timeout and a 5 MiB limit. Invalid responses never replace a good cache. The browser refreshes while the page is visible every five minutes, and when returning after that interval.

The endpoint does not accept a calendar/feed URL from the request. Only the configured public calendar is read. Calendar descriptions are rendered as text rather than executable HTML.

## Static fallback and GitHub Pages

The browser tries `server/calendar.php` first. If the request fails, times out, returns PHP source/HTML instead of JSON, or contains invalid calendar data, it loads `assets/calendar-fallback.json`. This checked-in file contains a snapshot of the actual public calendar, not invented events. The same parser, Events/Sessions grouping, signup links and date filtering apply to both sources. A valid but empty live calendar stays empty; it does not resurrect old snapshot events.

The saved timetable uses the same presentation as the live calendar, without technical status notices. The snapshot date remains in the data file for maintainers. If a live timetable is already displayed and a later refresh fails, it keeps that newer timetable rather than replacing it with the bundled snapshot. The PHP server's existing stale-cache fallback also remains intact and is preferred over the bundled file.

GitHub Pages can serve the built `dist/` site without PHP, a Google API key or another service. Its timetable is a saved copy: Google Calendar edits do not automatically update that copy. To refresh it, run `npm run calendar:snapshot`, then `npm run build` and deploy the updated site. Commit `assets/calendar-fallback.json` so deployments from GitHub include the new timetable. The build itself never contacts Google and never overwrites the snapshot. Past events and ended recurring series disappear normally; they are not moved into the future to keep the preview populated.

If both live and saved sources fail, the page keeps its link to Google Calendar and shows an unavailable message.

## Tests and development

`npm run test:calendar` checks recurrence, UK clock changes, overrides and signup parsing. Run the PHP cache tests with `php tests/calendar-cache.php`. Build before serving locally with PHP: `php -S 127.0.0.1:4181 -t dist`. The simple Node preview server is static and does not execute PHP.
