# 🚀 Starting the Gem Bot Universe Server

## Quick Start

### 1. Install Dependencies (First Time Only)
```bash
npm install
```

### 2. Start the Server
```bash
node server.js
```

Or use npm script:
```bash
npm start
```

The server will start on **http://localhost:3000**

---

## What the Server Does

### 🎮 Leaderboard System
- Tracks all players in real-time
- Stores player data in local SQLite database
- Auto-cleanup of offline players every 5 minutes
- Bottom-right leaderboard panel updates automatically

### 💾 Data Storage
All data stored in: `gembot.sqlite`

**Player Data Includes:**
- Wallet Address (unique ID)
- Display Name
- Mask Emoji (🤖 default)
- MGC Balance
- Uptime Minutes
- Status (Active/Idle)
- Role (Player/Admin/Builder)
- Online Status
- High Score

---

## API Endpoints for Leaderboard

### Update Player Data
```bash
POST /api/players/update
Body: {
  "walletAddress": "ABC123...",
  "displayName": "CoolPlayer",
  "maskEmoji": "🎮",
  "mgcBalance": 150.5,
  "status": "Active",
  "role": "Builder",
  "uptimeMinutes": 45
}
```

### Get Leaderboard
```bash
GET /api/players/leaderboard?limit=100&sortBy=mgcBalance
```

### Player Heartbeat (Auto-sent every minute)
```bash
POST /api/players/heartbeat
Body: {
  "walletAddress": "ABC123...",
  "uptimeIncrement": 1
}
```

### Get Single Player
```bash
GET /api/players/ABC123...
```

---

## How It Works with Gem Bot Universe

### Frontend (index.html)
1. Player connects wallet
2. JavaScript sends player data to server
3. Heartbeat sent every 60 seconds
4. Leaderboard panel fetches top players every 10 seconds
5. Displays in bottom-right corner

### Data Flow
```
Player Connects
  ↓
POST /api/players/update (create/update player)
  ↓
Heartbeat Loop (every 60s)
  ↓
POST /api/players/heartbeat
  ↓
Leaderboard Refresh (every 10s)
  ↓
GET /api/players/leaderboard
  ↓
Display in Panel
```

---

## Database Schema

### `players` Table
```sql
CREATE TABLE players (
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
)
```

---

## Server Status

### Check if Running
```bash
curl http://localhost:3000/api/ping
```

Response:
```json
{
  "status": "ok",
  "message": "pong",
  "serverTime": "2025-01-15T06:00:00.000Z"
}
```

### View Player Stats
```bash
curl http://localhost:3000/api/players/stats
```

Response:
```json
{
  "totalPlayers": 42,
  "onlinePlayers": 12,
  "totalMGC": 5230.50,
  "totalUptime": 12480,
  "avgMGC": 124.53
}
```

---

## Troubleshooting

### Server Won't Start
1. Check if port 3000 is in use
2. Install dependencies: `npm install`
3. Check Node.js version: `node --version` (requires v14+)

### Database Issues
1. Delete `gembot.sqlite` to reset
2. Server will recreate tables on restart

### Players Not Showing
1. Check browser console for errors
2. Verify server is running: http://localhost:3000/api/ping
3. Check CORS settings

---

## Deployment

### Local Development
```bash
node server.js
```

### Production (with PM2)
```bash
npm install -g pm2
pm2 start server.js --name gem-bot-server
pm2 save
pm2 startup
```

### Environment Variables
```bash
PORT=3000 node server.js
```

---

## Features

✅ Real-time player tracking  
✅ Persistent data storage  
✅ Auto-cleanup of offline players  
✅ Leaderboard sorting (MGC, Uptime, Score)  
✅ Player sessions tracking  
✅ RESTful API  
✅ CORS enabled  
✅ SQLite database (no external DB needed)  

---

**Server runs locally and stores all data in the project folder!** 🎉
