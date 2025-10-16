// Agent Monitoring System - Main Entry Point
// Modular agent monitoring system for better organization

// Wait for dependencies to be available (simplified since loaded in correct order)
async function waitForDependencies() {
    const dependencies = {
        'agentSystem': 'agent-core.js',
        'agentDisplay': 'agent-display.js',
        'BaseAgent': 'agent-types.js',
        'setupEnhancedErrorMonitoring': 'monitoring-systems.js'
    };

    const maxRetries = 50; // 5 seconds max wait
    let retries = 0;

    while (retries < maxRetries) {
        let allLoaded = true;

        for (const [name, script] of Object.entries(dependencies)) {
            if (typeof window[name] === 'undefined') {
                allLoaded = false;
                console.log(`⏳ Waiting for ${script} to load (${name})`);
                break;
            }
        }

        if (allLoaded) {
            console.log('✅ All agent dependencies loaded');
            return true;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }

    console.error('❌ Agent dependencies failed to load after 5 seconds');
    return false;
}

// Initialize agent system after dependencies are loaded
async function initializeAgentSystem() {
    console.log('🔄 Initializing agent system...');

    const dependenciesLoaded = await waitForDependencies();

    if (!dependenciesLoaded) {
        console.error('❌ Failed to initialize agent system - dependencies not loaded');
        return;
    }

    // All dependencies are loaded, system is ready
    console.log('✅ Agent system initialized successfully');

    // Initialize monitoring systems if available
    if (typeof window.setupEnhancedErrorMonitoring === 'function') {
        window.setupEnhancedErrorMonitoring();
        console.log('🔍 Enhanced error monitoring activated');
    }

    // Run initial tests if agent system is available
    if (typeof window.agentSystem !== 'undefined') {
        try {
            await window.agentSystem.start();
            console.log('🚀 Agent system started');
        } catch (error) {
            console.error('❌ Failed to start agent system:', error);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAgentSystem);
} else {
    initializeAgentSystem();
}

// Main initialization - now handled by modular loading
console.log('🤖 Agent System modules loaded - using modular architecture');

// Export for external use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AgentSystem, BaseAgent };
}
