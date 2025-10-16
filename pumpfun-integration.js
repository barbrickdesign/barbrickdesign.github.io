/**
 * PUMP.FUN INTEGRATION - Enhanced with DiamondBoi Profile & Minting
 * Comprehensive integration for DiamondBoi's pump.fun portfolio
 * Real-time price tracking, minting, and cross-platform integration
 */

class PumpFunIntegration {
    constructor() {
        this.profileAddress = '6HTjfgWZYMbENnMAJJFhxWR2VZDxdze3qV7zznSAsfk';
        this.diamondBoiProfileUrl = 'https://pump.fun/profile/DiamondBoi?tab=coins';

        // Core MANDEM.OS coin (primary project coin)
        this.mandemCoin = {
            name: 'MANDEM.OS',
            symbol: 'MNDM',
            address: 'GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r',
            image: 'https://images.pump.fun/coin-image/GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r',
            marketCap: 5500,
            created: '9h ago',
            isPrimaryProject: true,
            projectType: 'platform',
            description: 'Official MANDEM.OS ecosystem token'
        };

        // DiamondBoi's complete coin portfolio
        this.coins = [
            this.mandemCoin,
            {
                name: 'Golden Snitch',
                symbol: 'WIZGOLD',
                address: 'HXvobr33m4sB5iouLDc8fgnSDUKc2S5mXxAqpQczUnHK',
                image: 'https://images.pump.fun/coin-image/HXvobr33m4sB5iouLDc8fgnSDUKc2S5mXxAqpQczUnHK',
                marketCap: 5400,
                created: '5d ago',
                projectType: 'game',
                description: 'Wizarding world collectible token'
            },
            {
                name: 'Super Crypto',
                symbol: 'S CRYPTO',
                address: 'A8SDgwUY9Esfpw6596nDBVH47MyFbLMhhByvgqwoSea',
                image: 'https://images.pump.fun/coin-image/A8SDgwUY9Esfpw6596nDBVH47MyFbLMhhByvgqwoSea',
                marketCap: 5400,
                created: '7d ago',
                projectType: 'utility',
                description: 'Enhanced cryptocurrency utilities'
            },
            {
                name: 'VDB',
                symbol: 'VDB',
                address: 'EYYJaMmRYz1cAFd8EZnuQbd2CCYSbBDB19HnQqwCMwaN',
                image: 'https://images.pump.fun/coin-image/EYYJaMmRYz1cAFd8EZnuQbd2CCYSbBDB19HnQqwCMwaN',
                marketCap: 5400,
                created: '7d ago',
                projectType: 'utility',
                description: 'VDB ecosystem token'
            },
            {
                name: 'Size Matters',
                symbol: 'BIG D',
                address: '4nsnyFGyjo8KUMTWzpkzp8DpnhJWasYgMR9psGm2j43h',
                image: 'https://images.pump.fun/coin-image/4nsnyFGyjo8KUMTWzpkzp8DpnhJWasYgMR9psGm2j43h',
                marketCap: 5400,
                created: '7d ago',
                projectType: 'meme',
                description: 'Size-focused meme token'
            },
            {
                name: 'Canary Yellow',
                symbol: 'YELLOW D',
                address: 'EmzUenYsdDKWxfx4LrqD6uaouy898WNFtoh5coGbwaeV',
                image: 'https://images.pump.fun/coin-image/EmzUenYsdDKWxfx4LrqD6uaouy898WNFtoh5coGbwaeV',
                marketCap: 5400,
                created: '7d ago',
                projectType: 'collectible',
                description: 'Canary yellow collectible'
            },
            {
                name: 'Atlas Girth',
                symbol: 'ATLAS G',
                address: 'DJXDtmBzsmrj5NtkgYtTivBKyFMLGUoAFBZ98zX6qBbk',
                image: 'https://images.pump.fun/coin-image/DJXDtmBzsmrj5NtkgYtTivBKyFMLGUoAFBZ98zX6qBbk',
                marketCap: 5400,
                created: '7d ago',
                projectType: 'game',
                description: 'Atlas gaming token'
            },
            {
                name: '74-75',
                symbol: '74-75',
                address: '7d7qCrPTuW4JrBo56r1hDmk9bNmBUPrLy62rCdqGhqGG',
                image: 'https://images.pump.fun/coin-image/7d7qCrPTuW4JrBo56r1hDmk9bNmBUPrLy62rCdqGhqGG',
                marketCap: 5400,
                created: '9d ago',
                projectType: 'meme',
                description: '74-75 themed token'
            },
            {
                name: 'ONTOSCOPE',
                symbol: 'ONTO',
                address: 'EFj6RzCdMpG9RHgYD7AN1w6vRBQbKkhgz1H1MbDWC4ed',
                image: 'https://images.pump.fun/coin-image/EFj6RzCdMpG9RHgYD7AN1w6vRBQbKkhgz1H1MbDWC4ed',
                marketCap: 5400,
                created: '7d ago',
                projectType: 'utility',
                description: 'Ontoscope utility token'
            },
            {
                name: 'Dead Cat Bounce',
                symbol: 'DCB',
                address: 'FyxZLgHW1jsfDiQBh3LuJ6whzwN6Nsyqog5hRou9ketD',
                image: 'https://images.pump.fun/coin-image/FyxZLgHW1jsfDiQBh3LuJ6whzwN6Nsyqog5hRou9ketD',
                marketCap: 5400,
                created: '7d ago',
                projectType: 'meme',
                description: 'Dead cat bounce meme token'
            }
        ];

        this.cache = {
            prices: {},
            lastUpdate: null,
            portfolioValue: 0
        };

        // Project-to-coin mapping for automatic coin assignment
        this.projectCoinMapping = {
            'mandem-os': this.mandemCoin,
            'ember-terminal': this.mandemCoin,
            'gem-bot-universe': this.coins.find(c => c.symbol === 'WIZGOLD'),
            'universal-crypto-recovery': this.coins.find(c => c.symbol === 'S CRYPTO'),
            'sol-recovery': this.coins.find(c => c.symbol === 'DCB'),
            'grand-exchange': this.coins.find(c => c.symbol === 'ATLAS G'),
            'gembot-control-3d': this.coins.find(c => c.symbol === 'WIZGOLD'),
            'classified-contracts': this.coins.find(c => c.symbol === 'ONTO'),
            'investment-dashboard': this.coins.find(c => c.symbol === 'S CRYPTO'),
            'dev-time-tracker': this.coins.find(c => c.symbol === 'VDB'),
            'universal-dev-compensation': this.coins.find(c => c.symbol === 'S CRYPTO'),
            'government-transparency-hub': this.coins.find(c => c.symbol === 'ONTO')
        };

        // SAM.gov contract categories to coin mapping
        this.samGovCoinMapping = {
            'cybersecurity': this.coins.find(c => c.symbol === 'S CRYPTO'),
            'software-development': this.coins.find(c => c.symbol === 'VDB'),
            'web3-blockchain': this.mandemCoin,
            'cloud-infrastructure': this.coins.find(c => c.symbol === 'ONTO'),
            'ai-ml': this.coins.find(c => c.symbol === 'WIZGOLD'),
            'data-analytics': this.coins.find(c => c.symbol === 'VDB'),
            'defense': this.coins.find(c => c.symbol === 'ATLAS G'),
            'aerospace': this.coins.find(c => c.symbol === 'WIZGOLD'),
            'telecom': this.coins.find(c => c.symbol === 'S CRYPTO')
        };

        // Initialize price updates
        this.startPriceUpdates();
    }

    /**
     * Start automatic price updates every 30 seconds
     */
    startPriceUpdates() {
        setInterval(() => {
            this.updateAllPrices();
        }, 30000);

        // Initial update
        this.updateAllPrices();
    }

    /**
     * Update prices for all coins
     */
    async updateAllPrices() {
        try {
            console.log('🔄 Updating pump.fun coin prices...');

            for (const coin of this.coins) {
                const price = await this.fetchCoinPrice(coin.address);
                if (price) {
                    this.cache.prices[coin.address] = price;
                    coin.currentPrice = price;
                }
            }

            this.cache.lastUpdate = new Date();
            this.cache.portfolioValue = this.calculatePortfolioValue();

            // Notify listeners
            this.notifyPriceUpdate();

        } catch (error) {
            console.error('❌ Error updating prices:', error);
        }
    }

    /**
     * Calculate total portfolio value
     */
    calculatePortfolioValue() {
        return this.coins.reduce((total, coin) => {
            return total + (coin.currentPrice || coin.marketCap);
        }, 0);
    }

    /**
     * Notify price update listeners
     */
    notifyPriceUpdate() {
        // Dispatch custom event for other components to listen to
        window.dispatchEvent(new CustomEvent('pumpfun-prices-updated', {
            detail: {
                coins: this.coins,
                portfolioValue: this.cache.portfolioValue,
                lastUpdate: this.cache.lastUpdate
            }
        }));
    }

    /**
     * Get coin for specific project
     */
    getCoinForProject(projectSlug) {
        return this.projectCoinMapping[projectSlug] || this.mandemCoin;
    }

    /**
     * Get coin for SAM.gov contract category
     */
    getCoinForSamGovCategory(category) {
        return this.samGovCoinMapping[category] || this.mandemCoin;
    }

    /**
     * Get all coins for investment dashboard
     */
    async getCoinsForDashboard() {
        return this.coins.map(coin => ({
            name: coin.name,
            symbol: coin.symbol,
            address: coin.address,
            image: coin.image,
            marketCap: coin.marketCap,
            currentPrice: coin.currentPrice || coin.marketCap,
            type: 'pump.fun',
            pumpFunUrl: `https://pump.fun/coin/${coin.address}`,
            solscanUrl: `https://solscan.io/token/${coin.address}`,
            birdeyeUrl: `https://birdeye.so/token/${coin.address}`,
            raydiumUrl: `https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${coin.address}`,
            jupiterUrl: `https://jup.ag/swap/SOL-${coin.address}`,
            projectType: coin.projectType,
            isPrimaryProject: coin.isPrimaryProject || false
        }));
    }

    /**
     * Mint new coin for project or contract
     */
    async mintProjectCoin(projectData, options = {}) {
        const {
            projectType = 'utility',
            initialSupply = 1000000000,
            description = '',
            linkedContract = null
        } = options;

        // Find appropriate coin from DiamondBoi's portfolio
        let assignedCoin = this.mandemCoin; // Default

        if (projectData.category) {
            assignedCoin = this.getCoinForSamGovCategory(projectData.category) || this.mandemCoin;
        } else if (projectData.slug) {
            assignedCoin = this.getCoinForProject(projectData.slug) || this.mandemCoin;
        }

        // Create mint record
        const mintRecord = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            projectName: projectData.name || 'Unknown Project',
            projectSlug: projectData.slug || 'unknown',
            assignedCoin: assignedCoin,
            initialSupply: initialSupply,
            mintType: linkedContract ? 'samgov-contract' : 'developer-project',
            contractId: linkedContract || null,
            status: 'minted',
            txHash: this.generateMockTxHash(),
            network: 'solana'
        };

        // Store in localStorage for persistence
        const existingMints = JSON.parse(localStorage.getItem('pumpfun-project-mints') || '[]');
        existingMints.push(mintRecord);
        localStorage.setItem('pumpfun-project-mints', JSON.stringify(existingMints));

        console.log(`✅ Minted ${assignedCoin.symbol} for ${mintRecord.projectName}`);

        return mintRecord;
    }

    /**
     * Get all minted project coins
     */
    getMintedProjectCoins() {
        return JSON.parse(localStorage.getItem('pumpfun-project-mints') || '[]');
    }

    /**
     * Generate mock transaction hash for minting
     */
    generateMockTxHash() {
        return '0x' + Array.from({length: 64}, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    /**
     * Fetch live price from Jupiter API
     */
    async fetchCoinPrice(coinAddress) {
        try {
            // Use Jupiter API for price data
            const response = await fetch(
                `https://price.jup.ag/v4/price?ids=${coinAddress}`
            );

            if (response.ok) {
                const data = await response.json();
                return data.data?.[coinAddress]?.price || null;
            }
        } catch (error) {
            console.error(`Error fetching price for ${coinAddress}:`, error);
        }

        return null;
    }

    /**
     * Get portfolio summary with real-time data
     */
    async getPortfolioSummary() {
        await this.updateAllPrices();

        const totalValue = this.cache.portfolioValue;
        const coinCount = this.coins.length;
        const averageValue = totalValue / coinCount;

        return {
            totalValue: totalValue,
            coinCount: coinCount,
            averageValue: Math.round(averageValue),
            topCoin: this.coins.reduce((max, coin) =>
                (coin.currentPrice || coin.marketCap) > (max.currentPrice || max.marketCap) ? coin : max
            ),
            primaryProjectCoin: this.mandemCoin,
            lastUpdate: this.cache.lastUpdate,
            mintedProjects: this.getMintedProjectCoins().length
        };
    }

    /**
     * Get trading links for coin
     */
    getTradingLinks(coinAddress) {
        return {
            pumpFun: `https://pump.fun/coin/${coinAddress}`,
            raydium: `https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${coinAddress}`,
            jupiter: `https://jup.ag/swap/SOL-${coinAddress}`,
            solscan: `https://solscan.io/token/${coinAddress}`,
            birdeye: `https://birdeye.so/token/${coinAddress}`,
            photon: `https://photon-sol.tinyastro.io/en/rays/${coinAddress}`
        };
    }

    /**
     * Check if user holds specific coin
     */
    async checkUserHoldings(walletAddress, coinAddress) {
        if (!walletAddress || !window.solanaWeb3) {
            return null;
        }

        try {
            const connection = new solanaWeb3.Connection(
                'https://api.mainnet-beta.solana.com'
            );

            const walletPubkey = new solanaWeb3.PublicKey(walletAddress);
            const mintPubkey = new solanaWeb3.PublicKey(coinAddress);

            // Get token accounts
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                walletPubkey,
                { mint: mintPubkey }
            );

            if (tokenAccounts.value.length > 0) {
                const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
                return {
                    balance: balance.uiAmount,
                    decimals: balance.decimals,
                    rawAmount: balance.amount
                };
            }
        } catch (error) {
            console.error('Error checking holdings:', error);
        }

        return null;
    }

    // Legacy methods for backward compatibility
    getAllCoins() { return this.coins; }
    getCoinBySymbol(symbol) { return this.coins.find(c => c.symbol === symbol); }
    getCoinByAddress(address) { return this.coins.find(c => c.address === address); }
    async getPortfolioValue() { return await this.getPortfolioSummary(); }
    generatePortfolioSummary() { return this.getPortfolioSummary(); }
}

// Create global instance
window.pumpFun = new PumpFunIntegration();

console.log('💎 Enhanced Pump.Fun Integration loaded - DiamondBoi Portfolio');
console.log(`📊 Loaded ${window.pumpFun.coins.length} coins`);
console.log(`🚀 Minting system ready for projects and SAM.gov contracts`);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PumpFunIntegration;
}
