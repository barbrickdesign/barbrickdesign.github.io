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
        this.lastTestResults = null;
        this.testHistory = [];
    }

    start(agentSystem) {
        super.start(agentSystem);

        // Run tests less frequently to reduce performance impact
        this.testInterval = setInterval(() => {
            this.runTests();
        }, 120000); // Every 2 minutes instead of 1 minute

        // Initial test after longer delay to ensure everything is loaded
        setTimeout(() => this.runTests(), 15000);
    }

    stop() {
        super.stop();
        if (this.testInterval) {
            clearInterval(this.testInterval);
        }
    }

    async runTests() {
        try {
            this.log('🔬 Running comprehensive function tests...');
            const startTime = performance.now();
            const results = await this.agentSystem.runAllTests();
            const duration = performance.now() - startTime;

            const passed = results.filter(r => r.status === 'success').length;
            const failed = results.filter(r => r.status === 'error').length;

            // Store test results for trend analysis
            this.lastTestResults = { passed, failed, duration, timestamp: new Date() };
            this.testHistory.unshift(this.lastTestResults);

            // Keep only last 10 test results
            if (this.testHistory.length > 10) {
                this.testHistory = this.testHistory.slice(0, 10);
            }

            // Calculate performance trends
            const recentTests = this.testHistory.slice(0, 3);
            const avgDuration = recentTests.reduce((sum, test) => sum + test.duration, 0) / recentTests.length;

            this.log(`✅ Function tests complete: ${passed} passed, ${failed} failed (${duration.toFixed(1)}ms avg)`);

            // Performance warning if tests are taking too long
            if (avgDuration > 5000) {
                this.log('⚠️ Performance warning: Tests taking longer than expected');
            }

        } catch (error) {
            this.log(`❌ Function test error: ${error.message}`);
            this.recordTestFailure(error);
        }
    }

    recordTestFailure(error) {
        // Track test failures for pattern analysis
        const failure = {
            timestamp: new Date(),
            error: error.message,
            component: error.component || 'unknown'
        };

        // Could store in localStorage for historical analysis
        const failures = JSON.parse(localStorage.getItem('agentTestFailures') || '[]');
        failures.unshift(failure);
        if (failures.length > 50) failures.pop();
        localStorage.setItem('agentTestFailures', JSON.stringify(failures));
    }
}

// Button Testing Agent
class ButtonTestingAgent extends BaseAgent {
    constructor(id, description) {
        super(id, 'Button Tester', description);
        this.type = 'button-testing';
        this.testInterval = null;
        this.buttonTests = [];
        this.lastButtonState = {};
    }

    start(agentSystem) {
        super.start(agentSystem);

        // Run button tests less frequently
        this.testInterval = setInterval(() => {
            this.testAllButtons();
        }, 90000); // Every 90 seconds instead of 45 seconds

        // Initial test after longer delay
        setTimeout(() => this.testAllButtons(), 20000);
    }

    stop() {
        super.stop();
        if (this.testInterval) {
            clearInterval(this.testInterval);
        }
    }

    testAllButtons() {
        try {
            this.log('🖱️ Testing all interactive elements...');

            const currentState = {
                walletBtn: this.testWalletButton(),
                projectCards: this.testProjectCards(),
                navLinks: this.testNavigationLinks(),
                forms: this.testForms()
            };

            // Compare with previous state to detect changes
            const stateChanged = this.detectStateChanges(currentState);

            if (stateChanged) {
                this.log('🔄 UI state changed, retesting critical elements');
                // Could trigger additional tests or notifications here
            }

            this.lastButtonState = currentState;
            this.buttonTests.unshift({
                timestamp: new Date(),
                results: currentState,
                stateChanged
            });

            // Keep only last 5 test results
            if (this.buttonTests.length > 5) {
                this.buttonTests = this.buttonTests.slice(0, 5);
            }

        } catch (error) {
            this.log(`❌ Button test error: ${error.message}`);
        }
    }

    testWalletButton() {
        const walletBtn = document.getElementById('walletBtn');
        if (walletBtn) {
            const hasHandler = !!(walletBtn.onclick || walletBtn.getAttribute('onclick'));
            const isVisible = walletBtn.style.display !== 'none' && walletBtn.offsetParent !== null;
            return { exists: true, hasHandler, isVisible };
        }
        return { exists: false, hasHandler: false, isVisible: false };
    }

    testProjectCards() {
        const projectCards = document.querySelectorAll('.project-card');
        return Array.from(projectCards).map((card, index) => ({
            index,
            exists: !!card,
            hasClickHandler: !!card.onclick,
            isVisible: card.style.display !== 'none' && card.offsetParent !== null
        }));
    }

    testNavigationLinks() {
        const navLinks = document.querySelectorAll('a[href]');
        return Array.from(navLinks).map(link => ({
            href: link.getAttribute('href'),
            isValid: this.validateLink(link.getAttribute('href'))
        }));
    }

    testForms() {
        const forms = document.querySelectorAll('form');
        return Array.from(forms).map(form => ({
            hasSubmitButton: !!form.querySelector('input[type="submit"], button[type="submit"]'),
            hasInputs: form.querySelectorAll('input, textarea, select').length > 0
        }));
    }

    validateLink(href) {
        if (!href) return false;
        if (href.startsWith('http') || href.startsWith('/')) return true;
        if (href.includes('.html')) return true;
        return false;
    }

    detectStateChanges(currentState) {
        if (!this.lastButtonState) return true;

        // Simple state comparison - could be more sophisticated
        const currentKeys = Object.keys(currentState);
        const lastKeys = Object.keys(this.lastButtonState);

        if (currentKeys.length !== lastKeys.length) return true;

        for (const key of currentKeys) {
            if (JSON.stringify(currentState[key]) !== JSON.stringify(this.lastButtonState[key])) {
                return true;
            }
        }

        return false;
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

// Performance Monitoring Agent
class PerformanceMonitoringAgent extends BaseAgent {
    constructor(id, description) {
        super(id, 'Performance Monitor', description);
        this.type = 'performance-monitoring';
        this.metrics = {
            memory: {},
            timing: {},
            network: {},
            resources: {}
        };
        this.history = [];
        this.monitoringInterval = null;
    }

    start(agentSystem) {
        super.start(agentSystem);

        // Monitor performance every 30 seconds
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, 30000);

        // Initial collection after 10 seconds
        setTimeout(() => this.collectMetrics(), 10000);
    }

    stop() {
        super.stop();
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
    }

    collectMetrics() {
        try {
            this.log('📊 Collecting performance metrics...');

            // Memory metrics
            this.collectMemoryMetrics();

            // Timing metrics
            this.collectTimingMetrics();

            // Network metrics
            this.collectNetworkMetrics();

            // Resource metrics
            this.collectResourceMetrics();

            // Store metrics in history
            this.history.unshift({
                timestamp: new Date(),
                metrics: { ...this.metrics }
            });

            // Keep only last 20 entries
            if (this.history.length > 20) {
                this.history = this.history.slice(0, 20);
            }

            // Analyze trends
            this.analyzePerformanceTrends();

        } catch (error) {
            this.log(`❌ Performance monitoring error: ${error.message}`);
        }
    }

    collectMemoryMetrics() {
        if (performance.memory) {
            const memory = performance.memory;
            this.metrics.memory = {
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
                usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
            };
        }
    }

    collectTimingMetrics() {
        if (performance.timing) {
            const timing = performance.timing;
            this.metrics.timing = {
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart,
                domInteractive: timing.domInteractive - timing.navigationStart,
                firstByte: timing.responseStart - timing.requestStart
            };
        }
    }

    collectNetworkMetrics() {
        // Track active connections and requests
        this.metrics.network = {
            online: navigator.onLine,
            connectionType: navigator.connection?.effectiveType || 'unknown',
            downlink: navigator.connection?.downlink || 0,
            rtt: navigator.connection?.rtt || 0
        };
    }

    collectResourceMetrics() {
        this.metrics.resources = {
            activeIntervals: this.countActiveIntervals(),
            activeTimeouts: this.countActiveTimeouts(),
            eventListeners: this.countEventListeners(),
            domElements: document.getElementsByTagName('*').length
        };
    }

    countActiveIntervals() {
        // Simplified count - in real implementation would need to track all setInterval calls
        return Object.keys(window).filter(key =>
            key.includes('Interval') && typeof window[key] === 'number'
        ).length;
    }

    countActiveTimeouts() {
        // Simplified count - in real implementation would need to track all setTimeout calls
        return Object.keys(window).filter(key =>
            key.includes('Timeout') && typeof window[key] === 'number'
        ).length;
    }

    countEventListeners() {
        // This is a rough estimate - actual count would require more complex tracking
        return Object.keys(window).filter(key =>
            key.startsWith('on') && typeof window[key] === 'function'
        ).length;
    }

    analyzePerformanceTrends() {
        if (this.history.length < 3) return;

        const recent = this.history.slice(0, 3);
        const memoryTrend = this.calculateTrend(recent.map(h => h.metrics.memory?.usagePercent || 0));

        if (memoryTrend > 5) {
            this.log(`⚠️ Memory usage increasing: +${memoryTrend.toFixed(1)}%`);
        }

        const timingTrend = this.calculateTrend(recent.map(h => h.metrics.timing?.domContentLoaded || 0));
        if (timingTrend > 100) {
            this.log(`⚠️ Page load time increasing: +${timingTrend.toFixed(0)}ms`);
        }

        const resourceTrend = this.calculateTrend(recent.map(h => h.metrics.resources?.activeIntervals || 0));
        if (resourceTrend > 2) {
            this.log(`⚠️ Resource usage increasing: +${resourceTrend.toFixed(1)} intervals`);
        }
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;

        const first = values[0];
        const last = values[values.length - 1];
        return last - first;
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
        this.recoveryStats = {
            totalAttempts: 0,
            successfulFixes: 0,
            failedAttempts: 0,
            strategiesUsed: {}
        };
    }

    start(agentSystem) {
        super.start(agentSystem);
        this.initializeRecoveryStrategies();
        this.loadRecoveryStats();
    }

    initializeRecoveryStrategies() {
        this.recoveryStrategies = {
            // Script loading errors
            'Script failed to load': (error) => {
                return this.reloadScript(error);
            },

            'universal-wallet-auth.js not loaded': (error) => {
                return this.reloadWalletAuth();
            },

            'auth-integration.js not loaded': (error) => {
                return this.reloadAuthIntegration();
            },

            // CSS loading errors
            'CSS failed to load': (error) => {
                return this.reloadCSS(error);
            },

            // Network errors
            'NetworkError': (error) => {
                return this.handleNetworkError(error);
            },

            'fetch request failed': (error) => {
                return this.handleFetchError(error);
            },

            // DOM errors
            'element not found': (error) => {
                return this.recreateDOMElement(error);
            },

            'missing UI element': (error) => {
                return this.recreateDOMElement(error);
            },

            // Service Worker errors
            'Service Worker not registered': (error) => {
                return this.reregisterServiceWorker();
            },

            // Function missing errors
            'function not defined': (error) => {
                return this.reloadMissingFunction(error);
            },

            'is not a function': (error) => {
                return this.reloadMissingFunction(error);
            },

            // Performance errors
            'performance warning': (error) => {
                return this.optimizePerformance(error);
            },

            // Generic script errors
            'Script error': (error) => {
                return this.handleScriptError(error);
            }
        };
    }

    async reloadScript(error) {
        this.log('🔧 Attempting to reload failed script...');
        const scriptSrc = error.filename || error.target?.src;

        if (scriptSrc && scriptSrc.includes('.js')) {
            const script = document.querySelector(`script[src*="${scriptSrc.split('/').pop()}"]`);
            if (script) {
                const newScript = document.createElement('script');
                newScript.src = scriptSrc + '?retry=' + Date.now();
                newScript.onload = () => {
                    this.log('✅ Script reloaded successfully');
                    return true;
                };
                newScript.onerror = () => {
                    this.log('❌ Script reload failed');
                    return false;
                };

                script.remove();
                document.head.appendChild(newScript);
                return true;
            }
        }
        return false;
    }

    reloadWalletAuth() {
        this.log('🔧 Reloading wallet authentication system...');
        const script = document.querySelector('script[src*="universal-wallet-auth"]');
        if (script) {
            script.remove();

            // Wait a bit then reload
            setTimeout(() => {
                const newScript = document.createElement('script');
                newScript.src = 'universal-wallet-auth.js';
                newScript.onload = () => this.log('✅ Wallet auth reloaded');
                newScript.onerror = () => this.log('❌ Wallet auth reload failed');
                document.head.appendChild(newScript);
            }, 1000);

            return true;
        }
        return false;
    }

    reloadAuthIntegration() {
        this.log('🔧 Reloading auth integration...');
        const script = document.querySelector('script[src*="auth-integration"]');
        if (script) {
            script.remove();

            setTimeout(() => {
                const newScript = document.createElement('script');
                newScript.src = 'auth-integration.js';
                newScript.onload = () => this.log('✅ Auth integration reloaded');
                newScript.onerror = () => this.log('❌ Auth integration reload failed');
                document.head.appendChild(newScript);
            }, 1000);

            return true;
        }
        return false;
    }

    reloadCSS(error) {
        this.log('🔧 Reloading failed CSS...');
        const cssHref = error.filename;

        if (cssHref && cssHref.includes('.css')) {
            const link = document.querySelector(`link[href*="${cssHref.split('/').pop()}"]`);
            if (link) {
                const newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = cssHref + '?retry=' + Date.now();

                link.remove();
                document.head.appendChild(newLink);

                this.log('✅ CSS reloaded');
                return true;
            }
        }
        return false;
    }

    handleNetworkError(error) {
        this.log('🔧 Network error detected - checking connectivity...');

        if (!navigator.onLine) {
            this.log('💡 Network offline - will retry when connection restored');
            return 'network_retry';
        }

        // Try to ping a reliable endpoint
        fetch('/api/ping', { timeout: 5000 })
            .then(() => {
                this.log('✅ Network connectivity restored');
            })
            .catch(() => {
                this.log('❌ Network still unavailable');
            });

        return false;
    }

    handleFetchError(error) {
        this.log('🔧 Fetch error - attempting retry with exponential backoff...');

        const url = error.url || error.target?.src;
        if (url) {
            // Implement exponential backoff retry
            this.retryWithBackoff(url, 3);
            return true;
        }
        return false;
    }

    async retryWithBackoff(url, maxRetries) {
        for (let i = 0; i < maxRetries; i++) {
            const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s

            await new Promise(resolve => setTimeout(resolve, delay));

            try {
                const response = await fetch(url, { timeout: 5000 });
                if (response.ok) {
                    this.log(`✅ Retry ${i + 1} successful for ${url}`);
                    return true;
                }
            } catch (error) {
                this.log(`❌ Retry ${i + 1} failed for ${url}: ${error.message}`);
            }
        }

        this.log(`❌ All retries failed for ${url}`);
        return false;
    }

    recreateDOMElement(error) {
        this.log('🔧 Attempting to recreate missing DOM element...');

        const elementInfo = this.parseElementError(error.message);
        if (elementInfo) {
            return this.createElement(elementInfo);
        }
        return false;
    }

    parseElementError(message) {
        // Parse error messages to identify missing elements
        const patterns = [
            { pattern: /getElementById\(['"]([^'"]+)['"]\)/, type: 'id' },
            { pattern: /querySelector\(['"]([^'"]+)['"]\)/, type: 'selector' },
            { pattern: /class.*not found/, type: 'class' }
        ];

        for (const { pattern, type } of patterns) {
            const match = message.match(pattern);
            if (match) {
                return { type, value: match[1] };
            }
        }

        return null;
    }

    createElement(elementInfo) {
        switch (elementInfo.value) {
            case 'walletBtn':
            case 'walletButton':
                return this.createWalletButton();
            case 'mgcBalanceDisplay':
            case 'portfolioTicker':
                return this.createBalanceDisplay();
            case 'statusMessage':
                return this.createStatusMessage();
            default:
                this.log(`⚠️ Unknown element to recreate: ${elementInfo.value}`);
                return false;
        }
    }

    createWalletButton() {
        if (!document.getElementById('walletBtn')) {
            const button = document.createElement('button');
            button.id = 'walletBtn';
            button.textContent = 'Connect Wallet';
            button.className = 'wallet-button';
            button.onclick = () => {
                if (window.universalWalletAuth) {
                    window.universalWalletAuth.connect();
                }
            };

            // Find appropriate container
            const container = document.querySelector('header') || document.querySelector('.wallet-container') || document.body;
            container.appendChild(button);

            this.log('✅ Recreated wallet button');
            return true;
        }
        return false;
    }

    createBalanceDisplay() {
        if (!document.getElementById('mgcBalanceDisplay')) {
            const display = document.createElement('div');
            display.id = 'mgcBalanceDisplay';
            display.textContent = '0 MGC';
            display.className = 'balance-display';

            // Find appropriate container
            const container = document.querySelector('.user-info') || document.querySelector('header') || document.body;
            container.appendChild(display);

            this.log('✅ Recreated balance display');
            return true;
        }
        return false;
    }

    createStatusMessage() {
        if (!document.getElementById('statusMessage')) {
            const status = document.createElement('div');
            status.id = 'statusMessage';
            status.textContent = 'Server: Checking...';
            status.className = 'server-status';

            document.body.appendChild(status);

            this.log('✅ Recreated status message');
            return true;
        }
        return false;
    }

    reregisterServiceWorker() {
        this.log('🔧 Re-registering service worker...');

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    this.log('✅ Service worker re-registered');
                    return true;
                })
                .catch(error => {
                    this.log(`❌ Service worker registration failed: ${error.message}`);
                    return false;
                });
        }

        return true;
    }

    reloadMissingFunction(error) {
        this.log('🔧 Reloading modules for missing function...');

        const criticalModules = [
            'universal-wallet-auth.js',
            'auth-integration.js',
            'samgov-integration.js',
            'fpds-contract-schema.js',
            'agent-core.js',
            'agent-types.js',
            'agent-display.js'
        ];

        let reloadedCount = 0;
        criticalModules.forEach(module => {
            const script = document.querySelector(`script[src*="${module}"]`);
            if (script) {
                script.remove();
                setTimeout(() => {
                    const newScript = document.createElement('script');
                    newScript.src = module;
                    newScript.onload = () => reloadedCount++;
                    newScript.onerror = () => this.log(`❌ Failed to reload ${module}`);
                    document.head.appendChild(newScript);
                }, reloadedCount * 500); // Stagger reloads
            }
        });

        return reloadedCount > 0;
    }

    optimizePerformance(error) {
        this.log('🔧 Attempting performance optimization...');

        // Check if there are too many intervals running
        const intervals = this.getActiveIntervals();
        if (intervals > 20) {
            this.log(`⚠️ Too many active intervals (${intervals}) - consider optimization`);
            // Could implement interval cleanup here
        }

        // Check memory usage if available
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
            if (memoryUsage > 0.8) {
                this.log(`⚠️ High memory usage: ${(memoryUsage * 100).toFixed(1)}%`);
                // Could suggest garbage collection or optimization
            }
        }

        return true;
    }

    getActiveIntervals() {
        // This is a simplified check - in a real implementation,
        // you'd need to track all setInterval/setTimeout calls
        return Object.keys(window).filter(key =>
            key.includes('Interval') || key.includes('Timeout')
        ).length;
    }

    handleScriptError(error) {
        this.log('🔧 Handling script error...');

        // Try to identify which script caused the error
        if (error.filename && error.filename.includes('.js')) {
            return this.reloadScript(error);
        }

        // Fallback: reload critical modules
        return this.reloadMissingFunction(error);
    }

    attemptFix(error) {
        try {
            this.log(`🔧 Attempting to fix: ${error.message}`);
            this.recoveryStats.totalAttempts++;

            for (const [pattern, strategy] of Object.entries(this.recoveryStrategies)) {
                if (error.message.toLowerCase().includes(pattern.toLowerCase()) ||
                    error.category?.toLowerCase().includes(pattern.toLowerCase())) {

                    const startTime = performance.now();
                    const result = strategy(error);
                    const duration = performance.now() - startTime;

                    // Track strategy usage
                    this.recoveryStats.strategiesUsed[pattern] = (this.recoveryStats.strategiesUsed[pattern] || 0) + 1;

                    if (result === true) {
                        this.recoveryStats.successfulFixes++;
                        const fixDetails = {
                            type: 'automatic',
                            method: pattern,
                            success: true,
                            description: `Applied ${pattern} recovery strategy`,
                            duration: duration,
                            metadata: {
                                pattern: pattern,
                                strategy: 'recovery'
                            }
                        };

                        this.log(`✅ Successfully applied fix for: ${error.message}`);
                        this.agentSystem.recordFix(error.id, this.id, fixDetails);
                        this.saveRecoveryStats();
                        return true;

                    } else if (result === 'network_retry') {
                        const fixDetails = {
                            type: 'monitoring',
                            method: 'network_retry',
                            success: false,
                            description: 'Network issue detected - will retry when connection restored',
                            duration: duration,
                            metadata: {
                                issue: 'network_connectivity',
                                action: 'waiting_for_reconnection'
                            }
                        };

                        this.log(`💡 Network issue detected - will retry when connection restored`);
                        this.agentSystem.recordFix(error.id, this.id, fixDetails);
                        this.saveRecoveryStats();
                        return false;
                    }
                }
            }

            // Record failed fix attempt
            this.recoveryStats.failedAttempts++;
            const fixDetails = {
                type: 'failed',
                method: 'no_strategy',
                success: false,
                description: 'No recovery strategy available for this error type',
                duration: 0,
                metadata: {
                    reason: 'no_matching_strategy'
                }
            };

            this.log(`❓ No recovery strategy available for: ${error.message}`);
            this.agentSystem.recordFix(error.id, this.id, fixDetails);
            this.saveRecoveryStats();
            return false;

        } catch (fixError) {
            this.log(`❌ Fix attempt failed: ${fixError.message}`);
            this.recoveryStats.failedAttempts++;

            const fixDetails = {
                type: 'failed',
                method: 'exception',
                success: false,
                description: `Fix attempt threw exception: ${fixError.message}`,
                duration: 0,
                metadata: {
                    exception: fixError.message
                }
            };

            this.agentSystem.recordFix(error.id, this.id, fixDetails);
            this.saveRecoveryStats();
            return false;
        }
    }

    loadRecoveryStats() {
        try {
            const stats = localStorage.getItem('agentRecoveryStats');
            if (stats) {
                this.recoveryStats = { ...this.recoveryStats, ...JSON.parse(stats) };
            }
        } catch (error) {
            this.log(`Failed to load recovery stats: ${error.message}`);
        }
    }

    saveRecoveryStats() {
        try {
            localStorage.setItem('agentRecoveryStats', JSON.stringify(this.recoveryStats));
        } catch (error) {
            this.log(`Failed to save recovery stats: ${error.message}`);
        }
    }
}

console.log('🤖 Agent Types loaded');

// Export BaseAgent globally for other modules to use
window.BaseAgent = BaseAgent;
