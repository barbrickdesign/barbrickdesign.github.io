# Universal Wallet Authentication - Usage Guide

## 🎯 Overview

The Universal Wallet Authentication system provides **single sign-on (SSO)** across your entire platform. Users connect their wallet ONCE and stay authenticated across all pages.

## ✨ Features

- ✅ **Single Sign-On**: Connect once, authenticated everywhere
- ✅ **Session Management**: 4-hour session with 30-min inactivity timeout
- ✅ **Signature Verification**: Cryptographic proof of wallet ownership
- ✅ **Time Tracking**: Auto-tracks contractor work time for performance scoring
- ✅ **Auto-Reconnect**: Restores session on page reload
- ✅ **Multi-Wallet**: Supports MetaMask and Phantom

## 📦 Installation

Add these scripts to your HTML:

```html
<!-- Load in this order -->
<script src="contractor-registry.js"></script>
<script src="universal-wallet-auth.js"></script>
<script src="auth-integration.js"></script>
```

## 🚀 Basic Usage

### Simple Page (No auth required)

```html
<script>
// Initialize auth system
window.addEventListener('DOMContentLoaded', async () => {
    await window.authIntegration.init({
        showUI: true  // Shows connect button
    });
});
</script>
```

### Protected Page (Auth required)

```html
<script>
window.addEventListener('DOMContentLoaded', async () => {
    await window.authIntegration.init({
        requireAuth: true,  // Redirect if not authenticated
        loginPage: 'index.html'
    });
});
</script>
```

### System Architect Only Page

```html
<script>
window.addEventListener('DOMContentLoaded', async () => {
    await window.authIntegration.init();
    
    // Check System Architect role
    window.authIntegration.requireSystemArchitect();
});
</script>
```

### Contractor Only Page

```html
<script>
window.addEventListener('DOMContentLoaded', async () => {
    await window.authIntegration.init();
    
    // Check approved contractor role
    window.authIntegration.requireApprovedContractor();
});
</script>
```

## 🎨 Custom Integration

### With Callbacks

```javascript
await window.authIntegration.init({
    showUI: false,  // Don't show default UI
    onAuthSuccess: (authInfo) => {
        console.log('Authenticated!', authInfo);
        // Show custom UI
        document.getElementById('userAddress').textContent = authInfo.shortAddress;
        document.getElementById('workTime').textContent = authInfo.workTimeMinutes + ' mins';
    },
    onAuthFail: () => {
        console.log('Not authenticated');
        // Show login prompt
    }
});
```

### Manual Connection

```javascript
// Connect wallet manually
document.getElementById('myConnectBtn').addEventListener('click', async () => {
    try {
        const authInfo = await window.universalWalletAuth.connect();
        console.log('Connected:', authInfo);
    } catch (error) {
        console.error('Connection failed:', error);
    }
});
```

### Check Auth Status

```javascript
// Check if authenticated
if (window.authIntegration.isAuthenticated()) {
    const authInfo = window.authIntegration.getAuthInfo();
    console.log('User:', authInfo.address);
    console.log('Work time:', authInfo.workTimeMinutes, 'minutes');
}
```

### Disconnect

```javascript
// Disconnect and clear session
await window.authIntegration.disconnect();
```

## 📊 Time Tracking

Time tracking **automatically starts** for approved contractors:

- ✅ Tracks active time on platform
- ✅ Logs every 5 minutes
- ✅ Stops on disconnect or session expiry
- ✅ Adds to contractor performance score

```javascript
// Get contractor work time
const workMinutes = window.universalWalletAuth.getWorkTime();
const hours = Math.floor(workMinutes / 60);
const mins = workMinutes % 60;
console.log(`Total work time: ${hours}h ${mins}m`);
```

## 🔐 Session Management

### Session Duration
- **Total Session**: 4 hours from creation
- **Inactivity Timeout**: 30 minutes of no activity
- **Auto-Check**: Validates session every minute

### Session Storage
Sessions are stored in `localStorage`:
- `barbrick_auth_session` - Full session data
- `barbrick_wallet_address` - Current address
- `barbrick_wallet_type` - 'ethereum' or 'solana'

### Activity Tracking
These actions reset the inactivity timer:
- Mouse clicks
- Keyboard input
- Scrolling
- Touch events

## 🎭 Role-Based Access

### Check User Role

```javascript
// System Architect
if (window.universalWalletAuth.isSystemArchitect()) {
    console.log('Supreme access granted');
}

// Approved Contractor
if (window.universalWalletAuth.isApprovedContractor()) {
    console.log('Contractor access granted');
}
```

### Authorized Wallets

System Architect wallets (case-insensitive):
- `0xEFc6910e7624F164dAe9d0F799954aa69c943c8d`
- `0x4ccbefd7d3554bcbbc489b11af73a84d7baef4cb`

## 📱 Events

Listen for auth events:

```javascript
// Authentication success
window.addEventListener('authSuccess', (event) => {
    console.log('Auth success:', event.detail);
    // event.detail = { address, shortAddress, sessionToken, authenticated, workTimeMinutes }
});

// Logout
window.addEventListener('authLogout', () => {
    console.log('User logged out');
    // Redirect or show login
});
```

## 🛠️ Advanced Usage

### Custom Session Timeout

```javascript
// Set custom timeout (in milliseconds)
window.universalWalletAuth.sessionTimeout = 2 * 60 * 60 * 1000; // 2 hours
window.universalWalletAuth.inactivityTimeout = 15 * 60 * 1000; // 15 minutes
```

### Manual Session Validation

```javascript
const session = window.universalWalletAuth.loadSession();
if (window.universalWalletAuth.isSessionValid(session)) {
    console.log('Session is valid');
} else {
    console.log('Session expired');
}
```

## 🔍 Debugging

Enable detailed logging:

```javascript
// Check auth status
console.log('Authenticated:', window.universalWalletAuth.isAuthenticated());
console.log('Address:', window.universalWalletAuth.getAddress());
console.log('Session:', window.universalWalletAuth.loadSession());
console.log('Work time:', window.universalWalletAuth.getWorkTime(), 'minutes');
```

## 📋 Example: Complete Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Protected Page</title>
</head>
<body>
    <div class="auth-container">
        <!-- Auth UI will be inserted here -->
    </div>

    <div id="content" style="display:none;">
        <h1>Welcome!</h1>
        <p>Address: <span id="userAddress"></span></p>
        <p>Work Time: <span id="workTime"></span></p>
    </div>

    <!-- Scripts -->
    <script src="contractor-registry.js"></script>
    <script src="universal-wallet-auth.js"></script>
    <script src="auth-integration.js"></script>

    <script>
        window.addEventListener('DOMContentLoaded', async () => {
            // Initialize with custom handlers
            await window.authIntegration.init({
                requireAuth: false,
                showUI: true,
                onAuthSuccess: (authInfo) => {
                    // Show protected content
                    document.getElementById('content').style.display = 'block';
                    document.getElementById('userAddress').textContent = authInfo.shortAddress;
                    
                    const hours = Math.floor(authInfo.workTimeMinutes / 60);
                    const mins = authInfo.workTimeMinutes % 60;
                    document.getElementById('workTime').textContent = `${hours}h ${mins}m`;
                },
                onAuthFail: () => {
                    // Hide protected content
                    document.getElementById('content').style.display = 'none';
                }
            });
        });
    </script>
</body>
</html>
```

## 🚨 Security Notes

1. **Signature Verification**: Every session requires cryptographic signature
2. **No Transaction Risk**: Signature does NOT authorize any blockchain transactions
3. **Session Tokens**: Generated from wallet address + signature + timestamp
4. **Auto-Logout**: Sessions expire after 4 hours or 30 minutes of inactivity
5. **Wallet Changes**: Auto-logout if user switches wallet or network

## 🎯 Best Practices

1. ✅ Always include scripts in correct order
2. ✅ Use `requireAuth` for protected pages
3. ✅ Handle `authSuccess` and `authLogout` events
4. ✅ Test session expiry flows
5. ✅ Provide clear UX for expired sessions
6. ✅ Show work time to contractors for transparency
