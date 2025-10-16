# 🔒 Classified Contracts Access Guide

## Overview
The Classified Contracts page provides secure access to government contract opportunities requiring security clearance verification through wallet authentication.

---

## 🎯 Quick Access

### **For Registered Team Members**

1. **Visit**: https://barbrickdesign.github.io/classified-contracts.html
2. **Click**: "🔐 START DUAL VERIFICATION"
3. **Connect**: Your Phantom or MetaMask wallet
4. **Sign**: Authorization message
5. **Access Granted**: View classified contracts

---

## 💼 Supported Wallets

### **Phantom Wallet** (Solana)
- ✅ Primary wallet for Solana-based access
- ✅ Automatic detection
- ✅ One-click connect

### **MetaMask** (Ethereum)
- ✅ Ethereum wallet support
- ✅ EVM-compatible chains
- ✅ One-click connect

**Detection Order**: Phantom → MetaMask → Error

---

## 🔑 Registered Wallets

### **Admin Wallet** (Solana - Phantom)
```
Address: 6HTjfgWZYMbENnMAJJFhxWR2VZDxdze3qV7zznSAsfk
Level: TS/SCI (Top Secret / Sensitive Compartmented Information)
Caveats: NOFORN, NATO, FVEY, ORCON
Access: Full (All contracts)
```

### **Admin Wallet** (Ethereum - MetaMask)
```
Address: 0xEFc6910e7624F164dAe9d0F799954aa69c943c8d
Level: TS/SCI (Top Secret / Sensitive Compartmented Information)
Caveats: NOFORN, NATO, FVEY, ORCON
Access: Full (All contracts)
```

---

## 🛡️ Security Clearance Levels

### **Level Hierarchy** (Lowest to Highest)
1. **PUBLIC** (0) - No clearance required
2. **CONFIDENTIAL** (1) - Basic clearance
3. **SECRET** (2) - Moderate clearance
4. **TOP SECRET** (3) - High clearance
5. **TS/SCI** (4) - Highest clearance with compartmented access

### **Special Access Programs (Caveats)**
- **NOFORN** - No Foreign Nationals
- **NATO** - NATO Access
- **FVEY** - Five Eyes (US, UK, CA, AU, NZ)
- **ORCON** - Originator Controlled

---

## 📋 Authentication Flow

### **Step-by-Step Process**

```
1. User visits classified-contracts.html
    ↓
2. Click "START DUAL VERIFICATION"
    ↓
3. System detects available wallet
    ↓
4. Wallet connection requested
    ↓
5. Check wallet in clearance registry
    ↓
6. Request signature authorization
    ↓
7. User signs message in wallet
    ↓
8. Signature verified
    ↓
9. PIV/CAC card verification (simulated if not available)
    ↓
10. Access GRANTED ✅
    ↓
11. Display contracts matching clearance level
```

---

## 🎨 What You'll See

### **Before Authentication**
- Red/black classified aesthetic
- Warning banners
- Authentication button
- Security notices

### **After Authentication**
- ✅ User info panel (name, org, clearance, expiration)
- 📊 Statistics (accessible contracts, total value, clearance level)
- 📜 Contract cards (filtered by your clearance)
- 🔓 Logout button

---

## 📄 Contract Information Displayed

Each contract card shows:
- **Title** - Contract name
- **Classification Level** - Color-coded badge
- **Value** - Contract amount in millions
- **Agency** - Government department
- **Contract ID** - Unique identifier
- **Deadline** - Submission deadline
- **Status** - Current contract status
- **Description** - Brief overview
- **Requirements** - Technical requirements
- **Caveats** - Special access restrictions (if any)

---

## 🔐 Adding New Team Members

### **For Administrators**

Edit `security-clearance-auth.js` and add to `clearanceRegistry`:

```javascript
clearanceRegistry: {
    // Existing wallets...
    
    // NEW TEAM MEMBER - Solana Wallet
    'NEW_SOLANA_WALLET_ADDRESS_HERE': {
        level: 'SECRET',  // or 'TOP_SECRET', 'TS_SCI'
        caveats: ['NOFORN'],  // optional
        name: 'Team Member Name',
        organization: 'BarbrickDesign',
        verified: true,
        issuer: 'Self-Sovereign',
        expires: '2026-12-31',
        accessAll: false  // true for full access
    },
    
    // NEW TEAM MEMBER - Ethereum Wallet
    '0xNEW_ETHEREUM_ADDRESS_HERE': {
        level: 'SECRET',
        caveats: [],
        name: 'Team Member Name',
        organization: 'BarbrickDesign',
        verified: true,
        issuer: 'Self-Sovereign',
        expires: '2026-12-31',
        accessAll: false
    }
}
```

---

## 🧪 Testing Access

### **Quick Test**
```javascript
// Open browser console (F12)
// Test wallet detection
const auth = window.securityClearanceAuth;
const wallet = await auth.detectAndConnectWallet();
console.log('Wallet:', wallet);
```

### **Expected Console Output**
```
🔍 Detecting available wallets...
👻 Phantom wallet detected
✅ Phantom connected: 6HTjf...SAsfk

🔐 Starting dual authentication process...
✌️ Rooted in Peace, Love, and Understanding
💼 Step 1/3: phantom wallet connected: 6HTjf...SAsfk
🔍 Step 2/3: Clearance found in registry: TS_SCI
✅ Wallet signature verified
🎫 Step 3/3: PIV/CAC White Card verified (simulated)
✅ Authentication successful!
```

---

## 🚨 Troubleshooting

### **Error: "No compatible wallet found"**
**Solution**: Install Phantom or MetaMask extension

### **Error: "No security clearance registered"**
**Solution**: Contact admin to add your wallet to registry

### **Error: "Signature verification failed"**
**Solution**: Sign the authorization message in your wallet popup

### **Error: "Wallet connection failed"**
**Solution**: 
1. Refresh page
2. Disconnect wallet manually
3. Try again

---

## 🔧 Technical Details

### **Wallet Detection Logic**
```javascript
1. Check for window.solana (Phantom)
2. If found → Connect Phantom
3. If not, check for window.ethereum (MetaMask)
4. If found → Connect MetaMask
5. If neither → Error
```

### **Signature Verification**
- **Phantom**: Uses `signMessage()` with UTF-8 encoding
- **MetaMask**: Uses `personal_sign` method

### **Security Features**
- ✅ Wallet ownership verification
- ✅ Signature authentication
- ✅ Clearance level validation
- ✅ Expiration date checking
- ✅ Caveat code enforcement
- ✅ Access logging (console)

---

## 📊 Contract Filtering

Contracts are filtered by:
1. **User's clearance level** (must meet or exceed)
2. **Required caveats** (user must have all required)
3. **Expiration date** (must not be expired)
4. **Verification status** (must be verified)

**Example**: User with SECRET clearance will NOT see TOP SECRET contracts.

---

## 🎯 Use Cases

### **1. Contractor Access**
- View available government contracts
- Check clearance requirements
- See contract values and deadlines
- Access based on verified clearance

### **2. Team Collaboration**
- Multiple team members with different clearance levels
- Each sees contracts they're authorized for
- Secure, wallet-based authentication
- No passwords to manage

### **3. Secure Contract Discovery**
- Find high-value government opportunities
- Filter by classification level
- Track accessible contracts
- Generate proposals

---

## 💰 Token Generation

**Fun & Secure Environment for Contractors:**

Each contract interaction can generate MGC tokens:
- **View Contract** → Small MGC reward
- **Submit Proposal** → Larger MGC reward
- **Win Contract** → Major MGC reward
- **Team Collaboration** → Bonus MGC

**Token Distribution:**
- Secured by wallet authentication
- Tracked on-chain
- Auditable and transparent
- Fair distribution to all team members

---

## ✌️ Peace, Love, and Understanding

This system is rooted in:
- **Trust** - Wallet-based identity
- **Transparency** - All access logged
- **Security** - Multi-factor verification
- **Collaboration** - Team-friendly
- **Fair Access** - Based on clearance level

---

## 📝 Summary

**What You Need:**
1. ✅ Phantom or MetaMask wallet installed
2. ✅ Wallet registered in clearance registry
3. ✅ Valid security clearance (simulated for testing)

**What You Get:**
1. ✅ Access to classified contract opportunities
2. ✅ Filtered by your clearance level
3. ✅ Secure, wallet-based authentication
4. ✅ Team collaboration environment
5. ✅ MGC token generation for participation

---

## 🚀 Quick Start Commands

```bash
# Install Phantom Wallet
Visit: https://phantom.app

# Install MetaMask
Visit: https://metamask.io

# Access Classified Contracts
Visit: https://barbrickdesign.github.io/classified-contracts.html

# Click: "START DUAL VERIFICATION"
# Connect: Your wallet
# Sign: Authorization message
# ✅ Access Granted!
```

---

**Ready to access classified contracts!** Connect your wallet and join the trusted team. 🔐✨

**Questions?** Check console logs (F12) for detailed authentication flow.
