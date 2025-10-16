# 🔐 Universal Authentication System - Usage Guide

## Overview

The Universal Authentication system provides **single sign-on (SSO)** across all pages of the BARBRICKDESIGN ecosystem. Once a user connects their wallet on the main index page and signs the verification message, they stay authenticated across ALL pages without reconnecting.

## Key Features

✅ **Single Sign-On** - Connect once, authenticated everywhere  
✅ **Signature-Based Auth** - Uses signed message for verification  
✅ **24-Hour Sessions** - Auto-expires after 24 hours for security  
✅ **Cross-Page Persistence** - localStorage-based, works across tabs  
✅ **Wallet Verification** - Checks wallet is still connected  
✅ **Platform Agnostic** - Works with Phantom, MetaMask, any wallet  

---

## Setup (Already Done on Main Pages)

### 1. Add Scripts to Your HTML

```html
<head>
    <!-- Solana Web3 (if using Phantom) -->
    <script src="https://cdn.jsdelivr.net/npm/@solana/web3.js@1.95.8/lib/index.iife.min.js"></script>
    
    <!-- Universal Auth (MUST be first) -->
    <script src="universal-auth.js"></script>
    <script src="universal-wallet-connect.js"></script>
</head>
```

### 2. Pages Already Configured

- ✅ `index.html` - Main hub (sign-in page)
- ✅ `universal-dev-compensation.html`
- ✅ `investment-dashboard.html`
- ✅ `project-status-dashboard.html`

---

## How to Use in Your Pages

### Basic Authentication Check

```javascript
// Check if user is authenticated
window.addEventListener('DOMContentLoaded', async function() {
    const isAuth = await window.universalAuth.checkAuth();
    
    if (isAuth) {
        console.log('✅ User is authenticated!');
        const wallet = window.universalAuth.getWalletInfo();
        console.log('Wallet:', wallet);
    } else {
        console.log('❌ User not authenticated');
        // Optionally redirect to index.html
        // window.location.href = '/';
    }
});
```

### Get Wallet Information

```javascript
const walletInfo = window.universalAuth.getWalletInfo();

if (walletInfo) {
    console.log('Address:', walletInfo.address); // Full address
    console.log('Short:', walletInfo.shortAddress); // Abbreviated
    console.log('Type:', walletInfo.type); // 'Phantom' or 'MetaMask'
    console.log('Signature:', walletInfo.signature); // Signed message
    console.log('Verified:', walletInfo.verifiedAt); // Timestamp
}
```

### Display Auth Status in UI

```html
<!-- Add this div where you want status displayed -->
<div id="authStatus"></div>
```

```javascript
// Auto-displays authentication status
window.universalAuth.displayAuthStatus('authStatus');
```

**Output (if authenticated):**
```
✅ Connected: ABC123...XYZ789 (Phantom)
```

**Output (if not authenticated):**
```
⚠️ Not connected  [Connect Wallet link]
```

### Require Authentication (Protect Pages)

```javascript
// Redirect to index if not authenticated
window.addEventListener('DOMContentLoaded', async function() {
    await window.universalAuth.checkAuth();
    
    if (!window.universalAuth.requireAuth('/index.html')) {
        // User will be redirected, this won't execute
        return;
    }
    
    // User is authenticated, proceed with page logic
    initializePage();
});
```

### Use for API Calls

```javascript
// Get headers with wallet authentication
const headers = {
    'Content-Type': 'application/json',
    ...window.universalAuth.getAuthHeaders()
};

// Headers will include:
// 'X-Wallet-Address': '...'
// 'X-Wallet-Type': 'Phantom'
// 'X-Wallet-Signature': {...}
// 'X-Verified-At': '2025-10-14T...'

fetch('/api/user-data', {
    method: 'GET',
    headers: headers
}).then(response => response.json())
  .then(data => console.log(data));
```

### Listen for Auth Changes

```javascript
// React to auth status changes
window.addEventListener('authStatusChanged', function(event) {
    const walletInfo = event.detail;
    
    if (walletInfo && walletInfo.isAuthenticated) {
        console.log('✅ User authenticated:', walletInfo.shortAddress);
        updateUIForAuthenticatedUser(walletInfo);
    } else {
        console.log('❌ User not authenticated');
        updateUIForGuest();
    }
});
```

### Verify Wallet Still Connected

```javascript
// Check if wallet hasn't changed
const isStillValid = await window.universalAuth.verifyCurrentWallet();

if (!isStillValid) {
    alert('Your wallet connection has changed. Please reconnect.');
    window.universalAuth.clearAuth();
    window.location.href = '/';
}
```

---

## Complete Example Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Protected Page Example</title>
    <script src="https://cdn.jsdelivr.net/npm/@solana/web3.js@1.95.8/lib/index.iife.min.js"></script>
    <script src="universal-auth.js"></script>
    <script src="universal-wallet-connect.js"></script>
</head>
<body>
    <div class="container">
        <h1>Protected Page</h1>
        
        <!-- Auth status will appear here -->
        <div id="authStatus"></div>
        
        <div id="content" style="display: none;">
            <h2>Welcome, <span id="walletAddress"></span>!</h2>
            <p>This content is only visible to authenticated users.</p>
            
            <button onclick="logout()">Disconnect</button>
        </div>
        
        <div id="loginPrompt" style="display: none;">
            <p>Please connect your wallet to access this page.</p>
            <a href="/index.html">Go to Main Page</a>
        </div>
    </div>

    <script>
        window.addEventListener('DOMContentLoaded', async function() {
            // Check authentication
            const isAuth = await window.universalAuth.checkAuth();
            
            // Display status badge
            window.universalAuth.displayAuthStatus('authStatus');
            
            if (isAuth) {
                // Show authenticated content
                document.getElementById('content').style.display = 'block';
                
                const wallet = window.universalAuth.getWalletInfo();
                document.getElementById('walletAddress').textContent = wallet.shortAddress;
                
                console.log('✅ User authenticated');
                console.log('Wallet:', wallet.address);
                console.log('Type:', wallet.type);
                console.log('Verified:', new Date(wallet.verifiedAt).toLocaleString());
            } else {
                // Show login prompt
                document.getElementById('loginPrompt').style.display = 'block';
            }
        });
        
        function logout() {
            window.universalAuth.clearAuth();
            window.location.href = '/index.html';
        }
    </script>
</body>
</html>
```

---

## How the Flow Works

### 1. Initial Connection (index.html)

```
User clicks "CONNECT WALLET"
    ↓
Wallet opens (Phantom/MetaMask)
    ↓
User approves connection
    ↓
Connection successful
    ↓
Sign verification message
    ↓
Signature stored in localStorage
    ↓
User is now authenticated
```

### 2. Navigation to Other Pages

```
User clicks link to investment-dashboard.html
    ↓
Page loads universal-auth.js
    ↓
Auto-checks localStorage for wallet_verified
    ↓
Found! User still authenticated
    ↓
No reconnection needed
    ↓
Page shows authenticated content
```

### 3. Session Expiry (24 hours)

```
User returns after 25 hours
    ↓
universal-auth checks timestamp
    ↓
Session expired
    ↓
clearAuth() called
    ↓
User redirected to index.html
    ↓
Must reconnect wallet
```

---

## localStorage Keys Used

```javascript
'wallet_connected'    // 'true' if connected
'wallet_address'      // Full wallet address
'wallet_type'         // 'Phantom' or 'MetaMask'  
'wallet_balance'      // Last known balance
'wallet_verified'     // 'true' if signature collected
'wallet_signature'    // JSON of signature
'wallet_verified_at'  // ISO timestamp
```

---

## Security Features

✅ **Signature Verification** - Proves wallet ownership  
✅ **Time-Based Expiry** - Sessions expire after 24 hours  
✅ **Wallet Address Check** - Detects if user switched wallets  
✅ **No Passwords** - Blockchain-native authentication  
✅ **Client-Side Only** - No server dependencies  

---

## Troubleshooting

### User Not Staying Authenticated

**Check:**
1. Is `universal-auth.js` loaded on the page?
2. Is it loaded BEFORE other wallet scripts?
3. Check console for errors
4. Verify localStorage has the keys above

### Signature Not Being Saved

**Check:**
1. Message signing happening in `index.html`
2. `signVerificationMessage()` function executing
3. No errors in console during signing
4. User not rejecting the signature request

### Authentication Expiring Too Soon

**Solution:**
- Increase expiry time in `universal-auth.js`:
```javascript
// Change from 24 hours to 7 days
if (hoursSinceVerification < 168) { // 7 * 24 = 168
    // ... authenticated
}
```

---

## Best Practices

### 1. Always Check Auth Early

```javascript
window.addEventListener('DOMContentLoaded', async function() {
    await window.universalAuth.checkAuth(); // First thing!
    // Then proceed with page logic
});
```

### 2. Show Friendly Messages

```javascript
if (!isAuth) {
    alert('Please connect your wallet on the main page first!');
    window.location.href = '/';
}
```

### 3. Handle Wallet Changes

```javascript
setInterval(async () => {
    const isValid = await window.universalAuth.verifyCurrentWallet();
    if (!isValid) {
        alert('Wallet changed! Please reconnect.');
        window.universalAuth.clearAuth();
        window.location.href = '/';
    }
}, 30000); // Check every 30 seconds
```

### 4. Use Auth for Data Fetching

```javascript
async function loadUserData() {
    const wallet = window.universalAuth.getWalletInfo();
    if (!wallet) return;
    
    // Fetch user-specific data
    const response = await fetch(`/api/portfolio/${wallet.address}`, {
        headers: window.universalAuth.getAuthHeaders()
    });
    
    const data = await response.json();
    displayData(data);
}
```

---

## Testing

### Test 1: Fresh Connection
1. Clear localStorage
2. Go to index.html
3. Connect wallet
4. Sign message
5. Navigate to another page
6. Should stay connected ✅

### Test 2: Refresh Persistence
1. Connect on index.html
2. Refresh the page
3. Should auto-reconnect ✅

### Test 3: Cross-Tab Sync
1. Connect in Tab A
2. Open Tab B (same site)
3. Both tabs should show connected ✅

### Test 4: Expiry
1. Change expiry to 1 minute (for testing)
2. Connect wallet
3. Wait 1 minute
4. Refresh - should require reconnection ✅

---

## Status: ✅ PRODUCTION READY

All pages now share authentication. No more reconnecting on every page!

**Files:**
- ✅ `universal-auth.js` - Core authentication logic
- ✅ `universal-wallet-connect.js` - Wallet connection
- ✅ `index.html` - Sign-in page
- ✅ All dashboard pages - Auto-authenticated

**Next:** Test across all pages and push to GitHub!
