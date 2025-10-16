/**
 * AUTH INTEGRATION HELPER
 * Makes it easy to add universal auth to any page
 * Just include this script and call init()
 */

class AuthIntegration {
    constructor() {
        this.auth = window.universalWalletAuth;
        this.initialized = false;
    }

    /**
     * Initialize auth on page load
     * Automatically restores session if valid
     */
    async init(options = {}) {
        if (this.initialized) return;

        const {
            requireAuth = false,      // Redirect if not authenticated?
            loginPage = 'index.html',  // Where to redirect for login
            onAuthSuccess = null,      // Callback on successful auth
            onAuthFail = null,         // Callback on auth failure
            showUI = true              // Show default connect button?
        } = options;

        // Wait for auth system to load
        await this.waitForAuth();

        // Check if already authenticated
        if (this.auth.isAuthenticated()) {
            console.log('✅ User already authenticated');
            
            if (onAuthSuccess) {
                onAuthSuccess(this.auth.getAuthInfo());
            }

            if (showUI) {
                this.showAuthenticatedUI();
            }
        } else if (requireAuth) {
            console.log('⚠️ Authentication required, redirecting...');
            window.location.href = loginPage;
        } else if (showUI) {
            this.showConnectButton();
        }

        // Listen for auth events
        this.setupEventListeners(onAuthSuccess, onAuthFail);

        this.initialized = true;
    }

    /**
     * Wait for auth system to load
     */
    async waitForAuth(maxWait = 5000) {
        const startTime = Date.now();
        
        while (!window.universalWalletAuth && Date.now() - startTime < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!window.universalWalletAuth) {
            throw new Error('Universal auth system not loaded');
        }

        this.auth = window.universalWalletAuth;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners(onAuthSuccess, onAuthFail) {
        // Auth success event
        window.addEventListener('authSuccess', (event) => {
            console.log('🎉 Authentication successful');
            
            if (onAuthSuccess) {
                onAuthSuccess(event.detail);
            }

            this.showAuthenticatedUI();
        });

        // Auth logout event
        window.addEventListener('authLogout', () => {
            console.log('👋 User logged out');
            
            if (onAuthFail) {
                onAuthFail();
            }

            this.showConnectButton();
        });
    }

    /**
     * Show connect button (default UI)
     */
    showConnectButton() {
        // Check if button already exists
        if (document.getElementById('auth-connect-btn')) return;

        // Create connect button
        const button = document.createElement('button');
        button.id = 'auth-connect-btn';
        button.className = 'auth-connect-button';
        button.innerHTML = '🔌 Connect Wallet';
        button.onclick = () => this.connect();

        // Add to page
        const container = document.querySelector('.auth-container') || 
                         document.querySelector('header') || 
                         document.body;
        
        if (container) {
            container.appendChild(button);
        }

        // Add basic styles if not present
        if (!document.getElementById('auth-styles')) {
            const style = document.createElement('style');
            style.id = 'auth-styles';
            style.textContent = `
                .auth-connect-button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-family: 'Orbitron', sans-serif;
                    font-weight: bold;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }
                .auth-connect-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
                }
                .auth-wallet-info {
                    background: rgba(0, 0, 0, 0.9);
                    border: 2px solid #00ff00;
                    padding: 15px 20px;
                    border-radius: 10px;
                    color: #00ff00;
                    font-family: 'Orbitron', sans-serif;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .auth-disconnect-btn {
                    background: rgba(255, 68, 68, 0.2);
                    border: 1px solid #ff4444;
                    color: #ff4444;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 12px;
                    transition: all 0.3s ease;
                }
                .auth-disconnect-btn:hover {
                    background: rgba(255, 68, 68, 0.4);
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Show authenticated UI
     */
    showAuthenticatedUI() {
        const authInfo = this.auth.getAuthInfo();
        
        // Remove connect button
        const connectBtn = document.getElementById('auth-connect-btn');
        if (connectBtn) {
            connectBtn.remove();
        }

        // Check if wallet info already shown
        if (document.getElementById('auth-wallet-info')) return;

        // Create wallet info display
        const infoDiv = document.createElement('div');
        infoDiv.id = 'auth-wallet-info';
        infoDiv.className = 'auth-wallet-info';
        
        const workHours = Math.floor(authInfo.workTimeMinutes / 60);
        const workMins = authInfo.workTimeMinutes % 60;
        
        infoDiv.innerHTML = `
            <span>🟢 ${authInfo.shortAddress}</span>
            ${authInfo.workTimeMinutes > 0 ? `<span>⏱️ ${workHours}h ${workMins}m</span>` : ''}
            <button class="auth-disconnect-btn" onclick="window.authIntegration.disconnect()">Disconnect</button>
        `;

        // Add to page
        const container = document.querySelector('.auth-container') || 
                         document.querySelector('header') || 
                         document.body;
        
        if (container) {
            container.appendChild(infoDiv);
        }
    }

    /**
     * Connect wallet
     */
    async connect() {
        try {
            const button = document.getElementById('auth-connect-btn');
            if (button) {
                button.disabled = true;
                button.innerHTML = '⏳ Connecting...';
            }

            await this.auth.connect();

        } catch (error) {
            console.error('Connection failed:', error);
            alert('Connection failed: ' + error.message);
            
            const button = document.getElementById('auth-connect-btn');
            if (button) {
                button.disabled = false;
                button.innerHTML = '🔌 Connect Wallet';
            }
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnect() {
        if (confirm('Are you sure you want to disconnect?')) {
            await this.auth.disconnect();
            window.location.reload();
        }
    }

    /**
     * Get auth info (for use in page scripts)
     */
    getAuthInfo() {
        return this.auth.getAuthInfo();
    }

    /**
     * Check if authenticated
     */
    isAuthenticated() {
        return this.auth.isAuthenticated();
    }

    /**
     * Get wallet address
     */
    getAddress() {
        return this.auth.getAddress();
    }

    /**
     * Require authentication (redirect if not authenticated)
     */
    requireAuth(loginPage = 'index.html') {
        if (!this.auth.isAuthenticated()) {
            console.log('⚠️ Authentication required');
            window.location.href = loginPage;
        }
    }

    /**
     * Require System Architect role
     */
    requireSystemArchitect(redirectPage = 'index.html') {
        if (!this.auth.isSystemArchitect()) {
            console.log('⚠️ System Architect access required');
            alert('This page requires System Architect access');
            window.location.href = redirectPage;
        }
    }

    /**
     * Require Approved Contractor role
     */
    requireApprovedContractor(redirectPage = 'contractor-registration.html') {
        if (!this.auth.isApprovedContractor() && !this.auth.isSystemArchitect()) {
            console.log('⚠️ Approved contractor access required');
            alert('This page requires approved contractor access');
            window.location.href = redirectPage;
        }
    }
}

// Create global instance
window.authIntegration = new AuthIntegration();

console.log('✅ Auth Integration Helper loaded');
