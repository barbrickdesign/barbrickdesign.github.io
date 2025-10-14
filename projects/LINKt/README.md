SanctumLink — smoke test harness

Prerequisites
- Node.js (recommended 18+)
- Windows PowerShell (or any shell)

Install dev deps and run smoke test:

```powershell
cd d:\LINKt
npm install
npm run test:smoke
```

What the test does
- Loads `link.html` from the local filesystem
- Clicks `Generate QR`, `Test all links`, `Generate nonce` (simulation removed)
- Fails if Puppeteer detects uncaught page errors or console errors

Notes
- Puppeteer will download a Chromium build during `npm install`.
- The smoke test is intentionally lightweight; expand as needed to cover more flows.
