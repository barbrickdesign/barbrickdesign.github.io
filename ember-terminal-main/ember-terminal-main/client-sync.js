// client-sync.js
// Client-side synchronization helpers for Mandem.OS Ember Terminal
// - Loads /holders.json (static fallback) and merges with server leaderboard when available
// - Fetches server /api/leaderboard and /api/github/repos when relay is configured
// - Exposes functions to populate and render the leaderboard and repo list
// - Lightweight polling and optimistic UI so connected wallet appears immediately
//
// Usage:
// 1. Include <script src="/client-sync.js"></script> in your index.html after the main UI DOM.
// 2. Ensure window.__RELAY_BASE__ is set (optional). If not set, client still shows holders.json and local wallet row.
// 3. Functions exposed on window.ClientSync: init(), refreshNow(), populateWithAddress(address, keys).
//
// Security:
// - This file never contains secrets. All authoritative checks and privileged operations are performed by the relay/server.
//
// NOTE: adapt endpoint paths if your server exposes different routes.

(function () {
  'use strict';

  // Config
  const RELAY_BASE = (window.__RELAY_BASE__ || '').replace(/\/$/, '') || '';
  const HOLDERS_PATH = '/holders.json';            // static seed file
  const LEADERBOARD_API = RELAY_BASE ? `${RELAY_BASE}/api/leaderboard` : null;
  const REPOS_API = RELAY_BASE ? `${RELAY_BASE}/api/github/repos` : null;
  const WHOAMI_API = RELAY_BASE ? `${RELAY_BASE}/api/whoami` : null;
  const POLL_INTERVAL_MS = 30_000;

  // DOM hooks (fallback selectors - update to match your page)
  const SELECTORS = {
    leaderboardBody: '#leaderRows',
    reposContainer: '#repos',
    diagEl: '#diag',
    contribList: '#contribList'
  };

  // Minimal DOM helpers
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }
  function safeJSON(text) { try { return JSON.parse(text); } catch (e) { return null; } }

  // Internal state
  let holdersStatic = [];        // array of addresses or objects from holders.json
  let serverLeaderboard = null;  // authoritative rows from server { rows: [...] }
  let lastRefresh = 0;
  let pollTimer = null;

  // Public API object exposed on window
  const ClientSync = {
    init,
    refreshNow,
    populateWithAddress,
    getState,
  };
  window.ClientSync = ClientSync;

  // Utility: append small diagnostic message
  function diag(msg) {
    const el = $(SELECTORS.diagEl);
    if (el) el.textContent = msg;
    console.debug('[ClientSync]', msg);
  }

  // Render helpers
  function renderLeaderboard(rows) {
    const tbodyOld = $(SELECTORS.leaderboardBody);
    if (!tbodyOld) return;
    const tb = document.createElement('tbody');
    let i = 1;
    for (const r of rows) {
      const tr = document.createElement('tr');
      const keysText = Array.isArray(r.keys) && r.keys.length ? r.keys.map(k => `#${k}`).join(',') : '-';
      tr.innerHTML = `<td>${i++}</td><td class="addr">${escapeHtml(r.address)}</td><td>${escapeHtml(keysText)}</td><td style="text-align:right">${Number(r.score || 0)}</td>`;
      tb.appendChild(tr);
    }
    tbodyOld.parentNode.replaceChild(tb, tbodyOld);
  }

  function renderRepos(list) {
    const container = $(SELECTORS.reposContainer);
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(list) || list.length === 0) {
      container.innerHTML = '<div class="small">No repos available</div>';
      return;
    }
    for (const r of list) {
      const row = document.createElement('div');
      row.className = 'small';
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.gap = '8px';
      row.innerHTML = `<div style="flex:1"><strong style="font-family:var(--mono)">${escapeHtml(r.full_name)}</strong><div class="small" style="color:var(--muted)">${escapeHtml(r.description || '')}</div></div>
        <div style="white-space:nowrap"><button class="ghost" data-repo="${escapeHtml(r.full_name)}">Open</button></div>`;
      container.appendChild(row);
    }
    container.querySelectorAll('button[data-repo]').forEach(b => {
      b.addEventListener('click', () => window.open('https://github.com/' + b.dataset.repo, '_blank'));
    });
  }

  // Escape simple HTML to avoid injection in static contexts
  function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }

  // Load static holders.json (graceful)
  async function loadHoldersStatic() {
    try {
      const r = await fetch(HOLDERS_PATH, { cache: 'no-store' });
      if (!r.ok) {
        diag(`holders.json missing (${r.status}) — using empty seed`);
        holdersStatic = [];
        return holdersStatic;
      }
      const txt = await r.text();
      const parsed = safeJSON(txt);
      if (!parsed) {
        diag('holders.json invalid JSON — ignoring');
        holdersStatic = [];
        return holdersStatic;
      }
      // normalize: strings -> objects
      holdersStatic = parsed.map(item => {
        if (typeof item === 'string') return { address: item.toLowerCase() };
        const out = { address: (item.address || '').toLowerCase(), displayName: item.displayName || null, keys: item.keys || [], score: item.score || 0, github: item.github || null, avatar: item.avatar || null };
        return out;
      });
      diag(`Loaded ${holdersStatic.length} holders from static file`);
      return holdersStatic;
    } catch (err) {
      console.warn('loadHoldersStatic error', err);
      holdersStatic = [];
      return holdersStatic;
    }
  }

  // Fetch server leaderboard (authoritative) if available
  async function loadServerLeaderboard() {
    serverLeaderboard = null;
    if (!LEADERBOARD_API) return null;
    try {
      const r = await fetch(LEADERBOARD_API, { cache: 'no-store', credentials: 'include' });
      if (!r.ok) {
        diag(`Server leaderboard unavailable (${r.status})`);
        return null;
      }
      const j = await r.json();
      if (!j || !Array.isArray(j.rows)) { diag('Server leaderboard returned unexpected shape'); return null; }
      serverLeaderboard = j.rows.map(rw => ({ address: (rw.address || '').toLowerCase(), keys: rw.keys || [], score: Number(rw.score || 0) }));
      diag(`Loaded ${serverLeaderboard.length} rows from server leaderboard`);
      return serverLeaderboard;
    } catch (err) {
      console.warn('loadServerLeaderboard error', err);
      diag('Error fetching server leaderboard');
      return null;
    }
  }

  // Fetch server repo list if available
  async function loadServerRepos() {
    if (!REPOS_API) return null;
    try {
      const r = await fetch(REPOS_API, { cache: 'no-store', credentials: 'include' });
      if (!r.ok) { diag(`Repos endpoint returned ${r.status}`); return null; }
      const j = await r.json();
      diag(`Loaded ${Array.isArray(j) ? j.length : 0} repos`);
      renderRepos(j || []);
      return j;
    } catch (err) {
      console.warn('loadServerRepos error', err);
      diag('Error fetching repos');
      return null;
    }
  }

  // Merge static holders + server leaderboard + local connected wallet row into final rows
  function mergeRows({ connectedAddress = null, connectedKeys = [] } = {}) {
    // Start with server rows (authoritative) if present, otherwise static holders
    let map = new Map();
    const pushRow = r => map.set((r.address || '').toLowerCase(), Object.assign({}, map.get((r.address || '').toLowerCase()) || {}, r));
    if (serverLeaderboard) {
      serverLeaderboard.forEach(r => pushRow(r));
    } else {
      holdersStatic.forEach(h => pushRow({ address: h.address, keys: h.keys || [], score: h.score || 0 }));
    }

    // Ensure connected wallet is included and boosted
    if (connectedAddress) {
      const a = connectedAddress.toLowerCase();
      const existing = map.get(a) || { address: a, keys: [], score: 0 };
      // merge keys
      const combinedKeys = Array.from(new Set([...(existing.keys || []), ...connectedKeys]));
      existing.keys = combinedKeys;
      // lightweight score boost from local contributions stored in localStorage
      const contribs = getLocalContribCountFor(a);
      existing.score = Number(existing.score || 0) + contribs * 50 + connectedKeys.length * 200;
      map.set(a, existing);
    }

    // Convert to array and sort by score desc
    const rows = Array.from(map.values()).map(r => ({ address: r.address, keys: r.keys || [], score: Number(r.score || 0) }));
    rows.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    return rows;
  }

  // Utility: count local contribs for an address
  function getLocalContribCountFor(address) {
    try {
      const v = JSON.parse(localStorage.getItem('mandem_contribs') || '[]');
      return v.filter(x => (x.address || '').toLowerCase() === (address || '').toLowerCase()).length;
    } catch (e) { return 0; }
  }

  // Attempt to detect connected wallet address from injected provider
  async function detectConnectedAddress() {
    try {
      if (!window.ethereum || typeof window.ethereum.request !== 'function') return null;
      const accs = await window.ethereum.request({ method: 'eth_accounts' }).catch(() => []);
      return accs && accs.length ? accs[0].toLowerCase() : null;
    } catch (err) { return null; }
  }

  // Exposed: populate immediate UI row for an address (used on wallet connect)
  async function populateWithAddress(address, keys = []) {
    if (!address) return;
    // refresh static holders if empty
    if (!holdersStatic.length) await loadHoldersStatic();
    // attempt to fetch server leaderboard in background
    loadServerLeaderboard().catch(() => {});
    const rows = mergeRows({ connectedAddress: address, connectedKeys: keys });
    renderLeaderboard(rows);
  }

  // Refresh cycle: load static, server leaderboard, server repos, merge, render
  async function refreshNow() {
    lastRefresh = Date.now();
    await loadHoldersStatic();
    await loadServerLeaderboard();
    await loadServerRepos();
    const connected = await detectConnectedAddress();
    let keys = [];
    // If a connected wallet exists, attempt lightweight client RPC check for tracked keyIds if provided on window (optional)
    if (connected && Array.isArray(window.MandemKeyIdsToScan)) {
      try {
        // performs minimal read-only eth_call for ERC-1155 balanceOf if window.readERC1155Balance is available
        if (typeof window.readERC1155Balance === 'function') {
          const found = [];
          for (const id of window.MandemKeyIdsToScan) {
            try {
              const bal = await window.readERC1155Balance(connected, id);
              if (bal && (typeof bal === 'bigint' ? bal > 0n : Number(bal) > 0)) found.push(id);
            } catch (e) { /* ignore per-id */ }
          }
          keys = found;
        }
      } catch (e) { /* ignore */ }
    }
    const rows = mergeRows({ connectedAddress: connected, connectedKeys: keys });
    renderLeaderboard(rows);
    diag(`Synced @ ${new Date().toISOString()}`);
  }

  // Polling control
  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => { refreshNow().catch(() => {}); }, POLL_INTERVAL_MS);
  }
  function stopPolling() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }

  // Init entrypoint
  async function init(opts = {}) {
    // opts: { autoPopulateConnected: boolean, poll: boolean }
    const autoPopulate = opts.autoPopulateConnected !== false;
    const doPoll = opts.poll !== false;
    await loadHoldersStatic();
    // render initial static leaderboard if present
    if (holdersStatic.length) {
      const rows = holdersStatic.map((h, i) => ({ address: h.address, keys: h.keys || [], score: Number(h.score || 0) || (10000 - i) }));
      renderLeaderboard(rows);
    } else {
      renderLeaderboard([]);
    }
    // attempt server sync
    if (LEADERBOARD_API) {
      await loadServerLeaderboard();
      if (serverLeaderboard) renderLeaderboard(serverLeaderboard);
    }
    if (REPOS_API) await loadServerRepos();
    // if wallet connected, populate with it
    if (autoPopulate) {
      const conn = await detectConnectedAddress();
      if (conn) {
        // keys detection optional depends on page exposing readERC1155Balance or similar
        let keys = [];
        if (typeof window.readERC1155Balance === 'function' && Array.isArray(window.MandemKeyIdsToScan)) {
          for (const id of window.MandemKeyIdsToScan) {
            try { const bal = await window.readERC1155Balance(conn, id); if (bal && (typeof bal === 'bigint' ? bal > 0n : Number(bal) > 0)) keys.push(id); } catch(e) {}
          }
        }
        populateWithAddress(conn, keys);
      }
    }
    if (doPoll) startPolling();
    diag('Client sync initialized');
  }

  // Expose state
  function getState() {
    return { holdersStatic, serverLeaderboard, lastRefresh, relay: RELAY_BASE };
  }

  // Expose on global object
  window.ClientSync = {
    init,
    refreshNow,
    populateWithAddress,
    getState
  };
