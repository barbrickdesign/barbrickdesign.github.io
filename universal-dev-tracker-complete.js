// Universal Developer Compensation Tracker - Complete Engine
// Calculates fair compensation for ALL developers

class UniversalDevTracker {
    constructor() {
        this.BASE_RATE = 100; // $100/hour
        this.repos = [];
        this.results = null;
    }

    // Calculate pioneer multiplier based on years in crypto
    calculatePioneerMultiplier(yearsInCrypto) {
        if (yearsInCrypto >= 15) return 10; // Pre-2010: 10x
        if (yearsInCrypto >= 10) return 5;  // 2010-2015: 5x
        if (yearsInCrypto >= 5) return 2;   // 2015-2020: 2x
        return 1; // Less than 5 years: 1x
    }

    // Parse GitHub URL to extract owner and repo
    parseGitHubUrl(url) {
        try {
            const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) return null;
            return {
                owner: match[1],
                repo: match[2].replace('.git', '')
            };
        } catch (error) {
            console.error('URL parse error:', error);
            return null;
        }
    }

    // Fetch repository data from GitHub API
    async fetchRepoData(owner, repo) {
        try {
            // Fetch repo info
            const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            if (!repoResponse.ok) throw new Error('Repo not found');
            const repoData = await repoResponse.json();

            // Fetch commits (limited to last 100 for performance)
            const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`);
            const commits = await commitsResponse.json();

            // Fetch contributors
            const contributorsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors`);
            const contributors = await contributorsResponse.json();

            return {
                name: repoData.name,
                description: repoData.description,
                created: new Date(repoData.created_at),
                updated: new Date(repoData.updated_at),
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                commits: commits.length,
                contributors: Array.isArray(contributors) ? contributors.length : 0,
                language: repoData.language,
                size: repoData.size
            };
        } catch (error) {
            console.error('GitHub API error:', error);
            throw error;
        }
    }

    // Calculate development hours from repo data
    calculateDevHours(repoData) {
        const now = new Date();
        const createdDate = repoData.created;
        
        // Calculate months active
        const monthsActive = Math.max(1, Math.floor((now - createdDate) / (1000 * 60 * 60 * 24 * 30)));
        
        // Estimate hours based on commits, size, and activity
        const commitHours = repoData.commits * 2; // Avg 2 hours per commit
        const sizeHours = (repoData.size / 1000) * 5; // 5 hours per 1000KB
        const monthlyHours = monthsActive * 20; // 20 hours per month minimum
        
        // Use the highest estimate
        const totalHours = Math.max(commitHours, sizeHours, monthlyHours);
        
        return {
            totalHours: Math.round(totalHours),
            commitHours,
            sizeHours,
            monthlyHours,
            monthsActive
        };
    }

    // Calculate total compensation
    calculateCompensation(repoData, devHours, yearsInCrypto = 0) {
        const basePay = devHours.totalHours * this.BASE_RATE;
        const pioneerMultiplier = this.calculatePioneerMultiplier(yearsInCrypto);
        const pioneerBonus = basePay * (pioneerMultiplier - 1);
        
        // Calculate complexity bonus (based on language, stars, forks)
        let complexityMultiplier = 1;
        if (repoData.language === 'Rust' || repoData.language === 'C++') complexityMultiplier = 1.5;
        if (repoData.stars > 100) complexityMultiplier += 0.5;
        if (repoData.forks > 50) complexityMultiplier += 0.3;
        
        const complexityBonus = basePay * (complexityMultiplier - 1);
        
        // Open source bonus (usage-based)
        const openSourceBonus = repoData.stars * 100 + repoData.forks * 200;
        
        // Total compensation
        const totalCompensation = basePay + pioneerBonus + complexityBonus + openSourceBonus;
        
        return {
            basePay,
            pioneerMultiplier,
            pioneerBonus,
            complexityMultiplier,
            complexityBonus,
            openSourceBonus,
            totalCompensation
        };
    }

    // Scan a single repository
    async scanRepository(url, yearsInCrypto = 0) {
        const parsed = this.parseGitHubUrl(url);
        if (!parsed) {
            throw new Error('Invalid GitHub URL');
        }

        console.log(`📊 Scanning ${parsed.owner}/${parsed.repo}...`);
        
        const repoData = await this.fetchRepoData(parsed.owner, parsed.repo);
        const devHours = this.calculateDevHours(repoData);
        const compensation = this.calculateCompensation(repoData, devHours, yearsInCrypto);
        
        return {
            url,
            owner: parsed.owner,
            repo: parsed.repo,
            repoData,
            devHours,
            compensation
        };
    }

    // Scan multiple repositories
    async scanMultipleRepos(urls, yearsInCrypto = 0) {
        const results = [];
        
        for (const url of urls) {
            try {
                const result = await this.scanRepository(url.trim(), yearsInCrypto);
                results.push(result);
                console.log(`✅ Scanned: ${result.repo}`);
            } catch (error) {
                console.error(`❌ Failed to scan ${url}:`, error.message);
                results.push({
                    url,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    // Generate summary report
    generateSummary(results) {
        const validResults = results.filter(r => !r.error);
        
        if (validResults.length === 0) {
            return {
                totalRepos: 0,
                totalHours: 0,
                totalCompensation: 0,
                averageHoursPerRepo: 0,
                totalCommits: 0,
                totalStars: 0
            };
        }
        
        const totalHours = validResults.reduce((sum, r) => sum + r.devHours.totalHours, 0);
        const totalCompensation = validResults.reduce((sum, r) => sum + r.compensation.totalCompensation, 0);
        const totalCommits = validResults.reduce((sum, r) => sum + r.repoData.commits, 0);
        const totalStars = validResults.reduce((sum, r) => sum + r.repoData.stars, 0);
        
        return {
            totalRepos: validResults.length,
            totalHours,
            totalCompensation,
            averageHoursPerRepo: Math.round(totalHours / validResults.length),
            totalCommits,
            totalStars
        };
    }
}

// Initialize global instance
window.devTracker = new UniversalDevTracker();

// UI Functions
async function connectWallet() {
    const btn = document.getElementById('connectWalletBtn');
    const status = document.getElementById('walletStatus');
    
    try {
        btn.textContent = '⏳ Connecting...';
        btn.disabled = true;
        
        // Check for Phantom (Solana)
        if (window.solana && window.solana.isPhantom) {
            const response = await window.solana.connect();
            const pubkey = response.publicKey.toString();
            
            btn.textContent = '✅ Connected';
            btn.className = 'connected';
            status.innerHTML = `
                <span class="connected">
                    👻 Phantom Wallet Connected<br>
                    ${pubkey.slice(0, 8)}...${pubkey.slice(-8)}
                </span>
            `;
            
            localStorage.setItem('connectedWallet', pubkey);
            localStorage.setItem('walletType', 'phantom');
            return true;
        }
        
        // Check for MetaMask (Ethereum)
        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const address = accounts[0];
            
            btn.textContent = '✅ Connected';
            btn.className = 'connected';
            status.innerHTML = `
                <span class="connected">
                    🦊 MetaMask Connected<br>
                    ${address.slice(0, 8)}...${address.slice(-8)}
                </span>
            `;
            
            localStorage.setItem('connectedWallet', address);
            localStorage.setItem('walletType', 'metamask');
            return true;
        }
        
        throw new Error('No wallet detected. Please install Phantom or MetaMask.');
        
    } catch (error) {
        console.error('Wallet connection error:', error);
        btn.textContent = '❌ Failed - Try Again';
        btn.disabled = false;
        status.innerHTML = `<span style="color: #ff0000;">${error.message}</span>`;
        
        setTimeout(() => {
            btn.textContent = 'Connect Wallet';
        }, 3000);
        
        return false;
    }
}

async function scanRepos() {
    const singleUrl = document.getElementById('repoUrl').value.trim();
    const multipleUrls = document.getElementById('multipleRepos').value.trim();
    const yearsInput = document.getElementById('yearsInCrypto').value;
    const yearsInCrypto = parseInt(yearsInput) || 0;
    
    // Collect URLs
    let urls = [];
    if (singleUrl) urls.push(singleUrl);
    if (multipleUrls) urls.push(...multipleUrls.split('\n').filter(u => u.trim()));
    
    if (urls.length === 0) {
        alert('Please enter at least one GitHub repository URL');
        return;
    }
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    
    try {
        // Scan repositories
        const results = await window.devTracker.scanMultipleRepos(urls, yearsInCrypto);
        window.currentResults = results;
        
        // Generate summary
        const summary = window.devTracker.generateSummary(results);
        
        // Display results
        displayResults(results, summary, yearsInCrypto);
        
        // Hide loading
        document.getElementById('loading').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        
    } catch (error) {
        console.error('Scan error:', error);
        document.getElementById('loading').innerHTML = `
            <p style="color: #ff0000;">Error: ${error.message}</p>
            <button onclick="location.reload()">Try Again</button>
        `;
    }
}

function displayResults(results, summary, yearsInCrypto) {
    // Update summary stats
    document.getElementById('totalHours').textContent = summary.totalHours.toLocaleString();
    document.getElementById('totalRepos').textContent = summary.totalRepos;
    document.getElementById('totalCompensation').textContent = 
        '$' + Math.round(summary.totalCompensation).toLocaleString();
    document.getElementById('avgHours').textContent = summary.averageHoursPerRepo;
    
    // Display pioneer status
    const pioneerMultiplier = window.devTracker.calculatePioneerMultiplier(yearsInCrypto);
    if (pioneerMultiplier > 1) {
        document.getElementById('pioneerStatus').style.display = 'block';
        document.getElementById('pioneerMultiplier').textContent = `${pioneerMultiplier}x`;
    }
    
    // Display breakdown
    const breakdown = document.getElementById('compensationBreakdown');
    breakdown.innerHTML = `
        <h3 style="color: #00ff00; margin-bottom: 15px;">💰 Compensation Breakdown</h3>
        <div class="breakdown-item">
            <span>Base Pay (${summary.totalHours}h × $${window.devTracker.BASE_RATE}/h)</span>
            <span>$${(summary.totalHours * window.devTracker.BASE_RATE).toLocaleString()}</span>
        </div>
        <div class="breakdown-item">
            <span>Pioneer Bonus (${pioneerMultiplier}x multiplier)</span>
            <span>$${Math.round(summary.totalCompensation - (summary.totalHours * window.devTracker.BASE_RATE)).toLocaleString()}</span>
        </div>
        <div class="breakdown-item">
            <span><strong>TOTAL COMPENSATION OWED</strong></span>
            <span><strong>$${Math.round(summary.totalCompensation).toLocaleString()}</strong></span>
        </div>
    `;
    
    // Display repo list
    const repoList = document.getElementById('repoList');
    repoList.innerHTML = results.map(r => {
        if (r.error) {
            return `
                <div class="repo-item" style="border-color: rgba(255,0,0,0.3);">
                    <div>
                        <div style="color: #ff0000;">❌ ${r.url}</div>
                        <div style="font-size: 0.9em; color: #ff6666;">${r.error}</div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="repo-item">
                <div style="flex: 1;">
                    <div style="font-weight: 700; color: #00ff00;">${r.repo}</div>
                    <div style="font-size: 0.9em; color: #8affff; margin-top: 5px;">
                        ${r.devHours.totalHours}h • ${r.repoData.commits} commits • ⭐ ${r.repoData.stars}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.3em; font-weight: 900; color: #00ff00;">
                        $${Math.round(r.compensation.totalCompensation).toLocaleString()}
                    </div>
                    <div style="font-size: 0.8em; color: #8affff;">
                        ${r.compensation.pioneerMultiplier}x multiplier
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function claimCompensation() {
    const wallet = localStorage.getItem('connectedWallet');
    
    if (!wallet) {
        alert('Please connect your wallet first!');
        document.getElementById('connectWalletBtn').scrollIntoView({ behavior: 'smooth' });
        return;
    }
    
    if (!window.currentResults) {
        alert('Please scan your repositories first!');
        return;
    }
    
    const summary = window.devTracker.generateSummary(window.currentResults);
    
    alert(`
🎉 COMPENSATION CLAIM INITIATED

Wallet: ${wallet.slice(0, 8)}...${wallet.slice(-8)}
Total Owed: $${Math.round(summary.totalCompensation).toLocaleString()}

This feature is coming soon!

In the near future, you'll be able to:
• Submit your contribution proof on-chain
• Receive NFT certificates
• Get paid directly in crypto
• Earn ongoing royalties

Join the movement at:
https://barbrickdesign.github.io

#EveryDeveloperDeservesPay
    `);
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Universal Dev Compensation Tracker loaded');
    
    // Check for existing wallet connection
    const wallet = localStorage.getItem('connectedWallet');
    if (wallet) {
        const btn = document.getElementById('connectWalletBtn');
        const status = document.getElementById('walletStatus');
        const walletType = localStorage.getItem('walletType');
        
        btn.textContent = '✅ Connected';
        btn.className = 'connected';
        status.innerHTML = `
            <span class="connected">
                ${walletType === 'phantom' ? '👻 Phantom' : '🦊 MetaMask'} Connected<br>
                ${wallet.slice(0, 8)}...${wallet.slice(-8)}
            </span>
        `;
    }
});
