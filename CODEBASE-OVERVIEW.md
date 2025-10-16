# Codebase Overview - Quick Reference Guide

## Platform Architecture
This is a multi-system platform for government contracting, Web3 tools, and simulations. All systems integrate universal wallet authentication for single sign-on.

## Core Systems

### 1. Universal Wallet Authentication (`universal-wallet-auth.js`)
**Purpose:** Single sign-on across all pages with session management and contractor time tracking.
**Files:**
- `universal-wallet-auth.js` - Main auth engine
- `auth-integration.js` - Integration helper
- `contractor-registry.js` - Contractor management
**Key Features:**
- Session persistence (4hr, 30min inactivity timeout)
- Multi-wallet support (MetaMask, Phantom)
- Auto time tracking for contractors
- Role-based access (System Architect, Approved Contractor)
**System Architect Wallets:** 0xEFc6910e7624F164dAe9d0F799954aa69c943c8d, 0x4ccbefd7d3554bcbbc489b11af73a84d7baef4cb, 0x45a328572b2a06484e02EB5D4e4cb6004136eB16
**Integration:** Add to any page for auth.

### 2. Classified Contracts & Bidding (`crypto-bidding-system.js`)
**Purpose:** Full bidding engine for classified contracts with performance scoring.
**Files:**
- `crypto-bidding-system.js` - Bidding logic
- `classified-contracts.html` - Main contracts page
- `contractor-registration.html` - Registration
- `admin-contractor-dashboard.html` - Approval dashboard
**Key Features:**
- Multi-crypto bids (ETH, SOL, USDC, USDT)
- AI bid ranking (performance, price, timeline)
- Performance scoring (0-100 scale)
- Escrow contract management
- Clearance-based access
**Integration:** Requires wallet auth for access.

### 3. FPDS/SAM.gov Integration (`samgov-integration.js`, `fpds-contract-schema.js`)
**Purpose:** Federal contract intelligence and market data.
**Files:**
- `samgov-integration.js` - SAM.gov API integration
- `fpds-contract-schema.js` - Contract parsing and validation
**Key Features:**
- Contract number parsing (30+ agencies)
- Market statistics and bidding recommendations
- NAICS code mapping
- Historical contract data
**Agencies Supported:** DoD, NASA, DHS, GSA, etc.

### 4. Grand Exchange (`grand-exchange.html`)
**Purpose:** Web3 trading hub for digital assets.
**Files:**
- `grand-exchange.html` - Trading platform
**Key Features:**
- Buy/sell order books
- Multi-crypto support
- Real-time matching
- Search and filtering
**Assets:** Gem Bot NFT, GBU Token, etc.

### 5. Gem Faceting Simulation (`facetProcessor.js`, `simulation.js`)
**Purpose:** 3D simulation of CNC faceting machine.
**Files:**
- `facetProcessor.js` - G-code generation
- `simulation.js` - 3D visualization
- `facetingControls.js` - Controls
- `facetingMachineInit.js` - Initialization
**Key Features:**
- Automated cutting sequences
- Custom designs
- Keyboard controls (WASD, Q/E)
- Lap color system (80-3000 grit)

### 6. Unified Crypto Recovery (`unified-crypto-recovery.html`, `walletTracker.js`)
**Purpose:** Multi-chain recovery tool with scammer detection.
**Files:**
- `unified-crypto-recovery.html` - Main interface
- `walletTracker.js` - Tracking and detection
**Key Features:**
- Solana rent refunds
- Wallet tracking and pattern analysis
- Scam scoring (0-100)
- Dead wallet finder
- Transaction graph building

### 7. Mobile Responsiveness & UI Fixes
**Files:** Updated in `ember-terminal/app.html`, `mandem.os/workspace/index.html`
**Key Features:**
- Horizontal scrollable navigation
- Touch-optimized buttons
- Responsive breakpoints
- Custom scrollbars

## Directory Structure
- `mandem.os/workspace/` - Main workspace
- `ember-terminal/` - Terminal interface
- `gembot-universe/` - Gem bot pages
- Root level: Core scripts, HTML files, service worker

## Integration Patterns
**Standard Script Load Order:**
```html
<script src="contractor-registry.js"></script>
<script src="universal-wallet-auth.js"></script>
<script src="auth-integration.js"></script>
<script src="fpds-contract-schema.js"></script>
<script src="samgov-integration.js"></script>
```

**Auth Initialization:**
```javascript
await window.authIntegration.init({
    showUI: true,
    requireAuth: true,
    onAuthSuccess: (authInfo) => { /* handle */ }
});
```

## Service Worker (`service-worker.js`)
- Cache version: v4
- Offline support for all systems
- Auto-update on changes

## Testing Checklist
- Wallet connection on desktop/mobile
- Cross-page session persistence
- Contractor time tracking
- Bidding and contract matching
- Mobile responsiveness
- Offline functionality

## Quick Search Tags
Use these for quick navigation:
- `<!-- REF: WALLET-AUTH -->`
- `<!-- REF: BIDDING-SYSTEM -->`
- `<!-- REF: CONTRACTS -->`
- `<!-- REF: FPDS-INTEGRATION -->`
- `<!-- REF: GRAND-EXCHANGE -->`
- `<!-- REF: FACETING -->`
- `<!-- REF: CRYPTO-RECOVERY -->`
- `<!-- REF: MOBILE-FIXES -->`

## Status: PRODUCTION READY
All systems integrated and functional as of October 16, 2025.
