// Agent Monitoring System - Agent Types Module
// Individual agent classes for different monitoring tasks

// Base Agent Class
class BaseAgent {
    constructor(id, name, description) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isActive = false;
        this.startTime = null;
        this.lastActivity = null;
        this.type = 'base';
    }

    start(agentSystem) {
        this.isActive = true;
        this.startTime = new Date();
        this.agentSystem = agentSystem;
        this.log(`🚀 Agent ${this.name} started`);
    }

    stop() {
        this.isActive = false;
        this.log(`⏹️ Agent ${this.name} stopped`);
    }

    log(message) {
        if (this.agentSystem) {
            this.lastActivity = new Date();
            this.agentSystem.log(`[${this.name}] ${message}`);
        }
    }
}

// Function Testing Agent
class FunctionTestingAgent extends BaseAgent {
    constructor(id, description) {
        super(id, 'Function Tester', description);
        this.type = 'function-testing';
        this.testInterval = null;
    }

    start(agentSystem) {
        super.start(agentSystem);

        this.testInterval = setInterval(() => {
            this.runTests();
        }, 60000);

        setTimeout(() => this.runTests(), 10000);
    }

    stop() {
        super.stop();
        if (this.testInterval) {
            clearInterval(this.testInterval);
        }
    }

    async runTests() {
        try {
            this.log('🔬 Running function tests...');
            const results = await this.agentSystem.runAllTests();

            const passed = results.filter(r => r.status === 'success').length;
            const failed = results.filter(r => r.status === 'error').length;

            this.log(`✅ Function tests complete: ${passed} passed, ${failed} failed`);

        } catch (error) {
            this.log(`❌ Function test error: ${error.message}`);
        }
    }
}

// Button Testing Agent
class ButtonTestingAgent extends BaseAgent {
    constructor(id, description) {
        super(id, 'Button Tester', description);
        this.type = 'button-testing';
        this.testInterval = null;
    }

    start(agentSystem) {
        super.start(agentSystem);

        this.testInterval = setInterval(() => {
            this.testAllButtons();
        }, 45000);

        setTimeout(() => this.testAllButtons(), 15000);
    }

    stop() {
        super.stop();
        if (this.testInterval) {
            clearInterval(this.testInterval);
        }
    }

    testAllButtons() {
        try {
            this.log('🖱️ Testing all buttons...');

            const walletBtn = document.getElementById('walletBtn');
            if (walletBtn) {
                this.testWalletButton(walletBtn);
            }

            const projectCards = document.querySelectorAll('.project-card');
            projectCards.forEach((card, index) => {
                this.testProjectCard(card, index);
            });

            const navLinks = document.querySelectorAll('a[href]');
            navLinks.forEach(link => {
                this.testNavigationLink(link);
            });

            this.log(`✅ Button tests complete: ${projectCards.length} cards, ${navLinks.length} links`);

        } catch (error) {
            this.log(`❌ Button test error: ${error.message}`);
        }
    }

    testWalletButton(button) {
        if (button.onclick || button.getAttribute('onclick')) {
            this.log('✅ Wallet button: Has click handler');
        } else {
            this.log('⚠️ Wallet button: Missing click handler');
        }
    }

    testProjectCard(card, index) {
        if (card.onclick) {
            this.log(`✅ Project card ${index + 1}: Has click handler`);
        } else {
            this.log(`⚠️ Project card ${index + 1}: Missing click handler`);
        }
    }

    testNavigationLink(link) {
        const href = link.getAttribute('href');
        if (href && (href.startsWith('http') || href.startsWith('/') || href.includes('.html'))) {
            this.log(`✅ Navigation link: ${href}`);
        } else {
            this.log(`⚠️ Navigation link: Invalid href "${href}"`);
        }
    }
}

// Navigation Agent
class NavigationAgent extends BaseAgent {
    constructor(id, description) {
        super(id, 'Navigation Tester', description);
        this.type = 'navigation';
        this.testInterval = null;
    }

    start(agentSystem) {
        super.start(agentSystem);

        this.testInterval = setInterval(() => {
            this.testNavigation();
        }, 90000);
    }

    stop() {
        super.stop();
        if (this.testInterval) {
            clearInterval(this.testInterval);
        }
    }

    async testNavigation() {
        try {
            this.log('🧭 Testing navigation...');

            const pages = [
                'mandem.os/workspace/index.html',
                'ember-terminal/app.html',
                'grand-exchange.html',
                'classified-contracts.html'
            ];

            for (const page of pages) {
                try {
                    const response = await fetch(page, { method: 'HEAD' });
                    if (response.ok) {
                        this.log(`✅ Navigation: ${page} accessible`);
                    } else {
                        this.log(`❌ Navigation: ${page} returned ${response.status}`);
                    }
                } catch (error) {
                    this.log(`❌ Navigation: ${page} error - ${error.message}`);
                }
            }

        } catch (error) {
            this.log(`❌ Navigation test error: ${error.message}`);
        }
    }
}

// Performance Agent
class PerformanceAgent extends BaseAgent {
    constructor(id, description) {
        super(id, 'Performance Monitor', description);
        this.type = 'performance';
        this.metrics = {};
    }

    start(agentSystem) {
        super.start(agentSystem);

        this.monitorPerformance();
        setInterval(() => this.monitorPerformance(), 30000);
    }

    monitorPerformance() {
        try {
            if ('performance' in window) {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');

                this.metrics = {
                    domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
                    loadComplete: navigation?.loadEventEnd || 0,
                    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                    memoryUsage: performance.memory ? {
                        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                    } : null
                };

                this.log(`📊 Performance: DOM ${this.metrics.domContentLoaded}ms, Load ${this.metrics.loadComplete}ms`);

                if (this.metrics.domContentLoaded > 3000) {
                    this.log('⚠️ Performance warning: Slow DOM loading');
                }
                if (this.metrics.loadComplete > 5000) {
                    this.log('⚠️ Performance warning: Slow page loading');
                }
            }
        } catch (error) {
            this.log(`❌ Performance monitoring error: ${error.message}`);
        }
    }
}

// Security Agent
class SecurityAgent extends BaseAgent {
    constructor(id, description) {
        super(id, 'Security Monitor', description);
        this.type = 'security';
        this.securityIssues = [];
    }

    start(agentSystem) {
        super.start(agentSystem);

        setInterval(() => this.checkSecurity(), 60000);
        setTimeout(() => this.checkSecurity(), 20000);
    }

    checkSecurity() {
        try {
            this.log('🔒 Checking security...');

            const issues = [];

            const scripts = document.querySelectorAll('script[src]');
            scripts.forEach(script => {
                const src = script.src;
                if (src && src.startsWith('http://')) {
                    issues.push(`Insecure script: ${src}`);
                }
            });

            if (window.location.protocol === 'https:' && document.querySelector('script[src^="http://"]')) {
                issues.push('Mixed content detected');
            }

            if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
                // This is informational - CSP might be set via headers
            }

            this.securityIssues = issues;
            if (issues.length > 0) {
                this.log(`⚠️ Security issues found: ${issues.length}`);
                issues.forEach(issue => this.log(`  - ${issue}`));
            } else {
                this.log('✅ No security issues detected');
            }

        } catch (error) {
            this.log(`❌ Security check error: ${error.message}`);
        }
    }
}

// Error Recovery Agent
class ErrorRecoveryAgent extends BaseAgent {
    constructor(id, description) {
        super(id, 'Error Recovery', description);
        this.type = 'error-recovery';
        this.recoveryStrategies = {};
    }

    start(agentSystem) {
        super.start(agentSystem);
        this.initializeRecoveryStrategies();
    }

    initializeRecoveryStrategies() {
        this.recoveryStrategies = {
            'universal-wallet-auth.js not loaded': () => {
                this.log('🔧 Attempting wallet auth reload...');
                const script = document.querySelector('script[src="universal-wallet-auth.js"]');
                if (script) {
                    script.remove();
                    const newScript = document.createElement('script');
                    newScript.src = 'universal-wallet-auth.js';
                    document.head.appendChild(newScript);
                    return true;
                }
                return false;
            },
            'Service Worker not registered': () => {
                this.log('🔧 Attempting service worker registration...');
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('./service-worker.js');
                    return true;
                }
                return false;
            },
            'Critical element missing': (error) => {
                this.log('🔧 Attempting to recreate missing DOM elements...');
                const selector = error.selector;
                if (selector) {
                    if (selector === '.portfolio-ticker') {
                        this.createPortfolioTicker();
                        return true;
                    } else if (selector === '#walletButtonContainer') {
                        this.createWalletButton();
                        return true;
                    } else if (selector.includes('script[src*="universal-wallet-auth"]')) {
                        this.reloadWalletAuth();
                        return true;
                    }
                }
                return false;
            },
            'Script failed to load': (error) => {
                this.log('🔧 Attempting to reload failed script...');
                const scriptSrc = error.filename;
                if (scriptSrc && scriptSrc.includes('.js')) {
                    const script = document.querySelector(`script[src="${scriptSrc}"]`);
                    if (script) {
                        script.remove();
                        const newScript = document.createElement('script');
                        newScript.src = scriptSrc;
                        document.head.appendChild(newScript);
                        return true;
                    }
                }
                return false;
            },
            'CSS failed to load': (error) => {
                this.log('🔧 Attempting to reload failed CSS...');
                const cssHref = error.filename;
                if (cssHref && cssHref.includes('.css')) {
                    const link = document.querySelector(`link[href="${cssHref}"]`);
                    if (link) {
                        link.remove();
                        const newLink = document.createElement('link');
                        newLink.rel = 'stylesheet';
                        newLink.href = cssHref;
                        document.head.appendChild(newLink);
                        return true;
                    }
                }
                return false;
            },
            'Image failed to load': (error) => {
                this.log('🔧 Attempting to fix broken image...');
                const imgSrc = error.filename;
                if (imgSrc) {
                    const img = document.querySelector(`img[src="${imgSrc}"]`);
                    if (img) {
                        img.style.display = 'none';
                        return true;
                    }
                }
                return false;
            },
            'API request failed': (error) => {
                this.log('🔧 API request failed - checking network connectivity...');
                if (!navigator.onLine) {
                    this.log('💡 Network offline - will retry when connection restored');
                    return 'network_retry';
                }
                return false;
            },
            'Fetch request failed': (error) => {
                this.log('🔧 Fetch request failed - attempting retry...');
                const url = error.url;
                if (url) {
                    setTimeout(() => {
                        fetch(url).catch(err => {
                            this.log(`❌ Retry failed: ${err.message}`);
                        });
                    }, 2000);
                    return true;
                }
                return false;
            },
            'Network connection lost': () => {
                this.log('🔧 Network lost - setting up reconnection monitoring...');
                const handleReconnection = () => {
                    if (navigator.onLine) {
                        this.log('✅ Network restored - refreshing critical resources');
                        window.location.reload();
                        return true;
                    }
                    return false;
                };

                if (!navigator.onLine) {
                    const retryInterval = setInterval(() => {
                        if (handleReconnection()) {
                            clearInterval(retryInterval);
                        }
                    }, 5000);
                    return true;
                }
                return false;
            },
            'function missing': (error) => {
                this.log('🔧 Function missing - reloading affected modules...');
                const criticalModules = [
                    'universal-wallet-auth.js',
                    'auth-integration.js',
                    'samgov-integration.js',
                    'fpds-contract-schema.js'
                ];

                criticalModules.forEach(module => {
                    const script = document.querySelector(`script[src="${module}"]`);
                    if (script) {
                        script.remove();
                        const newScript = document.createElement('script');
                        newScript.src = module;
                        document.head.appendChild(newScript);
                    }
                });
                return true;
            }
        };
    }

    // Helper methods for DOM recreation
    createPortfolioTicker() {
        if (!document.querySelector('.portfolio-ticker')) {
            const ticker = document.createElement('div');
            ticker.className = 'portfolio-ticker';
            ticker.id = 'portfolioTicker';
            ticker.style.display = 'none';
            document.body.appendChild(ticker);
            this.log('✅ Recreated portfolio ticker element');
        }
    }

    createWalletButton() {
        if (!document.getElementById('walletButtonContainer')) {
            const container = document.createElement('div');
            container.id = 'walletButtonContainer';
            const header = document.querySelector('header');
            if (header) {
                header.appendChild(container);
                this.log('✅ Recreated wallet button container');
            }
        }
    }

    reloadWalletAuth() {
        const script = document.querySelector('script[src*="universal-wallet-auth"]');
        if (script) {
            script.remove();
            const newScript = document.createElement('script');
            newScript.src = 'universal-wallet-auth.js';
            document.head.appendChild(newScript);
            this.log('✅ Reloaded wallet authentication script');
        }
    }

    attemptFix(error) {
        try {
            this.log(`🔧 Attempting to fix: ${error.message}`);

            for (const [pattern, strategy] of Object.entries(this.recoveryStrategies)) {
                if (error.message.includes(pattern)) {
                    const result = strategy(error);
                    if (result === true) {
                        this.log(`✅ Successfully applied fix for: ${error.message}`);
                        this.agentSystem.recordFix(error.id);
                        return true;
                    } else if (result === 'cache_clear_suggestion') {
                        this.log(`💡 Suggestion: Clear browser cache for ${error.message}`);
                        return false;
                    } else if (result === 'network_retry') {
                        this.log(`💡 Network issue detected - will retry when connection restored`);
                        return false;
                    }
                }
            }

            this.log(`❓ No recovery strategy available for: ${error.message}`);
            return false;

        } catch (fixError) {
            this.log(`❌ Fix attempt failed: ${fixError.message}`);
            return false;
        }
    }
}

console.log('🤖 Agent Types loaded');
