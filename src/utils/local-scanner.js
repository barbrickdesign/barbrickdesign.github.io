/**
 * LOCAL PC SCANNER FOR DEVELOPMENT WORK
 * Scans user's computer for all development contributions
 * Includes: Git repos, AI conversation logs, code files, projects
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

class LocalScanner {
    constructor() {
        this.homeDir = os.homedir();
        this.results = {
            gitRepos: [],
            codeFiles: [],
            aiConversations: [],
            projects: [],
            totalDevHours: 0,
            estimatedValue: 0,
            dataProvenance: {
                sources: [],
                validationMethod: 'multi-source-cross-reference',
                calculatedAt: new Date().toISOString(),
                architect: {
                    role: 'Grand Architect',
                    recognized: false,
                    complexity: 0
                }
            }
        };
        this.extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.rs', '.go', '.rb', '.php', '.cs', '.swift'];
        
        // Architect-level rates based on system complexity and integration work
        this.rates = {
            'junior-developer': 75,
            'mid-developer': 100,
            'senior-developer': 150,
            'lead-architect': 200,
            'system-architect': 250,
            'grand-architect': 350  // For multi-system integration & design
        };
    }

    // Scan for all git repositories
    async scanGitRepos(directory = this.homeDir, maxDepth = 3) {
        console.log(`🔍 Scanning for git repositories in ${directory}...`);
        
        try {
            const found = [];
            this.findGitRepos(directory, found, 0, maxDepth);
            
            console.log(`✅ Found ${found.length} git repositories`);
            
            // Analyze each repo
            for (const repoPath of found) {
                try {
                    const analysis = await this.analyzeGitRepo(repoPath);
                    this.results.gitRepos.push(analysis);
                } catch (error) {
                    console.log(`  ⚠️ Could not analyze ${repoPath}`);
                }
            }
            
            return found;
        } catch (error) {
            console.error('Git scan error:', error.message);
            return [];
        }
    }

    findGitRepos(dir, found, depth, maxDepth) {
        if (depth > maxDepth) return;
        
        // SECURITY: Validate directory path to prevent traversal attacks
        const resolvedDir = path.resolve(dir);
        const homeDir = path.resolve(this.homeDir);
        if (!resolvedDir.startsWith(homeDir)) {
            console.warn(`⚠️ Security: Skipping directory outside home: ${dir}`);
            return;
        }
        
        try {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            
            // Check if this directory is a git repo
            if (items.some(item => item.name === '.git' && item.isDirectory())) {
                found.push(dir);
                return; // Don't scan subdirectories of git repos
            }
            
            // Scan subdirectories
            for (const item of items) {
                if (item.isDirectory() && 
                    !item.name.startsWith('.') && 
                    item.name !== 'node_modules' && 
                    item.name !== 'venv') {
                    try {
                        this.findGitRepos(path.join(dir, item.name), found, depth + 1, maxDepth);
                    } catch (error) {
                        // Skip inaccessible directories
                    }
                }
            }
        } catch (error) {
            // Skip inaccessible directories
        }
    }

    async analyzeGitRepo(repoPath) {
        console.log(`  📊 Analyzing ${path.basename(repoPath)}...`);
        
        try {
            // Get commit count
            const commitCount = parseInt(
                execSync('git rev-list --count HEAD', { 
                    cwd: repoPath, 
                    encoding: 'utf8'
                }).trim()
            );
            
            // Get first commit date
            const firstCommit = execSync('git log --reverse --format=%aI | head -n 1', {
                cwd: repoPath,
                encoding: 'utf8'
            }).trim();
            
            // Get last commit date
            const lastCommit = execSync('git log -1 --format=%aI', {
                cwd: repoPath,
                encoding: 'utf8'
            }).trim();
            
            // Count lines of code
            let totalLines = 0;
            let fileCount = 0;
            
            try {
                const gitFiles = execSync('git ls-files', {
                    cwd: repoPath,
                    encoding: 'utf8'
                }).split('\n').filter(f => f.trim());
                
                for (const file of gitFiles) {
                    const ext = path.extname(file);
                    if (this.extensions.includes(ext)) {
                        try {
                            const filePath = path.join(repoPath, file);
                            const content = fs.readFileSync(filePath, 'utf8');
                            totalLines += content.split('\n').length;
                            fileCount++;
                        } catch (error) {
                            // Skip unreadable files
                        }
                    }
                }
            } catch (error) {
                // Could not count lines
            }
            
            // Calculate dev hours - FIXED: Use weighted average instead of max to prevent inflation
            const monthsActive = Math.max(1, 
                (new Date(lastCommit) - new Date(firstCommit)) / (1000 * 60 * 60 * 24 * 30)
            );
            // FIXED: More realistic time estimates
            const commitHours = commitCount * 0.5; // 30 min per commit (was 2h - inflated!)
            const linesHours = (totalLines / 100); // 100 lines per hour (was 50 - too generous)
            const activityHours = monthsActive * 10; // 10h per month baseline
            // FIXED: Use weighted average instead of max to prevent massive inflation
            const devHours = (commitHours * 0.4 + linesHours * 0.4 + activityHours * 0.2);
            
            this.results.totalDevHours += devHours;
            
            return {
                path: repoPath,
                name: path.basename(repoPath),
                commits: commitCount,
                files: fileCount,
                lines: totalLines,
                firstCommit: new Date(firstCommit),
                lastCommit: new Date(lastCommit),
                monthsActive: Math.round(monthsActive),
                estimatedHours: Math.round(devHours),
                estimatedValue: Math.round(devHours * 75) // $75/hour (realistic rate)
            };
        } catch (error) {
            console.error(`    Error analyzing repo: ${error.message}`);
            return null;
        }
    }

    // Scan for AI conversation logs
    async scanAIConversations() {
        console.log('\n🤖 Scanning for AI conversation logs...');
        
        const aiPaths = [
            // Claude
            path.join(this.homeDir, 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev'),
            path.join(this.homeDir, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev'),
            
            // ChatGPT / OpenAI
            path.join(this.homeDir, 'AppData', 'Roaming', 'OpenAI'),
            path.join(this.homeDir, '.config', 'openai'),
            
            // Cursor
            path.join(this.homeDir, 'AppData', 'Roaming', 'Cursor'),
            path.join(this.homeDir, '.config', 'Cursor'),
            
            // Generic AI assistant logs
            path.join(this.homeDir, 'Documents', 'AI Conversations'),
            path.join(this.homeDir, 'Downloads')
        ];
        
        let totalConversations = 0;
        let totalTokens = 0;
        let estimatedHours = 0;
        
        for (const aiPath of aiPaths) {
            if (fs.existsSync(aiPath)) {
                const analysis = this.analyzeAIPath(aiPath);
                if (analysis) {
                    totalConversations += analysis.conversations;
                    totalTokens += analysis.tokens;
                    estimatedHours += analysis.hours;
                }
            }
        }
        
        this.results.aiConversations.push({
            totalConversations,
            totalTokens,
            estimatedHours: Math.round(estimatedHours),
            estimatedValue: Math.round(estimatedHours * 75) // $75/hour (realistic rate)
        });
        
        console.log(`  ✅ Found ${totalConversations} AI conversations`);
        console.log(`  ⏱️ Estimated ${Math.round(estimatedHours)} hours of AI-assisted development`);
        
        return totalConversations;
    }

    analyzeAIPath(dirPath) {
        try {
            let conversations = 0;
            let tokens = 0;
            let hours = 0;
            
            const files = this.getAllFiles(dirPath, ['.json', '.md', '.txt']);
            
            for (const file of files) {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    
                    // Try to parse as JSON (Claude/ChatGPT format)
                    try {
                        const data = JSON.parse(content);
                        
                        // Count messages
                        if (data.messages && Array.isArray(data.messages)) {
                            conversations++;
                            const messageCount = data.messages.length;
                            tokens += messageCount * 500; // Estimate 500 tokens per message
                            hours += messageCount * 0.05; // ~3 minutes per message
                        }
                    } catch (e) {
                        // Not JSON, count as text
                        const lines = content.split('\n').length;
                        if (lines > 10) { // Minimum conversation size
                            conversations++;
                            tokens += lines * 50;
                            hours += lines * 0.01;
                        }
                    }
                } catch (error) {
                    // Skip unreadable files
                }
            }
            
            return { conversations, tokens, hours };
        } catch (error) {
            return null;
        }
    }

    getAllFiles(dir, extensions, files = []) {
        // SECURITY: Validate directory path
        const resolvedDir = path.resolve(dir);
        const homeDir = path.resolve(this.homeDir);
        if (!resolvedDir.startsWith(homeDir)) {
            return files; // Skip directories outside home
        }
        
        try {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                
                if (item.isDirectory() && !item.name.startsWith('.')) {
                    this.getAllFiles(fullPath, extensions, files);
                } else if (item.isFile()) {
                    const ext = path.extname(item.name);
                    if (extensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (error) {
            // Skip inaccessible directories
        }
        
        return files;
    }

    // Scan for code files (not in git)
    async scanCodeFiles() {
        console.log('\n📄 Scanning for standalone code files...');
        
        const searchDirs = [
            path.join(this.homeDir, 'Documents'),
            path.join(this.homeDir, 'Desktop'),
            path.join(this.homeDir, 'Downloads')
        ];
        
        let totalFiles = 0;
        let totalLines = 0;
        
        for (const dir of searchDirs) {
            if (fs.existsSync(dir)) {
                const files = this.getAllFiles(dir, this.extensions);
                
                for (const file of files) {
                    try {
                        const content = fs.readFileSync(file, 'utf8');
                        const lines = content.split('\n').length;
                        
                        if (lines > 10) { // Minimum file size
                            totalFiles++;
                            totalLines += lines;
                            
                            this.results.codeFiles.push({
                                path: file,
                                name: path.basename(file),
                                lines,
                                extension: path.extname(file)
                            });
                        }
                    } catch (error) {
                        // Skip unreadable files
                    }
                }
            }
        }
        
        const hours = totalLines / 50; // ~50 lines per hour
        this.results.totalDevHours += hours;
        
        console.log(`  ✅ Found ${totalFiles} standalone code files`);
        console.log(`  📏 Total ${totalLines.toLocaleString()} lines of code`);
        
        return totalFiles;
    }

    // Generate comprehensive report
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPREHENSIVE DEVELOPMENT SCAN REPORT');
        console.log('='.repeat(60));
        
        // Git Repositories
        console.log('\n📁 Git Repositories:');
        console.log(`  Total Repos: ${this.results.gitRepos.length}`);
        const totalCommits = this.results.gitRepos.reduce((sum, r) => sum + (r?.commits || 0), 0);
        console.log(`  Total Commits: ${totalCommits.toLocaleString()}`);
        const totalLines = this.results.gitRepos.reduce((sum, r) => sum + (r?.lines || 0), 0);
        console.log(`  Total Lines: ${totalLines.toLocaleString()}`);
        
        // AI Conversations
        if (this.results.aiConversations.length > 0) {
            console.log('\n🤖 AI-Assisted Development:');
            const ai = this.results.aiConversations[0];
            console.log(`  Conversations: ${ai.totalConversations}`);
            console.log(`  Estimated Tokens: ${ai.totalTokens.toLocaleString()}`);
            console.log(`  Estimated Hours: ${ai.estimatedHours}`);
        }
        
        // Code Files
        console.log('\n📄 Standalone Code Files:');
        console.log(`  Total Files: ${this.results.codeFiles.length}`);
        const codeLines = this.results.codeFiles.reduce((sum, f) => sum + f.lines, 0);
        console.log(`  Total Lines: ${codeLines.toLocaleString()}`);
        
        // Calculate total value
        const aiHours = this.results.aiConversations[0]?.estimatedHours || 0;
        const totalHours = Math.round(this.results.totalDevHours + aiHours);
        const totalValue = totalHours * 75; // $75/hour (realistic market average)
        
        console.log('\n💰 COMPENSATION CALCULATION:');
        console.log(`  Total Development Hours: ${totalHours.toLocaleString()}`);
        console.log(`  Base Rate: $75/hour (realistic market average)`);
        console.log(`  Base Compensation: $${totalValue.toLocaleString()}`);
        
        // Add pioneer bonus if applicable
        const yearsInDev = this.calculateYearsInDev();
        const pioneerMultiplier = this.calculatePioneerMultiplier(yearsInDev);
        
        if (pioneerMultiplier > 1) {
            console.log(`\n🏆 PIONEER BONUS (${yearsInDev} years):` );
            console.log(`  Multiplier: ${pioneerMultiplier}x`);
            console.log(`  Pioneer Bonus: $${((totalValue * (pioneerMultiplier - 1))).toLocaleString()}`);
        }
        
        const finalValue = totalValue * pioneerMultiplier;
        console.log('\n' + '='.repeat(60));
        console.log(`💎 TOTAL COMPENSATION OWED: $${Math.round(finalValue).toLocaleString()}`);
        console.log('='.repeat(60));
        
        return {
            totalHours,
            baseValue: totalValue,
            pioneerMultiplier,
            finalValue: Math.round(finalValue),
            repos: this.results.gitRepos.length,
            conversations: this.results.aiConversations[0]?.totalConversations || 0,
            codeFiles: this.results.codeFiles.length
        };
    }

    calculateYearsInDev() {
        if (this.results.gitRepos.length === 0) return 0;
        
        const earliestCommit = this.results.gitRepos
            .map(r => r?.firstCommit)
            .filter(d => d)
            .sort((a, b) => a - b)[0];
        
        if (!earliestCommit) return 0;
        
        const years = (new Date() - earliestCommit) / (1000 * 60 * 60 * 24 * 365);
        return Math.floor(years);
    }

    calculatePioneerMultiplier(years) {
        // FIXED: More reasonable pioneer bonuses to prevent budget inflation
        if (years >= 15) return 2.0; // Pre-2010: 2x (was 10x - way too high!)
        if (years >= 10) return 1.5; // 2010-2015: 1.5x (was 5x)
        if (years >= 5) return 1.2;  // 2015-2020: 1.2x (was 2x)
        return 1.0;
    }

    // Export results
    exportResults(filename = 'development-scan-results.json') {
        const report = this.generateReport();
        const data = {
            timestamp: new Date().toISOString(),
            summary: report,
            details: this.results
        };
        
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        console.log(`\n✅ Results exported to ${filename}`);
        
        return filename;
    }
}

// CLI Interface
if (require.main === module) {
    const scanner = new LocalScanner();
    
    (async () => {
        console.log('🚀 Starting comprehensive development scan...\n');
        
        // Scan git repos
        await scanner.scanGitRepos();
        
        // Scan AI conversations
        await scanner.scanAIConversations();
        
        // Scan code files
        await scanner.scanCodeFiles();
        
        // Generate report
        const report = scanner.generateReport();
        
        // Export results
        scanner.exportResults();
        
        console.log('\n✨ Scan complete!\n');
    })();
}

module.exports = LocalScanner;
