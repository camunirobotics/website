# Cambridge University Robotics

A static society website, designed for ordinary SRCF web hosting. No backend, database, API keys or package installation required. Node 20+ is used only to build and preview locally.

## Preview

```sh
npm run build
npm run dev
```

Open http://127.0.0.1:4173. Re-run the build and refresh after editing.

## Structure

- `scripts/build.mjs`: shared header/footer, project content and five page templates.
- `assets/style.css`: responsive blueprint visual system.
- `assets/app.js`: mobile menu, event filters, active project navigation and reduced-motion-aware animations.
- `assets/*.svg`: original placeholder artwork. Replace image references in the templates with real photos when ready.
- `scripts/art.mjs`: editable source for the concept drawings.
- `assets/vendor/`: pinned, locally served animation libraries and license notices.
- `dist/`: generated static website, intentionally ignored by Git.

Run `npm test` after building to check all local links, assets and fragment targets. All content and navigation remain available without the animation libraries. Reduced motion disables pinning and parallax. Scrolling uses the browser’s native behaviour.

## Content still needed

Society logo and group photograph; four project photographs; current project descriptions; confirmed committee roles, names and portraits; actual events, times, locations and signup links; sponsors/logos; email, Instagram, mailing-list/Linktree and calendar URLs. Sample events and committee roles are clearly labelled. Contact placeholders are text, not dead links or fake forms.

## SRCF later

Run `npm run build`, then upload the **contents** of `dist/` to the society's web directory. All local URLs are relative, so the site can run under a subdirectory. No server process is needed in production. No deployment has been performed.

Research, attribution and design decisions are in `docs/design-notes.md` and the site's preview credits page.
