# V2: 40 verified lessons, debugging and simulated AI labs

Base: `feature/v1-5-learning`. This change preserves the fifteen V1.5 lessons and adds 25 original lessons, six exercise modes, a debugging lab, five simulated AI flows, six execution traces and adaptive review. Existing V1/V1.5 progress migrates locally without deleting the previous record. Partial answers and trace position survive screen and language changes during the session.

Content is organized by concepts and prerequisites with Portuguese, Mixed and English explanations. Python runs only in development fixtures; the frontend validates explicit answers and predefined traces.

Validation passed:
- Node content/game tests, negative content mutations, V1/V1.5 preservation and migration, XP, review eligibility/cooldown and independent sessions.
- CPython 3.12.14: all 40 lesson outcomes, patch alternatives, five exact exception messages, logic error and six intermediate/final traces.
- Chromium touch tests at 320, 375 and 390px: all 40 lessons and six modes; five eight-stage AI scenarios; six debugging investigations/repairs; languages, glossary offline, reviews, storage, restart/reset, reduced motion and no horizontal page overflow.
- JavaScript syntax, JSON and diff checks. Mobile captures inspected.

Limitations: Safari/WebKit and real iPhone are unavailable. Traces and AI requests are fictional simulations. Static validation does not prove general Python equivalence or professional proficiency. Partial drafts live in session memory; completed progress and preferences persist. Full report: `docs/REPORT-V2.md`.

Draft for review only. Do not merge automatically, change Pages or publish V2. Main and PR #1 remain untouched.
