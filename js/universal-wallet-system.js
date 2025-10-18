// UNIVERSAL WALLET INTEGRATION SYSTEM
// For all BARBRICKDESIGN platforms

class UniversalWalletSystem {
    constructor(options = {}) {
        this.options = {
            network: 'solana',
            autoConnect: true,
            showUI: true,
            enableMNDM: true,
            ...options
        };

        this.wallet = null;
        this.mndmBalance = 0;
        this.isConnected = false;
        this.connectionStatus = 'disconnected';

        this.MNDM_TOKEN_ADDRESS = 'GJFCA8XxnGns9TqKsMLScyVSooyiNrNPpjp2CyQCz7z5';

        this.init();
    }

    async init() {
        console.log('🔗 Initializing Universal Wallet System...');

        // Check if Solana is available
        if (typeof window.solana === 'undefined') {
            console.warn('⚠️ Solana wallet not detected');
            this.connectionStatus = 'no_wallet';
            if (this.options.showUI) {
                this.showWalletRequiredUI();
            }
            return;
        }

        // Check if Phantom is available
        if (!window.solana.isPhantom) {
            console.warn('⚠️ Phantom wallet not detected');
            this.connectionStatus = 'unsupported_wallet';
            if (this.options.showUI) {
                this.showUnsupportedWalletUI();
            }
            return;
        }

        // Try auto-connect if enabled
        if (this.options.autoConnect) {
            await this.trySilentConnect();
        }

        // Set up event listeners
        this.setupEventListeners();

        // Create UI if requested
        if (this.options.showUI) {
            this.createWalletUI();
        }

        console.log('✅ Universal Wallet System initialized');
    }

    async trySilentConnect() {
        try {
            const response = await window.solana.connect({ onlyIfTrusted: true });
            this.wallet = response.publicKey.toString();
            this.isConnected = true;
            this.connectionStatus = 'connected';

            console.log('🔗 Auto-connected to wallet:', this.wallet);

            // Load MNDM balance if enabled
            if (this.options.enableMNDM) {
                await this.loadMNDMBalance();
            }

            // Update UI
            if (this.options.showUI) {
                this.updateWalletUI();
            }

            // Trigger connection callback
            if (this.options.onConnect) {
                this.options.onConnect(this.getWalletInfo());
            }

        } catch (error) {
            console.log('🔗 Silent connect failed, manual connect required');
            this.connectionStatus = 'requires_manual_connect';
        }
    }

    async connect() {
        try {
            this.connectionStatus = 'connecting';

            if (this.options.showUI) {
                this.updateWalletUI();
            }

            const response = await window.solana.connect();
            this.wallet = response.publicKey.toString();
            this.isConnected = true;
            this.connectionStatus = 'connected';

            console.log('🔗 Connected to wallet:', this.wallet);

            // Load MNDM balance if enabled
            if (this.options.enableMNDM) {
                await this.loadMNDMBalance();
            }

            // Update UI
            if (this.options.showUI) {
                this.updateWalletUI();
            }

            // Trigger connection callback
            if (this.options.onConnect) {
                this.options.onConnect(this.getWalletInfo());
            }

            return true;

        } catch (error) {
            console.error('❌ Wallet connection failed:', error);
            this.connectionStatus = 'connection_failed';

            if (this.options.showUI) {
                this.updateWalletUI();
            }

            return false;
        }
    }

    async disconnect() {
        try {
            await window.solana.disconnect();
            this.reset();
            console.log('🔌 Disconnected from wallet');

            if (this.options.onDisconnect) {
                this.options.onDisconnect();
            }

        } catch (error) {
            console.error('❌ Disconnect failed:', error);
        }
    }

    reset() {
        this.wallet = null;
        this.mndmBalance = 0;
        this.isConnected = false;
        this.connectionStatus = 'disconnected';

        if (this.options.showUI) {
            this.updateWalletUI();
        }
    }

    async loadMNDMBalance() {
        if (!this.isConnected || !this.wallet) return 0;

        try {
            const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));

            const tokenAccounts = await connection.getTokenAccountsByOwner(
                new solanaWeb3.PublicKey(this.wallet),
                { mint: new solanaWeb3.PublicKey(this.MNDM_TOKEN_ADDRESS) }
            );

            if (tokenAccounts.value.length === 0) {
                this.mndmBalance = 0;
                return 0;
            }

            let totalBalance = 0;
            for (const tokenAccount of tokenAccounts.value) {
                const tokenAccountInfo = await connection.getTokenAccountBalance(tokenAccount.pubkey);
                totalBalance += parseFloat(tokenAccountInfo.value.uiAmountString || '0');
            }

            this.mndmBalance = totalBalance;
            console.log(`💎 MNDM Balance: ${totalBalance}`);

            return totalBalance;

        } catch (error) {
            console.error('❌ Failed to load MNDM balance:', error);
            return 0;
        }
    }

    async transferMNDM(recipientAddress, amount) {
        if (!this.isConnected) {
            throw new Error('Wallet not connected');
        }

        try {
            const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));

            // Get token accounts for sender
            const senderTokenAccounts = await connection.getTokenAccountsByOwner(
                new solanaWeb3.PublicKey(this.wallet),
                { mint: new solanaWeb3.PublicKey(this.MNDM_TOKEN_ADDRESS) }
            );

            if (senderTokenAccounts.value.length === 0) {
                throw new Error('No MNDM tokens found in wallet');
            }

            // Get or create associated token account for recipient
            const recipientPublicKey = new solanaWeb3.PublicKey(recipientAddress);
            const associatedTokenAddress = await solanaWeb3.Token.getAssociatedTokenAddress(
                new solanaWeb3.Token(connection, new solanaWeb3.PublicKey(this.MNDM_TOKEN_ADDRESS), {}, {}).associatedProgramId,
                solanaWeb3.TOKEN_PROGRAM_ID,
                new solanaWeb3.PublicKey(this.MNDM_TOKEN_ADDRESS),
                recipientPublicKey
            );

            // Create transfer instruction
            const transferInstruction = solanaWeb3.Token.createTransferInstruction(
                solanaWeb3.TOKEN_PROGRAM_ID,
                new solanaWeb3.PublicKey(senderTokenAccounts.value[0].pubkey),
                associatedTokenAddress,
                new solanaWeb3.PublicKey(this.wallet),
                [],
                amount * Math.pow(10, 9) // Assuming 9 decimals
            );

            // Get recent blockhash
            const { blockhash } = await connection.getRecentBlockhash();
            const transaction = new solanaWeb3.Transaction({
                recentBlockhash: blockhash,
                feePayer: new solanaWeb3.PublicKey(this.wallet)
            });

            transaction.add(transferInstruction);

            // Sign and send transaction
            const signed = await window.solana.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signed.serialize());

            console.log('✅ MNDM Transfer successful:', signature);
            return signature;

        } catch (error) {
            console.error('❌ MNDM Transfer failed:', error);
            throw error;
        }
    }

    getWalletInfo() {
        return {
            address: this.wallet,
            shortAddress: this.wallet ? this.wallet.substring(0, 6) + '...' + this.wallet.substring(-4) : null,
            mndmBalance: this.mndmBalance,
            isConnected: this.isConnected,
            network: this.options.network
        };
    }

    setupEventListeners() {
        if (!window.solana) return;

        window.solana.on('connect', (publicKey) => {
            console.log('🔗 Wallet connected event:', publicKey.toString());
            this.wallet = publicKey.toString();
            this.isConnected = true;
            this.connectionStatus = 'connected';

            if (this.options.enableMNDM) {
                this.loadMNDMBalance();
            }

            if (this.options.showUI) {
                this.updateWalletUI();
            }

            if (this.options.onConnect) {
                this.options.onConnect(this.getWalletInfo());
            }
        });

        window.solana.on('disconnect', () => {
            console.log('🔌 Wallet disconnected event');
            this.reset();

            if (this.options.onDisconnect) {
                this.options.onDisconnect();
            }
        });

        window.solana.on('accountChanged', (publicKey) => {
            console.log('🔄 Account changed:', publicKey?.toString());
            if (publicKey) {
                this.wallet = publicKey.toString();
                if (this.options.enableMNDM) {
                    this.loadMNDMBalance();
                }
                if (this.options.showUI) {
                    this.updateWalletUI();
                }
            } else {
                this.reset();
            }
        });
    }

    createWalletUI() {
        // Remove existing UI
        const existing = document.getElementById('universal-wallet-ui');
        if (existing) existing.remove();

        const ui = document.createElement('div');
        ui.id = 'universal-wallet-ui';
        ui.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            border: 2px solid var(--neon-blue);
            border-radius: 10px;
            padding: 15px;
            min-width: 280px;
            z-index: 10000;
            font-family: monospace;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;

        ui.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="color: var(--neon-blue); margin: 0; font-size: 1em;">Phantom Wallet</h4>
                <div id="wallet-status-indicator" style="width: 12px; height: 12px; border-radius: 50%; background: var(--neon-orange);"></div>
            </div>
            <div id="wallet-content">
                <button id="connect-wallet-btn" class="cyber-btn" style="width: 100%; font-size: 0.9em;">🔗 Connect Phantom</button>
            </div>
        `;

        document.body.appendChild(ui);

        // Add event listeners
        document.getElementById('connect-wallet-btn').addEventListener('click', () => {
            this.connect();
        });

        this.updateWalletUI();
    }

    updateWalletUI() {
        const statusIndicator = document.getElementById('wallet-status-indicator');
        const walletContent = document.getElementById('wallet-content');

        if (!statusIndicator || !walletContent) return;

        switch (this.connectionStatus) {
            case 'connected':
                statusIndicator.style.background = 'var(--neon-green)';
                walletContent.innerHTML = `
                    <div style="font-size: 0.8em; color: var(--neon-green); margin-bottom: 8px;">
                        ✅ Connected
                    </div>
                    <div style="font-family: monospace; font-size: 0.7em; color: var(--neon-blue); margin-bottom: 8px; word-break: break-all;">
                        ${this.wallet ? this.wallet.substring(0, 8) + '...' + this.wallet.substring(-8) : ''}
                    </div>
                    ${this.options.enableMNDM ? `
                        <div style="font-size: 0.7em; color: var(--neon-gold); margin-bottom: 8px;">
                            💎 ${this.mndmBalance.toFixed(4)} MNDM
                        </div>
                    ` : ''}
                    <button id="disconnect-wallet-btn" class="cyber-btn cyber-btn-secondary" style="width: 100%; font-size: 0.8em;">🔌 Disconnect</button>
                `;

                document.getElementById('disconnect-wallet-btn').addEventListener('click', () => {
                    this.disconnect();
                });
                break;

            case 'connecting':
                statusIndicator.style.background = 'var(--neon-blue)';
                walletContent.innerHTML = `
                    <div style="text-align: center; color: var(--neon-blue);">
                        <div style="font-size: 1.2em; margin-bottom: 5px;">⏳</div>
                        <div style="font-size: 0.8em;">Connecting...</div>
                    </div>
                `;
                break;

            case 'connection_failed':
                statusIndicator.style.background = 'var(--neon-orange)';
                walletContent.innerHTML = `
                    <div style="color: var(--neon-orange); font-size: 0.8em; margin-bottom: 8px;">
                        ❌ Connection Failed
                    </div>
                    <button id="retry-connect-btn" class="cyber-btn" style="width: 100%; font-size: 0.8em;">🔄 Retry</button>
                `;

                document.getElementById('retry-connect-btn').addEventListener('click', () => {
                    this.connect();
                });
                break;

            case 'no_wallet':
                statusIndicator.style.background = 'var(--neon-orange)';
                walletContent.innerHTML = `
                    <div style="color: var(--neon-orange); font-size: 0.8em; margin-bottom: 8px;">
                        Phantom wallet not detected
                    </div>
                    <a href="https://phantom.app/" target="_blank" class="cyber-btn" style="width: 100%; font-size: 0.8em; text-decoration: none;">📥 Install Phantom</a>
                `;
                break;

            case 'unsupported_wallet':
                statusIndicator.style.background = 'var(--neon-orange)';
                walletContent.innerHTML = `
                    <div style="color: var(--neon-orange); font-size: 0.8em; margin-bottom: 8px;">
                        Unsupported wallet detected
                    </div>
                    <div style="font-size: 0.7em; color: var(--neon-blue);">
                        Please use Phantom wallet for Solana
                    </div>
                `;
                break;

            default:
                statusIndicator.style.background = 'var(--neon-orange)';
                walletContent.innerHTML = `
                    <button id="connect-wallet-btn" class="cyber-btn" style="width: 100%; font-size: 0.9em;">🔗 Connect Phantom</button>
                `;

                document.getElementById('connect-wallet-btn').addEventListener('click', () => {
                    this.connect();
                });
        }
    }

    showWalletRequiredUI() {
        const ui = document.createElement('div');
        ui.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.95);
            border: 2px solid var(--neon-orange);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            z-index: 10001;
            max-width: 400px;
        `;

        ui.innerHTML = `
            <h3 style="color: var(--neon-orange); margin-bottom: 15px;">Phantom Wallet Required</h3>
            <p style="color: #8addff; margin-bottom: 20px; font-size: 0.9em;">
                This platform requires Phantom wallet for Solana blockchain integration and MNDM token transactions.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <a href="https://phantom.app/" target="_blank" class="cyber-btn">📥 Install Phantom</a>
                <button onclick="this.parentElement.remove()" class="cyber-btn cyber-btn-secondary">Close</button>
            </div>
        `;

        document.body.appendChild(ui);
    }

    showUnsupportedWalletUI() {
        const ui = document.createElement('div');
        ui.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.95);
            border: 2px solid var(--neon-orange);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            z-index: 10001;
            max-width: 400px;
        `;

        ui.innerHTML = `
            <h3 style="color: var(--neon-orange); margin-bottom: 15px;">Unsupported Wallet</h3>
            <p style="color: #8addff; margin-bottom: 20px; font-size: 0.9em;">
                Please use Phantom wallet for full Solana integration and MNDM token functionality.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <a href="https://phantom.app/" target="_blank" class="cyber-btn">🔄 Switch to Phantom</a>
                <button onclick="this.parentElement.remove()" class="cyber-btn cyber-btn-secondary">Close</button>
            </div>
        `;

        document.body.appendChild(ui);
    }
}

// Initialize global wallet system
let universalWallet;
document.addEventListener('DOMContentLoaded', () => {
    universalWallet = new UniversalWalletSystem({
        autoConnect: true,
        showUI: true,
        enableMNDM: true,
        onConnect: (walletInfo) => {
            console.log('🔗 Wallet connected:', walletInfo);
        },
        onDisconnect: () => {
            console.log('🔌 Wallet disconnected');
        }
    });
});

// Export for global access
if (typeof window !== 'undefined') {
    window.UniversalWalletSystem = UniversalWalletSystem;
    window.universalWallet = universalWallet;
}
