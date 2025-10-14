Vendor files for SanctumLink

Goal
----
Provide an easy local fallback for a browser-ready UMD build of `@solana/web3.js` so the page can load web3 from disk (no CDN) and avoid ESM dynamic import and node-shim problems.

What to drop here
-----------------
Place any one of the following filenames (preferred) into this folder:

- `@solana_web3.umd.js`
- `index.browser.umd.js`
- `solana-web3.umd.js`

You can obtain a browser-ready UMD build from the official package distribution or create one using your bundler. The SelfHeal injector will attempt to HEAD-check and inject any of the filenames above.

Why this helps
---------------
- Avoids CDN availability and CORS issues.
- Avoids browser ESM dynamic import problems related to Node-style specifiers.
- Provides stable, reproducible runtime for wallet and RPC features.

How to test
-----------
1. Place the UMD file in this folder.
2. Serve the site over HTTP (e.g. `python -m http.server 8000` or the included PowerShell server).
3. Open `http://localhost:8000/link.html`, and the SelfHeal "Inject web3 bundle" button will prefer the local vendor file.

If you want me to fetch and place a vetted UMD into this repo, say so and I'll attempt to add one (note: network fetch required).