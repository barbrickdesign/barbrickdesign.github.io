/**
 * GITHUB INTEGRATION FOR CONTRACTOR PROJECTS
 * Automatically syncs and enhances GitHub projects for government contracts
 * Provides seamless integration between developer workflows and government contracting
 */

class GitHubIntegration {
    constructor() {
        this.githubToken = null;
        this.apiBase = 'https://api.github.com';
        this.cache = {
            repositories: [],
            projects: [],
            enhancements: {},
            lastSync: null
        };
    }

    /**
     * Initialize GitHub integration with token
     */
    async initialize() {
        // Check for stored token
        this.githubToken = localStorage.getItem('githubToken');

        if (!this.githubToken) {
            // Prompt for GitHub token
            this.githubToken = prompt(
                'Enter your GitHub Personal Access Token for project syncing:\n' +
                '1. Go to GitHub Settings > Developer settings > Personal access tokens\n' +
                '2. Generate new token with "repo" and "read:user" permissions\n' +
                '3. Paste token here (or leave blank to skip):'
            );

            if (this.githubToken && this.githubToken.trim()) {
                localStorage.setItem('githubToken', this.githubToken);
                console.log('🔑 GitHub token set for project syncing');
            } else {
                console.log('⚠️ No GitHub token provided - project syncing disabled');
                return false;
            }
        }

        return true;
    }

    /**
     * Get authenticated user's repositories
     */
    async getUserRepositories() {
        if (!this.githubToken) {
            await this.initialize();
        }

        if (!this.githubToken) return [];

        try {
            const response = await fetch(`${this.apiBase}/user/repos?per_page=100`, {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const repos = await response.json();

            // Filter for relevant repositories (software projects)
            const relevantRepos = repos.filter(repo => {
                // Check for programming languages
                const hasCode = repo.language && ['JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust'].includes(repo.language);
                // Check for project indicators
                const hasProjectFiles = repo.name.includes('project') || repo.description?.toLowerCase().includes('project');

                return hasCode || hasProjectFiles || repo.stargazers_count > 0;
            });

            this.cache.repositories = relevantRepos;
            return relevantRepos;

        } catch (error) {
            console.error('Error fetching GitHub repositories:', error);
            return [];
        }
    }

    /**
     * Analyze repository for government contract suitability
     */
    async analyzeRepository(repoName, owner) {
        try {
            // Get repository details
            const repoResponse = await fetch(`${this.apiBase}/repos/${owner}/${repoName}`, {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!repoResponse.ok) {
                throw new Error(`Repository not accessible: ${repoResponse.status}`);
            }

            const repo = await repoResponse.json();

            // Get languages
            const languagesResponse = await fetch(`${this.apiBase}/repos/${owner}/${repoName}/languages`, {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            const languages = languagesResponse.ok ? await languagesResponse.json() : {};

            // Get recent commits
            const commitsResponse = await fetch(`${this.apiBase}/repos/${owner}/${repoName}/commits?per_page=10`, {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            const commits = commitsResponse.ok ? await commitsResponse.json() : [];

            // Analyze for government contract relevance
            const analysis = this.analyzeForGovernmentContracts(repo, languages, commits);

            return {
                repository: repo,
                analysis: analysis,
                languages: languages,
                recentCommits: commits.length,
                lastActivity: repo.updated_at,
                suitability: analysis.overallScore
            };

        } catch (error) {
            console.error('Error analyzing repository:', error);
            return null;
        }
    }

    /**
     * Analyze repository for government contract suitability
     */
    analyzeForGovernmentContracts(repo, languages, commits) {
        const analysis = {
            technicalCapabilities: [],
            securityFeatures: [],
            scalabilityIndicators: [],
            documentationQuality: 0,
            maintenanceActivity: 0,
            overallScore: 0,
            recommendations: [],
            enhancementSuggestions: []
        };

        // Technical capabilities analysis
        if (languages.JavaScript) analysis.technicalCapabilities.push('Web Development');
        if (languages.Python) analysis.technicalCapabilities.push('Data Processing', 'AI/ML');
        if (languages.Java) analysis.technicalCapabilities.push('Enterprise Applications');
        if (languages['C++'] || languages.C) analysis.technicalCapabilities.push('Systems Programming');

        // Security analysis
        const hasSecurityKeywords = repo.description?.toLowerCase().includes('security') ||
                                  repo.topics?.some(topic => topic.includes('security'));

        if (hasSecurityKeywords) {
            analysis.securityFeatures.push('Security-focused development');
        }

        // Scalability indicators
        const hasDocker = repo.topics?.some(topic => topic.includes('docker'));
        const hasKubernetes = repo.topics?.some(topic => topic.includes('kubernetes'));
        const hasCloud = repo.description?.toLowerCase().includes('cloud');

        if (hasDocker || hasKubernetes || hasCloud) {
            analysis.scalabilityIndicators.push('Cloud-native architecture');
        }

        // Documentation quality
        if (repo.has_wiki) analysis.documentationQuality += 30;
        if (repo.has_issues) analysis.documentationQuality += 20;
        if (repo.has_projects) analysis.documentationQuality += 25;

        // Recent activity
        const recentCommits = commits.filter(commit => {
            const commitDate = new Date(commit.commit.author.date);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return commitDate > thirtyDaysAgo;
        });

        analysis.maintenanceActivity = recentCommits.length;

        // Overall scoring
        analysis.overallScore = Math.min(100,
            (analysis.technicalCapabilities.length * 15) +
            (analysis.securityFeatures.length * 20) +
            (analysis.scalabilityIndicators.length * 10) +
            analysis.documentationQuality +
            Math.min(analysis.maintenanceActivity * 5, 25)
        );

        // Generate recommendations
        if (analysis.overallScore < 60) {
            analysis.recommendations.push('Consider adding security features');
            analysis.recommendations.push('Improve documentation');
        }

        if (analysis.technicalCapabilities.length < 2) {
            analysis.recommendations.push('Expand technical capabilities');
        }

        // Enhancement suggestions for government contracts
        analysis.enhancementSuggestions = this.generateGovernmentEnhancements(analysis);

        return analysis;
    }

    /**
     * Generate government contract enhancement suggestions
     */
    generateGovernmentEnhancements(analysis) {
        const suggestions = [];

        // Security enhancements
        if (analysis.securityFeatures.length === 0) {
            suggestions.push({
                type: 'security',
                priority: 'high',
                description: 'Add security compliance features (encryption, access controls)',
                estimatedEffort: '2-3 weeks'
            });
        }

        // Documentation enhancements
        if (analysis.documentationQuality < 50) {
            suggestions.push({
                type: 'documentation',
                priority: 'medium',
                description: 'Create comprehensive documentation including API docs and user guides',
                estimatedEffort: '1-2 weeks'
            });
        }

        // Scalability enhancements
        if (analysis.scalabilityIndicators.length === 0) {
            suggestions.push({
                type: 'scalability',
                priority: 'medium',
                description: 'Implement containerization and cloud deployment capabilities',
                estimatedEffort: '3-4 weeks'
            });
        }

        // Compliance enhancements
        suggestions.push({
            type: 'compliance',
            priority: 'high',
            description: 'Add government compliance features (audit trails, data retention)',
            estimatedEffort: '2-3 weeks'
        });

        return suggestions;
    }

    /**
     * Enhance project for government contract requirements
     */
    async enhanceForGovernmentContract(repository, contractRequirements) {
        const enhancements = {
            securityEnhancements: [],
            complianceEnhancements: [],
            documentationEnhancements: [],
            scalabilityEnhancements: [],
            totalEstimatedEffort: 0,
            enhancedProject: null
        };

        // Security enhancements
        if (!repository.analysis.securityFeatures.length) {
            enhancements.securityEnhancements = [
                'Add encryption for data at rest and in transit',
                'Implement role-based access control (RBAC)',
                'Add security audit logging',
                'Implement secure authentication mechanisms'
            ];
            enhancements.totalEstimatedEffort += 2;
        }

        // Compliance enhancements
        enhancements.complianceEnhancements = [
            'Add audit trail for all data modifications',
            'Implement data retention policies',
            'Add compliance reporting features',
            'Include accessibility (Section 508) compliance'
        ];
        enhancements.totalEstimatedEffort += 2;

        // Documentation enhancements
        if (repository.analysis.documentationQuality < 70) {
            enhancements.documentationEnhancements = [
                'Create comprehensive API documentation',
                'Add user manuals and guides',
                'Include deployment and maintenance guides',
                'Add security and compliance documentation'
            ];
            enhancements.totalEstimatedEffort += 1.5;
        }

        // Scalability enhancements
        if (!repository.analysis.scalabilityIndicators.length) {
            enhancements.scalabilityEnhancements = [
                'Add containerization (Docker)',
                'Implement horizontal scaling capabilities',
                'Add load balancing support',
                'Include monitoring and alerting'
            ];
            enhancements.totalEstimatedEffort += 3;
        }

        // Create enhanced project structure
        enhancements.enhancedProject = {
            originalRepository: repository.repository,
            contractRequirements: contractRequirements,
            enhancements: enhancements,
            estimatedTimeline: `${enhancements.totalEstimatedEffort} weeks`,
            readinessScore: this.calculateReadinessScore(repository.analysis, enhancements),
            nextSteps: this.generateNextSteps(repository, contractRequirements)
        };

        return enhancements;
    }

    /**
     * Calculate project readiness score for government contract
     */
    calculateReadinessScore(analysis, enhancements) {
        let score = analysis.overallScore;

        // Add points for planned enhancements
        score += enhancements.securityEnhancements.length * 5;
        score += enhancements.complianceEnhancements.length * 5;
        score += enhancements.documentationEnhancements.length * 3;
        score += enhancements.scalabilityEnhancements.length * 4;

        return Math.min(100, score);
    }

    /**
     * Generate next steps for project enhancement
     */
    generateNextSteps(repository, contractRequirements) {
        const steps = [];

        // Security first
        if (enhancements.securityEnhancements.length > 0) {
            steps.push({
                priority: 1,
                title: 'Implement Security Features',
                description: 'Add encryption, access controls, and audit logging',
                estimatedTime: '2-3 weeks'
            });
        }

        // Compliance
        steps.push({
            priority: 2,
            title: 'Add Compliance Features',
            description: 'Implement audit trails and compliance reporting',
            estimatedTime: '2 weeks'
        });

        // Documentation
        if (enhancements.documentationEnhancements.length > 0) {
            steps.push({
                priority: 3,
                title: 'Enhance Documentation',
                description: 'Create comprehensive documentation for government review',
                estimatedTime: '1-2 weeks'
            });
        }

        // Scalability
        if (enhancements.scalabilityEnhancements.length > 0) {
            steps.push({
                priority: 4,
                title: 'Add Scalability Features',
                description: 'Implement containerization and cloud deployment',
                estimatedTime: '3-4 weeks'
            });
        }

        // Final review and submission
        steps.push({
            priority: 5,
            title: 'Final Review and Submission',
            description: 'Review enhanced project and submit for contract',
            estimatedTime: '1 week'
        });

        return steps;
    }

    /**
     * Sync GitHub projects with SAM.gov opportunities
     */
    async syncProjectsWithSAMGov() {
        try {
            // Get user's repositories
            const repositories = await this.getUserRepositories();

            // Get SAM.gov opportunities
            const opportunities = await window.samGovIntegration.findOpportunities(['software', 'development'], ['software']);

            const syncedProjects = [];

            for (const repo of repositories) {
                const analysis = await this.analyzeRepository(repo.owner.login, repo.name);

                if (analysis && analysis.suitability > 50) {
                    // Find matching SAM.gov opportunities
                    const matchingOpportunities = opportunities.filter(opp => {
                        return this.matchProjectToOpportunity(analysis, opp);
                    });

                    if (matchingOpportunities.length > 0) {
                        syncedProjects.push({
                            repository: repo,
                            analysis: analysis,
                            matchingOpportunities: matchingOpportunities,
                            enhancementPlan: await this.enhanceForGovernmentContract(analysis, matchingOpportunities[0])
                        });
                    }
                }
            }

            this.cache.projects = syncedProjects;
            this.cache.lastSync = new Date().toISOString();

            return syncedProjects;

        } catch (error) {
            console.error('Error syncing projects with SAM.gov:', error);
            return [];
        }
    }

    /**
     * Match project to SAM.gov opportunity
     */
    matchProjectToOpportunity(analysis, opportunity) {
        // Simple matching based on keywords and capabilities
        const projectKeywords = analysis.technicalCapabilities.map(cap => cap.toLowerCase());
        const opportunityKeywords = opportunity.requirements.map(req => req.toLowerCase());

        const matches = projectKeywords.filter(keyword =>
            opportunityKeywords.some(oppKeyword => oppKeyword.includes(keyword) || keyword.includes(oppKeyword))
        );

        return matches.length > 0;
    }

    /**
     * Get cached projects
     */
    getCachedProjects() {
        return this.cache.projects;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache = {
            repositories: [],
            projects: [],
            enhancements: {},
            lastSync: null
        };
    }
}

// Create global instance
window.githubIntegration = new GitHubIntegration();

console.log('🔗 GitHub Integration loaded - Project syncing and enhancement available');
