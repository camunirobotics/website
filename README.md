# Cambridge University Robotics

A society website for SRCF or static hosting such as GitHub Pages. Pages are built with Node 20+, with a small PHP endpoint for the live Google Calendar timetable. No database, Google API keys or package installation is required.

## Preview

```sh
npm run build
npm run dev
```

Open http://127.0.0.1:4173. Re-run the build and refresh after editing. This preview is static and uses the saved calendar fallback. To test the live calendar, serve the build with PHP instead: `php -S 127.0.0.1:4181 -t dist`.

## Structure

- `scripts/build.mjs`: shared header, project content and four page templates.
- `assets/style.css`: responsive blueprint visual system.
- `assets/app.js`: mobile menu, active project navigation and reduced-motion-aware animations.
- `assets/projects/*.jpg`: project photographs from the CUR Drive; source dates and provenance are in `docs/project-sources.md`.
- `assets/*.svg`: editable concept artwork, including the illustrated hero.
- `scripts/art.mjs`: editable source for the concept drawings.
- `assets/vendor/`: pinned, locally served animation libraries and license notices.
- `assets/calendar*.mjs`: recurring-event parsing, live/fallback loading and the timetable view.
- `assets/calendar-fallback.json`: saved public timetable for static hosting or outages.
- `server/`: public calendar configuration and five-minute PHP feed cache.
- `dist/`: generated website, intentionally ignored by Git.

Run `npm test` after building to check all local links, assets and fragment targets. All content and navigation remain available without the animation libraries. Reduced motion disables pinning and parallax. Scrolling uses the browser’s native behaviour.

## Content still needed

Confirmation of current project activity; committee portraits, if desired; event locations and signup links in the CUR events calendar; current sponsors/logos; Instagram and mailing-list URLs. The events page reads the society�s public CUR events calendar. Committee names reflect the supplied roster. General enquiries use the CUR society email account.

## SRCF deployment

Run `npm run build`, then upload the **contents** of `dist/` to the society's web directory. All local URLs are relative, so the site can run under a subdirectory. SRCF runs the calendar PHP endpoint automatically. PHP needs HTTPS access and a writable system temporary directory. No database or always-running server process is needed. Timetable edits in Google Calendar appear without rebuilding or uploading the website. See `docs/calendar.md` for setup and cache behaviour. GitHub Pages publishes the main branch through `.github/workflows/pages.yml`. GitHub Pages uses the saved timetable in `assets/calendar-fallback.json` when PHP is unavailable. Refresh that copy with `npm run calendar:snapshot`, then rebuild and deploy; Google Calendar edits automatically reach PHP hosting but not the static snapshot. Local changes only reach the live site after an explicitly authorised push.

Research, attribution and design decisions are in `docs/design-notes.md` and `docs/project-sources.md`.
