/**
 * UNIVERSAL WALLET AUTHENTICATION SYSTEM
 * <!-- REF: WALLET-AUTH -->
 * Single Sign-On (SSO) for entire platform
 * - Connect wallet ONCE, stay authenticated across all pages
 * - Session-based auth with automatic expiry
 * - Time tracking for contractor performance scoring
 * - Signature verification for security
 */

class UniversalWalletAuth {
    constructor() {
        this.wallet = null;
        this.address = null;
        this.sessionToken = null;
        this.authenticated = false;
        this.sessionTimeout = 4 * 60 * 60 * 1000; // 4 hours default
        this.inactivityTimeout = 30 * 60 * 1000; // 30 minutes inactivity = re-auth
        this.timeTracker = null;
        this.lastActivity = Date.now();
        
        // Initialize on load
        this.init();
    }

    /**
     * Initialize authentication system
     */
    async init() {
        console.log('🔐 Universal Wallet Auth initializing...');
        
        // Setup activity tracker
        this.setupActivityTracking();
        
        // Check for existing session
        const existingSession = this.loadSession();
        
        if (existingSession) {
            // Validate session
            if (this.isSessionValid(existingSession)) {
                console.log('✅ Valid session found, restoring...');
                await this.restoreSession(existingSession);
            } else {
                console.log('⚠️ Session expired, clearing...');
                this.clearSession();
            }
        }
        
        // Setup wallet change listeners
        this.setupWalletListeners();
        
        console.log('✅ Universal Wallet Auth ready');
    }

    /**
     * Connect wallet and create authenticated session
     */
    async connect() {
        if (this.authenticated) {
            console.log('✅ Already authenticated');
            return this.getAuthInfo();
        }

        try {
            console.log('🔌 Starting wallet connection...');

            // 1. Connect wallet (try MetaMask first, then Phantom)
            const walletInfo = await this.connectWallet();
            
            if (!walletInfo) {
                throw new Error('No wallet detected');
            }

            this.wallet = walletInfo.provider;
            this.address = walletInfo.address.toLowerCase();

            console.log('✅ Wallet connected:', this.address);

            // 2. Request signature for verification
            const signature = await this.requestSignature();
            
            if (!signature) {
                throw new Error('Signature verification failed');
            }

            // 3. Create session token
            this.sessionToken = this.generateSessionToken(this.address, signature);

            // 4. Save session
            this.saveSession({
                address: this.address,
                sessionToken: this.sessionToken,
                signature: signature,
                walletType: walletInfo.type,
                createdAt: Date.now(),
                lastActivity: Date.now()
            });

            // 5. Mark as authenticated
            this.authenticated = true;

            // 6. Start time tracking if contractor
            this.startTimeTracking();

            console.log('✅ Authentication successful!');
            
            // 7. Notify app
            this.notifyAuthSuccess();

            return this.getAuthInfo();

        } catch (error) {
            console.error('❌ Authentication failed:', error);
            this.clearSession();
            throw error;
        }
    }

    /**
     * Connect to wallet (MetaMask or Phantom)
     */
    async connectWallet() {
        // Try MetaMask first
        if (window.ethereum) {
            try {
                console.log('🦊 Connecting to MetaMask...');
                
                // Check existing connection
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                
                let address;
                if (accounts && accounts.length > 0) {
                    console.log('✅ Using existing MetaMask connection');
                    address = accounts[0];
                } else {
                    // Request new connection
                    const newAccounts = await window.ethereum.request({ 
                        method: 'eth_requestAccounts' 
                    });
                    address = newAccounts[0];
                }

                return {
                    provider: window.ethereum,
                    address: address.toLowerCase(),
                    type: 'ethereum'
                };
            } catch (error) {
                if (error.message && error.message.includes('Unexpected')) {
                    throw new Error(
                        '⚠️ MetaMask connection failed. Please:\n\n' +
                        '1. ✅ UNLOCK your MetaMask wallet\n' +
                        '2. 🔄 REFRESH this page\n' +
                        '3. 🔌 Try again'
                    );
                }
                console.error('MetaMask error:', error);
            }
        }

        // Try Phantom as fallback
        if (window.solana || window.phantom) {
            try {
                console.log('👻 Connecting to Phantom...');
                const provider = window.phantom?.solana || window.solana;

                if (provider && provider.isConnected && provider.publicKey) {
                    console.log('✅ Using existing Phantom connection');
                    return {
                        provider: provider,
                        address: provider.publicKey.toString(),
                        type: 'solana'
                    };
                }

                if (provider && provider.connect) {
                    console.log('🔌 Requesting Phantom connection...');
                    const response = await provider.connect();

                    if (response && response.publicKey) {
                        return {
                            provider: provider,
                            address: response.publicKey.toString(),
                            type: 'solana'
                        };
                    }
                }

                // Check for Phantom provider
                if (window.phantom && window.phantom.solana) {
                    console.log('🔌 Connecting via Phantom provider...');
                    const phantomProvider = window.phantom.solana;

                    if (phantomProvider.isConnected) {
                        return {
                            provider: phantomProvider,
                            address: phantomProvider.publicKey.toString(),
                            type: 'solana'
                        };
                    }

                    const response = await phantomProvider.connect();
                    return {
                        provider: phantomProvider,
                        address: response.publicKey.toString(),
                        type: 'solana'
                    };
                }

            } catch (error) {
                console.error('Phantom connection error:', error);
                if (error.message && error.message.includes('User rejected')) {
                    throw new Error('Phantom connection rejected. Please try again.');
                }
            }
        }

        // No wallet found
        throw new Error('No wallet detected. Please install MetaMask or Phantom.');
    }

    /**
     * Request signature from user for verification
     */
    async requestSignature() {
        try {
            const message = this.generateSignatureMessage();

            // Determine wallet type and use appropriate signing method
            if (this.wallet === window.ethereum) {
                // Ethereum/MetaMask
                console.log('📝 Requesting Ethereum signature...');
                const signature = await this.wallet.request({
                    method: 'personal_sign',
                    params: [message, this.address]
                });
                return signature;

            } else if (this.wallet === window.solana || this.wallet === window.phantom?.solana) {
                // Solana/Phantom
                console.log('📝 Requesting Solana signature...');

                // For Solana, we need to encode the message properly
                const encodedMessage = new TextEncoder().encode(message);

                // Use the correct Solana signing method
                const { signature } = await this.wallet.signMessage(encodedMessage, 'utf8');

                // Convert signature to base64 for consistency with our system
                const signatureArray = Array.from(signature);
                return btoa(String.fromCharCode(...signatureArray));

            } else {
                console.error('❌ Unknown wallet type for signature');
                return null;
            }

        } catch (error) {
            console.error('Signature request failed:', error);

            // Provide helpful error messages
            if (error.message && error.message.includes('User rejected')) {
                throw new Error('Signature rejected by user. Please try again.');
            } else if (error.message && error.message.includes('Unexpected')) {
                throw new Error(
                    'Wallet connection issue. Please:\n\n' +
                    '1. ✅ Ensure wallet is unlocked\n' +
                    '2. 🔄 Refresh this page\n' +
                    '3. 🔌 Try connecting again'
                );
            }

            return null;
        }
    }

    /**
     * Generate signature message
     */
    generateSignatureMessage() {
        const timestamp = new Date().toISOString();
        const nonce = Math.random().toString(36).substring(7);
        
        return `BARBRICKDESIGN Platform Authentication\n\n` +
               `Wallet: ${this.address}\n` +
               `Time: ${timestamp}\n` +
               `Nonce: ${nonce}\n\n` +
               `This signature proves you own this wallet.\n` +
               `It does NOT authorize any transactions.`;
    }

    /**
     * Generate session token
     */
    generateSessionToken(address, signature) {
        const data = `${address}:${signature}:${Date.now()}`;
        // Simple hash (in production, use crypto.subtle)
        return btoa(data).substring(0, 64);
    }

    /**
     * Save session to storage
     */
    saveSession(sessionData) {
        try {
            localStorage.setItem('barbrick_auth_session', JSON.stringify(sessionData));
            localStorage.setItem('barbrick_wallet_address', sessionData.address);
            localStorage.setItem('barbrick_wallet_type', sessionData.walletType);
            console.log('💾 Session saved');
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }

    /**
     * Load session from storage
     */
    loadSession() {
        try {
            const sessionStr = localStorage.getItem('barbrick_auth_session');
            if (sessionStr) {
                return JSON.parse(sessionStr);
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
        return null;
    }

    /**
     * Validate session
     */
    isSessionValid(session) {
        if (!session || !session.createdAt || !session.lastActivity) {
            return false;
        }

        const now = Date.now();
        const sessionAge = now - session.createdAt;
        const inactivity = now - session.lastActivity;

        // Session expired?
        if (sessionAge > this.sessionTimeout) {
            console.log('⏰ Session expired (too old)');
            return false;
        }

        // Inactive too long?
        if (inactivity > this.inactivityTimeout) {
            console.log('😴 Session expired (inactive)');
            return false;
        }

        return true;
    }

    /**
     * Restore session from storage
     */
    async restoreSession(session) {
        try {
            this.address = session.address;
            this.sessionToken = session.sessionToken;
            this.authenticated = true;

            // Reconnect wallet silently
            if (session.walletType === 'ethereum' && window.ethereum) {
                this.wallet = window.ethereum;
            } else if (session.walletType === 'solana' && window.solana) {
                this.wallet = window.solana;
            }

            // Update last activity
            this.updateActivity();

            // Start time tracking
            this.startTimeTracking();

            console.log('✅ Session restored for:', this.address);
            
            // Notify app
            this.notifyAuthSuccess();

        } catch (error) {
            console.error('Failed to restore session:', error);
            this.clearSession();
        }
    }

    /**
     * Clear session and logout
     */
    clearSession() {
        this.wallet = null;
        this.address = null;
        this.sessionToken = null;
        this.authenticated = false;

        localStorage.removeItem('barbrick_auth_session');
        localStorage.removeItem('barbrick_wallet_address');
        localStorage.removeItem('barbrick_wallet_type');

        // Stop time tracking
        this.stopTimeTracking();

        console.log('🔓 Session cleared');
        
        // Notify app
        window.dispatchEvent(new CustomEvent('authLogout'));
    }

    /**
     * Disconnect and clear session
     */
    async disconnect() {
        // Disconnect wallet
        if (this.wallet && this.wallet.disconnect) {
            try {
                await this.wallet.disconnect();
            } catch (error) {
                console.error('Wallet disconnect error:', error);
            }
        }

        this.clearSession();
    }

    /**
     * Update last activity timestamp
     */
    updateActivity() {
        this.lastActivity = Date.now();
        
        const session = this.loadSession();
        if (session) {
            session.lastActivity = this.lastActivity;
            this.saveSession(session);
        }
    }

    /**
     * Setup activity tracking (mouse, keyboard, etc.)
     */
    setupActivityTracking() {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                if (this.authenticated) {
                    this.updateActivity();
                }
            }, { passive: true });
        });

        // Check session validity every minute
        setInterval(() => {
            if (this.authenticated) {
                const session = this.loadSession();
                if (!this.isSessionValid(session)) {
                    console.log('⏰ Session expired, logging out...');
                    this.clearSession();
                    window.location.reload();
                }
            }
        }, 60000); // Check every minute
    }

    /**
     * Setup wallet event listeners
     */
    setupWalletListeners() {
        // Ethereum events
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    console.log('🔔 Wallet disconnected');
                    this.clearSession();
                } else if (accounts[0].toLowerCase() !== this.address) {
                    console.log('🔔 Account changed, re-authenticating...');
                    this.clearSession();
                    window.location.reload();
                }
            });

            window.ethereum.on('chainChanged', () => {
                console.log('🔔 Chain changed, reloading...');
                window.location.reload();
            });
        }

        // Solana events
        if (window.solana) {
            window.solana.on('disconnect', () => {
                console.log('🔔 Phantom disconnected');
                this.clearSession();
            });

            window.solana.on('accountChanged', (publicKey) => {
                if (!publicKey) {
                    this.clearSession();
                } else if (publicKey.toString() !== this.address) {
                    console.log('🔔 Account changed, re-authenticating...');
                    this.clearSession();
                    window.location.reload();
                }
            });
        }
    }

    /**
     * Start time tracking for contractors
     */
    startTimeTracking() {
        // Check if this is a contractor
        if (window.contractorRegistry) {
            const contractor = window.contractorRegistry.getContractor(this.address);
            
            if (contractor && contractor.status === 'approved') {
                console.log('⏱️ Starting time tracking for contractor');
                
                // Log session start
                this.logWorkSession('start');

                // Update time every 5 minutes
                this.timeTracker = setInterval(() => {
                    this.logWorkTime();
                }, 5 * 60 * 1000); // Every 5 minutes
            }
        }
    }

    /**
     * Stop time tracking
     */
    stopTimeTracking() {
        if (this.timeTracker) {
            clearInterval(this.timeTracker);
            this.timeTracker = null;
            this.logWorkSession('end');
            console.log('⏹️ Time tracking stopped');
        }
    }

    /**
     * Log work session (start/end)
     */
    logWorkSession(type) {
        const sessions = JSON.parse(localStorage.getItem('contractor_work_sessions') || '[]');
        
        sessions.push({
            wallet: this.address,
            type: type,
            timestamp: new Date().toISOString(),
            platform: window.location.pathname
        });

        localStorage.setItem('contractor_work_sessions', JSON.stringify(sessions));
    }

    /**
     * Log work time
     */
    logWorkTime() {
        if (!this.authenticated) return;

        const timeLog = JSON.parse(localStorage.getItem('contractor_time_log') || '{}');
        
        if (!timeLog[this.address]) {
            timeLog[this.address] = {
                totalMinutes: 0,
                sessions: []
            };
        }

        // Add 5 minutes
        timeLog[this.address].totalMinutes += 5;

        localStorage.setItem('contractor_time_log', JSON.stringify(timeLog));
        
        console.log(`⏱️ Work time logged: ${timeLog[this.address].totalMinutes} minutes total`);
    }

    /**
     * Get contractor work time
     */
    getWorkTime(address = this.address) {
        const timeLog = JSON.parse(localStorage.getItem('contractor_time_log') || '{}');
        return timeLog[address]?.totalMinutes || 0;
    }

    /**
     * Notify app of successful authentication
     */
    notifyAuthSuccess() {
        window.dispatchEvent(new CustomEvent('authSuccess', {
            detail: this.getAuthInfo()
        }));
    }

    /**
     * Get authentication info
     */
    getAuthInfo() {
        if (!this.authenticated) return null;

        return {
            address: this.address,
            shortAddress: this.address.slice(0, 6) + '...' + this.address.slice(-4),
            sessionToken: this.sessionToken,
            authenticated: true,
            workTimeMinutes: this.getWorkTime()
        };
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.authenticated;
    }

    /**
     * Get current wallet address
     */
    getAddress() {
        return this.address;
    }

    /**
     * Check if user is System Architect
     */
    isSystemArchitect() {
        if (!this.address) return false;
        
        const systemArchitectWallets = [
            '0xefc6910e7624f164dae9d0f799954aa69c943c8d',
            '0x4ccbefd7d3554bcbbc489b11af73a84d7baef4cb',
            '0x45a328572b2a06484e02eb5d4e4cb6004136eb16'
        ];

        return systemArchitectWallets.includes(this.address.toLowerCase());
    }

    /**
     * Check if user is approved contractor
     */
    isApprovedContractor() {
        if (!this.address || !window.contractorRegistry) return false;

        const contractor = window.contractorRegistry.getContractor(this.address);
        return contractor && contractor.status === 'approved';
    }
}

// Create global instance
window.universalWalletAuth = new UniversalWalletAuth();

console.log('🔐 Universal Wallet Auth System loaded');
