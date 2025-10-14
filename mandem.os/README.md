# Mandem.OS + CSW2025 Integration

## 🚀 Overview

This directory contains the fully integrated **Mandem.OS** application merged with all **CSW2025** projects, creating a comprehensive Gem Bot Universe ecosystem.

## 📁 Directory Structure

```
mandem.os/
├── index.html              # Main Mandem.OS Terminal (Web3 integration)
├── launcher.html           # Project Launcher Dashboard (START HERE)
├── README.md              # This file
├── workspace/             # Complete Gem Bot Universe (from CSW2025/WorkingProject)
│   ├── index.html         # Main hub with 3D globe navigation
│   ├── server.js          # Node.js backend server
│   ├── package.json       # Dependencies
│   ├── laboratory.html    # 3D lab environment
│   ├── warehouse.html     # Storage facility
│   ├── forge.html         # NFT minting system
│   ├── grand_exchange.html # Trading center
│   ├── outdoor.html       # Geo-location explorer
│   ├── high_cafe.html     # Social hub
│   ├── profile.html       # User profile & wallet
│   ├── login.html         # Authentication
│   ├── admin.html         # Admin portal
│   ├── admin-forge.html   # Forge management
│   ├── realm_management.html # Realm collaboration
│   ├── css/               # Stylesheets
│   ├── public/            # JavaScript modules
│   ├── images/            # Assets
│   ├── 3DModels/          # 3D assets (.glb files)
│   └── [other files]      # Additional resources
├── app/                   # Alternative Mandem.OS versions
└── workingNicely/         # Development versions
```

## 🎯 Quick Start

### Option 1: View the Dashboard (Recommended)
1. Open `launcher.html` in your browser
2. Navigate to any project from the visual dashboard
3. All links and navigation are pre-configured

### Option 2: Direct Access
- **Mandem.OS Terminal**: Open `index.html`
- **Gem Bot Universe**: Open `workspace/index.html`
- **User Profile**: Open `workspace/profile.html`

### Option 3: Run with Server (Full Features)
```bash
cd mandem.os/workspace
npm install
node server.js
```
Then visit: `http://localhost:3000`

## 🌟 Key Features

### Mandem.OS Terminal (index.html)
- **Web3 Integration**: MetaMask connection
- **Copper Key Detection**: ERC-1155 token detection
- **Leaderboard System**: On-chain holder tracking
- **3D Flame Visuals**: Three.js powered animations
- **Check-in System**: Wallet signature verification

### Gem Bot Universe Hub (workspace/index.html)
- **3D Globe Navigation**: Interactive satellite system
- **Authentication**: Phantom wallet integration
- **MGC Token System**: In-game currency tracking
- **Real-time Updates**: WebSocket live player feed
- **Location Tracking**: Geo-location logging
- **Global Chat**: Multi-user communication

### Virtual Environments
1. **Laboratory** - 3D lab with faceting machines and printer farm
2. **Warehouse** - Inventory and storage management
3. **Forge** - NFT minting with file-based pricing
4. **Grand Exchange** - Trading marketplace
5. **Explorer** - Geo-location MGC mining
6. **High Cafe** - Social hub

### Backend Services (workspace/server.js)
- Express server on port 3000
- SQLite database (gembot.sqlite)
- User authentication & profiles
- Forge system with mint limits
- Chat logging & moderation
- Location tracking
- Admin controls
- WebSocket support

## 🔗 Integration Details

### How Projects Are Linked

1. **Main Entry Point**: `launcher.html`
   - Visual dashboard for all projects
   - Status indicators (ACTIVE, INTEGRATED, PENDING)
   - Direct navigation to all environments

2. **Terminal Integration**: `index.html`
   - Launcher button in top-right corner
   - Web3 features remain independent
   - Can bridge to Gem Bot Universe

3. **Cross-Project Navigation**:
   - All `workspace/*.html` files link to each other
   - Profile accessible from all environments
   - Admin portal available to authorized users

### API Endpoints

The backend server (`workspace/server.js`) provides:

```
GET  /api/ping                    - Server health check
GET  /api/user/profile            - Fetch user profile
POST /api/user/profile            - Create/update profile
POST /api/user/login              - Authenticate user
GET  /api/users                   - List all users
POST /api/forge                   - Mint new asset
GET  /api/forged-assets           - List forged assets
POST /api/asset-trade             - Trade/replicate asset
GET  /api/location-logs/:wallet   - Location history
POST /api/chat/log                - Log chat message
GET  /api/chat/log                - Retrieve chat logs
POST /api/chat/ban                - Ban user from chat
GET  /api/models                  - List 3D model metadata
GET  /api/admin/*                 - Admin operations
```

## 🛠️ Configuration

### Server Port
Default: `3000`  
Change in `workspace/server.js`: `const PORT = process.env.PORT || 3000;`

### Database
Location: `workspace/gembot.sqlite`  
Auto-created on first server start

### 3D Models
Location: `workspace/3DModels/`  
Metadata: `workspace/3DModels/models.json`

### Environment Variables
Create `.env` file in `workspace/`:
```
PORT=3000
NODE_ENV=production
```

## 🔐 Authentication

### User Authentication
- Email/password system
- Phantom wallet integration
- Wallet address verification
- Session management (24-hour expiry)

### Admin Access
- Password: `500004813` (change in production)
- God mode email verification for BarbrickDesign@gmail.com
- Failed login attempt tracking

## 📊 Features by Environment

### Laboratory
- 3D faceting machines visualization
- 3D printer farm monitoring
- Automated bot production
- Real-time status updates

### Warehouse
- 3D environment with storage visualization
- Inventory management
- Component tracking

### Forge
- Upload 3D models (.glb format)
- Automatic pricing: 1 MGC per 100KB
- Mint limits: 1 mint per 500KB
- Special abilities customization
- Trade/replicate system

### Grand Exchange
- Buy/sell forged assets
- MGC transaction system
- Real-time market updates

### Explorer
- Geo-location based gameplay
- MGC mining portals
- Location logging

## 🎨 Customization

### Styling
- Main theme: `workspace/css/theme.css`
- Color scheme: Purple (#7c5cff) + Cyan (#00d4ff)
- Responsive design included

### Adding New Environments
1. Create HTML file in `workspace/`
2. Add navigation link in `workspace/index.html` globe
3. Update `launcher.html` with new card
4. Link to `server.js` API if needed

## 📱 Mobile Support

- Responsive layouts
- Touch-friendly controls
- Mobile menu adaptations
- Globe navigation optimized for touch

## 🔧 Troubleshooting

### Server Won't Start
```bash
cd workspace
rm -rf node_modules
npm install
node server.js
```

### Database Issues
Delete `workspace/gembot.sqlite` and restart server to recreate

### Port Already in Use
Change PORT in `server.js` or kill existing process:
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 3D Models Not Loading
- Check files are in `workspace/3DModels/`
- Verify `models.json` exists and is valid
- Ensure .glb format

## 📦 Dependencies

### Backend (workspace/package.json)
- express: Web server
- sqlite3: Database
- bcryptjs: Password hashing
- cors: Cross-origin requests
- body-parser: Request parsing

### Frontend
- Three.js (CDN): 3D graphics
- Phantom Wallet: Solana integration
- MetaMask: Ethereum integration
