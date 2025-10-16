/**
 * AUTH + WALLET BOOTSTRAP
 * Ensures universal wallet auth initializes exactly once per page
 * and synchronizes the Pump.fun wallet button with auth events.
 */

(function () {
    const BOOT_PROPERTY = '__barbrickAuthBootstrapped';

    if (window[BOOT_PROPERTY]) {
        console.warn('Auth bootstrap already executed on this page.');
        return;
    }

    window[BOOT_PROPERTY] = true;

    async function ensureAuthInitialized() {
        const START = Date.now();
        const MAX_WAIT = 7000;

        // Wait for universal wallet auth script to be available
        while (!window.universalWalletAuth && Date.now() - START < MAX_WAIT) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!window.universalWalletAuth) {
            console.error('Auth bootstrap: universalWalletAuth not found.');
            return false;
        }

        // Wait for authIntegration to be available
        while (!window.authIntegration && Date.now() - START < MAX_WAIT) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!window.authIntegration) {
            console.error('Auth bootstrap: authIntegration helper missing.');
            return false;
        }

        try {
            await window.authIntegration.init({ showUI: false });
            console.log('Auth bootstrap: authIntegration initialized.');
        } catch (error) {
            console.error('Auth bootstrap failed during init:', error);
            return false;
        }

        // Initialize wallet button if container exists
        const buttonContainer = document.getElementById('walletButtonContainer') ||
                                 document.querySelector('.wallet-button-container');

        if (buttonContainer && !window.walletButton) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    window.walletButton = new window.WalletButton?.constructor
                        ? new window.WalletButton()
                        : new WalletButton();
                }, { once: true });
            } else {
                window.walletButton = new window.WalletButton?.constructor
                    ? new window.WalletButton()
                    : new WalletButton();
            }
        }

        return true;
    }

    ensureAuthInitialized().then((success) => {
        if (!success) {
            console.warn('Auth bootstrap: initialization unsuccessful.');
        }
    });
})();
