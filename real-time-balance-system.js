/**
 * REAL-TIME BALANCE SYSTEM
 * Fetches and displays balances across multiple chains and tokens
 * Integrates with universal wallet authentication
 * Provides real-time balance updates
 */

class RealTimeBalanceSystem {
    constructor() {
        this.balances = {};
        this.priceData = {};
        this.updateInterval = null;
        this.priceUpdateInterval = null;
        this.lastUpdate = null;
        this.isUpdating = false;

        // Token configurations for different chains
        this.tokenConfigs = {
            ethereum: {
                native: { symbol: 'ETH', decimals: 18, name: 'Ethereum' },
                tokens: [
                    { symbol: 'USDC', address: '0xa0b86a33e6c5685e2a8b7b5b8a8b7b5b8a8b7b5b', decimals: 6, name: 'USD Coin' },
                    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, name: 'Tether USD' },
                    { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, name: 'Wrapped Bitcoin' }
                ]
            },
            solana: {
                native: { symbol: 'SOL', decimals: 9, name: 'Solana' },
                tokens: [
                    { symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, name: 'USD Coin' },
                    { symbol: 'USDT', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, name: 'Tether USD' },
                    { symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5, name: 'Bonk' },
                    { symbol: 'MNDM', address: 'GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r', decimals: 6, name: 'MANDEM.OS' },
                    { symbol: 'CDR', address: 'DjAbfe6EjhvZs4RAajYs8r3jcC1cFqqK4beTfGS7Lidd', decimals: 6, name: 'Coder' }
                ]
            }
        };

        // RPC endpoints (fallback to public ones)
        this.rpcEndpoints = {
            ethereum: 'https://eth-mainnet.g.alchemy.com/v2/demo', // Replace with real endpoint
            solana: [
                'https://api.mainnet-beta.solana.com',
                'https://solana-api.projectserum.com',
                'https://rpc.ankr.com/solana',
                'https://solana-mainnet.g.alchemy.com/v2/demo', // Demo endpoint
                'https://ssc-dao.genesysgo.net'
            ]
        };
        this.currentRpcIndex = 0;

        this.init();
    }

    async init() {
        console.log('💰 Real-Time Balance System initializing...');

        // Wait for Google Data Integration to be ready
        await this.waitForGoogleIntegration();

        // Initialize price tracking
        this.initializePriceTracking();

        // Start balance updates
        this.startBalanceUpdates();

        console.log('✅ Balance system ready');
    }

    async waitForGoogleIntegration() {
        // Wait for Google Data Integration to load
        let attempts = 0;
        while (!window.googleDataIntegration && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        if (window.googleDataIntegration) {
            console.log('🔍 Google Data Integration detected - enhancing balance system');
        } else {
            console.warn('⚠️ Google Data Integration not available - using fallback data');
        }
    }

    initializePriceTracking() {
        // Listen for wallet authentication events
        this.setupWalletListeners();

        // Start price updates
        this.startPriceUpdates();
    }

    startBalanceUpdates() {
        // Start real-time updates
        this.startRealTimeUpdates();
    }

    /**
     * Setup wallet event listeners
     */
    setupWalletListeners() {
        // Listen for universal wallet auth events
        window.addEventListener('authSuccess', (event) => {
            const authInfo = event.detail;
            console.log('🔐 Wallet authenticated, fetching balances for:', authInfo.address);
            this.onWalletConnected(authInfo.address);
        });

        window.addEventListener('authLogout', () => {
            console.log('🔓 Wallet disconnected, clearing balances');
            this.clearBalances();
        });

        // Also listen for shared wallet system if universal auth isn't present
        if (!window.universalWalletAuth) {
            window.addEventListener('walletConnected', (event) => {
                const connectionInfo = event.detail;
                console.log('🔗 Wallet connected, fetching balances for:', connectionInfo.address);
                this.onWalletConnected(connectionInfo.address);
            });

            window.addEventListener('walletDisconnected', () => {
                console.log('🔌 Wallet disconnected, clearing balances');
                this.clearBalances();
            });
        }
    }

    /**
     * Handle wallet connection
     */
    async onWalletConnected(address) {
        if (!address) return;

        // Determine chain from address format
        const chain = this.detectChain(address);
        if (!chain) {
            console.warn('⚠️ Unable to detect chain for address:', address);
            return;
        }

        console.log(`🔍 Detected ${chain} address, fetching balances...`);

        // Start real-time updates
        await this.fetchBalances(address, chain);
        this.startRealTimeUpdates(address, chain);
    }

    /**
     * Detect chain from address format
     */
    detectChain(address) {
        if (address.startsWith('0x') && address.length === 42) {
            return 'ethereum';
        } else if (address.length === 44 || address.length === 43) {
            return 'solana';
        }
        return null;
    }

    /**
     * Fetch balances for address and chain
     */
    async fetchBalances(address, chain) {
        if (this.isUpdating) return;
        this.isUpdating = true;

        try {
            const config = this.tokenConfigs[chain];
            if (!config) return;

            const balanceData = {
                chain: chain,
                address: address,
                native: null,
                tokens: [],
                totalUSD: 0,
                lastUpdate: Date.now()
            };

            // Fetch native token balance
            balanceData.native = await this.fetchNativeBalance(address, chain);

            // Fetch token balances
            for (const token of config.tokens) {
                try {
                    const tokenBalance = await this.fetchTokenBalance(address, chain, token);
                    if (tokenBalance && tokenBalance.balance > 0) {
                        balanceData.tokens.push(tokenBalance);
                    }
                } catch (error) {
                    console.warn(`Failed to fetch ${token.symbol} balance:`, error.message);
                }
            }

            // Calculate total USD value
            balanceData.totalUSD = this.calculateTotalUSD(balanceData);

            // Store balances
            this.balances[address] = balanceData;
            this.lastUpdate = Date.now();

            // Notify listeners
            this.notifyBalanceUpdate(balanceData);

            console.log(`💰 Balances updated for ${address}:`, balanceData);

        } catch (error) {
            console.error('Failed to fetch balances:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Fetch native token balance
     */
    async fetchNativeBalance(address, chain) {
        try {
            if (chain === 'ethereum') {
                const balanceHex = await this.callEthereumRPC('eth_getBalance', [address, 'latest']);
                const balanceWei = BigInt(balanceHex);
                const balanceEth = Number(balanceWei) / Math.pow(10, 18);

                const price = this.priceData['ETH']?.usd || 0;
                const usdValue = balanceEth * price;

                return {
                    symbol: 'ETH',
                    name: 'Ethereum',
                    balance: balanceEth,
                    usdValue: usdValue,
                    formatted: balanceEth.toFixed(6)
                };

            } else if (chain === 'solana') {
                const balance = await this.callSolanaRPC('getBalance', [address]);
                const balanceSol = balance / Math.pow(10, 9);

                const price = this.priceData['SOL']?.usd || 0;
                const usdValue = balanceSol * price;

                return {
                    symbol: 'SOL',
                    name: 'Solana',
                    balance: balanceSol,
                    usdValue: usdValue,
                    formatted: balanceSol.toFixed(4)
                };
            }
        } catch (error) {
            console.error(`Failed to fetch ${chain} native balance:`, error);
            return null;
        }
    }

    /**
     * Fetch token balance
     */
    async fetchTokenBalance(address, chain, token) {
        try {
            if (chain === 'ethereum') {
                // ERC20 balanceOf call
                const data = '0x70a08231000000000000000000000000' + address.substring(2);
                const result = await this.callEthereumRPC('eth_call', [{
                    to: token.address,
                    data: data
                }, 'latest']);

                const balanceRaw = BigInt(result);
                const balance = Number(balanceRaw) / Math.pow(10, token.decimals);

                const price = this.priceData[token.symbol]?.usd || 0;
                const usdValue = balance * price;

                return {
                    symbol: token.symbol,
                    name: token.name,
                    balance: balance,
                    usdValue: usdValue,
                    formatted: balance.toFixed(token.decimals === 6 ? 2 : 6),
                    address: token.address
                };

            } else if (chain === 'solana') {
                // SPL token balance
                const accounts = await this.callSolanaRPC('getTokenAccountsByOwner', [
                    address,
                    { mint: token.address },
                    { encoding: 'jsonParsed' }
                ]);

                if (accounts.value && accounts.value.length > 0) {
                    const account = accounts.value[0];
                    const balanceRaw = account.account.data.parsed.info.tokenAmount.uiAmount;
                    const balance = parseFloat(balanceRaw) || 0;

                    const price = this.priceData[token.symbol]?.usd || 0;
                    const usdValue = balance * price;

                    return {
                        symbol: token.symbol,
                        name: token.name,
                        balance: balance,
                        usdValue: usdValue,
                        formatted: balance.toFixed(2),
                        address: token.address
                    };
                }
            }
        } catch (error) {
            console.error(`Failed to fetch ${token.symbol} balance:`, error);
        }
        return null;
    }

    /**
     * Call Ethereum RPC
     */
    async callEthereumRPC(method, params) {
        const response = await fetch(this.rpcEndpoints.ethereum, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: method,
                params: params
            })
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.result;
    }

    /**
     * Call Solana RPC
     */
    async callSolanaRPC(method, params) {
        const response = await fetch(this.rpcEndpoints.solana, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: method,
                params: params
            })
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.result;
    }

    /**
     * Calculate total USD value
     */
    calculateTotalUSD(balanceData) {
        let total = 0;

        if (balanceData.native) {
            total += balanceData.native.usdValue;
        }

        balanceData.tokens.forEach(token => {
            total += token.usdValue;
        });

        return total;
    }

    /**
     * Start real-time balance updates
     */
    startRealTimeUpdates(address, chain) {
        // Clear existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Update every 30 seconds
        this.updateInterval = setInterval(() => {
            this.fetchBalances(address, chain);
        }, 30000);

        console.log('🔄 Real-time balance updates started (30s intervals)');
    }

    /**
     * Start price data updates
     */
    startPriceUpdates() {
        // Update prices every 5 minutes
        this.priceUpdateInterval = setInterval(() => {
            this.fetchPriceData();
        }, 5 * 60 * 1000);

        // Initial price fetch
        this.fetchPriceData();
    }

    /**
     * Fetch cryptocurrency price data
     */
    async fetchPriceData() {
        try {
            const symbols = ['ETH', 'SOL', 'USDC', 'USDT', 'WBTC', 'BONK', 'MNDM', 'CDR'];
            const ids = symbols.map(s => s.toLowerCase()).join(',');

            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
            const data = await response.json();

            // Map to our format
            this.priceData = {};
            for (const [id, priceInfo] of Object.entries(data)) {
                const symbol = id.toUpperCase();
                this.priceData[symbol] = { usd: priceInfo.usd };
            }

            console.log('💹 Price data updated:', this.priceData);

        } catch (error) {
            console.error('Failed to fetch price data:', error);
            // Fallback: keep existing price data or set defaults
            if (Object.keys(this.priceData).length === 0) {
                // Set some default prices for common tokens
                this.priceData = {
                    'ETH': { usd: 2000 },
                    'SOL': { usd: 150 },
                    'USDC': { usd: 1 },
                    'USDT': { usd: 1 },
                    'WBTC': { usd: 60000 },
                    'BONK': { usd: 0.00002 },
                    'MNDM': { usd: 0 }, // New token, no price data yet
                    'CDR': { usd: 0 } // New token, no price data yet
                };
            }
        }
    }

    /**
     * Clear all balances
     */
    clearBalances() {
        this.balances = {};

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.notifyBalanceCleared();
    }

    /**
     * Get balances for address
     */
    getBalances(address) {
        return this.balances[address] || null;
    }

    /**
     * Get all balances
     */
    getAllBalances() {
        return this.balances;
    }

    /**
     * Format balance for display
     */
    formatBalance(balance, decimals = 4) {
        if (balance === null || balance === undefined) return '0.0000';

        if (balance < 0.0001) {
            return '<0.0001';
        }

        return balance.toFixed(decimals);
    }

    /**
     * Format USD value for display
     */
    formatUSD(value) {
        if (value === null || value === undefined) return '$0.00';

        if (value < 0.01) {
            return '<$0.01';
        } else if (value < 1000) {
            return `$${value.toFixed(2)}`;
        } else {
            return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }

    /**
     * Event notification methods
     */
    notifyBalanceUpdate(balanceData) {
        window.dispatchEvent(new CustomEvent('balanceUpdate', {
            detail: balanceData
        }));
    }

    notifyBalanceCleared() {
        window.dispatchEvent(new CustomEvent('balanceCleared'));
    }

    /**
     * Create balance display UI
     */
    createBalanceDisplay(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const balanceDiv = document.createElement('div');
        balanceDiv.id = 'realtime-balance-display';
        balanceDiv.innerHTML = `
            <div class="balance-header">
                <h3>💰 Portfolio Balance</h3>
                <div class="balance-last-update">Last updated: <span id="balance-timestamp">Never</span></div>
            </div>
            <div class="balance-content" id="balance-content">
                <div class="balance-loading">
                    <div class="balance-spinner"></div>
                    <p>Connect wallet to view balances</p>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #realtime-balance-display {
                background: linear-gradient(135deg, rgba(0,20,40,0.9), rgba(0,40,60,0.9));
                border: 2px solid rgba(0,255,255,0.3);
                border-radius: 15px;
                padding: 20px;
                color: #e4e4e4;
                font-family: 'Orbitron', sans-serif;
                margin: 20px 0;
                backdrop-filter: blur(10px);
            }

            .balance-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                border-bottom: 1px solid rgba(0,255,255,0.3);
                padding-bottom: 10px;
            }

            .balance-header h3 {
                margin: 0;
                color: #00ffff;
                font-size: 1.2em;
            }

            .balance-last-update {
                font-size: 0.8em;
                color: #8addff;
            }

            .balance-loading {
                text-align: center;
                padding: 30px;
                color: #8addff;
            }

            .balance-spinner {
                width: 30px;
                height: 30px;
                border: 3px solid #333;
                border-top: 3px solid #00ffff;
                border-radius: 50%;
                animation: balanceSpin 1s linear infinite;
                margin: 0 auto 15px;
            }

            @keyframes balanceSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .balance-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }

            .balance-item:last-child {
                border-bottom: none;
            }

            .balance-symbol {
                font-weight: bold;
                color: #00ffff;
            }

            .balance-amount {
                text-align: right;
                color: #e4e4e4;
            }

            .balance-usd {
                text-align: right;
                color: #00ff00;
                font-size: 0.9em;
            }

            .balance-total {
                margin-top: 15px;
                padding-top: 15px;
                border-top: 2px solid rgba(0,255,255,0.3);
                font-size: 1.1em;
                font-weight: bold;
            }

            .balance-error {
                color: #ff6b6b;
                text-align: center;
                padding: 20px;
            }
        `;

        container.appendChild(style);
        container.appendChild(balanceDiv);

        // Listen for balance updates
        window.addEventListener('balanceUpdate', (event) => {
            this.updateBalanceDisplay(event.detail);
        });

        window.addEventListener('balanceCleared', () => {
            this.clearBalanceDisplay();
        });
    }

    /**
     * Update balance display with Google data enhancements
     */
    updateBalanceDisplay(balanceData) {
        const content = document.getElementById('balance-content');
        const timestamp = document.getElementById('balance-timestamp');

        if (!content) return;

        // Update timestamp
        const now = new Date(balanceData.lastUpdate);
        timestamp.textContent = now.toLocaleTimeString();

        // Build balance HTML
        let html = '';
        let hasBalances = false;

        // Native token (only if balance > 0)
        if (balanceData.native && balanceData.native.balance > 0) {
            html += `
                <div class="balance-item">
                    <span class="balance-symbol">${balanceData.native.symbol}</span>
                    <div>
                        <div class="balance-amount">${balanceData.native.formatted}</div>
                        <div class="balance-usd">${this.formatUSD(balanceData.native.usdValue)}</div>
                    </div>
                </div>
            `;
            hasBalances = true;
        }

        // Token balances (only show tokens with actual balances)
        balanceData.tokens.forEach(token => {
            if (token.balance > 0) {
                const icon = token.symbol === 'USDC' ? '💵' :
                            token.symbol === 'USDT' ? '💰' :
                            token.symbol === 'MNDM' ? '⚡' :
                            token.symbol === 'CDR' ? '👨‍💻' : '';
                const symbol = icon ? `${icon} ${token.symbol}` : token.symbol;

                html += `
                    <div class="balance-item">
                        <span class="balance-symbol">${symbol}</span>
                        <div>
                            <div class="balance-amount">${token.formatted}</div>
                            <div class="balance-usd">${this.formatUSD(token.usdValue)}</div>
                        </div>
                    </div>
                `;
                hasBalances = true;
            }
        });

        // Total (only show if there are balances)
        if (hasBalances && balanceData.totalUSD > 0) {
            html += `
                <div class="balance-item balance-total">
                    <span class="balance-symbol">💼 TOTAL</span>
                    <div class="balance-usd">${this.formatUSD(balanceData.totalUSD)}</div>
                </div>
            `;
        }

        // Add Google data insights if available
        if (hasBalances && window.googleDataIntegration) {
            html += this.generateGoogleInsights(balanceData);
        }

        if (!hasBalances) {
            html = `
                <div class="balance-loading">
                    <div class="balance-spinner"></div>
                    <p>No token balances found</p>
                </div>
            `;
        }

        content.innerHTML = html;
    }

    /**
     * Clear balance display
     */
    clearBalanceDisplay() {
        const content = document.getElementById('balance-content');
        const timestamp = document.getElementById('balance-timestamp');

        if (content) {
            content.innerHTML = `
                <div class="balance-loading">
                    <div class="balance-spinner"></div>
                    <p>Connect wallet to view balances</p>
                </div>
            `;
        }

        if (timestamp) {
            timestamp.textContent = 'Never';
        }
    }

    /**
     * Generate Google data insights for portfolio
     */
    async generateGoogleInsights(balanceData) {
        try {
            const insights = await window.googleDataIntegration.enhanceBalanceSystem();
            if (!insights) return '';

            let insightsHTML = '<div class="balance-insights" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(0,255,255,0.3);">';

            // Price alerts
            if (insights.priceAlerts && insights.priceAlerts.length > 0) {
                insightsHTML += '<div class="insights-section" style="margin-bottom: 15px;">';
                insightsHTML += '<div style="color: #ffd700; font-size: 0.9em; margin-bottom: 8px;">🚨 Price Alerts:</div>';

                insights.priceAlerts.slice(0, 3).forEach(alert => {
                    insightsHTML += `
                        <div style="font-size: 0.8em; color: #ffaa00; margin-bottom: 5px; padding: 4px; background: rgba(255,170,0,0.1); border-radius: 3px;">
                            ${alert.message}
                        </div>
                    `;
                });

                insightsHTML += '</div>';
            }

            // Portfolio insights
            if (insights.portfolioInsights && insights.portfolioInsights.length > 0) {
                insightsHTML += '<div class="insights-section">';
                insightsHTML += '<div style="color: #00ff88; font-size: 0.9em; margin-bottom: 8px;">💡 Portfolio Insights:</div>';

                insights.portfolioInsights.slice(0, 3).forEach(insight => {
                    insightsHTML += `
                        <div style="font-size: 0.8em; color: #8addff; margin-bottom: 5px; padding: 4px; background: rgba(0,255,255,0.1); border-radius: 3px;">
                            ${insight.insight}
                        </div>
                    `;
                });

                insightsHTML += '</div>';
            }

            insightsHTML += '</div>';

            return insightsHTML;
        } catch (error) {
            console.error('Failed to generate Google insights:', error);
            return '';
        }
    }

    /**
     * Enhanced price data fetching with Google Finance
     */
    async fetchPriceData() {
        try {
            const symbols = ['ETH', 'SOL', 'USDC', 'USDT', 'WBTC', 'BONK', 'MNDM', 'CDR'];

            // Try Google Finance first
            if (window.googleDataIntegration) {
                try {
                    const googleFinance = await window.googleDataIntegration.getFinanceData(
                        symbols.map(s => `${s}-USD`)
                    );

                    // Convert to our format
                    this.priceData = {};
                    Object.entries(googleFinance).forEach(([symbol, data]) => {
                        const cleanSymbol = symbol.replace('-USD', '');
                        this.priceData[cleanSymbol] = { usd: data.currentPrice };
                    });

                    console.log('💹 Price data updated from Google Finance:', this.priceData);
                    return;
                } catch (googleError) {
                    console.warn('Google Finance failed, falling back to CoinGecko:', googleError);
                }
            }

            // Fallback to CoinGecko
            const ids = symbols.map(s => s.toLowerCase()).join(',');
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
            const data = await response.json();

            // Map to our format
            this.priceData = {};
            for (const [id, priceInfo] of Object.entries(data)) {
                const symbol = id.toUpperCase();
                this.priceData[symbol] = { usd: priceInfo.usd };
            }

            console.log('💹 Price data updated from CoinGecko:', this.priceData);

        } catch (error) {
            console.error('Failed to fetch price data:', error);
            // Fallback: keep existing price data or set defaults
            if (Object.keys(this.priceData).length === 0) {
                // Set some default prices for common tokens
                this.priceData = {
                    'ETH': { usd: 2000 },
                    'SOL': { usd: 150 },
                    'USDC': { usd: 1 },
                    'USDT': { usd: 1 },
                    'WBTC': { usd: 60000 },
                    'BONK': { usd: 0.00002 },
                    'MNDM': { usd: 0 }, // New token, no price data yet
                    'CDR': { usd: 0 } // New token, no price data yet
                };
            }
        }
    }
}

// Create global instance
window.realTimeBalanceSystem = new RealTimeBalanceSystem();

console.log('💰 Real-Time Balance System loaded - multi-chain balance tracking enabled');
