# Runtime distribution

Pyodide **314.0.7**, CPython **3.14.2** observed in Chromium.

Source: https://registry.npmjs.org/pyodide/-/pyodide-314.0.7.tgz

The official npm tarball SHA-512 SRI was verified before extraction. `manifest.json` records that integrity value plus SHA-256 and sizes of five **unmodified distributed artifacts**, totaling 13,532,188 bytes. Browser bootstrap verifies those bytes before using them. Pyodide MPL-2.0 and CPython license texts were retrieved from their exact release tags and are included beside the artifacts.

The runtime remains a classic worker in an opaque-origin frame with network-blocking CSP. A local Blob dynamic import loads `pyodide.asm.mjs`, then supplies its factory through the published experimental `createPyodideModule` option. This pinned injection point avoids the module-worker origin problem found in the earlier release attempt, without adding allow-same-origin. Updates must repeat the real worker/CSP, interruption, memory and mobile tests.

The trusted loader applies `runtime/memory.js` to the verified WASM **in memory** before instantiation. It changes the primary memory declaration to a maximum of 1024 pages (64 MiB), validates the pinned format, and fails closed on unsupported binaries. The vendor file on disk is unchanged. The browser engine enforces this maximum even when memory is defined inside the module. This does not bound all JavaScript/buffer/browser memory or claim an absolute sandbox.

The previous 0.29.3 / CPython 3.13.2 distribution remains in Git history. The new release removes reliance on that older CPython after reviewing later upstream security fixes. Package advisory lookups are limited evidence, not a declaration that all compiled/transitive components are vulnerability-free.
