# Security & Mobile Implementation Guide

## 🔒 Security Audit Results

### ✅ PASSED: No Exposed Credentials
- **HTML Files**: No passwords, API keys, or secrets found
- **Server Files**: Properly using environment variables (.env)
- **Best Practice**: All sensitive data stored in .env file (not tracked by git)

### 🔐 Required Environment Variables
Create `.env` file in project root:
```env
# GitHub OAuth (for ember-terminal server)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Blockchain Configuration
RPC_URL=https://cloudflare-eth.com
CONTRACT=0x45a328572b2a06484e02EB5D4e4cb6004136eB16
GOD_TOKEN_ID=45

# Cline API Configuration
CLINE_API_VAULT=6HTjfgWZYMbENnMAJJFhxWR2VZDxdze3qV7zznSAsfk
PAYMENT_TOKEN=GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r

# Server Configuration
PORT=4000
APP_BASE_URL=http://localhost:4000
COOKIE_SECRET=generate_random_secret_here
```

## 📱 Mobile Responsiveness Implementation

### Strategy
1. **Mobile-First Design**: All layouts optimized for 320px+ screens
2. **Responsive Breakpoints**:
   - Mobile: 320px - 768px
   - Tablet: 769px - 1024px
   - Desktop: 1025px+
3. **Touch-Friendly**: Minimum 44px touch targets
4. **Performance**: Optimized graphics for low-power devices

### CSS Framework
```css
/* Global Mobile-First Base */
:root {
  --mobile-padding: 16px;
  --tablet-padding: 24px;
  --desktop-padding: 32px;
  
  --touch-target-min: 44px;
  --font-size-mobile: 14px;
  --font-size-desktop: 16px;
}

/* Responsive Container */
.responsive-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--mobile-padding);
}

@media (min-width: 769px) {
  .responsive-container {
    padding: var(--tablet-padding);
  }
}

@media (min-width: 1025px) {
  .responsive-container {
    padding: var(--desktop-padding);
  }
}

/* Touch-Friendly Buttons */
button, .btn, .touch-target {
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
  padding: 12px 24px;
  font-size: 16px; /* Prevent iOS zoom on input focus */
}

/* Mobile Navigation */
@media (max-width: 768px) {
  nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
  }
  
  /* Stack vertically on mobile */
  .flex-desktop {
    flex-direction: column;
  }
  
  /* Hide non-essential content */
  .desktop-only {
    display: none;
  }
}

/* 3D Graphics Performance */
@media (max-width: 768px), (max-device-width: 768px) {
  canvas, .three-js-canvas {
    /* Reduce quality on mobile */
    image-rendering: optimizeSpeed;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: optimize-contrast;
  }
  
  /* Disable shadows on mobile */
  .shadow-heavy {
    box-shadow: none !important;
  }
  
  /* Reduce animations */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 💳 Cline API Integration

### Payment System Architecture

```javascript
// Cline API Payment Handler
const CLINE_VAULT = "6HTjfgWZYMbENnMAJJFhxWR2VZDxdze3qV7zznSAsfk";
const PAYMENT_TOKEN = "GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r";
const KEY_TOKEN_ID = 45;

class ClineAPIHandler {
  constructor() {
    this.wallet = null;
    this.hasKey = false;
  }
  
  async initialize() {
    // Connect to Phantom wallet
    if (window.solana && window.solana.isPhantom) {
      this.wallet = window.solana;
      await this.checkKeyOwnership();
    }
  }
  
  async checkKeyOwnership() {
    // Check if wallet holds Key #45
    // If true, API calls are free
    // If false, require payment
    const connection = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com');
    const publicKey = this.wallet.publicKey;
    
    // Check token account for KEY_TOKEN_ID
    // Implementation would check specific token account
    this.hasKey = await this.verifyKeyOwnership(publicKey);
    return this.hasKey;
  }
  
  async callClineAPI(prompt, options = {}) {
    if (!this.hasKey) {
      // Require payment
      const paymentResult = await this.processPayment(options.cost || 0.01);
      if (!paymentResult.success) {
        throw new Error('Payment required for API call');
      }
    }
    
    // Make API call to Cline
    const response = await fetch('/api/cline/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt, 
        walletAddress: this.wallet.publicKey.toString(),
        hasKey: this.hasKey 
      })
    });
    
    return await response.json();
  }
  
  async processPayment(amount) {
    try {
      // Create transaction to send PAYMENT_TOKEN to CLINE_VAULT
      const transaction = new solanaWeb3.Transaction();
      
      // Add transfer instruction
      // (Implementation would add proper SPL token transfer)
      
      // Sign and send transaction
      const signature = await this.wallet.signAndSendTransaction(transaction);
      
      return { success: true, signature };
    } catch (error) {
      console.error('Payment failed:', error);
      return { success: false, error };
    }
  }
}

// Usage in Ember Terminal
const clineAPI = new ClineAPIHandler();
await clineAPI.initialize();

// Free for key holders, paid for others
const response = await clineAPI.callClineAPI("Help me with this code...");
```

### Server-Side Verification

```javascript
// Add to ember-terminal server.js

app.post('/api/cline/chat', async (req, res) => {
  try {
    const { prompt, walletAddress, hasKey } = req.body;
    
    if (!hasKey) {
      // Verify payment was received
      const paymentVerified = await verifyPaymentToVault(walletAddress);
      if (!paymentVerified) {
        return res.status(402).json({ error: 'Payment required' });
      }
    }
    
    // Call actual Cline API or local AI
    const clineResponse = await callClineService(prompt);
    
    res.json({ response: clineResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function verifyPaymentToVault(walletAddress) {
  // Check recent transactions to CLINE_VAULT
  // Verify PAYMENT_TOKEN was sent
  // Return true if valid payment found
  return true; // Placeholder
}

async function callClineService(prompt) {
  // Integration with Cline API
  // Or use local AI model
  return "Response from Cline...";
}
```

## 🎨 Graphics Optimization

### 3D Environment Settings

```javascript
// Adaptive quality based on device
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isLowPower = navigator.deviceMemory < 4 || navigator.hardwareConcurrency < 4;

const graphicsSettings = {
  antialias: !isMobile,
  shadows: !isMobile && !isLowPower,
  particleCount: isMobile ? 50 : isLowPower ? 100 : 200,
  textureQuality: isMobile ? 'low' : isLowPower ? 'medium' : 'high',
  fps: isMobile ? 30 : 60
};

// Three.js renderer setup
const renderer = new THREE.WebGLRenderer({
  antialias: graphicsSettings.antialias,
  powerPreference: isMobile ? 'low-power' : 'high-performance'
});

// Reduce poly count on mobile
const geometry = new THREE.SphereGeometry(
  1,
  isMobile ? 8 : 32,  // segments
  isMobile ? 6 : 16   // rings
);
```

## 🔧 Implementation Checklist

### Phase 1: Security ✅
- [x] Audit all files for exposed credentials
- [x] Confirm environment variables usage
- [x] Document security best practices

### Phase 2: Mobile Responsiveness
- [ ] Add responsive CSS to main index.html
- [ ] Update ember-terminal for mobile
- [ ] Update mandem.os for mobile
- [ ] Update city-3d for mobile
- [ ] Test on multiple devices

### Phase 3: Cline API Integration
- [ ] Implement wallet verification
- [ ] Add payment system
- [ ] Create API endpoints
- [ ] Test with key holders
- [ ] Test with payment flow

### Phase 4: Performance Optimization
- [ ] Optimize 3D graphics
- [ ] Add device detection
- [ ] Implement adaptive quality
- [ ] Test on low-power devices

### Phase 5: Testing
- [ ] Test all projects on mobile
- [ ] Test wallet connections
- [ ] Test payment flow
- [ ] Test API calls
- [ ] Performance benchmarks

## 🚀 Deployment

### Environment Setup
1. Create `.env` file with all required variables
2. Install dependencies: `npm install`
3. Start server: `npm start`
4. Access at: `http://localhost:4000`

### Production Checklist
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Add rate limiting
- [ ] Enable CORS properly
- [ ] Add error monitoring
- [ ] Set up logging

## 📊 Budget Tracking

**Remaining Budget**: $5.00
**Estimated API Costs**: 
- Cline API calls: Free for key holders
- Payment verification: Minimal gas fees
- Server hosting: Covered by existing infrastructure

## 🆘 Support

For issues or questions:
1. Check this documentation
2. Review `.env.example` file
3. Test in development environment
4. Deploy to production

---

**Last Updated**: 2025-10-14
**Status**: Ready for Implementation
