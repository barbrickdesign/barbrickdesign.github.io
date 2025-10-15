// server.js for WorkingProject: Express + SQLite user database
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// SQLite DB setup
const dbPath = path.join(__dirname, 'gembot.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    displayName TEXT,
    walletAddress TEXT,
    inGameMGC REAL DEFAULT 0,
    mgcBalance REAL DEFAULT 0,
    isAdmin INTEGER DEFAULT 0,
    isVerified INTEGER DEFAULT 0,
    verificationToken TEXT,
    resetToken TEXT,
    resetTokenExpiry INTEGER
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    walletAddress TEXT UNIQUE,
    displayName TEXT,
    maskEmoji TEXT DEFAULT '🤖',
    mgcBalance REAL DEFAULT 0,
    uptimeMinutes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Idle',
    role TEXT DEFAULT 'Player',
    lastSeen TEXT,
    joinedAt TEXT,
    isOnline INTEGER DEFAULT 0,
    totalSessions INTEGER DEFAULT 0,
    highScore INTEGER DEFAULT 0
  )`);
});

// Send email utility (placeholder, replace with real email service)
function sendEmail(to, subject, text) {
  console.log(`[EMAIL] To: ${to}\nSubject: ${subject}\n${text}`);
}

// Sample /api/ping endpoint for server connectivity check
app.get('/api/ping', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'pong', serverTime: new Date().toISOString() });
});

// POST /api/players/update
app.post('/api/players/update', (req, res) => {
  const { walletAddress, displayName, maskEmoji, mgcBalance, status, role, uptimeMinutes } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const now = new Date().toISOString();
  db.run(`INSERT INTO players (walletAddress, displayName, maskEmoji, mgcBalance, status, role, uptimeMinutes, lastSeen, joinedAt, isOnline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1) ON CONFLICT(walletAddress) DO UPDATE SET displayName=excluded.displayName, maskEmoji=excluded.maskEmoji, mgcBalance=excluded.mgcBalance, status=excluded.status, role=excluded.role, uptimeMinutes=excluded.uptimeMinutes, lastSeen=excluded.lastSeen, isOnline=1`, [walletAddress, displayName, maskEmoji, mgcBalance, status, role, uptimeMinutes, now, now], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/players/leaderboard', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  db.all('SELECT * FROM players ORDER BY mgcBalance DESC, lastSeen DESC LIMIT ?', [limit], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/players/heartbeat', (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const now = new Date().toISOString();
  db.run('UPDATE players SET isOnline=1, lastSeen=?, uptimeMinutes=uptimeMinutes+1 WHERE walletAddress=?', [now, walletAddress], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      db.run('INSERT INTO players (walletAddress, lastSeen, joinedAt, isOnline) VALUES (?, ?, ?, 1)', [walletAddress, now, now]);
    }
    res.json({ success: true });
  });
});

// Create or update user profile
app.post('/api/user/profile', async (req, res) => {
  const { email, password, displayName, walletAddress, inGameMGC, mgcBalance } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  let hashedPassword = password;
  if (password) {
    // Hash password if provided and not already hashed
    if (!password.startsWith('$2a$')) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
  }
  db.run(`INSERT INTO users (email, password, displayName, walletAddress, inGameMGC, mgcBalance)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      password=COALESCE(excluded.password, users.password),
      displayName=excluded.displayName,
      walletAddress=excluded.walletAddress,
      inGameMGC=excluded.inGameMGC,
      mgcBalance=excluded.mgcBalance`,
    [email, hashedPassword, displayName, walletAddress, inGameMGC, mgcBalance],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Fetch user profile by email
app.get('/api/user/profile', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    // Do not return password hash to client
    if (row.password) delete row.password;
    res.json(row);
  });
});

// API: Add or update user by wallet address
app.post('/api/users', (req, res) => {
  const { wallet_address, display_name } = req.body;
  if (!wallet_address) return res.status(400).json({ error: 'wallet_address required' });
  db.run(
    `INSERT OR IGNORE INTO users (wallet_address, display_name) VALUES (?, ?);`,
    [wallet_address, display_name || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get(`SELECT * FROM users WHERE wallet_address = ?`, [wallet_address], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

// API: Get user by wallet address
app.get('/api/users/:wallet_address', (req, res) => {
  db.get(`SELECT * FROM users WHERE wallet_address = ?`, [req.params.wallet_address], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

// API: Get all users
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Add placeholder status and stats for each user
    const users = rows.map(u => ({
      ...u,
      isLoggedIn: false, // Placeholder: set to true if you have a login/session system
      joinDate: u.createdAt || null, // If you add a createdAt column
      stats: {
        inGameMGC: u.inGameMGC,
        mgcBalance: u.mgcBalance
      }
    }));
    res.json(users);
  });
});

// API: Add a new location log
app.post('/api/location-logs', (req, res) => {
  const { wallet_address, location } = req.body;
  if (!wallet_address || !location) return res.status(400).json({ error: 'wallet_address and location required' });
  db.run(
    `INSERT INTO location_logs (wallet_address, location) VALUES (?, ?);`,
    [wallet_address, location],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// API: Get all location logs for a user
app.get('/api/location-logs/:wallet_address', (req, res) => {
  db.all(
    `SELECT * FROM location_logs WHERE wallet_address = ? ORDER BY timestamp DESC`,
    [req.params.wallet_address],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Add a login endpoint for password check
app.post('/api/user/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    if (!row.password) return res.status(400).json({ error: 'No password set for this user' });
    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });
    // Do not return password hash
    delete row.password;
    res.json(row);
  });
});

// Request password reset
app.post('/api/user/request-reset', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + 1000 * 60 * 30; // 30 min expiry
  db.run('UPDATE users SET resetToken=?, resetTokenExpiry=? WHERE email=?', [token, expiry, email], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    sendEmail(email, 'Password Reset', `Reset your password: http://localhost:5500/reset.html?token=${token}&email=${encodeURIComponent(email)}`);
    res.json({ success: true });
  });
});

// Reset password
app.post('/api/user/reset-password', async (req, res) => {
  const { email, token, password } = req.body;
  if (!email || !token || !password) return res.status(400).json({ error: 'Missing fields' });
  db.get('SELECT resetToken, resetTokenExpiry FROM users WHERE email=?', [email], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row || row.resetToken !== token || Date.now() > row.resetTokenExpiry) return res.status(400).json({ error: 'Invalid or expired token' });
    const hashed = await bcrypt.hash(password, 10);
    db.run('UPDATE users SET password=?, resetToken=NULL, resetTokenExpiry=NULL WHERE email=?', [hashed, email], function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true });
    });
  });
});

// Request email verification
app.post('/api/user/request-verification', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const token = crypto.randomBytes(32).toString('hex');
  db.run('UPDATE users SET verificationToken=? WHERE email=?', [token, email], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    sendEmail(email, 'Verify your email', `Verify your account: http://localhost:5500/verify.html?token=${token}&email=${encodeURIComponent(email)}`);
    res.json({ success: true });
  });
});

// Verify email
app.post('/api/user/verify', (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ error: 'Missing fields' });
  db.get('SELECT verificationToken FROM users WHERE email=?', [email], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row || row.verificationToken !== token) return res.status(400).json({ error: 'Invalid token' });
    db.run('UPDATE users SET isVerified=1, verificationToken=NULL WHERE email=?', [email], function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true });
    });
  });
});

// Admin endpoints
app.get('/api/admin/users', (req, res) => {
  db.all('SELECT id, email, displayName, walletAddress, isAdmin, isVerified FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/admin/set-admin', (req, res) => {
  const { email, isAdmin } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  db.run('UPDATE users SET isAdmin=? WHERE email=?', [isAdmin ? 1 : 0, email], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/admin/delete-user', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  db.run('DELETE FROM users WHERE email=?', [email], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Store failed admin login attempts
app.post('/api/admin/failed-login', (req, res) => {
  const { ip, city, region, country, loc, time } = req.body;
  db.run(`CREATE TABLE IF NOT EXISTS admin_failed_logins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT, city TEXT, region TEXT, country TEXT, loc TEXT, time TEXT
  )`);
  db.run('INSERT INTO admin_failed_logins (ip, city, region, country, loc, time) VALUES (?, ?, ?, ?, ?, ?)',
    [ip, city, region, country, loc, time],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Get all failed admin login attempts
app.get('/api/admin/failed-logins', (req, res) => {
  db.all('SELECT * FROM admin_failed_logins ORDER BY id DESC LIMIT 100', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// DELETE: Clear all admin failed logins
app.delete('/api/admin/failed-logins', (req, res) => {
  db.run('DELETE FROM admin_failed_logins', [], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

// God mode admin email verification
app.post('/api/admin/request-godmode', (req, res) => {
  const email = 'BarbrickDesign@gmail.com';
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  db.run('UPDATE users SET verificationToken=? WHERE email=?', [code, email], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    sendEmail(email, 'God Mode Admin Verification', `Your God Mode admin code is: ${code}`);
    res.json({ success: true });
  });
});

app.post('/api/admin/verify-godmode', (req, res) => {
  const { code } = req.body;
  const email = 'BarbrickDesign@gmail.com';
  db.get('SELECT verificationToken FROM users WHERE email=?', [email], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row || row.verificationToken !== code) return res.status(400).json({ error: 'Invalid code' });
    db.run('UPDATE users SET isAdmin=1, verificationToken=NULL WHERE email=?', [email], function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true });
    });
  });
});

// SystemCheck endpoint: logs user data every second
const logFile = path.join(__dirname, 'systemCheck-log.jsonl');

app.post('/api/system-check', express.json(), (req, res) => {
  const data = req.body;
  data._receivedAt = new Date().toISOString();
  fs.appendFile(logFile, JSON.stringify(data) + '\n', err => {
    if (err) return res.status(500).json({ error: 'Failed to log data' });
    res.json({ status: 'ok' });
  });
});

// GET: Retrieve recent systemCheck logs (last 100)
app.get('/api/system-check/logs', (req, res) => {
  const logFile = path.join(__dirname, 'systemCheck-log.jsonl');
  fs.readFile(logFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read log file' });
    const lines = data.trim().split('\n').filter(Boolean);
    const logs = lines.slice(-100).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
    res.json(logs);
  });
});

// GET: List all tables in the database
app.get('/api/db/tables', (req, res) => {
  db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.name));
  });
});

// GET: List columns for a given table
app.get('/api/db/columns/:table', (req, res) => {
  db.all(`PRAGMA table_info(${req.params.table})`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.name));
  });
});

// --- Chat Logging Endpoint for Admin Review ---

// In-memory chat log (for demo; replace with DB or file for production)
const chatLog = [];

// Log chat messages to a file (optional, for persistence)
const chatLogFile = path.join(__dirname, 'chat-log.json');

function saveChatLogToFile() {
  fs.writeFile(chatLogFile, JSON.stringify(chatLog, null, 2), err => {
    if (err) console.error('Failed to save chat log:', err);
  });
}

// POST /api/chat/log
// Body: { sender, text, room, timestamp }
app.post('/api/chat/log', (req, res, next) => {
  const { sender } = req.body;
  if (sender && bannedUsers.has(sender)) {
    return res.status(403).json({ error: 'User is banned from chat.' });
  }
  next();
}, (req, res) => {
  const { sender, text, room, timestamp } = req.body;
  if (!sender || !text || !room || !timestamp) {
    return res.status(400).json({ error: 'Missing required chat fields.' });
  }
  const entry = { sender, text, room, timestamp };
  chatLog.push(entry);
  // Optionally, save to file for persistence
  saveChatLogToFile();
  res.json({ success: true });
});

// GET /api/chat/log (admin only, simple version)
app.get('/api/chat/log', (req, res) => {
  // TODO: Add admin authentication in production
  res.json(chatLog);
});

// --- Chat Moderation: Delete & Ban ---
// In-memory ban list (replace with DB/file for production)
const bannedUsers = new Set();
const banFile = path.join(__dirname, 'banned-users.json');
function saveBanList() {
  fs.writeFile(banFile, JSON.stringify(Array.from(bannedUsers)), err => {
    if (err) console.error('Failed to save ban list:', err);
  });
}
function loadBanList() {
  if (fs.existsSync(banFile)) {
    try {
      const arr = JSON.parse(fs.readFileSync(banFile));
      arr.forEach(u => bannedUsers.add(u));
    } catch {}
  }
}
loadBanList();

// DELETE /api/chat/log (delete a message by timestamp, sender, text)
app.delete('/api/chat/log', (req, res) => {
  const { sender, text, timestamp } = req.body;
  const idx = chatLog.findIndex(m => m.sender === sender && m.text === text && m.timestamp === timestamp);
  if (idx === -1) return res.status(404).json({ error: 'Message not found' });
  chatLog.splice(idx, 1);
  saveChatLogToFile();
  res.json({ success: true });
});

// POST /api/chat/ban (ban a user by sender/username)
app.post('/api/chat/ban', (req, res) => {
  const { sender } = req.body;
  if (!sender) return res.status(400).json({ error: 'Sender required' });
  bannedUsers.add(sender);
  saveBanList();
  res.json({ success: true });
});

// GET /api/chat/banned (list banned users)
app.get('/api/chat/banned', (req, res) => {
  res.json(Array.from(bannedUsers));
});

// Utility: Detect environment
function detectEnvironment(req) {
  if (process.env.NODE_ENV === 'production') return 'production';
  if (req.hostname && req.hostname.includes('localhost')) return 'local';
  if (os.hostname().toLowerCase().includes('barbrickdesign')) return 'production-server';
  return 'unknown';
}

// Endpoint to handle server activation/re-linking
app.post('/api/start-server', (req, res) => {
  const env = detectEnvironment(req);
  console.log(`[SERVER] /api/start-server called. Environment: ${env}`);

  // Example: reload config, re-initialize services, or log the request
  // Add your actual logic here as needed for your deployment
  if (env === 'local') {
    // Local dev: reload config, reconnect DB, etc.
    // ...add logic here...
    return res.json({ status: 'ok', message: 'Server is running in local development mode.' });
  } else if (env === 'production' || env === 'production-server') {
    // Production: reload config, reconnect services, etc.
    // ...add logic here...
    return res.json({ status: 'ok', message: 'Server is running in production mode.' });
  } else {
    return res.status(500).json({ status: 'error', message: 'Unknown environment. Manual intervention may be required.' });
  }
});

// Expose sync status for frontend
app.get('/api/sync-status', (req, res) => {
  res.json({
    isSyncing,
    lastSyncTime,
    nextSyncTime: lastSyncTime ? new Date(new Date(lastSyncTime).getTime() + syncIntervalMs).toISOString() : null
  });
});

// Hourly sync timer
async function performSync() {
  isSyncing = true;
  lastSyncTime = new Date().toISOString();
  // ...call broadcastSync or your sync logic here...
  try {
    await broadcastSync('hourly-sync', { time: lastSyncTime });
  } catch (e) {
    console.error('[SYNC] Error during sync:', e);
  }
  isSyncing = false;
}
setInterval(performSync, syncIntervalMs);
// Optionally, trigger first sync on startup
// performSync();

// Serve 3D model metadata for frontend gallery
const modelsJsonPath = path.join(__dirname, '3DModels', 'models.json');
app.get('/api/models', (req, res) => {
  if (fs.existsSync(modelsJsonPath)) {
    res.sendFile(modelsJsonPath);
  } else {
    res.status(404).json({ error: 'No models metadata found.' });
  }
});

// --- FORGE SYSTEM: DB TABLES & ENDPOINTS ---
// Add tables for forged assets and trades
const forgeDbInit = () => {
  db.run(`CREATE TABLE IF NOT EXISTS forged_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_filename TEXT,
    owner_wallet TEXT,
    file_size INTEGER,
    mint_limit INTEGER,
    mint_count INTEGER DEFAULT 0,
    special_ability TEXT,
    created_at TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS asset_trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    forged_asset_id INTEGER,
    from_wallet TEXT,
    to_wallet TEXT,
    price REAL,
    timestamp TEXT
  )`);
};
forgeDbInit();

// Helper: Calculate base price and mint limit
function calculateAssetValueAndMintLimit(fileSizeBytes) {
  const kb = Math.ceil(fileSizeBytes / 1024);
  const basePrice = Math.max(1, Math.ceil(kb / 100)); // 1 MGC per 100KB, min 1 MGC
  const mintLimit = Math.max(1, Math.floor(500 / kb)); // 1 mint per 500KB, min 1
  return { basePrice, mintLimit };
}

// --- Redundant Asset Storage: Local + Cloud ---
const cloudDb = require('./scripts/cloudDb');

// Helper: Store asset metadata in both local DB and Supabase
async function storeAssetMetadataRedundant(metadata) {
  // Store locally (SQLite)
  db.run(`INSERT INTO forged_assets (asset_filename, owner_wallet, file_size, mint_limit, special_ability, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [metadata.asset_filename, metadata.owner_wallet, metadata.file_size, metadata.mint_limit, metadata.special_ability || '', metadata.created_at],
    function(err) { if (err) console.error('[Local DB] Asset insert error:', err.message); });
  // Store in Supabase (cloud)
  try {
    await cloudDb.insertAssetMetadata(metadata);
  } catch (e) {
    console.error('[Supabase] Asset insert error:', e.message);
  }
}

// Helper: Upload asset file to both local and R2
async function uploadAssetRedundant(localFilePath, filename) {
  // Already in local 3DModels/
  // Upload to R2 (cloud)
  try {
    await cloudDb.uploadAssetToR2(localFilePath, filename);
  } catch (e) {
    console.error('[R2] Asset upload error:', e.message);
  }
}

// POST /api/forge - Forge a new asset
app.post('/api/forge', async (req, res) => {
  const { asset_filename, owner_wallet, special_ability } = req.body;
  if (!asset_filename || !owner_wallet) return res.status(400).json({ error: 'Missing asset or owner' });
  const assetPath = path.join(__dirname, '3DModels', asset_filename);
  if (!fs.existsSync(assetPath)) return res.status(404).json({ error: 'Asset file not found' });
  const fileSize = fs.statSync(assetPath).size;
  const { basePrice, mintLimit } = calculateAssetValueAndMintLimit(fileSize);
  // TODO: Deduct MGC from user, credit to vault (simulate for now)
  // Insert forged asset
  const metadata = {
    asset_filename,
    owner_wallet,
    file_size: fileSize,
    mint_limit: mintLimit,
    special_ability: special_ability || '',
    created_at: new Date().toISOString()
  };
  await storeAssetMetadataRedundant(metadata);
  await uploadAssetRedundant(assetPath, asset_filename);
  res.json({ success: true, basePrice, mintLimit });
});

// GET /api/forged-assets?owner_wallet=... - List user's forged assets
app.get('/api/forged-assets', (req, res) => {
  const { owner_wallet } = req.query;
  let sql = 'SELECT * FROM forged_assets';
  let params = [];
  if (owner_wallet) {
    sql += ' WHERE owner_wallet = ?';
    params.push(owner_wallet);
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/asset-trade - Trade/replicate an asset
app.post('/api/asset-trade', (req, res) => {
  const { forged_asset_id, from_wallet, to_wallet, price } = req.body;
  if (!forged_asset_id || !from_wallet || !to_wallet) return res.status(400).json({ error: 'Missing fields' });
  // Check mint limit
  db.get('SELECT mint_limit, mint_count FROM forged_assets WHERE id = ?', [forged_asset_id], (err, asset) => {
    if (err || !asset) return res.status(404).json({ error: 'Asset not found' });
    if (asset.mint_count >= asset.mint_limit) return res.status(400).json({ error: 'Mint limit reached' });
    // Record trade
    db.run(`INSERT INTO asset_trades (forged_asset_id, from_wallet, to_wallet, price, timestamp)
      VALUES (?, ?, ?, ?, ?)`,
      [forged_asset_id, from_wallet, to_wallet, price || 0, new Date().toISOString()],
      function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        // Increment mint count
        db.run('UPDATE forged_assets SET mint_count = mint_count + 1 WHERE id = ?', [forged_asset_id]);
        res.json({ success: true, trade_id: this.lastID });
      }
    );
  });
});

// --- Realm Collaboration Endpoints ---
// Table for realm collaborators
const collabDbInit = () => {
  db.run(`CREATE TABLE IF NOT EXISTS realm_collaborators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    realm_id INTEGER,
    wallet TEXT,
    role TEXT,
    added_at TEXT
  )`);
};
collabDbInit();

// GET /api/collab-realms?collaborator=wallet - List realms user collaborates on
app.get('/api/collab-realms', (req, res) => {
  const { collaborator } = req.query;
  if (!collaborator) return res.json([]);
  db.all(`SELECT fa.* FROM forged_assets fa
    JOIN realm_collaborators rc ON fa.id = rc.realm_id
    WHERE rc.wallet = ?`, [collaborator], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/realm-collaborators?realm_id=... - List collaborators for a realm
app.get('/api/realm-collaborators', (req, res) => {
  const { realm_id } = req.query;
  if (!realm_id) return res.json([]);
  db.all('SELECT wallet, role FROM realm_collaborators WHERE realm_id = ?', [realm_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/realm-collaborators - Add collaborator
app.post('/api/realm-collaborators', (req, res) => {
  const { realm_id, wallet, role } = req.body;
  if (!realm_id || !wallet || !role) return res.status(400).json({ error: 'Missing fields' });
  // Prevent duplicate
  db.get('SELECT id FROM realm_collaborators WHERE realm_id = ? AND wallet = ?', [realm_id, wallet], (err, row) => {
    if (row) return res.status(400).json({ error: 'Already a collaborator' });
    db.run('INSERT INTO realm_collaborators (realm_id, wallet, role, added_at) VALUES (?, ?, ?, ?)',
      [realm_id, wallet, role, new Date().toISOString()],
      function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ success: true, id: this.lastID });
      }
    );
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

let isSyncing = false;
let lastSyncTime = null;
let syncIntervalMs = 60 * 60 * 1000; // Default: 1 hour

setInterval(() => {
  const cutoffTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  db.run('UPDATE players SET isOnline=0 WHERE lastSeen < ? AND isOnline=1', [cutoffTime], function(err) {
    if (!err && this.changes > 0) console.log(`[Cleanup] ${this.changes} players offline`);
  });
}, 5 * 60 * 1000);

console.log('[Leaderboard] System initialized');
console.log('[Database] Location:', dbPath);