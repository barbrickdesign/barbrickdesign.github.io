// Agent Display System - UI Component for Main Hub
// Shows agent status, logs, errors, and statistics

class AgentDisplay {
    constructor() {
        this.container = null;
        this.statsContainer = null;
        this.logsContainer = null;
        this.errorsContainer = null;
        this.agentsContainer = null;
        this.isVisible = false;
        this.updateInterval = null;
    }

    initialize() {
        this.createDisplay();
        this.startAutoUpdate();
    }

    createDisplay() {
        // Create main agent display container
        this.container = document.createElement('div');
        this.container.id = 'agent-display';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 80vh;
            background: linear-gradient(135deg, rgba(0,20,40,0.95), rgba(0,40,60,0.95));
            border: 2px solid rgba(0,255,255,0.5);
            border-radius: 15px;
            padding: 20px;
            z-index: 10000;
            font-family: 'Orbitron', monospace;
            font-size: 12px;
            color: #00ffff;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            box-shadow: 0 0 30px rgba(0,255,255,0.3);
            overflow: hidden;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(0,255,255,0.3);
        `;

        const title = document.createElement('h3');
        title.textContent = '🤖 AGENT SYSTEM';
        title.style.cssText = `
            margin: 0;
            font-size: 16px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            background: linear-gradient(90deg, #00ffff, #ff00ff);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        `;

        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = '×';
        toggleBtn.style.cssText = `
            background: rgba(255,0,0,0.2);
            border: 1px solid rgba(255,0,0,0.5);
            color: #ff4444;
            border-radius: 50%;
            width: 25px;
            height: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        `;
        toggleBtn.onclick = () => this.toggle();

        header.appendChild(title);
        header.appendChild(toggleBtn);

        // Create stats section
        this.statsContainer = document.createElement('div');
        this.statsContainer.style.cssText = `
            margin-bottom: 15px;
            padding: 10px;
            background: rgba(0,255,0,0.1);
            border-radius: 8px;
            border: 1px solid rgba(0,255,0,0.3);
        `;

        // Create agents status section
        this.agentsContainer = document.createElement('div');
        this.agentsContainer.style.cssText = `
            margin-bottom: 15px;
            max-height: 150px;
            overflow-y: auto;
        `;

        // Create logs section
        this.logsContainer = document.createElement('div');
        this.logsContainer.style.cssText = `
            margin-bottom: 15px;
            max-height: 120px;
            overflow-y: auto;
            padding: 8px;
            background: rgba(0,0,0,0.3);
            border-radius: 5px;
            font-size: 11px;
        `;

        // Create errors section
        this.errorsContainer = document.createElement('div');
        this.errorsContainer.style.cssText = `
            max-height: 100px;
            overflow-y: auto;
            padding: 8px;
            background: rgba(255,0,0,0.1);
            border-radius: 5px;
            border: 1px solid rgba(255,0,0,0.3);
            font-size: 11px;
        `;

        // Assemble container
        this.container.appendChild(header);
        this.container.appendChild(this.statsContainer);
        this.container.appendChild(this.agentsContainer);
        this.container.appendChild(this.logsContainer);
        this.container.appendChild(this.errorsContainer);

        document.body.appendChild(this.container);

        // Add toggle functionality
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.toggle();
            }
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            this.container.style.transform = 'translateX(0)';
            this.updateDisplay();
        } else {
            this.container.style.transform = 'translateX(100%)';
        }
    }

    show() {
        if (!this.isVisible) {
            this.toggle();
        }
    }

    hide() {
        if (this.isVisible) {
            this.toggle();
        }
    }

    startAutoUpdate() {
        // Update display every 5 seconds
        this.updateInterval = setInterval(() => {
            if (this.isVisible && window.agentSystem) {
                this.updateDisplay();
            }
        }, 5000);
    }

    updateDisplay() {
        if (!window.agentSystem) {
            this.statsContainer.innerHTML = '<div style="color: #ff6b6b;">❌ Agent system not loaded</div>';
            return;
        }

        const stats = window.agentSystem.getStats();
        this.updateStats(stats);
        this.updateAgents(stats);
        this.updateLogs(stats);
        this.updateErrors(stats);
    }

    updateStats(stats) {
        const healthColor = stats.healthStatus === 'healthy' ? '#00ff00' :
                           stats.healthStatus === 'degraded' ? '#ffaa00' : '#ff4444';

        this.statsContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                <div style="text-align: center;">
                    <div style="font-size: 10px; color: #8addff; margin-bottom: 2px;">AGENTS</div>
                    <div style="font-size: 16px; font-weight: bold; color: #00ff00;">${stats.activeAgents}/${stats.totalAgents}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 10px; color: #8addff; margin-bottom: 2px;">HEALTH</div>
                    <div style="font-size: 16px; font-weight: bold; color: ${healthColor};">${stats.healthStatus.toUpperCase()}</div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                <div style="text-align: center;">
                    <div style="font-size: 9px; color: #8addff; margin-bottom: 2px;">TESTS</div>
                    <div style="font-size: 14px; font-weight: bold; color: #00ffff;">${stats.testsRun}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 9px; color: #8addff; margin-bottom: 2px;">ERRORS</div>
                    <div style="font-size: 14px; font-weight: bold; color: #ff4444;">${stats.openErrors}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 9px; color: #8addff; margin-bottom: 2px;">FIXES</div>
                    <div style="font-size: 14px; font-weight: bold; color: #00ff00;">${stats.totalFixes}</div>
                </div>
            </div>
        `;
    }

    updateAgents(stats) {
        if (!window.agentSystem || !window.agentSystem.agents) {
            this.agentsContainer.innerHTML = '<div style="color: #ff6b6b; font-size: 11px;">❌ No agents available</div>';
            return;
        }

        const agentsHtml = window.agentSystem.agents.map(agent => {
            const statusColor = agent.isActive ? '#00ff00' : '#ff6b6b';
            const statusIcon = agent.isActive ? '●' : '○';

            // Get agent stats
            const agentStats = stats.agentStats ? stats.agentStats[agent.id] : null;
            const repairs = agentStats ? agentStats.repairs : 0;
            const efficiency = agentStats ? agentStats.efficiency : 0;
            const uptime = agentStats ? Math.floor((Date.now() - agentStats.startTime) / 1000) : 0;

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; padding: 4px 0; border-bottom: 1px solid rgba(0,255,255,0.1);">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; margin-bottom: 2px;">
                            <span style="color: ${statusColor}; font-weight: bold; margin-right: 4px;">${statusIcon}</span>
                            <span style="font-size: 10px; font-weight: bold;">${agent.name}</span>
                        </div>
                        <div style="font-size: 9px; color: #8addff; margin-left: 12px;">
                            Repairs: ${repairs} (${efficiency}%) | Uptime: ${Math.floor(uptime/3600)}h ${Math.floor((uptime%3600)/60)}m
                        </div>
                    </div>
                    <div style="font-size: 9px; color: #8addff;">
                        ${agent.lastActivity ? new Date(agent.lastActivity).toLocaleTimeString() : 'Idle'}
                    </div>
                </div>
            `;
        }).join('');

        this.agentsContainer.innerHTML = `
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 8px; color: #00ffff;">👥 AGENT PERFORMANCE</div>
            ${agentsHtml}
        `;
    }

    updateLogs(stats) {
        if (!window.agentSystem || !window.agentSystem.logs) {
            this.logsContainer.innerHTML = '<div style="color: #8addff; font-size: 11px;">No recent logs</div>';
            return;
        }

        const recentLogs = window.agentSystem.logs.slice(-8);
        const logsHtml = recentLogs.map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            return `<div style="margin-bottom: 2px; padding: 2px 0;">
                <span style="color: #8addff; font-size: 10px;">${time}</span>
                <span style="margin-left: 6px; color: #ffffff; font-size: 10px;">${log.message}</span>
            </div>`;
        }).join('');

        this.logsContainer.innerHTML = `
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 6px; color: #00ffff;">📋 RECENT LOGS</div>
            ${logsHtml || '<div style="color: #8addff; font-size: 11px;">No recent logs</div>'}
        `;
    }

    updateErrors(stats) {
        if (!window.agentSystem || !window.agentSystem.errors) {
            this.errorsContainer.innerHTML = '<div style="color: #00ff00; font-size: 11px;">✅ No errors detected</div>';
            return;
        }

        const recentErrors = window.agentSystem.errors
            .filter(e => e.status === 'open')
            .slice(-5);

        if (recentErrors.length === 0) {
            this.errorsContainer.innerHTML = '<div style="color: #00ff00; font-size: 11px;">✅ No errors detected</div>';
            return;
        }

        const errorsHtml = recentErrors.map(error => {
            const time = new Date(error.timestamp).toLocaleTimeString();
            return `<div style="margin-bottom: 3px; padding: 3px; background: rgba(255,0,0,0.1); border-radius: 3px;">
                <div style="font-size: 10px; color: #ff6b6b; font-weight: bold;">${error.component}</div>
                <div style="font-size: 9px; color: #ffffff; margin-top: 2px;">${error.message}</div>
                <div style="font-size: 8px; color: #8addff; margin-top: 1px;">${time}</div>
            </div>`;
        }).join('');

        this.errorsContainer.innerHTML = `
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 6px; color: #ff4444;">❌ ACTIVE ERRORS (${recentErrors.length})</div>
            ${errorsHtml}
        `;
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Initialize agent display
window.agentDisplay = new AgentDisplay();

// Auto-initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.agentDisplay.initialize();
    }, 3000); // Wait for agent system to load
});

console.log('📺 Agent Display loaded and ready');
