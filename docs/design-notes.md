# Design and research

## Sources reviewed, 15 October 2026

- Cambridge Engineering's CUR profile: https://www.eng.cam.ac.uk/node/7244 — confirms combat robotics, Wise Angel autonomous drones, InMoov humanoid robotics and introductory Minibots. This is historical context, not a claim that a particular schedule or competition entry is current.
- Cambridge SU: https://www.cambridgesu.co.uk/organisation/15566/ — society purpose and broad project descriptions.
- Dyson Centre: https://www.dysoncentre.eng.cam.ac.uk/societies — robotics project context.
- CUAMS: https://cuams.soc.srcf.net/ — clear society introduction and practical participation information.
- Archimedeans: https://archim.org.uk/ — community, events and committee structure.
- CUES: https://www.cues.org.uk/ — member activities and sponsorship visibility.
- Full Blue Racing: https://www.fullblueracing.co.uk/ — project-led presentation and partnerships.
- CUSF: https://www.cusf.co.uk/ — project storytelling and accessible student involvement.

## Design approach and taste skill

The design uses schematic construction geometry and responsive scroll animation (GSAP matchMedia, ScrollTrigger and Lenis lifecycle). This is an adaptation, not a claim to integrate Rough.js. Pinned vendor files retain their source headers and license notices.

Taste skill: https://github.com/Leonxlnx/taste-skill/tree/main/skills/taste-skill
Direction: One motif, seed 1432368345. User direction fixes blueprint palette, schematic imagery and a sequence of four projects. These override incompatible dealt composition/photography requirements. No random redraws.

Subject inventory: Cambridge student society; combat robots; autonomous drone; InMoov; Minibots; introductory learning; shared workbench; 3D-printed components; circuits; software meeting mechanical systems.

Idea: CUR's four different robot projects become a shared drawing sheet, moving from the whole workbench into each individual build. Live interaction: select a project in the rail or scroll through the drawing stage. Events also have working category filters.

Argument: society identity → accessible hands-on making → four concrete projects → how to get involved. Copy is kept factual and does not invent sponsors, achievements, appointments or dates.

Original vector concept drawings stand in for one society photo and four project photos. They are not accurate technical drawings of CUR hardware. The temporary robot brand icon also needs confirmation. No found photography or video is used. The user explicitly requested placeholders and restrained motion, then requested richer scrolling and the same pale 32px grid throughout.

## Review

Round 1: desktop, tablet and mobile screenshots showed clear hierarchy and recognisable robot imagery. Fixed tablet artwork encroaching on supporting text, mobile text below 13px, and insufficient scroll progression. Added a true pinned desktop chapter stage, drawing transforms and a tracing progress line. Mobile and reduced-motion views retain the linear content order.

Round 2: taste inspector passed with explicit exceptions for blueprint lines/grid, schematic captions and user-authorized placeholder drawings. It reports a wide type-size range, missing footage and a long-pin warning. Footage is intentionally deferred; the type sizes distinguish navigation, captions and editorial content. Its automated scroll capture interacts poorly with Lenis, so the pin warning is supplemented by interactive browser inspection.

Self-assessment under the skill's strict placeholder caps: design 6.5, usability 8, creativity 7, content 5; overall 6.9. This reflects intentionally missing real society imagery/content, not a launch-readiness claim. Before launch, photography and confirmed content are the main improvements.

Validation: five-page static build; 93 local link/asset and anchor checks; JavaScript syntax check; responsive home inspection at 1440, 768 and 390px; browser event-filter check; interactive pinned-stage inspection. No SRCF deployment performed.


## Sponsorship copy revision — 18 October 2026

Replaced promotional filler and sponsor placeholders with the society's project scope, accepted forms of support, possible collaboration and a direct sponsorship enquiry address. No unverified sponsor list, tiers, audience counts or benefits were imported.

References reviewed for structure and tone (original CUR wording, not copied text):
- Full Blue Racing: https://www.fullblueracing.co.uk/ — partners and direct contact.
- CUES: https://www.cues.org.uk/partner-information/ — concrete ways for companies to work with students.
- CUSF: https://www.cusf.co.uk/about/sponsorship/ — financial, in-kind and technical support; concise enquiry invitation.
- Riviera Racing: https://rivieraracing.co.uk/ — industry partners, technical project context and contact.

The enquiry address is the connected CUR society account, camunirobotics@gmail.com. Removed visible photo provenance notes at the user's request; original source records remain in docs/project-sources.md.


## Whole-site copy revision — 18 October 2026

Reviewed Full Blue Racing (https://www.fullblueracing.co.uk/), CUES (https://www.cues.org.uk/), CUSF (https://www.cusf.co.uk/) and Riviera Racing (https://rivieraracing.co.uk/) for concrete identity, project descriptions and joining/contact routes. Original CUR copy now uses the society name, descriptive section headings, documented project work and direct email links. Generic slogans and invented event listings were removed. Facts remain grounded in CUR's Drive records and the committee roster supplied by the user; no other society's membership figures, achievements, programme or promises were adopted.
