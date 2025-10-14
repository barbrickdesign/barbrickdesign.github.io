// relay-server.js
// Secure relay for Mandem.OS Ember Terminal
//
// Features
// - Challenge/nonce flow for replay protection
// - Verifies wallet-signed requests (personal_sign / eth_sign)
// - Verifies on-chain ERC-1155 ownership for Mandem.OS key holders
// - Endpoint to accept signed contributions and persist in-memory audit (demo)
// - Endpoint to accept signed deploy requests and trigger GitHub repository_dispatch (server-side PAT)
// - LLM request handling: accept signed prompts, stream provider responses (OpenAI demo) and expose SSE streaming to clients
// - Basic rate-limiting, nonce expiration, audit logging
//
// Security notes
// - KEEP GITHUB_PAT, OPENAI_API_KEY and other secrets in the server environment only
// - This relay does NOT perform any network scanning or remote device control
// - Replace in-memory stores (nonces, audit, llmJobs) with a DB/Redis for production
// - Run behind TLS and firewall; restrict access if needed
//
// Required environment variables (set before starting)
//  RELAY_PORT (optional, default 4200)
//  RPC_URL (optional, default https://cloudflare-eth.com)
//  CONTRACT (ERC-1155 contract address; default set to repo value)
//  GOD_TOKEN_ID (default 45; used for owner checks; relay can verify any tokenId per payload)
//  GITHUB_PAT (optional; if present, relay can dispatch GitHub repo_dispatch events)
//  GITHUB_REPO (owner/repo string required if GITHUB_PAT provided)
//  LLM_PROVIDER (optional; 'openai' supported in demo)
//  OPENAI_API_KEY (required if LLM_PROVIDER=openai and LLM features used)
//  OPENAI_MODEL (optional; default 'gpt-4o-mini')
//
// Install:
//   npm i express body-parser cors ethers node-fetch dotenv rate-limiter-flexible
//
// Run:
//   node relay-server.js
//
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const { ethers } = require('ethers');
const fetch = require('node-fetch');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const PORT = process.env.RELAY_PORT ? Number(process.env.RELAY_PORT) : 4200;
const RPC_URL = process.env.RPC_URL || 'https://cloudflare-eth.com';
const CONTRACT = process.env.CONTRACT || '0x45a328572b2a06484e02EB5D4e4cb6004136eB16';
const DEFAULT_GOD_TOKEN_ID = Number(process.env.GOD_TOKEN_ID || 45);

const GITHUB_PAT = process.env.GITHUB_PAT || '';
const GITHUB_REPO = process.env.GITHUB_REPO || '';

const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (GITHUB_PAT && !GITHUB_REPO) {
  console.error('GITHUB_PAT is set but GITHUB_REPO is not. Please set GITHUB_REPO if you want deploy dispatching.');
}

// Provider for on-chain reads
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const ERC1155_IFACE = new ethers.utils.Interface(['function balanceOf(address account, uint256 id) view returns (uint256)']);

// In-memory stores (demo). Use DB for production.
const nonces = new Map();        // nonce -> timestamp
const audit = [];                // array of audit entries
const llmJobs = new Map();       // jobId -> job object

// Rate limiter: tune points/duration per address
const limiter = new RateLimiterMemory({ points: 60, duration: 60 }); // 60 req/min per key (demo)

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '512kb' }));

function now() { return Date.now(); }

function makeNonce() {
  return crypto.randomBytes(16).toString('hex');
}
function makeChallenge() {
  const nonce = makeNonce();
  const ts = Date.now();
  return `Mandem.OS challenge;nonce:${nonce};ts:${ts}`;
}

function recoverSigner(message, signature) {
  try { return ethers.utils.verifyMessage(message, signature); } catch (e) { return null; }
}
async function checkTokenHolding(address, tokenId) {
  const id = Number(tokenId);
  const data = ERC1155_IFACE.encodeFunctionData('balanceOf', [address, id]);
  const res = await provider.call({ to: CONTRACT, data });
  const bn = ethers.BigNumber.from(res);
  return bn.gt(0);
}

// Health
app.get('/relay/health', (req, res) => {
  res.json({ ok: true, ts: now(), contract: CONTRACT, defaultTokenId: DEFAULT_GOD_TOKEN_ID, llm: LLM_PROVIDER });
});

// Challenge endpoint
app.get('/relay/challenge', (req, res) => {
  const challenge = makeChallenge();
  const m = challenge.match(/nonce:([0-9a-f]+)/);
  if (m && m[1]) {
    nonces.set(m[1], Date.now());
    // auto-expire after 10 minutes
    setTimeout(() => nonces.delete(m[1]), 10 * 60 * 1000);
  }
  res.json({ challenge });
});

// Generic middleware to verify signed payloads
// Expects body { payload: string, signature: string, address: string }
// If payload contains "nonce:..." ensure nonce exists and is recent; consumes nonce
async function verifySignedPayload(req, res, next) {
  try {
    const { payload, signature, address } = req.body;
    if (!payload || !signature || !address) return res.status(400).json({ error: 'payload, signature, address required' });

    const recovered = recoverSigner(payload, signature);
    if (!recovered) return res.status(401).json({ error: 'invalid signature' });
    if (recovered.toLowerCase() !== address.toLowerCase()) return res.status(401).json({ error: 'signature address mismatch' });

    // Nonce handling: look for nonce:([0-9a-f]+) in payload string
    const payloadText = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const m = payloadText.match(/nonce:([0-9a-f]+)/);
    if (m && m[1]) {
      const nonce = m[1];
      const created = nonces.get(nonce);
      if (!created) return res.status(400).json({ error: 'unknown or expired nonce' });
      if (Date.now() - created > 5 * 60 * 1000) { nonces.delete(nonce); return res.status(400).json({ error: 'nonce expired' }); }
      // consume
      nonces.delete(nonce);
    }

    // rate limit per address
    try {
      await limiter.consume(address.toLowerCase());
    } catch (rl) {
      return res.status(429).json({ error: 'rate limit exceeded' });
    }

    // attach verified to req for downstream
    req.verified = { address: address.toLowerCase(), payload: payloadText, signature };
    next();
  } catch (err) {
    console.error('verifySignedPayload error', err);
    res.status(500).json({ error: 'verification error' });
  }
}

// Contribution endpoint (signed). Stores in audit (in-memory demo)
app.post('/relay/contribution', verifySignedPayload, (req, res) => {
  try {
    const meta = req.verified;
    const entry = { type: 'contribution', author: meta.address, payload: meta.payload, signature: req.body.signature, ts: now() };
    audit.unshift(entry);
    // trim
    if (audit.length > 2000) audit.length = 2000;
    res.json({ ok: true });
  } catch (err) {
    console.error('contribution error', err);
    res.status(500).json({ error: 'contribution failed' });
  }
});

// Deploy endpoint: signed + on-chain check + optional GitHub repository_dispatch
// payload may include tokenId to check; fallback to DEFAULT_GOD_TOKEN_ID
app.post('/relay/deploy', verifySignedPayload, async (req, res) => {
  try {
    const meta = req.verified;
    let parsed;
    try { parsed = JSON.parse(meta.payload); } catch { parsed = { raw: meta.payload }; }
    const tokenId = Number(parsed.tokenId || DEFAULT_GOD_TOKEN_ID);
    const address = meta.address;

    // On-chain check
    const holds = await checkTokenHolding(address, tokenId);
    if (!holds) return res.status(403).json({ error: `address does not hold required tokenId ${tokenId}` });

    // If GitHub dispatch is configured, call repo dispatch
    if (GITHUB_PAT && GITHUB_REPO) {
      const url = `https://api.github.com/repos/${GITHUB_REPO}/dispatches`;
      const body = { event_type: 'deploy-server', client_payload: parsed };
      const ghRes = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `token ${GITHUB_PAT}`,
          Accept: 'application/vnd.github.everest-preview+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (ghRes.status === 204) {
        audit.unshift({ type: 'deploy-request', author: address, ts: now(), payload: parsed });
        return res.json({ ok: true, message: 'deploy requested' });
      } else {
        const txt = await ghRes.text();
        console.warn('GitHub dispatch failed', ghRes.status, txt);
        return res.status(500).json({ error: 'github dispatch failed', detail: txt });
      }
    } else {
      // GitHub not configured — just log and return accepted
      audit.unshift({ type: 'deploy-request', author: address, ts: now(), payload: parsed, note: 'github not configured' });
      return res.json({ ok: true, message: 'deploy accepted (github not configured on relay)' });
    }
  } catch (err) {
    console.error('deploy handler error', err);
    res.status(500).json({ error: err.message || 'deploy error' });
  }
});

// LLM request: verify signed payload, create job, stream provider response server-side into job
// Body: { payload: string, signature, address, model?, tokenId? }
// payload must include a challenge nonce (recommended)
app.post('/relay/llm-request', verifySignedPayload, async (req, res) => {
  try {
    const meta = req.verified;
    let parsed;
    try { parsed = JSON.parse(meta.payload); } catch { parsed = { text: meta.payload }; }
    const prompt = parsed.prompt || parsed.text || parsed.input;
    if (!prompt) return res.status(400).json({ error: 'payload must include prompt/text/input' });

    // Optionally ensure the signer holds some tokenId (if required). Use tokenId in parsed or default.
    const tokenId = Number(parsed.tokenId || DEFAULT_GOD_TOKEN_ID);
    const holds = await checkTokenHolding(meta.address, tokenId);
    if (!holds) return res.status(403).json({ error: `address does not hold required tokenId ${tokenId}` });

    const jobId = crypto.randomBytes(12).toString('hex');
    const job = { id: jobId, status: 'queued', author: meta.address, createdAt: now(), prompt, model: req.body.model || OPENAI_MODEL, output: '', lastChunk: '', error: null };
    llmJobs.set(jobId, job);
    // keep audit
    audit.unshift({ type: 'llm-request', author: meta.address, ts: now(), prompt: prompt.slice(0, 512), jobId });

    // Fire-and-forget background streaming to provider
    (async () => {
      job.status = 'running';
      try {
        if (LLM_PROVIDER === 'openai') {
          if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured on server');
          const model = job.model || OPENAI_MODEL;
          // OpenAI streaming chat completions
          const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: job.prompt }],
              temperature: 0.2,
              stream: true
            })
          });

          if (!resp.ok) {
            const t = await resp.text();
            job.status = 'error';
            job.error = `provider error: ${t}`;
            return;
          }

          const reader = resp.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let acc = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            acc += decoder.decode(value, { stream: true });
            const lines = acc.split(/\r?\n/);
            acc = lines.pop(); // partial
            for (const line of lines) {
              if (!line.trim()) continue;
              const trimmed = line.replace(/^data:\s*/, '');
              if (trimmed === '[DONE]') {
                job.status = 'done';
                break;
              }
              try {
                const chunk = JSON.parse(trimmed);
                const choices = chunk.choices || [];
                for (const ch of choices) {
                  const delta = ch.delta || {};
                  const text = delta.content || delta.text || '';
                  if (text) {
                    job.output += text;
                    job.lastChunk = text;
                  }
                }
              } catch (e) {
                // ignore stray lines
              }
            }
          }
          if (job.status !== 'error') job.status = 'done';
        } else {
          // Placeholder: other provider integrations would be added here
          job.output = '[LLM provider not implemented on relay]';
          job.status = 'done';
        }
      } catch (err) {
        job.status = 'error';
        job.error = String(err.message || err);
        console.error('LLM background error', err);
      }
    })();

    return res.json({ ok: true, jobId });
  } catch (err) {
    console.error('llm-request error', err);
    res.status(500).json({ error: err.message || 'llm request failed' });
  }
});

// SSE streaming endpoint for clients to receive LLM tokens: GET /relay/llm-stream/:jobId
function sendSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}
app.get('/relay/llm-stream/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  if (!jobId) return res.status(400).end();
  const job = llmJobs.get(jobId);
  if (!job) return res.status(404).end();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  sendSSE(res, 'status', { status: job.status, jobId });

  const iv = setInterval(() => {
    try {
      const j = llmJobs.get(jobId);
      if (!j) {
        sendSSE(res, 'done', { status: 'missing' });
        clearInterval(iv);
        return res.end();
      }
      if (j.lastChunk) {
        sendSSE(res, 'chunk', { chunk: j.lastChunk });
        j.lastChunk = '';
      }
      if (j.status === 'error') {
        sendSSE(res, 'error', { error: j.error || 'unknown' });
        clearInterval(iv);
        return res.end();
      }
      if (j.status === 'done' || j.status === 'finished') {
        sendSSE(res, 'done', { output: j.output || '' });
        clearInterval(iv);
        return res.end();
      }
    } catch (err) {
      clearInterval(iv);
      res.end();
    }
  }, 200);

  req.on('close', () => {
    clearInterval(iv);
  });
});

// Optional admin endpoints (demo) to inspect audit and jobs (protect in production)
app.get('/relay/audit', (req, res) => {
  // PROTECT THIS IN PRODUCTION (auth)
  res.json({ audit: audit.slice(0, 500), jobs: Array.from(llmJobs.values()).map(j => ({ id: j.id, status: j.status, author: j.author, createdAt: j.createdAt })) });
});

// Simple whoami / session helpers (for server-side GitHub mapping or UI)
app.get('/api/whoami', (req, res) => {
  // In a real relay you would check session/cookie and return linked github user info
  res.json({ ok: true, relay: true });
});

// Simple leaderboard API shape (demo). In production compute authoritative scores from DB.
app.get('/api/leaderboard', (req, res) => {
  // Example shape: { rows: [ { address, keys: [45], score: 123 }, ... ] }
  // For demo we return empty or derive from audit
  const map = new Map();
  for (const e of audit) {
    if (e.type === 'contribution' && e.author) {
      const a = e.author.toLowerCase();
      const cur = map.get(a) || { address: a, keys: [], score: 0 };
      cur.score += 10;
      map.set(a, cur);
    }
  }
  const rows = Array.from(map.values()).sort((a,b) => b.score - a.score);
  res.json({ rows });
});

// Start
app.listen(PORT, () => {
  console.log(`Relay server listening on port ${PORT}`);
  console.log('RPC_URL:', RPC_URL);
  console.log('CONTRACT:', CONTRACT);
  console.log('DEFAULT_GOD_TOKEN_ID:', DEFAULT_GOD_TOKEN_ID);
  console.log('LLM_PROVIDER:', LLM_PROVIDER, 'OPENAI configured:', !!OPENAI_API_KEY);
  if (GITHUB_PAT && GITHUB_REPO) console.log('GitHub dispatch enabled for', GITHUB_REPO);
