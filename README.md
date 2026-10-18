# Cambridge University Robotics

A static society website, designed for ordinary SRCF web hosting. No backend, database, API keys or package installation required. Node 20+ is used only to build and preview locally.

## Preview

```sh
npm run build
npm run dev
```

Open http://127.0.0.1:4173. Re-run the build and refresh after editing.

## Structure

- `scripts/build.mjs`: shared header/footer, project content and four page templates.
- `assets/style.css`: responsive blueprint visual system.
- `assets/app.js`: mobile menu, active project navigation and reduced-motion-aware animations.
- `assets/projects/*.jpg`: project photographs from the CUR Drive; source dates and provenance are in `docs/project-sources.md`.
- `assets/*.svg`: editable concept artwork, including the illustrated hero.
- `scripts/art.mjs`: editable source for the concept drawings.
- `assets/vendor/`: pinned, locally served animation libraries and license notices.
- `dist/`: generated static website, intentionally ignored by Git.

Run `npm test` after building to check all local links, assets and fragment targets. All content and navigation remain available without the animation libraries. Reduced motion disables pinning and parallax. Scrolling uses the browser’s native behaviour.

## Content still needed

Confirmation of current project activity; committee portraits, if desired; confirmed event dates, times, locations and signup links; current sponsors/logos; Instagram, mailing-list and calendar URLs. The events page describes documented activities without inventing upcoming sessions. Committee names reflect the supplied roster. General enquiries use the CUR society email account.

## SRCF later

Run `npm run build`, then upload the **contents** of `dist/` to the society's web directory. All local URLs are relative, so the site can run under a subdirectory. No server process is needed in production. GitHub Pages publishes the main branch through `.github/workflows/pages.yml`. Local changes only reach the live site after an explicitly authorised push.

Research, attribution and design decisions are in `docs/design-notes.md` and `docs/project-sources.md`.
