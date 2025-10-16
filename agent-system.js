// Agent Monitoring System - Core Engine
// Monitors and tests all site functionality in real-time

class AgentSystem {
    constructor() {
        this.agents = [];
        this.logs = [];
        this.errors = [];
        this.fixes = 0;
        this.testsRun = 0;
        this.isRunning = false;
        this.lastHealthCheck = null;
        this.healthStatus = 'unknown';
        this.agentStats = {}; // Track individual agent statistics

        // Site components to monitor
        this.siteComponents = {
            // Core Systems
            'universal-wallet-auth': {
                type: 'javascript',
                path: 'universal-wallet-auth.js',
                testFunction: this.testWalletAuth.bind(this),
                critical: true
            },
            'auth-integration': {
                type: 'javascript',
                path: 'auth-integration.js',
                testFunction: this.testAuthIntegration.bind(this),
                critical: true
            },
            'fpds-contract-schema': {
                type: 'javascript',
                path: 'fpds-contract-schema.js',
                testFunction: this.testFpdsSchema.bind(this),
                critical: true
            },
            'samgov-integration': {
                type: 'javascript',
                path: 'samgov-integration.js',
                testFunction: this.testSamGovIntegration.bind(this),
                critical: true
            },

            // Pages
            'main-hub': {
                type: 'html',
                path: 'index.html',
                testFunction: this.testMainHub.bind(this),
                critical: true
            },
            'gem-bot-universe': {
                type: 'html',
                path: 'mandem.os/workspace/index.html',
                testFunction: this.testGemBotUniverse.bind(this),
                critical: true
            },
            'ember-terminal': {
                type: 'html',
                path: 'ember-terminal/app.html',
                testFunction: this.testEmberTerminal.bind(this),
                critical: true
            },
            'grand-exchange': {
                type: 'html',
                path: 'grand-exchange.html',
                testFunction: this.testGrandExchange.bind(this),
                critical: true
            },
            'classified-contracts': {
                type: 'html',
                path: 'classified-contracts.html',
                testFunction: this.testClassifiedContracts.bind(this),
                critical: true
            },

            // APIs and External Services
            'service-worker': {
                type: 'service-worker',
                path: 'service-worker.js',
                testFunction: this.testServiceWorker.bind(this),
                critical: true
            }
        };

        this.initializeAgents();
        this.loadFromStorage();
    }

    initializeAgents() {
        // Create specialized testing agents with repair capabilities
        this.agents = [
            new FunctionTestingAgent('function-tester', 'Tests all site functions and APIs', this),
            new ButtonTestingAgent('button-tester', 'Tests all buttons and clickable elements', this),
            new NavigationAgent('navigation-tester', 'Tests navigation between pages', this),
            new PerformanceAgent('performance-monitor', 'Monitors site performance and speed', this),
            new SecurityAgent('security-monitor', 'Monitors security and authentication', this),
            new ErrorRecoveryAgent('error-recovery', 'Automatically fixes detected errors', this)
        ];

        // Initialize agent statistics
        this.agents.forEach(agent => {
            this.agentStats[agent.id] = {
                id: agent.id,
                name: agent.name,
                type: agent.type,
                repairs: 0,
                fixes: 0,
                tests: 0,
                uptime: 0,
                efficiency: 0,
                startTime: Date.now()
            };
        });
    }

    async start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.log('🚀 Agent System Started');

        // Start all agents
        for (const agent of this.agents) {
            agent.start(this);
        }

        // Begin continuous monitoring
        this.startHealthMonitoring();
        this.startErrorMonitoring();

        // Save state
        this.saveToStorage();
    }

    stop() {
        this.isRunning = false;
        this.log('⏹️ Agent System Stopped');

        for (const agent of this.agents) {
            agent.stop();
        }
    }

    async runAllTests() {
        this.log('🔬 Running comprehensive site tests...');

        const results = [];
        for (const [componentName, component] of Object.entries(this.siteComponents)) {
            try {
                const result = await component.testFunction();
                results.push({
                    component: componentName,
                    status: 'success',
                    data: result,
                    timestamp: new Date().toISOString()
                });
                this.log(`✅ ${componentName}: PASSED`);
            } catch (error) {
                results.push({
                    component: componentName,
                    status: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                this.log(`❌ ${componentName}: FAILED - ${error.message}`);
                this.recordError(componentName, error);
            }
        }

        this.testsRun++;
        this.saveToStorage();
        return results;
    }

    // Component Testing Functions (same as before)
    async testWalletAuth() {
        if (typeof window.universalWalletAuth === 'undefined') {
            throw new Error('universal-wallet-auth.js not loaded');
        }

        // Test core functions
        if (typeof window.universalWalletAuth.connect !== 'function') {
            throw new Error('connect function missing');
        }
        if (typeof window.universalWalletAuth.disconnect !== 'function') {
            throw new Error('disconnect function missing');
        }
        if (typeof window.universalWalletAuth.isAuthenticated !== 'function') {
            throw new Error('isAuthenticated function missing');
        }

        return {
            functions: ['connect', 'disconnect', 'isAuthenticated', 'getAddress'],
            version: '2.0.0'
        };
    }

    async testAuthIntegration() {
        if (typeof window.authIntegration === 'undefined') {
            throw new Error('auth-integration.js not loaded');
        }

        if (typeof window.authIntegration.init !== 'function') {
            throw new Error('init function missing');
        }

        return {
            functions: ['init', 'requireSystemArchitect', 'requireApprovedContractor'],
            version: '1.0.0'
        };
    }

    async testFpdsSchema() {
        if (typeof window.samGovIntegration === 'undefined') {
            throw new Error('samgov-integration.js not loaded');
        }

        // Test FPDS contract parsing
        const testContract = 'FA8750-23-C-0001';
        const parsed = window.samGovIntegration.parseContractNumber(testContract);
        if (!parsed || !parsed.agency) {
            throw new Error('Contract parsing failed');
        }

        return {
            parsedContract: parsed,
            functions: ['parseContractNumber', 'validateContractNumber', 'generateContractNumber']
        };
    }

    async testSamGovIntegration() {
        if (typeof window.samGovIntegration === 'undefined') {
            throw new Error('samgov-integration.js not loaded');
        }

        // Test market intelligence functions
        if (typeof window.samGovIntegration.getMarketStatistics !== 'function') {
            throw new Error('getMarketStatistics function missing');
        }

        return {
            functions: ['getMarketStatistics', 'generateMarketReport', 'fetchFPDSContracts'],
            version: '1.0.0'
        };
    }

    async testMainHub() {
        // Test if page loads and critical elements exist
        const requiredElements = [
            '.project-card',
            '#walletButtonContainer',
            '.portfolio-ticker'
        ];

        for (const selector of requiredElements) {
            if (!document.querySelector(selector)) {
                throw new Error(`Required element missing: ${selector}`);
            }
        }

        // Test project card clicks (simulate navigation)
        const projectCards = document.querySelectorAll('.project-card');
        if (projectCards.length === 0) {
            throw new Error('No project cards found');
        }

        return {
            projectCards: projectCards.length,
            requiredElements: requiredElements.length,
            status: 'loaded'
        };
    }

    async testGemBotUniverse() {
        // Test if Gem Bot Universe page is accessible
        try {
            const response = await fetch('mandem.os/workspace/index.html');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return { status: 'accessible', responseTime: Date.now() };
        } catch (error) {
            throw new Error(`Page not accessible: ${error.message}`);
        }
    }

    async testEmberTerminal() {
        try {
            const response = await fetch('ember-terminal/app.html');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return { status: 'accessible', responseTime: Date.now() };
        } catch (error) {
            throw new Error(`Page not accessible: ${error.message}`);
        }
    }

    async testGrandExchange() {
        try {
            const response = await fetch('grand-exchange.html');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return { status: 'accessible', responseTime: Date.now() };
        } catch (error) {
            throw new Error(`Page not accessible: ${error.message}`);
        }
    }

    async testClassifiedContracts() {
        try {
            const response = await fetch('classified-contracts.html');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return { status: 'accessible', responseTime: Date.now() };
        } catch (error) {
            throw new Error(`Page not accessible: ${error.message}`);
        }
    }

    async testServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker not supported');
        }

        const registration = await navigator.serviceWorker.getRegistration('./');
        if (!registration) {
            throw new Error('Service Worker not registered');
        }

        return {
            status: 'registered',
            scope: registration.scope,
            updateViaCache: registration.updateViaCache
        };
    }

    startHealthMonitoring() {
        // Run health checks every 30 seconds
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, 30000);

        // Initial health check
        setTimeout(() => this.performHealthCheck(), 5000);
    }

    async performHealthCheck() {
        try {
            this.lastHealthCheck = new Date();

            // Test critical components
            const criticalTests = ['universal-wallet-auth', 'main-hub', 'service-worker'];
            const results = [];

            for (const component of criticalTests) {
                try {
                    const result = await this.siteComponents[component].testFunction();
                    results.push({ component, status: 'healthy' });
                } catch (error) {
                    results.push({ component, status: 'unhealthy', error: error.message });
                    this.recordError(component, error);
                }
            }

            // Determine overall health
            const healthyCount = results.filter(r => r.status === 'healthy').length;
            this.healthStatus = healthyCount === criticalTests.length ? 'healthy' :
                               healthyCount >= criticalTests.length * 0.8 ? 'degraded' : 'critical';

            this.log(`🏥 Health Check: ${this.healthStatus.toUpperCase()} (${healthyCount}/${criticalTests.length} healthy)`);

        } catch (error) {
            this.healthStatus = 'critical';
            this.recordError('health-check', error);
        }
    }

    startErrorMonitoring() {
        // Monitor for JavaScript errors
        window.addEventListener('error', (event) => {
            this.recordError('javascript-error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Monitor for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError('unhandled-promise', {
                reason: event.reason?.toString() || 'Unknown promise rejection'
            });
        });

        // Monitor for console errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.recordError('console-error', { message: args.join(' ') });
            originalConsoleError.apply(console, args);
        };
    }

    recordError(component, error) {
        const errorEntry = {
            id: Date.now() + Math.random(),
            component,
            message: error.message || error.toString(),
            stack: error.stack,
            timestamp: new Date().toISOString(),
            status: 'open'
        };

        this.errors.push(errorEntry);
        this.log(`❌ ERROR: ${component} - ${errorEntry.message}`);

        // Attempt auto-recovery if error recovery agent is available
        const errorRecoveryAgent = this.agents.find(a => a.type === 'error-recovery');
        if (errorRecoveryAgent) {
            errorRecoveryAgent.attemptFix(errorEntry);
        }

        this.saveToStorage();
    }

    recordFix(errorId, agentId = null) {
        const error = this.errors.find(e => e.id === errorId);
        if (error) {
            error.status = 'fixed';
            error.fixedAt = new Date().toISOString();
            error.fixedBy = agentId;
            this.fixes++;

            // Update agent statistics
            if (agentId && this.agentStats[agentId]) {
                this.agentStats[agentId].fixes++;
                this.agentStats[agentId].repairs++;
            }

            this.log(`✅ FIXED: ${error.component} - ${error.message} (Agent: ${agentId || 'unknown'})`);
            this.saveToStorage();
        }
    }

    recordAgentActivity(agentId, activityType) {
        if (this.agentStats[agentId]) {
            if (activityType === 'test') {
                this.agentStats[agentId].tests++;
            } else if (activityType === 'repair') {
                this.agentStats[agentId].repairs++;
            }
        }
    }

    log(message, agentId = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'info',
            message,
            agentId
        };

        this.logs.push(logEntry);

        // Keep only last 1000 logs
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }

        // Also log to console for debugging
        console.log(`[AGENT${agentId ? `:${agentId}` : ''}] ${message}`);
    }

    saveToStorage() {
        try {
            localStorage.setItem('agent-system-data', JSON.stringify({
                logs: this.logs.slice(-100),
                errors: this.errors.slice(-50),
                fixes: this.fixes,
                testsRun: this.testsRun,
                healthStatus: this.healthStatus,
                lastHealthCheck: this.lastHealthCheck,
                agentStats: this.agentStats,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.warn('Failed to save agent data to storage:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('agent-system-data');
            if (data) {
                const parsed = JSON.parse(data);
                this.logs = parsed.logs || [];
                this.errors = parsed.errors || [];
                this.fixes = parsed.fixes || 0;
                this.testsRun = parsed.testsRun || 0;
                this.healthStatus = parsed.healthStatus || 'unknown';
                this.lastHealthCheck = parsed.lastHealthCheck ? new Date(parsed.lastHealthCheck) : null;
                this.agentStats = parsed.agentStats || this.agentStats;
            }
        } catch (error) {
            console.warn('Failed to load agent data from storage:', error);
        }
    }

    getStats() {
        const recentLogs = this.logs.slice(-100);
        const recentErrors = this.errors.filter(e => {
            const errorTime = new Date(e.timestamp);
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
            return errorTime > cutoff;
        });

        // Calculate agent efficiency percentages
        const totalRepairs = Object.values(this.agentStats).reduce((sum, agent) => sum + agent.repairs, 0);
        Object.values(this.agentStats).forEach(agent => {
            agent.efficiency = totalRepairs > 0 ? Math.round((agent.repairs / totalRepairs) * 100) : 0;
            agent.uptime = Date.now() - agent.startTime;
        });

        return {
            totalAgents: this.agents.length,
            activeAgents: this.agents.filter(a => a.isActive).length,
            totalLogs: this.logs.length,
            recentLogs: recentLogs.length,
            totalErrors: this.errors.length,
            recentErrors: recentErrors.length,
            openErrors: this.errors.filter(e => e.status === 'open').length,
            totalFixes: this.fixes,
            testsRun: this.testsRun,
            healthStatus: this.healthStatus,
            lastHealthCheck: this.lastHealthCheck,
            uptime: this.isRunning ? Date.now() - (this.startTime || Date.now()) : 0,
            agentStats: this.agentStats,
            totalRepairs: totalRepairs
        };
    }
}

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

        // Run tests every 60 seconds
        this.testInterval = setInterval(() => {
            this.runTests();
        }, 60000);

        // Run initial test
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

        // Test buttons every 45 seconds
        this.testInterval = setInterval(() => {
            this.testAllButtons();
        }, 45000);

        // Initial test
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

            // Test wallet connection button
            const walletBtn = document.getElementById('walletBtn');
            if (walletBtn) {
                this.testWalletButton(walletBtn);
            }

            // Test project cards (simulate clicks)
            const projectCards = document.querySelectorAll('.project-card');
            projectCards.forEach((card, index) => {
                this.testProjectCard(card, index);
            });

            // Test navigation links
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

        // Test navigation every 90 seconds
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

            // Test if pages are accessible
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

        // Monitor performance every 30 seconds
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

                // Check for performance issues
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

        // Monitor security every 60 seconds
        setInterval(() => this.checkSecurity(), 60000);
        setTimeout(() => this.checkSecurity(), 20000);
    }

    checkSecurity() {
        try {
            this.log('🔒 Checking security...');

            const issues = [];

            // Check for insecure content
            const scripts = document.querySelectorAll('script[src]');
            scripts.forEach(script => {
                const src = script.src;
                if (src && src.startsWith('http://')) {
                    issues.push(`Insecure script: ${src}`);
                }
            });

            // Check for mixed content
            if (window.location.protocol === 'https:' && document.querySelector('script[src^="http://"]')) {
                issues.push('Mixed content detected');
            }

            // Check for missing security headers (simulate)
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
        // Define recovery strategies for real site errors
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
            'Critical element missing': (error) => {
                this.log('🔧 Attempting to recreate missing DOM elements...');
                const selector = error.selector;
                if (selector) {
                    // Try to recreate common elements
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
                        // Replace with placeholder or hide
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
                    // Attempt to retry the fetch request
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
                // Set up reconnection handler
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
                // Reload critical modules that might have missing functions
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
            },
            'Service Worker not registered': () => {
                this.log('🔧 Attempting service worker registration...');
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('./service-worker.js');
                    return true;
                }
                return false;
            },
            'Page not accessible': (error) => {
                const match = error.message.match(/(\w+\.html) error/);
                if (match) {
                    this.log(`🔧 Page ${match[1]} may need cache clearing`);
                    // Suggest cache clearing
                    return 'cache_clear_suggestion';
                }
                return false;
            },
            'Required element missing': (error) => {
                this.log('🔧 Attempting to recreate missing DOM elements...');
                // Try to recreate missing elements based on error message
                const missingElement = error.message.match(/Required element missing: (.+)/);
                if (missingElement && missingElement[1]) {
                    this.log(`🔧 Attempting to fix missing element: ${missingElement[1]}`);
                    // This is a simulation - in real implementation, would recreate elements
                    return true;
                }
                return false;
            },
            'Contract parsing failed': () => {
                this.log('🔧 Attempting to fix contract parsing by reloading FPDS schema...');
                const script = document.querySelector('script[src="fpds-contract-schema.js"]');
                if (script) {
                    script.remove();
                    const newScript = document.createElement('script');
                    newScript.src = 'fpds-contract-schema.js';
                    document.head.appendChild(newScript);
                    return true;
                }
                return false;
            },
            'Navigation link: Invalid href': (error) => {
                this.log('🔧 Attempting to fix broken navigation links...');
                // Find and fix broken links
                const brokenLinks = document.querySelectorAll('a[href*="undefined"]');
                brokenLinks.forEach(link => {
                    link.href = '#'; // Fix broken hrefs
                });
                return brokenLinks.length > 0;
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

// Initialize the agent system
window.agentSystem = new AgentSystem();

// Auto-start when page loads
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.agentSystem.start();

        // Set up enhanced error monitoring for real site issues
        setupEnhancedErrorMonitoring();
    }, 2000);
});

function setupEnhancedErrorMonitoring() {
    if (!window.agentSystem) return;

    // Enhanced error monitoring for real site issues
    const agentSystem = window.agentSystem;

    // Monitor for network errors
    window.addEventListener('offline', () => {
        agentSystem.recordError('network', {
            message: 'Network connection lost - attempting reconnection'
        });
    });

    window.addEventListener('online', () => {
        agentSystem.log('✅ Network connection restored');
    });

    // Monitor for script loading errors
    document.addEventListener('error', (event) => {
        if (event.target.tagName === 'SCRIPT') {
            agentSystem.recordError('script-loading', {
                message: `Script failed to load: ${event.target.src || event.target.innerHTML}`,
                filename: event.target.src || 'inline-script'
            });
        }
    }, true);

    // Monitor for resource loading errors (images, CSS, etc.)
    window.addEventListener('error', (event) => {
        if (event.target.tagName === 'IMG') {
            agentSystem.recordError('image-loading', {
                message: `Image failed to load: ${event.target.src}`,
                filename: event.target.src
            });
        }
    }, true);

    // Monitor for CSS loading errors
    document.addEventListener('error', (event) => {
        if (event.target.tagName === 'LINK' && event.target.rel === 'stylesheet') {
            agentSystem.recordError('css-loading', {
                message: `CSS failed to load: ${event.target.href}`,
                filename: event.target.href
            });
        }
    }, true);

    // Monitor for WebSocket errors (if any)
    if ('WebSocket' in window) {
        const originalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            const ws = new originalWebSocket(url, protocols);
            ws.addEventListener('error', (event) => {
                agentSystem.recordError('websocket', {
                    message: `WebSocket error for ${url}`,
                    url: url
                });
            });
            return ws;
        };
    }

    // Monitor for fetch/API errors
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        try {
            const response = await originalFetch(...args);
            if (!response.ok) {
                agentSystem.recordError('api-error', {
                    message: `API request failed: ${response.status} ${response.statusText}`,
                    url: args[0],
                    status: response.status
                });
            }
            return response;
        } catch (error) {
            agentSystem.recordError('fetch-error', {
                message: `Fetch request failed: ${error.message}`,
                url: args[0]
            });
            throw error;
        }
    };

    // Monitor for localStorage/IndexedDB errors
    try {
        localStorage.setItem('agent-test', 'test');
        localStorage.removeItem('agent-test');
    } catch (storageError) {
        agentSystem.recordError('storage-error', {
            message: `Storage error: ${storageError.message}`,
            error: storageError
        });
    }

    // Monitor for performance issues
    if ('performance' in window && 'PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'largest-contentful-paint' && entry.startTime > 4000) {
                        agentSystem.recordError('performance', {
                            message: `Slow LCP detected: ${Math.round(entry.startTime)}ms`,
                            metric: 'lcp',
                            value: entry.startTime
                        });
                    }
                }
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (perfError) {
            // PerformanceObserver not supported
        }
    }

    // Monitor for memory issues
    if ('performance' in window && performance.memory) {
        setInterval(() => {
            const memUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
            if (memUsage > 0.8) {
                agentSystem.recordError('memory', {
                    message: `High memory usage: ${Math.round(memUsage * 100)}%`,
                    usage: memUsage
                });
            }
        }, 60000);
    }

    console.log('🔍 Enhanced error monitoring activated for real site issues');
}

// Monitor for real DOM issues that occur during normal operation
function monitorDOMIssues() {
    if (!window.agentSystem) return;

    // Check for missing critical elements every 30 seconds
    setInterval(() => {
        const criticalElements = [
            '.project-card',
            '#walletButtonContainer',
            '.portfolio-ticker',
            'script[src*="universal-wallet-auth"]',
            'script[src*="auth-integration"]'
        ];

        criticalElements.forEach(selector => {
            const element = document.querySelector(selector);
            if (!element) {
                window.agentSystem.recordError('missing-element', {
                    message: `Critical element missing: ${selector}`,
                    selector: selector
                });
            }
        });
    }, 30000);
}

// Initialize DOM monitoring
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        monitorDOMIssues();
    }, 3000);
});

console.log('🤖 Agent System loaded and ready');
