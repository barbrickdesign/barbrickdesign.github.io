/**
 * PUMPFUN TOKEN CONFIGURATION & INTEGRATION
 * Complete token integration for pump.fun tokens
 * Supports MNDM token: GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r
 */

class PumpfunTokenConfig {
    constructor() {
        this.token = {
            address: 'GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r',
            name: 'MANDEM.OS',
            symbol: 'MNDM',
            decimals: 9,
            chain: 'solana',
            platform: 'pump.fun',
            logo: '💎',
            color: '#00FFFF',
            gradient: 'linear-gradient(135deg, #00FFFF 0%, #FF00FF 100%)',
            pumpfunUrl: 'https://pump.fun/coin/GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r'
        };

        this.mockData = {
            price: 0.000042,
            priceUSD: 0.0042,
            change24h: 15.3,
            volume24h: 125000,
            marketCap: 420000,
            holders: 1337,
            transactions24h: 2450
        };

        this.initialized = false;
        this.updateInterval = null;
        this.updateFrequency = 30000; // 30 seconds

        console.log('🔥 Pump.fun Token Config Loaded');
        console.log('Token Address:', this.token.address);
    }

    /**
     * Get token price data
     */
    async getTokenPrice() {
        try {
            // TODO: Replace with real pump.fun API when available
            // For now, return mock data with slight randomization

            const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
            const mockPrice = this.mockData.price * (1 + variation);
            const mockChange = this.mockData.change24h + (Math.random() - 0.5) * 5;

            return {
                price: mockPrice,
                priceUSD: mockPrice * 100, // Simplified conversion
                change24h: mockChange,
                volume24h: this.mockData.volume24h,
                marketCap: this.mockData.marketCap,
                holders: this.mockData.holders,
                transactions24h: this.mockData.transactions24h,
                lastUpdate: new Date().toISOString(),
                isMock: true
            };
        } catch (error) {
            console.error('Error fetching token price:', error);
            return this.mockData;
        }
    }

    /**
     * Get token balance for wallet address
     */
    async getTokenBalance(walletAddress) {
        if (!walletAddress) return 0;

        try {
            // TODO: Replace with real Solana token balance checking
            // For now, return mock balance based on wallet address

            // Create a deterministic mock balance based on wallet address
            let hash = 0;
            for (let i = 0; i < Math.min(walletAddress.length, 10); i++) {
                hash += walletAddress.charCodeAt(i);
            }

            const mockBalance = (hash % 10000) / 100; // 0-100 tokens
            console.log(`💎 Mock balance for ${walletAddress.slice(0, 8)}...: ${mockBalance} MNDM`);

            return mockBalance;
        } catch (error) {
            console.error('Error fetching token balance:', error);
            return 0;
        }
    }

    /**
     * Format token amount for display
     */
    formatTokenAmount(amount, decimals = 4) {
        if (!amount || amount === 0) return '0';

        // Format with commas and specified decimals
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals
        }).format(amount);
    }

    /**
     * Get display information for the token
     */
    getTokenDisplayInfo() {
        return {
            symbol: this.token.symbol,
            name: this.token.name,
            logo: this.token.logo,
            color: this.token.color,
            gradient: this.token.gradient,
            address: this.token.address,
            shortAddress: `${this.token.address.slice(0, 4)}...${this.token.address.slice(-4)}`,
            pumpfunUrl: this.token.pumpfunUrl,
            chain: this.token.chain,
            platform: this.token.platform
        };
    }

    /**
     * Create and display token widget
     */
    async createTokenWidget(containerId = 'pumpfun-token-container') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }

        try {
            // Get current price and balance
            const priceData = await this.getTokenPrice();
            let balance = 0;

            // Check if wallet is connected
            if (window.universalWalletAuth && window.universalWalletAuth.isAuthenticated()) {
                const walletAddress = window.universalWalletAuth.getAddress();
                balance = await this.getTokenBalance(walletAddress);
            }

            // Create widget HTML
            const widgetHtml = this.generateWidgetHTML(priceData, balance);
            container.innerHTML = widgetHtml;

            // Add event listeners
            this.attachWidgetEvents(container);

            console.log('🔥 Token widget created successfully');

        } catch (error) {
            console.error('Error creating token widget:', error);
            container.innerHTML = '<div style="color: #ff6b6b; padding: 20px; text-align: center;">Error loading token data</div>';
        }
    }

    /**
     * Generate widget HTML
     */
    generateWidgetHTML(priceData, balance) {
        const info = this.getTokenDisplayInfo();
        const priceChangeColor = priceData.change24h >= 0 ? '#00ff88' : '#ff6b6b';
        const priceChangeSymbol = priceData.change24h >= 0 ? '▲' : '▼';

        return `
            <div class="pumpfun-token-widget" style="
                background: ${info.gradient};
                border-radius: 16px;
                padding: 20px;
                color: white;
                box-shadow: 0 8px 32px rgba(255, 107, 53, 0.3);
                font-family: 'Inter', sans-serif;
                position: relative;
                overflow: hidden;
            ">
                <!-- Background Pattern -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 50%);
                    pointer-events: none;
                "></div>

                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; position: relative; z-index: 1;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 24px;">${info.logo}</span>
                        <div>
                            <div style="font-weight: 700; font-size: 16px;">${info.symbol}</div>
                            <div style="font-size: 12px; opacity: 0.8;">${info.name}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; font-size: 16px;">${this.formatTokenAmount(balance)}</div>
                        <div style="font-size: 12px; opacity: 0.8;">Balance</div>
                    </div>
                </div>

                <!-- Price Info -->
                <div style="margin-bottom: 20px; position: relative; z-index: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-size: 14px; opacity: 0.8;">Price</div>
                        <div style="font-size: 14px; opacity: 0.8;">24h Change</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-weight: 700; font-size: 18px;">$${priceData.priceUSD.toFixed(6)}</div>
                        <div style="display: flex; align-items: center; gap: 4px; color: ${priceChangeColor};">
                            <span>${priceChangeSymbol}</span>
                            <span style="font-weight: 600;">${Math.abs(priceData.change24h).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                <!-- Trade Button -->
                <button class="pumpfun-trade-btn" style="
                    width: 100%;
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 12px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    position: relative;
                    z-index: 1;
                ">
                    <span>📈</span>
                    <span>Trade on Pump.fun</span>
                </button>

                <!-- Footer Info -->
                <div style="margin-top: 16px; text-align: center; font-size: 11px; opacity: 0.7; position: relative; z-index: 1;">
                    <div>Contract: ${info.shortAddress}</div>
                    ${priceData.isMock ? '<div style="color: #ffff00; margin-top: 4px;">⚠️ Using mock data for testing</div>' : ''}
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to widget
     */
    attachWidgetEvents(container) {
        const tradeBtn = container.querySelector('.pumpfun-trade-btn');
        if (tradeBtn) {
            tradeBtn.addEventListener('click', () => {
                window.open(this.token.pumpfunUrl, '_blank');
            });

            // Hover effects
            tradeBtn.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(255, 255, 255, 0.3)';
                this.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                this.style.transform = 'translateY(-1px)';
            });

            tradeBtn.addEventListener('mouseleave', function() {
                this.style.background = 'rgba(255, 255, 255, 0.2)';
                this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                this.style.transform = 'translateY(0)';
            });
        }
    }

    /**
     * Initialize token integration
     */
    async init() {
        if (this.initialized) return;

        console.log('🔥 Initializing Pump.fun token integration...');

        // Auto-initialize if container exists
        const container = document.getElementById('pumpfun-token-container');
        if (container) {
            await this.createTokenWidget();
        }

        // Set up auto-refresh
        this.updateInterval = setInterval(async () => {
            const container = document.getElementById('pumpfun-token-container');
            if (container) {
                await this.createTokenWidget();
            }
        }, this.updateFrequency);

        this.initialized = true;
        console.log('✅ Pump.fun token integration initialized');
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.initialized = false;
        console.log('🔥 Pump.fun token integration destroyed');
    }
}

// Global functions for external use
async function getTokenPrice() {
    const config = new PumpfunTokenConfig();
    return await config.getTokenPrice();
}

async function getTokenBalance(walletAddress) {
    const config = new PumpfunTokenConfig();
    return await config.getTokenBalance(walletAddress);
}

function formatTokenAmount(amount, decimals = 4) {
    const config = new PumpfunTokenConfig();
    return config.formatTokenAmount(amount, decimals);
}

function getTokenDisplayInfo() {
    const config = new PumpfunTokenConfig();
    return config.getTokenDisplayInfo();
}

async function initPumpfunToken(containerId = 'pumpfun-token-container') {
    const config = new PumpfunTokenConfig();
    await config.init();
    return await config.createTokenWidget(containerId);
}

// Auto-initialize on page load
if (typeof window !== 'undefined') {
    window.PumpfunTokenConfig = PumpfunTokenConfig;
    window.getTokenPrice = getTokenPrice;
    window.getTokenBalance = getTokenBalance;
    window.formatTokenAmount = formatTokenAmount;
    window.getTokenDisplayInfo = getTokenDisplayInfo;
    window.initPumpfunToken = initPumpfunToken;

    // Auto-init when DOM is ready
    document.addEventListener('DOMContentLoaded', async () => {
        const config = new PumpfunTokenConfig();
        await config.init();
    });
}

console.log('🔥 Pump.fun Token Config System Ready');
