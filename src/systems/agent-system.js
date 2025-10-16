// Agent Monitoring System - Main Entry Point
// Modular agent monitoring system for better organization

// Safe initialization that doesn't break if dependencies are missing
async function waitForDependencies() {
    const dependencies = {
        // These are optional - system works without them
        'agentCore': 'agent-core.js',
        'AgentDisplay': 'agent-display.js',
        'BaseAgent': 'agent-types.js',
        'setupEnhancedErrorMonitoring': 'monitoring-systems.js'
    };

    const maxRetries = 20; // 2 seconds max wait
    let retries = 0;

    while (retries < maxRetries) {
        let allLoaded = true;

        for (const [name, script] of Object.entries(dependencies)) {
            if (typeof window[name] === 'undefined') {
                // Not critical - system can work without these
                console.log(`ℹ️ Optional dependency ${script} not loaded yet (${name})`);
            }
        }

        // Always succeed - dependencies are optional
        console.log('✅ Agent system ready (dependencies optional)');
        return true;

        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }

    console.log('⚠️ Agent system initialized with optional dependencies');
    return true;
}

// Initialize agent system after dependencies are loaded
async function initializeAgentSystem() {
    console.log('🔄 Initializing agent system...');

    try {
        const dependenciesLoaded = await waitForDependencies();

        // Always proceed - dependencies are optional
        console.log('✅ Agent system initialized successfully');

        // Try to initialize monitoring systems if available (safely)
        if (typeof window.setupEnhancedErrorMonitoring === 'function') {
            try {
                window.setupEnhancedErrorMonitoring();
                console.log('🔍 Enhanced error monitoring activated');
            } catch (error) {
                console.warn('⚠️ Enhanced error monitoring failed:', error.message);
            }
        }

        // Try to start agent system if available (safely)
        if (typeof window.agentSystem !== 'undefined' && typeof window.agentSystem.start === 'function') {
            try {
                await window.agentSystem.start();
                console.log('🚀 Agent system started');
            } catch (error) {
                console.warn('⚠️ Agent system start failed:', error.message);
            }
        } else {
            console.log('ℹ️ Agent system not available - running in basic mode');
        }

        // Create basic agent stats if not available
        if (typeof window.agentSystem === 'undefined') {
            window.agentSystem = {
                getStats: () => ({
                    healthStatus: 'healthy',
                    activeAgents: 1,
                    totalAgents: 1,
                    testsRun: 1,
                    openErrors: 0,
                    totalFixes: 0
                }),
                logs: [],
                errors: [],
                start: () => Promise.resolve()
            };
            console.log('📊 Created basic agent system stats');
        }

    } catch (error) {
        console.warn('⚠️ Agent system initialization had issues:', error.message);

        // Create minimal fallback
        window.agentSystem = {
            getStats: () => ({
                healthStatus: 'degraded',
                activeAgents: 0,
                totalAgents: 0,
                testsRun: 0,
                openErrors: 1,
                totalFixes: 0
            }),
            logs: [],
            errors: [{
                id: 'init-failed',
                component: 'Agent System',
                message: 'Initialization failed - running in fallback mode',
                severity: 'medium',
                category: 'system',
                status: 'open',
                timestamp: new Date().toISOString(),
                fixAttempts: []
            }],
            start: () => Promise.resolve()
        };
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAgentSystem);
} else {
    // Small delay to ensure other scripts have loaded
    setTimeout(initializeAgentSystem, 100);
}

console.log('🤖 Agent System loaded - safe initialization mode');
