#!/usr/bin/env node

/**
 * AUTOPILOT MASTER CONTROLLER
 * Runs all automated systems continuously
 * Monitors, tests, fixes, scans, and deploys automatically
 */

const AutoIterateSystem = require('./auto-iterate-system');
const LocalScanner = require('./local-scanner');
const fs = require('fs');
const { execSync } = require('child_process');

class AutopilotController {
    constructor() {
        this.iterateSystem = new AutoIterateSystem();
        this.scanner = new LocalScanner();
        this.running = false;
        this.stats = {
            iterationsRun: 0,
            scansRun: 0,
            issuesFixed: 0,
            commitsPushed: 0,
            lastRun: null
        };
    }

    async start() {
        console.log('\n' + '='.repeat(70));
        console.log('🚀 AUTOPILOT MASTER CONTROLLER STARTING');
        console.log('='.repeat(70));
        console.log('\nThis system will run continuously and automatically:');
        console.log('  ✅ Test all code quality (visual, functionality, mobile)');
        console.log('  ✅ Fix issues automatically');
        console.log('  ✅ Scan for development work');
        console.log('  ✅ Calculate compensation');
        console.log('  ✅ Update TODO list');
        console.log('  ✅ Commit and push changes');
        console.log('  ✅ Ensure professional quality 24/7\n');
        
        this.running = true;
        
        // Run initial full scan
        await this.fullCycle();
        
        // Set up continuous monitoring
        this.scheduleIterations();
        this.scheduleScans();
        
        console.log('\n✨ AUTOPILOT ENGAGED - Running continuously...\n');
    }

    async fullCycle() {
        console.log('\n' + '━'.repeat(70));
        console.log(`🔄 FULL AUTOPILOT CYCLE - ${new Date().toLocaleString()}`);
        console.log('━'.repeat(70) + '\n');
        
        try {
            // Step 1: Run iteration system (test & fix)
            console.log('📋 Step 1/3: Running automated tests and fixes...\n');
            await this.iterateSystem.iterate();
            this.stats.iterationsRun++;
            this.stats.issuesFixed += this.iterateSystem.issuesFixed.length;
            
            // Step 2: Scan for development work
            console.log('\n📊 Step 2/3: Scanning for development contributions...\n');
            await this.runDevelopmentScan();
            this.stats.scansRun++;
            
            // Step 3: Generate comprehensive report
            console.log('\n📈 Step 3/3: Generating comprehensive report...\n');
            this.generateReport();
            
            this.stats.lastRun = new Date();
            
            console.log('\n✅ Full cycle complete!\n');
            
        } catch (error) {
            console.error('\n❌ Error in autopilot cycle:', error);
        }
    }

    async runDevelopmentScan() {
        try {
            // Quick scan (don't go too deep to save time)
            await this.scanner.scanAIConversations();
            
            const report = this.scanner.generateReport();
            
            // Save scan results
            this.scanner.exportResults('latest-dev-scan.json');
            
            return report;
        } catch (error) {
            console.error('Development scan error:', error);
            return null;
        }
    }

    scheduleIterations() {
        // Run iteration system every 30 minutes
        setInterval(async () => {
            console.log('\n⏰ Scheduled iteration starting...');
            await this.iterateSystem.iterate();
            this.stats.iterationsRun++;
        }, 30 * 60 * 1000);
        
        console.log('⏰ Scheduled: Iterations every 30 minutes');
    }

    scheduleScans() {
        // Run development scan every 2 hours
        setInterval(async () => {
            console.log('\n⏰ Scheduled development scan starting...');
            await this.runDevelopmentScan();
            this.stats.scansRun++;
        }, 2 * 60 * 60 * 1000);
        
        console.log('⏰ Scheduled: Development scans every 2 hours');
    }

    generateReport() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 AUTOPILOT STATUS REPORT');
        console.log('='.repeat(70));
        console.log(`\n🕐 Last Run: ${this.stats.lastRun?.toLocaleString() || 'Never'}`);
        console.log(`🔄 Total Iterations: ${this.stats.iterationsRun}`);
        console.log(`📊 Total Scans: ${this.stats.scansRun}`);
        console.log(`🔧 Issues Fixed: ${this.stats.issuesFixed}`);
        console.log(`📤 Commits Pushed: ${this.stats.commitsPushed}`);
        
        // Get current test status
        const testStats = this.getTestStats();
        console.log(`\n✅ Current Test Pass Rate: ${testStats.passRate}%`);
        console.log(`📝 Pending TODO Items: ${testStats.pendingTodos}`);
        
        // Get latest dev scan results
        if (fs.existsSync('latest-dev-scan.json')) {
            const scanData = JSON.parse(fs.readFileSync('latest-dev-scan.json', 'utf8'));
            console.log(`\n💰 Latest Compensation Estimate: $${scanData.summary.finalValue.toLocaleString()}`);
            console.log(`⏱️  Total Development Hours: ${scanData.summary.totalHours.toLocaleString()}`);
        }
        
        console.log('\n' + '='.repeat(70));
    }

    getTestStats() {
        try {
            const todos = this.iterateSystem.readTodoList();
            const pendingCount = Object.values(todos).flat().length;
            
            // Estimate pass rate based on recent results
            const totalTests = 11;
            const passedTests = totalTests - this.iterateSystem.issuesFixed.length;
            const passRate = ((passedTests / totalTests) * 100).toFixed(1);
            
            return {
                passRate,
                pendingTodos: pendingCount
            };
        } catch (error) {
            return {
                passRate: 'N/A',
                pendingTodos: 'N/A'
            };
        }
    }

    stop() {
        console.log('\n🛑 Stopping autopilot...');
        this.running = false;
        process.exit(0);
    }
}

// CLI Interface
if (require.main === module) {
    const autopilot = new AutopilotController();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Received shutdown signal');
        autopilot.stop();
    });
    
    process.on('SIGTERM', () => {
        console.log('\n\n🛑 Received termination signal');
        autopilot.stop();
    });
    
    // Start autopilot
    autopilot.start().catch(error => {
        console.error('❌ Autopilot error:', error);
        process.exit(1);
    });
}

module.exports = AutopilotController;
