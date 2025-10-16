# Wallet Integration - Unified Solution

## Problem Solved

The G3MPATH.html file mentioned doesn't exist (may have been deleted or renamed), but the core issue was that **wallet connection wasn't working consistently across projects**. This has been resolved by implementing a unified wallet connection system using the working `phantomLogin.js` script.

## What Was Fixed

### 1. **Unified Wallet Script**
- Located at: `mandem.os/workspace/public/phantomLogin.js`
- This is the MASTER wallet connection script
- Handles Phantom wallet connection, signature verification, token/NFT fetching
- Works on both desktop and mobile (with deep linking)
- Auto-reconnects after mobile app returns

### 2. **Main Index Page Updated**
- File: `index.html` (root)
- Now includes wallet connection button
- Matches the style of `ember-terminal/app.html`
- Links to Ember Terminal added
- Shows wallet status and address when connected

### 3. **Template Created**
- File: `wallet-base.html`
- Copy-paste template for adding wallet connectivity to ANY HTML file
- Includes all required dependencies and usage instructions

## How to Use Wallet Connection

### For Existing Pages

To add wallet connectivity to any HTML file, add these scripts in the `<head>` section **BEFORE** any custom scripts:

```html
<!-- Wallet Connection Dependencies -->
<script src="https://cdn.jsdelivr.net/npm/tweetnacl@1.0.3/nacl.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@solana/web3.js@1.95.8/lib/index.iife.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@solana/spl-token@0.3.11/dist/browser/spl-token.min.js"></script>
<script src="mandem.os/workspace/public/phantomLogin.js"></script>
```

**Note:** Adjust the path to `phantomLogin.js` based on your file's location relative to the root.

### Available Functions

Once the scripts are loaded, you have access to:

```javascript
// Connect wallet (with optional signup redirect)
await connectPhantomWallet(isSignup = false);

// Disconnect wallet
disconnectWallet();

// Check if authenticated
const isAuth = isUserAuthenticated();

// Get current wallet state
const state = getWalletState();
// Returns: { connected, publicKey, balance, tokens, nfts }

// Refresh wallet data
await refreshWalletData();
```

### Example Button Setup

```html
<button onclick="connectPhantomWallet()">Connect Wallet</button>

<script>
async function handleConnect() {
    try {
        await connectPhantomWallet();
        const state = getWalletState();
        if (state.connected) {
            console.log('Connected:', state.publicKey);
            console.log('Balance:', state.balance, 'SOL');
        }
    } catch (error) {
        console.error('Connection failed:', error);
    }
}
</script>
```

## Files Modified

1. **index.html** (root) - Added wallet connectivity and link to Ember Terminal
2. **wallet-base.html** (NEW) - Template with all necessary includes
3. **WALLET-INTEGRATION-README.md** (NEW) - This documentation

## Files Already Using Wallet Connection

These files already have wallet connectivity implemented:

- `mandem.os/workspace/login.html`
- `mandem.os/workspace/profile.html`
- `sol-recovery.html` (has its own implementation but can be unified)

## Key Features

### Desktop Support
- Automatic Phantom extension detection
- Signature verification for security
- Persistent connection across page reloads (24 hours)

### Mobile Support
- Deep linking to Phantom mobile app
- Auto-reconnect when returning from app
- Seamless mobile experience

### Data Fetching
- SOL balance
- All token holdings (SPL tokens)
- NFT detection (0 decimals, balance 1)
- Metadata fetching for NFTs

### Debug Features
- All actions logged to console
- Debug logs stored in localStorage
- Can view with: `JSON.parse(localStorage.getItem('wallet_debug_logs'))`

## Testing the Connection

### On Desktop
1. Open https://barbrickdesign.github.io/
2. Click "Connect Wallet"
3. Approve in Phantom extension
4. Should show connected status with address

### On Mobile
1. Open https://barbrickdesign.github.io/ in mobile browser
2. Click "Connect Wallet"
3. Opens Phantom app for approval
4. Returns to site and auto-connects

## Troubleshooting

### "Wallet script not loaded" Error
- Check that all script tags are included in the correct order
- Verify the path to `phantomLogin.js` is correct
- Check browser console for loading errors

### Connection Fails on Mobile
- Ensure Phantom app is installed
- Clear browser cache and try again
- Check that you're returning to the same URL after approval

### Connection Not Persisting
- Check localStorage isn't being blocked
- Verify cookies/storage aren't being cleared
- Connection expires after 24 hours by default

## Next Steps

### To Add Wallet to Other Pages

1. Copy the script includes from `wallet-base.html`
2. Adjust the path to `phantomLogin.js` as needed
3. Add a connect button with `onclick="connectPhantomWallet()"`
4. Optionally check connection status on page load

### To Customize Behavior

Edit `mandem.os/workspace/public/phantomLogin.js` to:
- Change connection timeout values
- Modify RPC endpoints
- Adjust authentication expiry time
- Add custom wallet state management

## Important Notes

- **DO NOT** create duplicate wallet connection scripts
- **ALWAYS** use the master script at `mandem.os/workspace/public/phantomLogin.js`
- This ensures consistency across all projects
- All updates should be made to the master script only

## Support

For issues or questions:
1. Check browser console for detailed error logs
2. View debug logs: `localStorage.getItem('wallet_debug_logs')`
3. Verify Phantom wallet is installed and unlocked
4. Test on https://barbrickdesign.github.
