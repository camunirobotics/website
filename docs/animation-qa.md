# Animation repair and browser QA — 15 October 2026

## Problems repaired

- Removed Lenis initialization and CSS smooth scrolling competing with scroll-driven state.
- Uses a single pinned scene and discrete chapter selection from one progress value.
- Pin the entire project section, including navigation, instead of pinning one grid child while a separate sticky sidebar follows different geometry.
- Removed crossfading article layers, which overlapped text and used a different clock from navigation and accessibility state.
- Exactly one chapter is visible and interactive in pinned mode. Only artwork transforms; descriptions remain fully readable.
- Restore all four chapters, clear transforms and remove the pin when the viewport or reduced-motion preference requires the linear layout.
- Preserve contexts across the browser back/forward cache and refresh restored geometry.
- Project links, direct hashes and history navigation map to chapter positions in the pin.

## Executed in the in-app browser

At 736 × 827, scrolled down through Minibots and beyond the pin, reversed through Minibots → InMoov → Wise Angel → Combat, then forward through all chapters again. Ten observations: exactly one visible chapter; active link matched every chapter; no horizontal overflow; during pin, scene top stayed at 0 and action-link bottom stayed at 704px. Beyond the pin, scene moved upwards normally into the next section.

Resized through 390 × 844 → 1440 × 900 → 736 × 827 → 1024 × 600 → 736 × 827. Phone and short window: zero pin spacers, four visible chapters. Desktop sizes: exactly one spacer and one visible chapter, no overflow.

Clicked all four project links and waited for each requested heading to become visible. Reloaded on the Minibots hash. Used browser Back and verified InMoov became active.

Emulated reduced motion: zero pin spacers and four visible chapters. Cleared the emulation and restored the original viewport. Inspected the pinned scene visually for clipping and overlap.

Static checks: `npm run build`, `npm test` (five pages and 88 internal links/assets/anchors), `node --check assets/app.js`, and `git diff --check`.

This is local browser QA, not a claim of testing every browser/device. Original concept artwork remains a placeholder for society photography.

## Text transition follow-up

Adapted Atlas's staggered rise-and-fade to scroll progress. Each chapter holds readable copy through its middle, exits upwards near the end, then the next chapter enters from below. The heading leads the description slightly. Exactly one chapter remains rendered; no independent timers or crossfading article layers.

Verified twelve small forward/reverse scroll samples over the Wise Angel/InMoov boundary. Outgoing opacity fell to 0.306/0.133 with upward offsets; incoming opacity rose through 0.378/0.170 with downward offsets before reaching 1/1 at rest. Reverse samples matched. Mobile breakpoint removes the copy transforms/opacity and exposes all four chapters.
