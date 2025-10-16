# 🔥 Pump.fun Token Integration - Complete Guide

**Token Address:** `GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r`  
**Platform:** pump.fun  
**Chain:** Solana  
**Symbol:** MANDEM  
**Name:** Mandem OS Token  

**Integration Date:** October 15, 2025  
**Version:** 1.0.0

---

## 🎯 **Purpose**

The pump.fun token is the **official native currency** for:
1. **Mandem.OS** - Virtual environment system
2. **Ember Terminal** - Gaming/questing platform

---

## 📍 **Token Details**

### **Official Links:**
- **Pump.fun:** https://pump.fun/coin/GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r
- **Solscan:** https://solscan.io/token/GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r
- **Solana Explorer:** https://explorer.solana.com/address/GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r

### **Token Specifications:**
```javascript
{
    address: 'GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r',
    name: 'Mandem OS Token',
    symbol: 'MANDEM',
    decimals: 9,
    chain: 'solana',
    platform: 'pump.fun'
}
```

---

## 🔧 **Integration Components**

### **1. Core File Created**
**File:** `pumpfun-token-config.js`

**Features:**
- Token configuration and metadata
- Price fetching from pump.fun API
- Balance checking for connected wallets
- Token amount formatting utilities
- Widget HTML generation
- Auto-initialization on DOMContentLoaded

### **2. Pages Integrated**

#### **✅ Mandem.OS**
**File:** `/mandem.os/workspace/index.html`

**Location:** Header area, below MGC balance
```html
<div id="pumpfun-token-container" style="max-width: 400px; margin: 15px auto 0;"></div>
```

**Features:**
- Displays token balance for connected wallet
- Shows current price in USD
- Shows 24h price change
- Direct link to pump.fun trading page

#### **✅ Ember Terminal**
**File:** `/ember-terminal/app.html`

**Location 1:** Above navigation footer
```html
<div id="pumpfun-token-container" style="max-width: 400px; margin: 0 auto 10px;"></div>
```

**Location 2:** MNDM Status Bar (Real-time balance display)
```html
<div class="swag-status-bar">
    <div class="status-label">MNDM 🔥</div>
    <div class="status-bar-container">
        <div class="status-bar-fill swag-fill" id="swagStatusFill"></div>
    </div>
    <div class="status-value" id="swagStatusValue">0</div>
</div>
```

**Features:**
- Full token widget with trade button
- **MNDM Status Bar** - Real-time balance in status HUD
- Auto-updates when wallet connects
- Progress bar shows balance (max 10,000 MNDM = 100%)
- Pump.fun orange/gold gradient colors
- Integrated with Ember's cyberpunk theme
- Responsive mobile design

---

## 🎨 **Widget Design**

### **Visual Style:**
- **Gradient Background:** `linear-gradient(135deg, #FF6B35 0%, #F7931A 100%)`
- **Logo:** 🔥 emoji
- **Colors:** Orange/gold theme matching pump.fun
- **Shadow:** Glowing orange shadow effect
- **Rounded Corners:** 12px border radius

### **Widget Components:**
1. **Token Symbol & Logo** (top-left)
2. **Balance Display** (top-right)
3. **Price Information** (middle)
4. **24h Change** (middle-right, color-coded)
5. **Trade Button** (bottom, links to pump.fun)

### **Example Widget:**
```
╔══════════════════════════════════╗
║  🔥 MANDEM           1,234.56    ║
║  Mandem OS Token     Balance     ║
║                                  ║
║  Price         24h Change        ║
║  $0.004200     ▲ 15.30%         ║
║                                  ║
║  [📈 Trade on Pump.fun]          ║
╚══════════════════════════════════╝
```

---

## 💻 **API Functions**

### **Available Functions:**

#### **1. Get Token Price**
```javascript
const priceData = await getTokenPrice();
// Returns: { price, priceUSD, change24h, volume24h, marketCap, holders, transactions24h }
```

#### **2. Get Token Balance**
```javascript
const balance = await getTokenBalance(walletAddress);
// Returns: Number (token amount)
```

#### **3. Format Token Amount**
```javascript
const formatted = formatTokenAmount(1234.5678, 2);
// Returns: "1,234.57"
```

#### **4. Get Display Info**
```javascript
const info = getTokenDisplayInfo();
// Returns: { symbol, name, logo, color, address, shortAddress, pumpfunUrl }
```

#### **5. Initialize Token Widget**
```javascript
await initPumpfunToken('pumpfun-token-container');
// Auto-fetches price, balance, and renders widget
```

---

## 🚀 **How It Works**

### **Automatic Initialization:**
```javascript
// On page load, if container exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pumpfun-token-container')) {
        initPumpfunToken();
    }
});
```

### **Manual Initialization:**
```javascript
// Call manually with custom container ID
await initPumpfunToken('my-custom-container-id');
```

### **Integration with Wallet Auth:**
```javascript
// Automatically detects connected wallet
if (window.universalWalletAuth && window.universalWalletAuth.isAuthenticated()) {
    const address = window.universalWalletAuth.getAddress();
    const balance = await getTokenBalance(address);
    // Display balance in widget
}
```

---

## 🎮 **Use Cases**

### **In Mandem.OS:**
1. **Rewards:** Earn MANDEM tokens for completing tasks
2. **Purchases:** Buy virtual items with MANDEM
3. **Staking:** Stake tokens for platform benefits
4. **Governance:** Vote on platform decisions
5. **Trading:** Buy/sell on pump.fun directly from UI

### **In Ember Terminal:**
1. **Quest Rewards:** Complete quests to earn MANDEM
2. **Item Purchases:** Buy relics, scrolls, and upgrades
3. **Trading:** Exchange with other players
4. **Staking:** Lock tokens for bonus stats
5. **Leaderboard:** Top holders get special status

---

## 📊 **Mock Data (For Testing)**

Currently using mock data until live API integration:
```javascript
{
    price: 0.000042,        // SOL
    priceUSD: 0.0042,       // USD
    change24h: 15.3,        // Percentage
    volume24h: 125000,      // USD
    marketCap: 420000,      // USD
    holders: 1337,          // Number of holders
    transactions24h: 2450   // 24h transactions
}
```

---

## 🔮 **Future Enhancements**

### **Phase 2: Live Data**
- [ ] Connect to pump.fun real-time API
- [ ] Fetch live price updates every 30 seconds
- [ ] Display real holder count
- [ ] Show live transaction feed
- [ ] Price chart integration

### **Phase 3: Trading Features**
- [ ] Buy MANDEM directly from widget
- [ ] Sell MANDEM from widget
- [ ] Set price alerts
- [ ] Trading history
- [ ] Portfolio tracking

### **Phase 4: Gamification**
- [ ] Earn tokens for platform engagement
- [ ] Reward system for active users
- [ ] Staking rewards
- [ ] Liquidity mining
- [ ] Token-gated features

### **Phase 5: Smart Contracts**
- [ ] On-chain staking contract
- [ ] Governance voting contract
- [ ] Reward distribution contract
- [ ] NFT integration (use MANDEM for minting)
- [ ] Escrow for marketplace trades

---

## 🧪 **Testing**

### **Test the Integration:**

1. **Open Mandem.OS:**
   ```
   URL: /mandem.os/workspace/index.html
   Check: Token widget appears in header
   ```

2. **Open Ember Terminal:**
   ```
   URL: /ember-terminal/app.html
   Check: Token widget appears above nav footer
   ```

3. **Connect Wallet:**
   ```
   Click: Connect Wallet button
   Result: Widget shows your balance (mock data for now)
   ```

4. **Check Console:**
   ```
   Open: Browser DevTools (F12)
   Check: "🔥 Pump.fun Token Config Loaded"
   Check: Token address logged
   ```

5. **Click Trade Button:**
   ```
   Click: "📈 Trade on Pump.fun" button
   Result: Opens pump.fun page in new tab
   URL: https://pump.fun/coin/GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r
   ```

---

## 📱 **Mobile Responsive**

### **Breakpoints:**
- **Desktop (>768px):** Full widget, all details visible
- **Tablet (480-768px):** Slightly smaller padding
- **Mobile (<480px):** Compact layout, smaller fonts

### **Mobile Features:**
- Touch-optimized trade button
- Responsive font sizes
- Stacks vertically on narrow screens
- Maintains readability

---

## 🔐 **Security**

### **Important Notes:**
1. **Read-Only:** Widget only displays data, doesn't request wallet signatures
2. **No Private Keys:** Never stores or transmits private keys
3. **Safe Links:** All pump.fun links are official and verified
4. **Mock Data:** Currently using mock data (safe for testing)
5. **Wallet Integration:** Uses existing universal-wallet-auth system

### **When Live API Enabled:**
- Use HTTPS only for API calls
- Implement rate limiting
- Cache responses appropriately
- Validate all API responses
- Handle errors gracefully

---

## 🛠️ **Customization**

### **Change Widget Style:**
```javascript
// In pumpfun-token-config.js
PUMPFUN_TOKEN_CONFIG.color = '#YOUR_COLOR';
PUMPFUN_TOKEN_CONFIG.gradient = 'YOUR_GRADIENT';
PUMPFUN_TOKEN_CONFIG.logo = '🔥'; // Or image URL
```

### **Change Widget Position:**
```html
<!-- Move container anywhere -->
<div id="pumpfun-token-container" style="YOUR_STYLES"></div>
```

### **Change Update Frequency:**
```javascript
// Add auto-refresh
setInterval(async () => {
    await initPumpfunToken();
}, 30000); // 30 seconds
```

---

## 📚 **Code Examples**

### **Example 1: Basic Integration**
```html
<!DOCTYPE html>
<html>
<head>
    <script src="pumpfun-token-config.js"></script>
</head>
<body>
    <div id="pumpfun-token-container"></div>
    
    <script>
        // Auto-initializes on page load
    </script>
</body>
</html>
```

### **Example 2: Custom Container**
```html
<div id="my-token-widget"></div>

<script>
    window.addEventListener('DOMContentLoaded', async () => {
        await initPumpfunToken('my-token-widget');
    });
</script>
```

### **Example 3: Manual Balance Display**
```javascript
// Get balance for specific wallet
const balance = await getTokenBalance('YourSolanaAddressHere');
console.log('Balance:', balance, 'MANDEM');
```

### **Example 4: Price Monitoring**
```javascript
// Monitor price changes
setInterval(async () => {
    const priceData = await getTokenPrice();
    console.log('Current Price:', priceData.priceUSD);
    console.log('24h Change:', priceData.change24h);
}, 60000); // Every minute
```

---

## 🐛 **Troubleshooting**

### **Widget Not Showing:**
1. Check container exists: `document.getElementById('pumpfun-token-container')`
2. Check script loaded: `console.log(window.PUMPFUN_TOKEN_CONFIG)`
3. Check console for errors
4. Hard refresh: Ctrl + Shift + F5

### **Balance Shows 0:**
1. Currently using mock data (expected)
2. When live: Check wallet connected
3. Verify Solana address is valid
4. Check console for API errors

### **Trade Button Not Working:**
1. Check popup blocker
2. Verify pump.fun URL is correct
3. Check browser console for errors

---

## 📞 **Support**

### **For Issues:**
1. Check browser console (F12)
2. Verify all scripts loaded
3. Test with wallet connected
4. Clear cache and hard refresh

### **Configuration File:**
- `pumpfun-token-config.js`

### **Integrated Pages:**
- `/mandem.os/workspace/index.html`
- `/ember-terminal/app.html`

---

## ✅ **Integration Checklist**

- [x] ✅ Token config file created
- [x] ✅ Mandem.OS integration complete
- [x] ✅ Ember Terminal integration complete
- [x] ✅ Widget design implemented
- [x] ✅ Auto-initialization working
- [x] ✅ Balance display functional
- [x] ✅ Price display functional
- [x] ✅ Trade button working
- [x] ✅ Mobile responsive
- [x] ✅ Documentation complete
- [ ] ⏳ Live API integration (Phase 2)
- [ ] ⏳ Real-time price updates (Phase 2)
- [ ] ⏳ Trading features (Phase 3)
- [ ] ⏳ Smart contracts (Phase 5)

---

## 🎉 **Summary**

**Token:** MANDEM (GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r)  
**Platform:** pump.fun (Solana)  
**Status:** ✅ INTEGRATED  
**Pages:** Mandem.OS + Ember Terminal  
**Features:** Balance display, price tracking, direct trading link  

**Next Steps:**
1. Test integration on both pages
2. Connect wallet to see mock balance
3. Click trade button to visit pump.fun
4. Ready for Phase 2 (live API integration)

---

**Built with 🔥 for Mandem.OS & Ember Terminal**  
**Powered by pump.fun on Solana**

**Token Ready! 🚀💎**
