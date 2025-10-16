/**
 * PUMP.FUN INTEGRATION
 * Integrates DiamondBoi's pump.fun coins into the platform
 * Real-time price tracking and portfolio management
 */

class PumpFunIntegration {
    constructor() {
        this.profileAddress = '6HTjfgWZYMbENnMAJJFhxWR2VZDxdze3qV7zznSAsfk';
        this.coins = [
            {
                name: 'MANDEM.OS',
                symbol: 'MNDM',
                address: 'GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r',
                image: 'https://images.pump.fun/coin-image/GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r',
                marketCap: 5500,
                created: '9h ago'
            },
            {
                name: 'Golden Snitch',
                symbol: 'WIZGOLD',
                address: 'HXvobr33m4sB5iouLDc8fgnSDUKc2S5mXxAqpQczUnHK',
                image: 'https://images.pump.fun/coin-image/HXvobr33m4sB5iouLDc8fgnSDUKc2S5mXxAqpQczUnHK',
                marketCap: 5400,
                created: '5d ago'
            },
            {
                name: 'Super Crypto',
                symbol: 'S CRYPTO',
                address: 'A8SDgwUY9Esfpw6596nDBVH47MyFbLMhhByvgqwoSea',
                image: 'https://images.pump.fun/coin-image/A8SDgwUY9Esfpw6596nDBVH47MyFbLMhhByvgqwoSea',
                marketCap: 5400,
                created: '7d ago'
            },
            {
                name: 'VDB',
                symbol: 'VDB',
                address: 'EYYJaMmRYz1cAFd8EZnuQbd2CCYSbBDB19HnQqwCMwaN',
                image: 'https://images.pump.fun/coin-image/EYYJaMmRYz1cAFd8EZnuQbd2CCYSbBDB19HnQqwCMwaN',
                marketCap: 5400,
                created: '7d ago'
            },
            {
                name: 'Size Matters',
                symbol: 'BIG D',
                address: '4nsnyFGyjo8KUMTWzpkzp8DpnhJWasYgMR9psGm2j43h',
                image: 'https://images.pump.fun/coin-image/4nsnyFGyjo8KUMTWzpkzp8DpnhJWasYgMR9psGm2j43h',
                marketCap: 5400,
                created: '7d ago'
            },
            {
                name: 'Canary Yellow',
                symbol: 'YELLOW D',
                address: 'EmzUenYsdDKWxfx4LrqD6uaouy898WNFtoh5coGbwaeV',
                image: 'https://images.pump.fun/coin-image/EmzUenYsdDKWxfx4LrqD6uaouy898WNFtoh5coGbwaeV',
                marketCap: 5400,
                created: '7d ago'
            },
            {
                name: 'Atlas Girth',
                symbol: 'ATLAS G',
                address: 'DJXDtmBzsmrj5NtkgYtTivBKyFMLGUoAFBZ98zX6qBbk',
                image: 'https://images.pump.fun/coin-image/DJXDtmBzsmrj5NtkgYtTivBKyFMLGUoAFBZ98zX6qBbk',
                marketCap: 5400,
                created: '7d ago'
            },
            {
                name: '74-75',
                symbol: '74-75',
                address: '7d7qCrPTuW4JrBo56r1hDmk9bNmBUPrLy62rCdqGhqGG',
                image: 'https://images.pump.fun/coin-image/7d7qCrPTuW4JrBo56r1hDmk9bNmBUPrLy62rCdqGhqGG',
                marketCap: 5400,
                created: '9d ago'
            },
            {
                name: 'ONTOSCOPE',
                symbol: 'ONTO',
                address: 'EFj6RzCdMpG9RHgYD7AN1w6vRBQbKkhgz1H1MbDWC4ed',
                image: 'https://images.pump.fun/coin-image/EFj6RzCdMpG9RHgYD7AN1w6vRBQbKkhgz1H1MbDWC4ed',
                marketCap: 5400,
                created: '7d ago'
            },
            {
                name: 'Dead Cat Bounce',
                symbol: 'DCB',
                address: 'FyxZLgHW1jsfDiQBh3LuJ6whzwN6Nsyqog5hRou9ketD',
                image: 'https://images.pump.fun/coin-image/FyxZLgHW1jsfDiQBh3LuJ6whzwN6Nsyqog5hRou9ketD',
                marketCap: 5400,
                created: '7d ago'
            }
        ];
        
        this.cache = {
            prices: {},
            lastUpdate: null
        };
    }

    /**
     * Get all DiamondBoi coins
     */
    getAllCoins() {
        return this.coins;
    }

    /**
     * Get coin by symbol
     */
    getCoinBySymbol(symbol) {
        return this.coins.find(c => c.symbol === symbol);
    }

    /**
     * Get coin by address
     */
    getCoinByAddress(address) {
        return this.coins.find(c => c.address === address);
    }

    /**
     * Fetch live price from Solana blockchain
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
     * Get portfolio value
     */
    async getPortfolioValue() {
        let totalValue = 0;
        
        for (const coin of this.coins) {
            totalValue += coin.marketCap;
        }
        
        return {
            totalValue: totalValue,
            coinCount: this.coins.length,
            averageMarketCap: totalValue / this.coins.length
        };
    }

    /**
     * Get coin for investment dashboard
     */
    async getCoinsForDashboard() {
        return this.coins.map(coin => ({
            name: coin.name,
            symbol: coin.symbol,
            address: coin.address,
            image: coin.image,
            marketCap: coin.marketCap,
            type: 'pump.fun',
            pumpFunUrl: `https://pump.fun/coin/${coin.address}`,
            solscanUrl: `https://solscan.io/token/${coin.address}`
        }));
    }

    /**
     * Check if user holds coin
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
                    decimals: balance.decimals
                };
            }
        } catch (error) {
            console.error('Error checking holdings:', error);
        }
        
        return null;
    }

    /**
     * Generate portfolio summary
     */
    generatePortfolioSummary() {
        const total = this.coins.reduce((sum, coin) => sum + coin.marketCap, 0);
        
        return {
            totalCoins: this.coins.length,
            totalMarketCap: total,
            averageMarketCap: Math.round(total / this.coins.length),
            topCoin: this.coins.reduce((max, coin) => 
                coin.marketCap > max.marketCap ? coin : max
            ),
            recentCoins: this.coins.filter(coin => 
                coin.created.includes('h ago') || coin.created.includes('d ago')
            ).slice(0, 5)
        };
    }

    /**
     * Get trading links
     */
    getTradingLinks(coinAddress) {
        return {
            pumpFun: `https://pump.fun/coin/${coinAddress}`,
            raydium: `https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${coinAddress}`,
            jupiter: `https://jup.ag/swap/SOL-${coinAddress}`,
            solscan: `https://solscan.io/token/${coinAddress}`,
            birdeye: `https://birdeye.so/token/${coinAddress}`
        };
    }
}

// Create global instance
window.pumpFun = new PumpFunIntegration();

console.log('💎 Pump.Fun Integration loaded - DiamondBoi Portfolio');
console.log(`📊 Loaded ${window.pumpFun.coins.length} coins`);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PumpFunIntegration;
}
