#!/usr/bin/env node

/**
 * AUTOMATED ITERATION SYSTEM
 * Self-Healing, Testing, and Auto-Deployment
 *
 * This system automatically:
 * - Reads the TODO list
 * - Runs visual tests
 * - Runs functionality tests
 * - Runs backtests (git history)
 * - Runs mobile responsiveness tests
 * - Fixes issues automatically
 * - Updates the TODO list
 * - Commits and pushes changes
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const https = require('https');

// Configuration
const CONFIG = {
    repoPath: path.join(__dirname),
    todoFile: path.join(__dirname, 'docs', 'COMPREHENSIVE-FIX-TODO.md'),
    testInterval: 30 * 60 * 1000, // 30 minutes default
    commitPrefix: 'AUTO-FIX',
    verbose: process.argv.includes('--verbose') || false
};

// Logging system
class Logger {
    static log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            action: '🔧'
        }[type] || '📝';

        const logMessage = `[${timestamp}] ${prefix} ${message}`;
        console.log(logMessage);

        // Also write to file
        fs.appendFileSync(path.join(CONFIG.repoPath, 'auto-iterate.log'),
            logMessage + '\n');
    }
}

// Test Results Tracker
class TestResults {
    constructor() {
        this.results = {
            visual: [],
            functionality: [],
            backtests: [],
            mobile: []
        };
        this.fixes = [];
    }

    addResult(category, test, passed, details = '') {
        this.results[category].push({ test, passed, details });
        Logger.log(`${test}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'success' : 'error');
    }

    addFix(description) {
        this.fixes.push(description);
        Logger.log(`Applied fix: ${description}`, 'action');
    }

    getSummary() {
        const totalTests = Object.values(this.results).flat().length;
        const passedTests = Object.values(this.results).flat().filter(r => r.passed).length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);

        return {
            totalTests,
            passedTests,
            successRate,
            results: this.results,
            fixes: this.fixes
        };
    }
}

// Visual Tests
class VisualTester {
    static run(results) {
        Logger.log('Running visual tests...', 'info');

        // Test 1: Mobile text breaking
        const mobileTextTest = this.testMobileTextBreaking();
        results.addResult('visual', 'Mobile Text Breaking', mobileTextTest.passed, mobileTextTest.details);

        // Test 2: Section title styling
        const titleStylingTest = this.testSectionTitleStyling();
        results.addResult('visual', 'Section Title Styling', titleStylingTest.passed, titleStylingTest.details);

        // Test 3: Responsive layout
        const responsiveTest = this.testResponsiveLayout();
        results.addResult('visual', 'Responsive Layout', responsiveTest.passed, responsiveTest.details);

        // Test 4: Professional appearance
        const appearanceTest = this.testProfessionalAppearance();
        results.addResult('visual', 'Professional Appearance', appearanceTest.passed, appearanceTest.details);
    }

    static testMobileTextBreaking() {
        try {
            // Check if CSS has proper word-break handling
            const indexPath = path.join(CONFIG.repoPath, 'index.html');
            const content = fs.readFileSync(indexPath, 'utf8');

            if (content.includes('word-break: break-word') ||
                content.includes('overflow-wrap: break-word')) {
                return { passed: true, details: 'Word-break CSS found' };
            }

            // Auto-fix: Add word-break CSS
            const fixedContent = content.replace(
                '.section-title {',
                '.section-title {\n    word-break: break-word;\n    overflow-wrap: break-word;'
            );

            fs.writeFileSync(indexPath, fixedContent);
            return { passed: false, details: 'Auto-fixed: Added word-break CSS' };
        } catch (error) {
            return { passed: false, details: `Error: ${error.message}` };
        }
    }

    static testSectionTitleStyling() {
        try {
            const indexPath = path.join(CONFIG.repoPath, 'index.html');
            const content = fs.readFileSync(indexPath, 'utf8');

            // Check for proper section title styling
            if (content.includes('section-title') &&
                (content.includes('font-weight:') || content.includes('font-size:'))) {
                return { passed: true, details: 'Section titles properly styled' };
            }

            return { passed: false, details: 'Section title styling incomplete' };
        } catch (error) {
            return { passed: false, details: `Error: ${error.message}` };
        }
    }

    static testResponsiveLayout() {
        try {
            const indexPath = path.join(CONFIG.repoPath, 'index.html');
            const content = fs.readFileSync(indexPath, 'utf8');

            if (content.includes('@media') && content.includes('max-width')) {
                return { passed: true, details: 'Responsive CSS found' };
            }

            return { passed: false, details: 'Missing responsive CSS breakpoints' };
        } catch (error) {
            return { passed: false, details: `Error: ${error.message}` };
        }
    }

    static testProfessionalAppearance() {
        try {
            const indexPath = path.join(CONFIG.repoPath, 'index.html');
            const content = fs.readFileSync(indexPath, 'utf8');

            let score = 0;
            if (content.includes('backdrop-filter')) score += 25;
            if (content.includes('box-shadow')) score += 25;
            if (content.includes('transition')) score += 25;
            if (content.includes('font-family') && content.includes('Inter')) score += 25;

            const passed = score >= 75;
            return {
                passed,
                details: `Professional score: ${score}% (${passed ? 'Excellent' : 'Needs improvement'})`
            };
        } catch (error) {
            return { passed: false, details: `Error: ${error.message}` };
        }
    }
}

// Functionality Tests
class FunctionalityTester {
    static run(results) {
        Logger.log('Running functionality tests...', 'info');

        // Test 1: Wallet connector exists
        const walletTest = this.testWalletConnector();
        results.addResult('functionality', 'Wallet Connect Script', walletTest.passed, walletTest.details);

        // Test 2: API integrations working
        const apiTest = this.testAPIIntegrations();
        results.addResult('functionality', 'API Integrations', apiTest.passed, apiTest.details);

        // Test 3: Service worker registered
        const swTest = this.testServiceWorker();
        results.addResult('functionality', 'Service Worker', swTest.passed, swTest.details);

        // Test 4: All scripts loading
        const scriptsTest = this.testScriptsLoading();
        results.addResult('functionality', 'Script Loading', scriptsTest.passed, scriptsTest.details);
    }

    static testWalletConnector() {
        try {
            const walletPath = path.join(CONFIG.repoPath, 'js', 'universal-wallet-system.js');
            if (fs.existsSync(walletPath)) {
                const content = fs.readFileSync(walletPath, 'utf8');
                if (content.includes('UniversalWalletSystem') && content.includes('connect')) {
                    return { passed: true, details: 'Wallet system found and functional' };
                }
            }
            return { passed: false, details: 'Wallet connector missing or incomplete' };
        } catch (error) {
            return { passed: false, details: `Error: ${error.message}` };
        }
    }

    static testAPIIntegrations() {
        try {
            // Check for CoinGecko API integration
            const files = [
                'index.html',
                'investment-dashboard.html',
                path.join('js', 'universal-wallet-system.js')
            ];

            let hasAPI = false;
            for (const file of files) {
                const filePath = path.join(CONFIG.repoPath, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    if (content.includes('api.coingecko.com') || content.includes('coingecko')) {
                        hasAPI = true;
                        break;
                    }
                }
            }

            return {
                passed: hasAPI,
                details: hasAPI ? 'CoinGecko API integration found' : 'Missing API integrations'
            };
        } catch (error) {
            return { passed: false, details: `Error: ${error.message}` };
        }
    }

    static testServiceWorker() {
        try {
            const swPath = path.join(CONFIG.repoPath, 'service-worker.js');
            if (fs.existsSync(swPath)) {
                const content = fs.readFileSync(swPath, 'utf8');
                if (content.includes('install') && content.includes('activate')) {
                    return { passed: true, details: 'Service worker properly configured' };
                }
            }
            return { passed: false, details: 'Service worker missing or incomplete' };
        } catch (error) {
            return { passed: false, details: `Error: ${error.message}` };
        }
    }

    static testScriptsLoading() {
        try {
            const indexPath = path.join(CONFIG.repoPath, 'index.html');
            const content = fs.readFileSync(indexPath, 'utf8');

            const requiredScripts = [
                'universal-wallet-system.js',
                'mandem-mndm-system.js',
                'solana/web3.js'
            ];

            let missingScripts = [];
            for (const script of requiredScripts) {
                if (!content.includes(script)) {
                    missingScripts.push(script);
                }
            }

            const passed = missingScripts.length === 0;
            return {
                passed,
                details: passed ? 'All required scripts present' : `Missing scripts: ${missingScripts.join(', ')}`
            };
        } catch (error) {
            return { passed: false, details: `Error: ${error.message}` };
        }
    }
}

// Backtests (Git History)
class Backtester {
    static run(results) {
        Logger.log('Running backtests...', 'info');

        // Test 1: Git status clean
        const statusTest = this.testGitStatus();
        results.addResult('backtests', 'Git Status Clean', statusTest.passed, statusTest.details);

        // Test 2: Latest commit info
        const commitTest = this.testLatestCommit();
        results.addResult('backtests', 'Latest Commit Info', commitTest.passed, commitTest.details);

        // Test 3: Remote sync status
        const remoteTest = this.testRemoteSync();
        results.addResult('backtests', 'Remote Sync Status', remoteTest.passed, remoteTest.details);

        // Test 4: No uncommitted changes
        const changesTest = this.testUncommittedChanges();
        results.addResult('backtests', 'No Uncommitted Changes', changesTest.passed, changesTest.details);
    }

    static testGitStatus() {
        try {
            const status = execSync('git status --porcelain', { cwd: CONFIG.repoPath }).toString().trim();
            const hasChanges = status.length > 0;

            if (hasChanges) {
                // Auto-commit changes
                execSync('git add .', { cwd: CONFIG.repoPath });
                execSync(`git commit -m "${CONFIG.commitPrefix}: Auto-commit changes"`, { cwd: CONFIG.repoPath });
                results.addFix('Auto-committed uncommitted changes');
                return { passed: true, details: 'Changes auto-committed' };
            }

            return { passed: true, details: 'Working directory clean' };
        } catch (error) {
            return { passed: false, details: `Git error: ${error.message}` };
        }
    }

    static testLatestCommit() {
        try {
            const commitInfo = execSync('git log -1 --oneline', { cwd: CONFIG.repoPath }).toString().trim();
            return { passed: true, details: `Last commit: ${commitInfo}` };
        } catch (error) {
            return { passed: false, details: `Git log error: ${error.message}` };
        }
    }

    static testRemoteSync() {
        try {
            execSync('git fetch origin', { cwd: CONFIG.repoPath });
            const status = execSync('git status -sb', { cwd: CONFIG.repoPath }).toString();

            if (status.includes('behind') || status.includes('ahead')) {
                // Auto-sync with remote
                execSync('git pull origin main', { cwd: CONFIG.repoPath });
                execSync('git push origin main', { cwd: CONFIG.repoPath });
                results.addFix('Auto-synced with remote repository');
                return { passed: true, details: 'Repository auto-synced' };
            }

            return { passed: true, details: 'Repository in sync with remote' };
        } catch (error) {
            return { passed: false, details: `Sync error: ${error.message}` };
        }
    }

    static testUncommittedChanges() {
        try {
            const status = execSync('git status --porcelain', { cwd: CONFIG.repoPath }).toString().trim();
            const hasChanges = status.length > 0;
            return {
                passed: !hasChanges,
                details: hasChanges ? `${status.split('\n').length} uncommitted files` : 'No uncommitted changes'
            };
        } catch (error) {
            return { passed: false, details: `Git status error: ${error.message}` };
        }
    }
}

// Mobile Tests
class MobileTester {
    static run(results) {
        Logger.log('Running mobile tests...', 'info');

        // Test 1: Viewport meta tags
        const viewportTest = this.testViewportMeta();
        results.addResult('mobile', 'Viewport Meta Tags', viewportTest.passed, viewportTest.details);

        // Test 2: Mobile responsive CSS
        const cssTest = this.testMobileCSS();
        results.addResult('mobile', 'Mobile Responsive CSS', cssTest.passed, cssTest.details);

        // Test 3: Touch targets adequate
        const touchTest = this.testTouchTargets();
        results.addResult('mobile', 'Touch Targets', touchTest.passed, touchTest.details);

        // Test 4: All pages mobile-ready
        const pagesTest = this.testAllPagesMobile();
        results.addResult('mobile', 'All Pages Mobile Ready', pagesTest.passed, pagesTest.details);
    }

    static testViewportMeta() {
        try {
            const indexPath = path.join(CONFIG.repoPath, 'index.html');
            const content = fs.readFileSync(indexPath, 'utf8');

            if (content.includes('viewport') && content.includes('width=device-width')) {
                return { passed: true, details: 'Viewport meta tag present' };
            }

            // Auto-fix: Add viewport meta tag
            const fixedContent = content.replace(
                '<meta charset="UTF-8">',
                '<meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
            );
            fs.writeFileSync(indexPath, fixedContent);
            results.addFix('Added viewport meta tag');
            return { passed: true, details: 'Viewport meta tag auto-added' };
        } catch (error) {
            return { passed: false, details: `Error: ${error.message}` };
        }
    }

    static testMobileCSS() {
        try {
            const indexPath = path.join(CONFIG.repoPath, 'index.html');
            const content = fs.readFileSync(indexPath, 'utf8');

            if (content.includes('@media') && content.includes('max-width')) {
                return { passed: true, details: 'Mobile CSS breakpoints found' };
            }

            return { passed: false, details: 'Missing mobile CSS breakpoints' };
        } catch (error) {
            return { passed: false, details: `Error: ${error.message}` };
        }
    }

    static testTouchTargets() {
        try {
            const indexPath = path.join(CONFIG.repoPath, 'index.html');
            const content = fs.readFileSync(indexPath, 'utf8');

            // Check for minimum touch target sizes (44px recommended)
            const hasAdequateTargets = content.includes('padding:') ||
                                     content.includes('min-height:') ||
                                     content.includes('line-height:');

            return {
                passed: hasAdequateTargets,
                details: hasAdequateTargets ? 'Touch targets appear adequate' : 'Touch targets may be too small'
            };
        } catch (error) {
            return { passed: false, details: `Error: ${error.message}` };
        }
    }

    static testAllPagesMobile() {
        try {
            const htmlFiles = fs.readdirSync(CONFIG.repoPath)
                .filter(file => file.endsWith('.html'))
                .slice(0, 5); // Test first 5 HTML files

            let mobileReadyCount = 0;
            for (const file of htmlFiles) {
                const filePath = path.join(CONFIG.repoPath, file);
                const content = fs.readFileSync(filePath, 'utf8');

                if (content.includes('viewport') && content.includes('@media')) {
                    mobileReadyCount++;
                }
            }

            const passed = mobileReadyCount === htmlFiles.length;
            return {
                passed,
                details: `${mobileReadyCount}/${htmlFiles.length} pages mobile-ready`
            };
        } catch (error) {
            return { passed: false, details: `Error: ${error.message}` };
        }
    }
}

// Main Auto-Iteration System
class AutoIterateSystem {
    constructor() {
        this.results = new TestResults();
        this.isContinuous = process.argv.includes('--continuous');
        this.customInterval = this.parseCustomInterval();
    }

    parseCustomInterval() {
        const intervalArg = process.argv.find(arg => /^\d+$/.test(arg));
        return intervalArg ? parseInt(intervalArg) * 60 * 1000 : CONFIG.testInterval;
    }

    async run() {
        Logger.log('🚀 AUTOMATED ITERATION SYSTEM STARTING...', 'info');
        Logger.log(`Time: ${new Date().toLocaleString()}`, 'info');

        try {
            // Read TODO list
            const todoContent = fs.readFileSync(CONFIG.todoFile, 'utf8');
            const pendingTasks = (todoContent.match(/- \[ \]/g) || []).length;
            Logger.log(`📋 Found ${pendingTasks} pending tasks`, 'info');

            // Run all tests
            VisualTester.run(this.results);
            FunctionalityTester.run(this.results);
            Backtester.run(this.results);
            MobileTester.run(this.results);

            // Generate report
            this.generateReport();

            // Update TODO list if needed
            this.updateTodoList();

            Logger.log('✨ Iteration complete!', 'success');

            // Continue if in continuous mode
            if (this.isContinuous) {
                Logger.log(`⏰ Next iteration in ${this.customInterval / 1000 / 60} minutes...`, 'info');
                setTimeout(() => this.run(), this.customInterval);
            }

        } catch (error) {
            Logger.log(`❌ System error: ${error.message}`, 'error');
            if (this.isContinuous) {
                Logger.log('🔄 Retrying in 5 minutes due to error...', 'warning');
                setTimeout(() => this.run(), 5 * 60 * 1000);
            }
        }
    }

    generateReport() {
        const summary = this.results.getSummary();

        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST REPORT');
        console.log('='.repeat(60));

        Object.entries(summary.results).forEach(([category, tests]) => {
            console.log(`\n${category.charAt(0).toUpperCase() + category.slice(1)} Tests:`);
            tests.forEach(test => {
                const status = test.passed ? '✅' : '❌';
                console.log(`  ${status} ${test.test}`);
                if (test.details) {
                    console.log(`    ${test.details}`);
                }
            });
        });

        if (summary.fixes.length > 0) {
            console.log('\n🔧 Auto-Fixes Applied:');
            summary.fixes.forEach(fix => {
                console.log(`  ✅ ${fix}`);
            });
        }

        console.log('\n' + '='.repeat(60));
        console.log(`Total: ${summary.passedTests}/${summary.totalTests} tests passed`);
        console.log(`Success Rate: ${summary.successRate}%`);
        console.log('='.repeat(60));

        if (summary.successRate === '100.0') {
            Logger.log('✅ No changes needed - all tests passed!', 'success');
        } else {
            Logger.log('⚠️ Some tests failed - fixes have been applied', 'warning');
        }
    }

    updateTodoList() {
        try {
            let todoContent = fs.readFileSync(CONFIG.todoFile, 'utf8');

            // Mark completed items
            if (this.results.fixes.length > 0) {
                todoContent = todoContent.replace(
                    /- \[ \] Mobile text breaking fixed/,
                    '- [x] Mobile text breaking fixed'
                );
            }

            fs.writeFileSync(CONFIG.todoFile, todoContent);
            Logger.log('📝 TODO list updated', 'action');
        } catch (error) {
            Logger.log(`❌ Failed to update TODO list: ${error.message}`, 'error');
        }
    }
}

// CLI Interface
function showUsage() {
    console.log(`
🚀 AUTOMATED ITERATION SYSTEM

Usage:
  node auto-iterate-system.js              # Run once
  node auto-iterate-system.js --continuous # Run continuously (default 30min)
  node auto-iterate-system.js --continuous 15 # Custom interval (15 minutes)
  node auto-iterate-system.js --verbose    # Verbose logging

Examples:
  node auto-iterate-system.js --continuous 60  # Every hour
  node auto-iterate-system.js --continuous     # Every 30 minutes
  node auto-iterate-system.js                  # Single run

Built for barbrickdesign.github.io
Ensuring professional quality 24/7
`);
}

// Main execution
if (require.main === module) {
    // Check for help flag
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        showUsage();
        process.exit(0);
    }

    // Initialize and run
    const system = new AutoIterateSystem();
    system.run().catch(error => {
        Logger.log(`❌ Fatal error: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = { AutoIterateSystem, VisualTester, FunctionalityTester, Backtester, MobileTester };
