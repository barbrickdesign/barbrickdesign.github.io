// WALLET CONNECTION AUTO-REPAIR SYSTEM
// Automatically detects and fixes wallet connection errors

class WalletAutoRepair {
    constructor() {
        this.errors = [];
        this.fixes = [];
        this.errorPatterns = {
            'User rejected the request': 'user_rejection',
            'MetaMask is not installed': 'no_metamask',
            'Already processing': 'already_processing',
            'Disconnected from chain': 'chain_disconnect',
            'Invalid wallet address': 'invalid_address',
            'Network error': 'network_error',
            'Timeout': 'timeout_error'
        };
    }

    async diagnoseAndRepair() {
        console.log('🔧 WALLET AUTO-REPAIR SYSTEM ACTIVATED');
        console.log('=====================================\n');

        // 1. Check current wallet connection status
        await this.checkWalletStatus();

        // 2. Analyze console errors
        await this.analyzeConsoleErrors();

        // 3. Check script loading issues
        await this.checkScriptLoading();

        // 4. Apply automatic fixes
        await this.applyFixes();

        // 5. Test wallet connection
        await this.testConnection();

        // 6. Generate report
        this.generateReport();
    }

    async checkWalletStatus() {
        console.log('🔍 Checking wallet connection status...');

        try {
            // Check if MetaMask is available
            if (typeof window !== 'undefined') {
                const hasMetaMask = typeof window.ethereum !== 'undefined';
                const hasPhantom = typeof window.solana !== 'undefined';

                console.log(`MetaMask detected: ${hasMetaMask ? '✅' : '❌'}`);
                console.log(`Phantom detected: ${hasPhantom ? '✅' : '❌'}`);

                if (!hasMetaMask && !hasPhantom) {
                    this.errors.push({
                        type: 'no_wallet_extension',
                        message: 'No wallet extensions detected',
                        severity: 'high'
                    });
                }
            }
        } catch (error) {
            this.errors.push({
                type: 'wallet_check_error',
                message: `Wallet status check failed: ${error.message}`,
                severity: 'medium'
            });
        }
    }

    async analyzeConsoleErrors() {
        console.log('📊 Analyzing console errors...');

        // Common error patterns that indicate wallet issues
        const walletErrors = [
            'User rejected the request',
            'MetaMask Tx Signature: User denied transaction signature',
            'Already processing eth_requestAccounts',
            'Disconnected from chain',
            'Invalid wallet address',
            'Network Error',
            'timeout',
            'Failed to fetch',
            'Cannot read properties of null',
            'Cannot read properties of undefined'
        ];

        // Simulate checking console errors (in a real implementation, we'd capture them)
        // For now, we'll check the most common issues
        if (typeof window !== 'undefined') {
            // Check for common wallet connection issues
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length === 0) {
                        this.errors.push({
                            type: 'not_connected',
                            message: 'Wallet not connected to any accounts',
                            severity: 'medium'
                        });
                    }
                } catch (error) {
                    this.errors.push({
                        type: 'connection_error',
                        message: `Wallet connection error: ${error.message}`,
                        severity: 'high'
                    });
                }
            }
        }
    }

    async checkScriptLoading() {
        console.log('🔗 Checking script loading...');

        const requiredScripts = [
            'universal-wallet-auth.js',
            'auth-integration.js',
            'contractor-registry.js',
            'wallet-adapter.js'
        ];

        for (const script of requiredScripts) {
            try {
                // Check if script element exists
                const scriptElements = document.querySelectorAll(`script[src*="${script}"]`);
                if (scriptElements.length === 0) {
                    this.errors.push({
                        type: 'missing_script',
                        message: `Script ${script} not loaded`,
                        severity: 'high'
                    });
                } else {
                    // Check if script loaded successfully
                    const scriptEl = scriptElements[0];
                    if (scriptEl.hasAttribute('data-error')) {
                        this.errors.push({
                            type: 'script_load_error',
                            message: `Script ${script} failed to load`,
                            severity: 'high'
                        });
                    }
                }
            } catch (error) {
                this.errors.push({
                    type: 'script_check_error',
                    message: `Error checking script ${script}: ${error.message}`,
                    severity: 'low'
                });
            }
        }
    }

    async applyFixes() {
        console.log('🔧 Applying automatic fixes...');

        for (const error of this.errors) {
            const fix = this.generateFix(error);
            if (fix) {
                try {
                    await this.executeFix(fix);
                    this.fixes.push(fix);
                    console.log(`✅ Applied fix: ${fix.description}`);
                } catch (fixError) {
                    console.error(`❌ Fix failed: ${fix.description} - ${fixError.message}`);
                }
            }
        }
    }

    generateFix(error) {
        switch (error.type) {
            case 'no_wallet_extension':
                return {
                    type: 'install_prompt',
                    description: 'Prompt user to install wallet extension',
                    action: () => {
                        // Show installation prompt
                        if (confirm('No wallet detected! Would you like to install MetaMask?')) {
                            window.open('https://metamask.io/download/', '_blank');
                        }
                    }
                };

            case 'not_connected':
                return {
                    type: 'auto_connect',
                    description: 'Attempt automatic wallet connection',
                    action: async () => {
                        if (window.universalWalletAuth) {
                            try {
                                await window.universalWalletAuth.connect();
                            } catch (connectError) {
                                console.warn('Auto-connect failed:', connectError.message);
                            }
                        }
                    }
                };

            case 'connection_error':
                return {
                    type: 'retry_connection',
                    description: 'Retry wallet connection with better error handling',
                    action: async () => {
                        // Enhanced connection retry logic
                        if (window.ethereum) {
                            try {
                                await window.ethereum.request({
                                    method: 'eth_requestAccounts',
                                    timeout: 10000 // 10 second timeout
                                });
                            } catch (retryError) {
                                // Provide user-friendly error message
                                this.showUserError('Wallet connection failed. Please try again or refresh the page.');
                            }
                        }
                    }
                };

            case 'missing_script':
                return {
                    type: 'reload_scripts',
                    description: 'Reload missing wallet scripts',
                    action: () => {
                        // Force reload of critical scripts
                        const scriptsToReload = ['universal-wallet-auth.js', 'auth-integration.js'];
                        scriptsToReload.forEach(scriptName => {
                            const existing = document.querySelector(`script[src*="${scriptName}"]`);
                            if (existing) {
                                existing.remove();
                                const newScript = document.createElement('script');
                                newScript.src = scriptName;
                                newScript.defer = true;
                                document.head.appendChild(newScript);
                            }
                        });
                    }
                };

            default:
                return null;
        }
    }

    async executeFix(fix) {
        if (typeof fix.action === 'function') {
            await fix.action();
        }
    }

    async testConnection() {
        console.log('🧪 Testing wallet connection...');

        try {
            if (window.universalWalletAuth) {
                const isConnected = window.universalWalletAuth.isAuthenticated();
                console.log(`Wallet connected: ${isConnected ? '✅' : '❌'}`);

                if (isConnected) {
                    const address = window.universalWalletAuth.getAddress();
                    console.log(`Wallet address: ${address ? address.substring(0, 10) + '...' : 'Unknown'}`);
                }
            } else {
                console.log('❌ Universal wallet auth not available');
            }
        } catch (error) {
            console.error('❌ Connection test failed:', error.message);
        }
    }

    showUserError(message) {
        // Create user-friendly error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.innerHTML = `
            <strong>Wallet Error</strong><br>
            ${message}
            <br><br>
            <button onclick="this.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            ">Dismiss</button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    generateReport() {
        console.log('\n📋 WALLET REPAIR REPORT');
        console.log('======================');

        console.log(`\n🔍 Errors Found: ${this.errors.length}`);
        this.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.type}: ${error.message} (${error.severity})`);
        });

        console.log(`\n🔧 Fixes Applied: ${this.fixes.length}`);
        this.fixes.forEach((fix, index) => {
            console.log(`${index + 1}. ${fix.description}`);
        });

        console.log('\n🚀 WALLET STATUS:');
        if (this.errors.length === 0) {
            console.log('✅ All systems operational');
        } else if (this.fixes.length > 0) {
            console.log('⚠️ Some issues detected and repaired');
        } else {
            console.log('❌ Issues detected - manual intervention may be needed');
        }
    }

    // Emergency recovery function
    emergencyRecovery() {
        console.log('🚨 EMERGENCY WALLET RECOVERY ACTIVATED');

        // Clear all wallet-related localStorage
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('wallet') || key.includes('auth') || key.includes('barbrick'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log('✅ Cleared wallet cache');
        } catch (error) {
            console.error('❌ Failed to clear cache:', error.message);
        }

        // Force page reload
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// Auto-run the repair system
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Add global error handler for wallet errors
        window.addEventListener('error', (event) => {
            if (event.message && (
                event.message.includes('wallet') ||
                event.message.includes('ethereum') ||
                event.message.includes('MetaMask') ||
                event.message.includes('Phantom')
            )) {
                console.warn('🚨 Wallet error detected:', event.message);

                // Auto-repair after a short delay
                setTimeout(() => {
                    const repair = new WalletAutoRepair();
                    repair.diagnoseAndRepair();
                }, 2000);
            }
        });

        // Also run on wallet connection failures
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && typeof event.reason === 'string' &&
                (event.reason.includes('wallet') || event.reason.includes('User rejected'))) {
                console.warn('🚨 Wallet promise rejection:', event.reason);

                setTimeout(() => {
                    const repair = new WalletAutoRepair();
                    repair.diagnoseAndRepair();
                }, 2000);
            }
        });
    });

    // Make repair system globally available
    window.walletAutoRepair = new WalletAutoRepair();
}
