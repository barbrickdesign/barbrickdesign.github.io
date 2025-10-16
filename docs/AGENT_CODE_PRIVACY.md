# 🕶️ Agent Code Privacy System - Men in Black Style

## Overview
Contractor identities are protected on public leaderboards using Agent Codes (e.g., Agent R3, Agent K7). Full credentials visible only when clicked.

---

## Agent Code Generation

**Format**: `Agent [FirstLetter][Number]`
- First letter from contractor name or wallet
- Number generated from wallet hash (0-99)
- Unique per wallet address
- **Agent R** reserved for System Architect

### Examples
- Ryan Barbrick → **Agent R** (System Architect override)
- Alice Walker → **Agent A42**
- Bob Chen → **Agent B17**
- 0xABC123... → **Agent A73**

---

## Privacy Features

### Public Leaderboard Display
- ✅ Agent Code only
- ✅ "🔒 Click for full credentials"
- ✅ Stats visible
- ✅ Wallet hidden

### Click to Reveal
- Full name
- Agent code
- Wallet address
- All projects
- Complete credentials
- Time by realm
- Contract cross-references

---

## Project Tracking

### All Projects Listed
- Every project tracked
- Active + completed
- Realm classification
- Time contributions
- Contract cross-references

### Time Contributions
- Total hours across all projects
- Hours by realm (Mandem.OS, Null.OS, Gem Bot Universe)
- Hours by project
- Hours by contract
- Visual progress bars

---

## Implementation

**Files Modified:**
- `contractor-payment-system.js` - Agent code generation
- `contractor-leaderboard.html` - Privacy display

**Agent R Status**: 22+ projects tracked across all realms with cross-referenced contracts and time contributions.
