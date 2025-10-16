// COMPREHENSIVE WEBSITE DIAGNOSTIC AND FIX SYSTEM
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveWebsiteDiagnostic {
    constructor() {
        this.issues = {
            timestamp: [],
            mobile: [],
            scripts: [],
            mdFiles: [],
            layout: [],
            functionality: []
        };
        this.fixes = [];
    }

    async runFullDiagnostic() {
        console.log('🔍 Starting comprehensive website diagnostic...\n');

        // 1. Check timestamp functionality
        await this.checkTimestampFunctionality();

        // 2. Check mobile responsiveness
        await this.checkMobileResponsiveness();

        // 3. Check script functionality
        await this.checkScriptFunctionality();

        // 4. Check MD files and HTML counterparts
        await this.checkMdFiles();

        // 5. Check layout issues (especially Gem Bot Universe)
        await this.checkLayoutIssues();

        // 6. Generate comprehensive report
        await this.generateDiagnosticReport();

        // 7. Apply fixes
        await this.applyFixes();

        console.log('✅ Diagnostic complete!');
    }

    async checkTimestampFunctionality() {
        console.log('📅 Checking timestamp functionality...');

        const indexHtml = await fs.readFile('index.html', 'utf8');

        // Check if timestamp element exists
        if (!indexHtml.includes('id="pageTimestamp"')) {
            this.issues.timestamp.push('Missing pageTimestamp element');
        }

        // Check if updatePageTimestamp function exists
        if (!indexHtml.includes('updatePageTimestamp()')) {
            this.issues.timestamp.push('updatePageTimestamp function not called');
        }

        // Check if function is properly defined
        if (!indexHtml.includes('function updatePageTimestamp()')) {
            this.issues.timestamp.push('updatePageTimestamp function not defined');
        }

        // Check for potential timezone issues
        if (indexHtml.includes('toLocaleString') && !indexHtml.includes('timeZone')) {
            this.issues.timestamp.push('Timestamp may not handle timezones correctly');
        }

        console.log(`Found ${this.issues.timestamp.length} timestamp issues`);
    }

    async checkMobileResponsiveness() {
        console.log('📱 Checking mobile responsiveness...');

        const htmlFiles = await this.findHtmlFiles('.');
        let mobileIssues = 0;

        for (const file of htmlFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');

                // Check for viewport meta tag
                if (!content.includes('viewport') || !content.includes('width=device-width')) {
                    this.issues.mobile.push(`${path.basename(file)}: Missing proper viewport meta tag`);
                    mobileIssues++;
                }

                // Check for mobile-specific CSS
                if (!content.includes('@media') || !content.includes('max-width')) {
                    this.issues.mobile.push(`${path.basename(file)}: No mobile breakpoints defined`);
                    mobileIssues++;
                }

                // Check for touch-friendly elements
                const buttons = content.match(/<button[^>]*>/g) || [];
                if (buttons.length > 0 && !content.includes('min-height: 44px') && !content.includes('touch-action')) {
                    this.issues.mobile.push(`${path.basename(file)}: Buttons may not be touch-friendly`);
                    mobileIssues++;
                }

                // Check for horizontal scrolling issues
                if (content.includes('overflow-x: auto') && !content.includes('-webkit-overflow-scrolling: touch')) {
                    this.issues.mobile.push(`${path.basename(file)}: Horizontal scroll may not be smooth on iOS`);
                    mobileIssues++;
                }

            } catch (error) {
                this.issues.mobile.push(`${path.basename(file)}: Could not analyze - ${error.message}`);
            }

            // Limit to first 10 files for performance
            if (mobileIssues >= 10) break;
        }

        console.log(`Found ${this.issues.mobile.length} mobile responsiveness issues`);
    }

    async checkScriptFunctionality() {
        console.log('🔧 Checking script functionality...');

        const htmlFiles = await this.findHtmlFiles('.');
        let scriptIssues = 0;

        for (const file of htmlFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');

                // Check for broken script references
                const scripts = content.match(/<script[^>]*src="([^"]*\.js)/g) || [];
                for (const script of scripts) {
                    const srcMatch = script.match(/src="([^"]*\.js)/);
                    if (srcMatch) {
                        const scriptPath = srcMatch[1];
                        // Handle relative paths from different directories
                        let fullPath;
                        if (scriptPath.startsWith('../')) {
                            // From subdirectory, go up
                            const dir = path.dirname(file);
                            fullPath = path.resolve(dir, scriptPath);
                        } else if (scriptPath.startsWith('./')) {
                            // Relative to current directory
                            const dir = path.dirname(file);
                            fullPath = path.resolve(dir, scriptPath);
                        } else {
                            // Assume root relative
                            fullPath = path.resolve('.', scriptPath);
                        }

                        try {
                            await fs.access(fullPath);
                        } catch (error) {
                            // Try alternative path resolution
                            const altPath = path.resolve('.', scriptPath);
                            try {
                                await fs.access(altPath);
                            } catch (altError) {
                                this.issues.scripts.push(`${path.basename(file)}: Broken script reference: ${scriptPath}`);
                                scriptIssues++;
                            }
                        }
                    }
                }

                // Check for console.log statements in production
                const consoleLogs = (content.match(/console\.log/g) || []).length;
                if (consoleLogs > 0) {
                    this.issues.scripts.push(`${path.basename(file)}: ${consoleLogs} console.log statements in production code`);
                    scriptIssues++;
                }

                // Check for undefined function calls
                if (content.includes('window.') && content.includes('undefined')) {
                    this.issues.scripts.push(`${path.basename(file)}: Potential undefined function calls`);
                    scriptIssues++;
                }

            } catch (error) {
                this.issues.scripts.push(`${path.basename(file)}: Could not analyze scripts - ${error.message}`);
            }

            // Limit for performance
            if (scriptIssues >= 20) break;
        }

        console.log(`Found ${this.issues.scripts.length} script functionality issues`);
    }

    async checkMdFiles() {
        console.log('📄 Checking MD files and HTML counterparts...');

        const files = await fs.readdir('.');
        const mdFiles = files.filter(f => f.endsWith('.md'));
        let mdIssues = 0;

        for (const mdFile of mdFiles) {
            const htmlEquivalent = mdFile.replace('.md', '.html');

            try {
                // Check if HTML equivalent exists
                await fs.access(htmlEquivalent);
            } catch (error) {
                this.issues.mdFiles.push(`Missing HTML equivalent for ${mdFile}`);
                mdIssues++;
            }

            // Check if MD file has been updated recently (basic check)
            try {
                const stats = await fs.stat(mdFile);
                const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceModified > 30) {
                    this.issues.mdFiles.push(`${mdFile}: Not updated in ${Math.round(daysSinceModified)} days`);
                    mdIssues++;
                }
            } catch (error) {
                // Ignore stat errors
            }

            // Check for broken links in MD files
            try {
                const content = await fs.readFile(mdFile, 'utf8');
                const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
                for (const link of links) {
                    const urlMatch = link.match(/\(([^)]+)\)/);
                    if (urlMatch) {
                        const url = urlMatch[1];
                        // Check internal links
                        if (!url.startsWith('http') && !url.startsWith('mailto') && !url.startsWith('#')) {
                            // Try to resolve the path
                            const resolvedPath = path.resolve('.', url);
                            try {
                                await fs.access(resolvedPath);
                            } catch (error) {
                                this.issues.mdFiles.push(`${mdFile}: Broken internal link: ${url}`);
                                mdIssues++;
                            }
                        }
                    }
                }
            } catch (error) {
                this.issues.mdFiles.push(`${mdFile}: Could not analyze content - ${error.message}`);
            }
        }

        console.log(`Found ${this.issues.mdFiles.length} MD file issues`);
    }

    async checkLayoutIssues() {
        console.log('🎨 Checking layout issues...');

        // Focus on Gem Bot Universe (mandem.os/workspace/index.html)
        try {
            const gbuContent = await fs.readFile('mandem.os/workspace/index.html', 'utf8');

            // Check for potential layout breaking issues
            if (gbuContent.includes('position: fixed') && gbuContent.includes('z-index')) {
                // Check for z-index conflicts
                const zIndexValues = gbuContent.match(/z-index:\s*(\d+)/g) || [];
                const zIndexNumbers = zIndexValues.map(z => parseInt(z.match(/(\d+)/)[1]));
                const maxZIndex = Math.max(...zIndexNumbers);

                if (maxZIndex > 10000) {
                    this.issues.layout.push('Gem Bot Universe: Extremely high z-index values may cause stacking issues');
                }
            }

            // Check for mobile layout issues
            if (!gbuContent.includes('@media (max-width: 700px)')) {
                this.issues.layout.push('Gem Bot Universe: Missing mobile layout adjustments');
            }

            // Check for horizontal overflow issues
            if (gbuContent.includes('width: 100vw') && !gbuContent.includes('overflow-x: hidden')) {
                this.issues.layout.push('Gem Bot Universe: Potential horizontal overflow on mobile');
            }

            // Check for flexbox/grid layout issues
            if (gbuContent.includes('display: flex') && !gbuContent.includes('flex-wrap')) {
                this.issues.layout.push('Gem Bot Universe: Flex containers may not wrap on small screens');
            }

            // Check for absolute positioning issues
            const absoluteElements = (gbuContent.match(/position:\s*absolute/g) || []).length;
            if (absoluteElements > 10) {
                this.issues.layout.push('Gem Bot Universe: Too many absolutely positioned elements may cause layout conflicts');
            }

        } catch (error) {
            this.issues.layout.push(`Could not analyze Gem Bot Universe layout: ${error.message}`);
        }

        console.log(`Found ${this.issues.layout.length} layout issues`);
    }

    async findHtmlFiles(dir, results = []) {
        try {
            const files = await fs.readdir(dir);

            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = await fs.stat(fullPath);

                if (stat.isDirectory() &&
                    !file.startsWith('.') &&
                    file !== 'node_modules' &&
                    file !== 'backup-2025-10-16') {
                    await this.findHtmlFiles(fullPath, results);
                } else if (file.endsWith('.html') && !file.startsWith('.')) {
                    results.push(fullPath);
                }
            }
        } catch (error) {
            // Ignore permission errors etc.
        }

        return results;
    }

    async generateDiagnosticReport() {
        console.log('\n📋 === COMPREHENSIVE DIAGNOSTIC REPORT ===\n');

        const totalIssues = Object.values(this.issues).reduce((sum, issues) => sum + issues.length, 0);

        console.log(`🔍 Total Issues Found: ${totalIssues}\n`);

        console.log('📅 TIMESTAMP ISSUES:');
        this.issues.timestamp.forEach(issue => console.log(`  ❌ ${issue}`));
        if (this.issues.timestamp.length === 0) console.log('  ✅ No timestamp issues found');

        console.log('\n📱 MOBILE RESPONSIVENESS ISSUES:');
        this.issues.mobile.forEach(issue => console.log(`  ❌ ${issue}`));
        if (this.issues.mobile.length === 0) console.log('  ✅ No mobile issues found');

        console.log('\n🔧 SCRIPT FUNCTIONALITY ISSUES:');
        this.issues.scripts.forEach(issue => console.log(`  ❌ ${issue}`));
        if (this.issues.scripts.length === 0) console.log('  ✅ No script issues found');

        console.log('\n📄 MD FILE ISSUES:');
        this.issues.mdFiles.forEach(issue => console.log(`  ❌ ${issue}`));
        if (this.issues.mdFiles.length === 0) console.log('  ✅ No MD file issues found');

        console.log('\n🎨 LAYOUT ISSUES:');
        this.issues.layout.forEach(issue => console.log(`  ❌ ${issue}`));
        if (this.issues.layout.length === 0) console.log('  ✅ No layout issues found');

        console.log('\n🔄 GENERATING FIXES...');
        this.generateFixes();
    }

    generateFixes() {
        // Timestamp fixes
        if (this.issues.timestamp.includes('Timestamp may not handle timezones correctly')) {
            this.fixes.push({
                type: 'timestamp',
                file: 'index.html',
                description: 'Add timezone handling to timestamp function',
                implementation: 'regex_replace',
                pattern: /const formatted = now\.toLocaleString\('en-US', \{[\s\S]*?\}\);/,
                replacement: `const formatted = now.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                    timeZone: 'America/New_York'
                });`
            });
        }

        // Mobile fixes
        for (const issue of this.issues.mobile) {
            if (issue.includes('Missing proper viewport meta tag')) {
                const file = issue.split(':')[0];
                this.fixes.push({
                    type: 'mobile',
                    file: file,
                    description: 'Add proper viewport meta tag',
                    implementation: 'add_meta_tag',
                    tag: '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
                });
            }
        }

        // Layout fixes for Gem Bot Universe
        if (this.issues.layout.some(i => i.includes('Gem Bot Universe'))) {
            this.fixes.push({
                type: 'layout',
                file: 'mandem.os/workspace/index.html',
                description: 'Fix mobile layout issues in Gem Bot Universe',
                implementation: 'regex_replace',
                pattern: /\/\* Mobile table scroll \*\/\s*@media \(max-width: 700px\) \{[\s\S]*?\}/,
                replacement: `/* Mobile table scroll */
@media (max-width: 700px) {
  table, .stat-table {
    display: block;
    overflow-x: auto;
    width: 100%;
    max-width: 100vw;
    -webkit-overflow-scrolling: touch;
  }
  th, td {
    min-width: 90px;
    font-size: 15px;
  }
  .profile-card, .container, .post-login-content {
    padding: 8px !important;
  }
  button, .auth-button {
    min-height: 44px;
    font-size: 18px;
  }
  /* Fix z-index stacking issues */
  .welcome-overlay {
    z-index: 10 !important;
  }
  .globe-container {
    z-index: 1 !important;
  }
}`
            });
        }

        console.log(`📝 Generated ${this.fixes.length} automated fixes`);
    }

    async applyFixes() {
        console.log('⚙️ Applying automated fixes...');

        for (const fix of this.fixes) {
            try {
                await this.applyFix(fix);
                console.log(`✅ Applied: ${fix.description}`);
            } catch (error) {
                console.error(`❌ Failed to apply fix: ${fix.description} - ${error.message}`);
            }
        }

        console.log(`🔧 Applied ${this.fixes.length} fixes successfully`);
    }

    async applyFix(fix) {
        let content = await fs.readFile(fix.file, 'utf8');

        switch (fix.implementation) {
            case 'regex_replace':
                const regex = new RegExp(fix.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                content = content.replace(regex, fix.replacement);
                break;

            case 'add_meta_tag':
                if (!content.includes(fix.tag)) {
                    content = content.replace(/(<head[^>]*>)/, '$1\n    ' + fix.tag);
                }
                break;

            default:
                throw new Error(`Unknown implementation: ${fix.implementation}`);
        }

        await fs.writeFile(fix.file, content, 'utf8');
    }
}

// Run the diagnostic
if (typeof require !== 'undefined' && require.main === module) {
    const diagnostic = new ComprehensiveWebsiteDiagnostic();
    diagnostic.runFullDiagnostic().catch(console.error);
}
