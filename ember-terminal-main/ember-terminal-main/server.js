// server.js
// Full authoritative server for Mandem.OS Ember Terminal (demo).
// - Verifies EVM signatures (personal_sign / eth_sign).
// - Verifies on-chain ERC-1155 ownership (tokenId 45) via RPC.
// - Implements GitHub OAuth linking (server stores OAuth token in-memory for demo).
// - Exposes endpoints: /link/github/start, /link/github/callback, /api/whoami, /api/github/repos, /api/repo-op, /api/contribution, /api/layout, /api/checkin
// - Broadcasts events via Socket.IO.
//
// WARNING: This is a demo. Replace in-memory stores with a proper DB, add HTTPS, rate-limiting, robust error handling, and secure secret storage for production.

const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const { ethers } = require('ethers');
const fetch = require('node-fetch'); // for GitHub OAuth token exchange and GitHub API calls
const crypto = require('crypto');
require('dotenv').config();

// Config
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const RPC_URL = process.env.RPC_URL || 'https://cloudflare-eth.com';
const CONTRACT = process.env.CONTRACT || '0x45a328572b2a06484e02EB5D4e4cb6004136eB16';
const GOD_TOKEN_ID = Number(process.env.GOD_TOKEN_ID || 45);

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`; // must match GitHub OAuth callback

const COOKIE_SECRET = process.env.COOKIE_SECRET || crypto.randomBytes(24).toString('hex');

// In-memory stores (demo)
const layoutStore = { version: 1, payload: null, updatedAt: null, lastAuthor: null };
const contributions = []; // persisted contributions
const audit = [];
const linkedAccounts = {}; // walletAddress (lowercase) -> { githubLogin, oauthToken }

// Ethers provider + ABI helper
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const ERC1155_IFACE = new ethers.utils.Interface(['function balanceOf(address account, uint256 id) view returns (uint256)']);

// Helpers
function recoverSigner(message, signature) {
  try { return ethers.utils.verifyMessage(message, signature); } catch (e) { return null; }
}
async function checkTokenHolding(address, tokenId) {
  const data = ERC1155_IFACE.encodeFunctionData('balanceOf', [address, tokenId]);
  const res = await provider.call({ to: CONTRACT, data });
  const bn = ethers.BigNumber.from(res);
  return bn.gt(0);
}
function now() { return Date.now(); }
function canonical(addr){ return String(addr || '').toLowerCase(); }

// Express setup
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json({ limit: '256kb' }));
app.use(cookieParser(COOKIE_SECRET));

// HTTP + Socket.IO
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: true } });

io.on('connection', socket => {
  console.log('socket connected', socket.id);
  // send current layout
  socket.emit('layout:current', layoutStore);
  socket.on('disconnect', () => console.log('socket disconnected', socket.id));
});

// --- GitHub OAuth routes (simple) ---

// Start: redirect user to GitHub OAuth authorization
app.get('/link/github/start', (req, res) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.status(500).send('GitHub OAuth not configured on server');
  }
  // create a short-lived state and set cookie
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('gh_oauth_state', state, { httpOnly: true, sameSite: 'lax' });
  const redirect = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(GITHUB_CLIENT_ID)}&scope=repo&state=${state}`;
  return res.redirect(redirect);
});

// Callback: exchange code for token, fetch user, store mapping in session cookie for simple demo
app.get('/link/github/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const cookieState = req.signedCookies ? req.signedCookies['gh_oauth_state'] || req.cookies['gh_oauth_state'] : req.cookies['gh_oauth_state'];
    if (!state || !cookieState || state !== cookieState) {
      return res.status(400).send('Invalid OAuth state');
    }

    // exchange code for access token
    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new URLSearchParams({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code: code })
    });
    const tokenJson = await tokenResp.json();
    if (!tokenJson || !tokenJson.access_token) {
      return res.status(500).send('GitHub token exchange failed: ' + JSON.stringify(tokenJson));
    }
    const accessToken = tokenJson.access_token;

    // fetch user
    const userResp = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}`, Accept: 'application/json' }
    });
    const userJson = await userResp.json();
    if (!userJson || !userJson.login) return res.status(500).send('Unable to fetch GitHub user');

    // store temporary mapping in cookie for the user to confirm via wallet signature
    const session = { github: userJson.login, oauthToken: accessToken };

    // store session in signed cookie for demo (short-lived)
    res.cookie('gh_link_pending', JSON.stringify(session), { maxAge: 10 * 60 * 1000, httpOnly: true, signed: true, sameSite: 'lax' });

    // instruct user to return to Ember Terminal and sign challenge (server will create challenge endpoint)
    return res.send(`<html><body> <p>GitHub account <strong>${userJson.login}</strong> linked temporarily. Return to the Ember Terminal to complete wallet verification.</p> <p>Close this window and sign the challenge in the terminal UI.</p> </body></html>`);
  } catch (e) {
    console.error('github callback error', e);
    return res.status(500).send('OAuth callback error: ' + e.message);
  }
});

// Provide a short challenge for the client to sign, then complete linking
app.get('/link/github/challenge', (req, res) => {
  const pending = req.signedCookies && req.signedCookies['gh_link_pending'];
  if (!pending) return res.status(400).json({ error: 'No pending GitHub OAuth session found in cookies' });
  const session = typeof pending === 'string' ? JSON.parse(pending) : pending;
  const nonce = crypto.randomBytes(16).toString('hex');
  // store pending nonce in cookie for verification
  res.cookie('gh_link_nonce', nonce, { maxAge: 10 * 60 * 1000, httpOnly: true, signed: true, sameSite: 'lax' });
  res.json({ challenge: `Link GitHub:${session.github};nonce:${nonce};ts:${now()}` });
});

// Endpoint to finalize GitHub linking: expects { payload, signature, address }
// payload must be exactly the challenge string issued earlier
app.post('/link/github/complete', async (req, res) => {
  try {
    const { payload, signature, address } = req.body;
    if (!payload || !signature || !address) return res.status(400).json({ error: 'payload, signature, address required' });

    // recover signer
    const recovered = recoverSigner(payload, signature);
    if (!recovered) return res.status(401).json({ error: 'invalid signature' });
    if (recovered.toLowerCase() !== address.toLowerCase()) return res.status(401).json({ error: 'signature does not match address' });

    // verify nonce
    const nonce = req.signedCookies && req.signedCookies['gh_link_nonce'];
    if (!nonce) return res.status(400).json({ error: 'missing nonce cookie' });
    if (!payload.includes(nonce)) return res.status(400).json({ error: 'challenge payload mismatch' });

    // load pending oauth session
    const pending = req.signedCookies && req.signedCookies['gh_link_pending'];
    if (!pending) return res.status(400).json({ error: 'no pending oauth session' });
    const session = typeof pending === 'string' ? JSON.parse(pending) : pending;

    // server-side on-chain check: ensure address holds GOD_TOKEN_ID
    const holds = await checkTokenHolding(address, GOD_TOKEN_ID);
    if (!holds) return res.status(403).json({ error: `address does not hold required tokenId ${GOD_TOKEN_ID}` });

    // persist mapping (in-memory demo)
    linkedAccounts[address.toLowerCase()] = { githubLogin: session.github, oauthToken: session.oauthToken, linkedAt: now() };
    audit.push({ type: 'link', address: address.toLowerCase(), github: session.github, ts: now() });

    // clear cookies
    res.clearCookie('gh_link_pending');
    res.clearCookie('gh_link_nonce');

    // set a session cookie to represent logged-in UI (demo)
    res.cookie('gh_session', JSON.stringify({ address: address.toLowerCase(), github: session.github }), { httpOnly: true, signed: true, sameSite: 'lax' });

    return res.json({ ok: true, github: session.github });
  } catch (e) {
    console.error('link complete error', e);
    return res.status(500).json({ error: e.message });
  }
});

// --- API: whoami and github repos (use stored session cookie) ---
app.get('/api/whoami', (req, res) => {
  try {
    const session = req.signedCookies && req.signedCookies['gh_session'];
    if (!session) {
      return res.json({ ok: true, github: null });
    }
    const s = typeof session === 'string' ? JSON.parse(session) : session;
    return res.json({ ok: true, github: s.github, address: s.address });
  } catch (e) {
    return res.json({ ok: false });
  }
});

// list repos via stored oauth token for the linked wallet (demo: returns repos for the linked GitHub user)
app.get('/api/github/repos', async (req, res) => {
  try {
    const session = req.signedCookies && req.signedCookies['gh_session'];
    if (!session) return res.status(401).json({ error: 'no linked session' });
    const s = typeof session === 'string' ? JSON.parse(session) : session;
    const mapping = linkedAccounts[s.address];
    if (!mapping) return res.status(403).json({ error: 'no mapping found' });

    // fetch repos via GitHub API
    const r = await fetch('https://api.github.com/user/repos?per_page=200', {
      headers: { Authorization: `token ${mapping.oauthToken}`, Accept: 'application/vnd.github.v3+json' }
    });
    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: 'github api failed: ' + text });
    }
    const repos = await r.json();
    // return a minimal set
    const out = repos.map(rp => ({ id: rp.id, full_name: rp.full_name, description: rp.description }));
    return res.json(out);
  } catch (e) {
    console.error('api/github/repos error', e);
    return res.status(500).json({ error: e.message });
  }
});

// --- Protected middleware: verify signature + on-chain ownership of tokenId 45 ---
// Expects body { payload, signature, address }
async function verifyHolderMiddleware(req, res, next) {
  try {
    const { payload, signature, address } = req.body;
    if (!payload || !signature || !address) return res.status(400).json({ error: 'payload, signature, address required' });
    const recovered = recoverSigner(payload, signature);
    if (!recovered) return res.status(401).json({ error: 'invalid signature' });
    if (recovered.toLowerCase() !== address.toLowerCase()) return res.status(401).json({ error: 'signature does not match address' });
    const holds = await checkTokenHolding(address, GOD_TOKEN_ID);
    if (!holds) return res.status(403).json({ error: `address does not hold required tokenId ${GOD_TOKEN_ID}` });
    req.verified = { address: address.toLowerCase(), payload: typeof payload === 'string' ? payload : JSON.stringify(payload), signature };
    next();
  } catch (e) {
    console.error('verifyHolderMiddleware err', e);
    return res.status(500).json({ error: 'verification error' });
  }
}

// --- API: layout update (only verified holders) ---
app.post('/api/layout', verifyHolderMiddleware, (req, res) => {
  const { payload } = req.body;
  const meta = req.verified;
  layoutStore.version += 1;
  layoutStore.payload = payload;
  layoutStore.updatedAt = Date.now();
  layoutStore.lastAuthor = meta.address;
  audit.push({ type: 'layout', author: meta.address, ts: Date.now(), payload: meta.payload });
  io.emit('layout:update', { payload, author: meta.address, ts: Date.now(), version: layoutStore.version });
  return res.json({ ok: true, layout: layoutStore });
});

// --- API: checkin (verified holder) ---
app.post('/api/checkin', verifyHolderMiddleware, (req, res) => {
  const { address } = req.verified;
  const ts = Date.now();
  contributions.unshift({ type: 'checkin', address, ts });
  audit.push({ type: 'checkin', author: address, ts });
  io.emit('checkin:new', { address, ts });
  return res.json({ ok: true });
});

// --- API: contribution (signed payload by holder) ---
app.post('/api/contribution', verifyHolderMiddleware, (req, res) => {
  const { payload } = req.body;
  const meta = req.verified;
  // store contribution (payload is stringified by client)
  const entry = { type: 'contribution', author: meta.address, payload, signature: req.body.signature, ts: Date.now() };
  contributions.unshift(entry);
  audit.push({ type: 'contribution', author: meta.address, ts: Date.now() });
  io.emit('contribution:new', entry);
  return res.json({ ok: true });
});

// --- API: repo operation (verified holder + linked GitHub account required) ---
// This endpoint performs a safe demo operation: create a branch named "mandem-<ts>" and optionally create a file commit.
// For real usage, validate and restrict ops heavily.
app.post('/api/repo-op', verifyHolderMiddleware, async (req, res) => {
  try {
    const { payload } = req.body; // payload is JSON string
    const meta = req.verified;
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const repo = parsed.repo;
    const op = parsed.op;
    if (!repo || !op) return res.status(400).json({ error: 'repo and op required' });

    // check mapping wallet -> github account and oauth token
    const mapping = linkedAccounts[meta.address];
    if (!mapping) return res.status(403).json({ error: 'no linked GitHub account for this wallet' });

    // safe demo: create branch and commit a small file for create-file or create branch only for create-branch
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) return res.status(400).json({ error: 'repo must be owner/repo' });

    // helper for GitHub API requests using oauth token
    async function ghFetch(path, method='GET', body=null){
      const url = `https://api.github.com${path}`;
      const headers = { Authorization: `token ${mapping.oauthToken}`, Accept: 'application/vnd.github.v3+json' };
      const opts = { method, headers };
      if (body) { opts.body = JSON.stringify(body); headers['Content-Type'] = 'application/json'; }
      const r = await fetch(url, opts);
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch(e) {}
      return { ok: r.ok, status: r.status, text, json };
    }

    // get repo info
    const repoResp = await ghFetch(`/repos/${owner}/${repoName}`);
    if (!repoResp.ok) return res.status(500).json({ error: 'failed fetching repo: ' + (repoResp.text || repoResp.status) });
    const defaultBranch = repoResp.json.default_branch || 'main';

    // get latest commit sha of default branch
    const refResp = await ghFetch(`/repos/${owner}/${repoName}/git/refs/heads/${defaultBranch}`);
    if (!refResp.ok) return res.status(500).json({ error: 'failed fetching branch ref: ' + (refResp.text || refResp.status) });
    const latestSha = refResp.json.object.sha;

    // create new branch
    const newBranch = `mandem-${Date.now()}`;
    const createRefBody = { ref: `refs/heads/${newBranch}`, sha: latestSha };
    const createRefResp = await ghFetch(`/repos/${owner}/${repoName}/git/refs`, 'POST', createRefBody);
    if (!createRefResp.ok) return res.status(500).json({ error: 'failed creating ref: ' + (createRefResp.text || createRefResp.status) });

    // if op === create-file, create a file via create-or-update-file endpoint
    if (op === 'create-file') {
      const path = parsed.path || `mandem/${Date.now()}.txt`;
      const content = parsed.content || `Created by Mandem.OS Ember Terminal at ${new Date().toISOString()}`;
      const fileResp = await ghFetch(`/repos/${owner}/${repoName}/contents/${encodeURIComponent(path)}`, 'PUT', { message: `Mandem: add ${path}`, content: Buffer.from(content).toString('base64'), branch: newBranch });
      if (!fileResp.ok) return res.status(500).json({ error: 'failed creating file: ' + (fileResp.text || fileResp.status) });

      audit.push({ type: 'repo-op', op, repo, author: meta.address, ts: Date.now(), details: { branch: newBranch, path } });
      io.emit('repo:update', { repo, op, author: meta.address, branch: newBranch, path });
      return res.json({ ok: true, repo, op, branch: newBranch, path, result: fileResp.json });
    }

    // create-branch only
    audit.push({ type: 'repo-op', op, repo, author: meta.address, ts: Date.now(), details: { branch: newBranch } });
    io.emit('repo:update', { repo, op, author: meta.address, branch: newBranch });
    return res.json({ ok: true, repo, op, branch: newBranch });
  } catch (e) {
    console.error('repo-op error', e);
    return res.status(500).json({ error: e.message });
  }
});

// --- Simple audit & status endpoints ---
app.get('/api/audit', (req, res) => res.json({ audit, layout: layoutStore, contributionsCount: contributions.length }));
app.get('/api/layout', (req, res) => res.json(layoutStore));

app.get('/api/leaderboard', (req, res) => {
  // demo leaderboard: build from linkedAccounts and contributions (not authoritative)
  const rows = Object.keys(linkedAccounts).slice(0,200).map((addr, idx) => {
    const keys = [GOD_TOKEN_ID]; // server knows token required; for demo assume linked accounts hold it
    return { address: addr, keys, score: 10000 - idx };
  });
  res.json({ rows });
});

// Start server
server.listen(PORT, () => {
  console.log(`Mandem.OS server listening on port ${PORT}`);
  console.log('RPC_URL', RPC_URL);
  console.log('CONTRACT', CONTRACT);
  console.log('GOD_TOKEN_ID', GOD_TOKEN_ID);
  console.log('APP_BASE_URL', APP_BASE_URL);
});

// Note: For production use:
// - Use persistent DB to store linkedAccounts, audit, layout, contributions.
// - Use HTTPS and secure cookies; set cookie secure:true when using TLS.
// - Implement nonce tracking and replay protection, rate limiting, request validation.
// - For GitHub automation consider building a GitHub App and using installation tokens instead of long-lived user tokens.
// - Require multi-sig or multi-step approvals for critical GOD actions that change infrastructure.
