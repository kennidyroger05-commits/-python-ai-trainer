# Runtime distribution

Pyodide **0.29.3**, CPython **3.13.2** (observed in the browser).

Source: https://registry.npmjs.org/pyodide/-/pyodide-0.29.3.tgz

The npm tarball was verified against the official registry SHA-512 integrity value before extraction. `manifest.json` records the SRI plus SHA-256 and sizes of five unmodified browser artifacts. The app verifies those files before transferring them to the isolated frame. Run `node scripts/verify-runtime.cjs` to check the checkout.

The five runtime files total 12,284,602 bytes. They are loaded only after an explicit Python run, not on initial app load. Vendoring is deliberate: GitHub Pages can serve the application and runtime without third-party CDN calls or learner-code transfers.

Pyodide uses MPL-2.0; CPython uses the Python license. License texts are included under `vendor/pyodide/`. The standard-library archive and generated artifacts are redistributed unchanged. Browser application code is separate.

The newer official 314.0.7 distribution was evaluated but not retained: it requires module workers, which failed in the tested opaque-origin sandbox. 0.29.3 supports classic workers, so isolation was preserved rather than weakening origin restrictions. Updating the pinned runtime requires repeating worker/CSP, Python, interruption and mobile tests; the manifest is not a substitute for trusted hosting.
