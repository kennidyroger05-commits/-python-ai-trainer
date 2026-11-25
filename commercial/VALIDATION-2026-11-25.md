# Commercial readiness — 25 November 2026
Branch: feature/commercial-readiness-v1 (draft PR #9).
## Executed independently
- Native Node v22.16.0: 35 HTTP/helper assertions, using mock Supabase and static assets. Verified Git blob hashes of worker.mjs (43755ebf7ee342f5b7fa1f128f4276bc5d1b42e7), auth-email.mjs (e978ba4aa5f8882dd694b38ce3e47dfffcce2776), extended-tests.mjs (9a071410b9b64f9be053d1a2e5c53f01bc8e5b91).
- Native Node: 16 optional email-auth assertions, simulated provider. Test blob d227622205a4cb41806479aa74605a73048f79da.
- Python 3.13.5: 18 reference-solution cases matching the six new writing challenges. Not execution inside Pyodide or student evaluation.
- No terminal GitHub DNS access; no complete checkout/build, browser run or PostgreSQL/Supabase execution in this environment.
## Release gates
- V4 base: confirmed merged (PR #8); commercial branch isolated.
- Free first unit and six new code-writing challenges: implemented; browser/build pending.
- Authentication, account recovery, RLS, progress backup and Free/Pro routing: implemented for staging; live integration pending.
- Payment ledger: code only; no verified event adapter, checkout, database migration, or sales.
- Pilot protocol: ready; actual mobile devices, user studies and independent review pending.
- Production: BLOCKED; account access, ownership/license verification, legal disclosures, security review, SMTP and anti-bot protections required.
- No resources purchased, no live payment enabled, no secrets used.
