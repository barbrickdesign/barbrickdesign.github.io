/**
 * GITHUB PROJECT ANALYSIS FOR GOVERNMENT CONTRACT DETECTION
 * Analyzes GitHub repositories to identify potential government usage
 * Cross-references with SAM.gov contract data for compensation claims
 */

class GitHubContractDetector {
    constructor() {
        this.analysisCache = {};
        this.detectedMatches = [];
        this.compensationClaims = [];
    }

    /**
     * Analyze GitHub repository for potential government contract usage
     */
    async analyzeRepositoryForContracts(owner, repoName) {
        try {
            console.log(`🔍 Analyzing ${owner}/${repoName} for government contract usage...`);

            // Get repository details
            const repo = await this.getRepositoryDetails(owner, repoName);
            if (!repo) return null;

            // Analyze for government indicators
            const analysis = this.analyzeGovernmentIndicators(repo);

            // Cross-reference with SAM.gov opportunities
            const matches = await this.crossReferenceWithSAMGov(repo, analysis);

            // Generate compensation potential
            const compensation = this.assessCompensationPotential(repo, matches);

            const result = {
                repository: repo,
                analysis: analysis,
                samGovMatches: matches,
                compensationPotential: compensation,
                lastAnalyzed: new Date().toISOString()
            };

            this.analysisCache[`${owner}/${repoName}`] = result;
            return result;

        } catch (error) {
            console.error('Error analyzing repository for contracts:', error);
            return null;
        }
    }

    /**
     * Get repository details from GitHub API
     */
    async getRepositoryDetails(owner, repoName) {
        if (!window.githubIntegration?.githubToken) {
            console.warn('GitHub token not available for API calls');
            return null;
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
                headers: {
                    'Authorization': `token ${window.githubIntegration.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`Repository ${owner}/${repoName} not found or private`);
                    return null;
                }
                throw new Error(`GitHub API error: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Error fetching repository details:', error);
            return null;
        }
    }

    /**
     * Analyze repository for government usage indicators
     */
    analyzeGovernmentIndicators(repo) {
        const indicators = {
            governmentKeywords: [],
            technicalComplexity: 0,
            documentationQuality: 0,
            securityFeatures: 0,
            scalabilityIndicators: 0,
            enterpriseReadiness: 0,
            totalScore: 0
        };

        const description = (repo.description || '').toLowerCase();
        const readme = repo.readme || '';

        // Check for government-related keywords
        const govKeywords = [
            'government', 'federal', 'dod', 'dhs', 'cia', 'nsa', 'fbi',
            'military', 'defense', 'intelligence', 'security', 'classified',
            'contract', 'procurement', 'solicitation', 'award', 'sam.gov'
        ];

        govKeywords.forEach(keyword => {
            if (description.includes(keyword) || readme.toLowerCase().includes(keyword)) {
                indicators.governmentKeywords.push(keyword);
            }
        });

        // Technical complexity assessment
        if (repo.language) {
            const complexityMap = {
                'C++': 5, 'Rust': 5, 'Go': 4, 'Java': 4,
                'Python': 3, 'JavaScript': 2, 'HTML': 1
            };
            indicators.technicalComplexity = complexityMap[repo.language] || 2;
        }

        // Documentation quality
        if (repo.has_wiki) indicators.documentationQuality += 2;
        if (repo.has_pages) indicators.documentationQuality += 1;
        if (readme) indicators.documentationQuality += 2;

        // Security features
        const securityKeywords = ['security', 'encryption', 'authentication', 'authorization', 'ssl', 'tls'];
        securityKeywords.forEach(keyword => {
            if (description.includes(keyword) || readme.toLowerCase().includes(keyword)) {
                indicators.securityFeatures++;
            }
        });

        // Scalability indicators
        const scalabilityKeywords = ['scale', 'performance', 'load', 'cluster', 'distributed'];
        scalabilityKeywords.forEach(keyword => {
            if (description.includes(keyword) || readme.toLowerCase().includes(keyword)) {
                indicators.scalabilityIndicators++;
            }
        });

        // Enterprise readiness
        if (repo.license) indicators.enterpriseReadiness += 1;
        if (repo.topics && repo.topics.length > 0) indicators.enterpriseReadiness += 1;
        if (repo.stargazers_count > 50) indicators.enterpriseReadiness += 2;
        if (repo.forks_count > 20) indicators.enterpriseReadiness += 1;

        // Calculate total score (0-100)
        indicators.totalScore = Math.min(100,
            (indicators.governmentKeywords.length * 10) +
            (indicators.technicalComplexity * 10) +
            (indicators.documentationQuality * 5) +
            (indicators.securityFeatures * 8) +
            (indicators.scalabilityIndicators * 6) +
            (indicators.enterpriseReadiness * 4)
        );

        return indicators;
    }

    /**
     * Cross-reference repository with SAM.gov opportunities
     */
    async crossReferenceWithSAMGov(repo, analysis) {
        try {
            // Get SAM.gov historical opportunities
            const samGovOpportunities = await window.samGovIntegration.fetchHistoricalOpportunities();

            const matches = [];

            samGovOpportunities.forEach(opp => {
                const matchScore = this.calculateMatchScore(repo, analysis, opp);

                if (matchScore > 60) { // 60% match threshold
                    matches.push({
                        opportunity: opp,
                        matchScore: matchScore,
                        matchReasons: this.getMatchReasons(repo, analysis, opp),
                        potentialUsage: this.assessPotentialUsage(repo, opp),
                        compensationEstimate: this.estimateCompensation(repo, opp, matchScore)
                    });
                }
            });

            // Sort by match score
            matches.sort((a, b) => b.matchScore - a.matchScore);

            return matches;

        } catch (error) {
            console.error('Error cross-referencing with SAM.gov:', error);
            return [];
        }
    }

    /**
     * Calculate match score between repository and SAM.gov opportunity
     */
    calculateMatchScore(repo, analysis, opportunity) {
        let score = 0;
        const reasons = [];

        // Technical capability match (40%)
        const repoLanguages = [repo.language].filter(Boolean);
        const oppRequirements = opportunity.requirements || [];

        const languageMatches = repoLanguages.filter(lang =>
            oppRequirements.some(req => req.toLowerCase().includes(lang.toLowerCase()))
        );

        if (languageMatches.length > 0) {
            score += 40;
            reasons.push(`Technical capabilities match: ${languageMatches.join(', ')}`);
        }

        // Keyword match (30%)
        const repoKeywords = analysis.governmentKeywords;
        const oppKeywords = opportunity.githubKeywords || [];

        const keywordMatches = repoKeywords.filter(keyword =>
            oppKeywords.some(oppKeyword => oppKeyword.includes(keyword) || keyword.includes(oppKeyword))
        );

        if (keywordMatches.length > 0) {
            score += 30;
            reasons.push(`Keyword matches: ${keywordMatches.join(', ')}`);
        }

        // Timeline feasibility (20%)
        if (opportunity.awardDate) {
            const awardDate = new Date(opportunity.awardDate);
            const repoUpdated = new Date(repo.updated_at);
            const monthsDiff = (awardDate - repoUpdated) / (1000 * 60 * 60 * 24 * 30);

            if (monthsDiff >= 0 && monthsDiff <= 24) { // Within 2 years
                score += 20;
                reasons.push('Timeline aligns with contract award');
            }
        }

        // Complexity match (10%)
        if (analysis.technicalComplexity >= 3 && opportunity.awardAmount > 1000000) {
            score += 10;
            reasons.push('Complexity level matches contract value');
        }

        return Math.min(100, score);
    }

    /**
     * Get detailed match reasons
     */
    getMatchReasons(repo, analysis, opportunity) {
        const reasons = [];

        // Technical matches
        if (repo.language && opportunity.requirements?.some(req =>
            req.toLowerCase().includes(repo.language.toLowerCase())
        )) {
            reasons.push(`Programming language: ${repo.language}`);
        }

        // Keyword matches
        analysis.governmentKeywords.forEach(keyword => {
            if (opportunity.githubKeywords?.some(oppKeyword =>
                oppKeyword.includes(keyword) || keyword.includes(oppKeyword)
            )) {
                reasons.push(`Shared keyword: ${keyword}`);
            }
        });

        // Technical approach similarity
        if (opportunity.technicalApproach) {
            const repoDesc = (repo.description || '').toLowerCase();
            const approach = opportunity.technicalApproach.toLowerCase();

            if (repoDesc.includes('machine learning') && approach.includes('neural')) {
                reasons.push('Similar technical approach detected');
            }
        }

        return reasons;
    }

    /**
     * Assess potential usage of repository in government contract
     */
    assessPotentialUsage(repo, opportunity) {
        const usage = {
            likelihood: 'low',
            evidence: [],
            usageType: 'unknown',
            confidence: 0
        };

        // High likelihood indicators
        if (opportunity.potentialMatches?.some(match =>
            match.toLowerCase().includes(repo.name.toLowerCase()) ||
            repo.name.toLowerCase().includes(match.toLowerCase())
        )) {
            usage.likelihood = 'high';
            usage.evidence.push('Direct project name match');
            usage.confidence = 90;
        }

        // Medium likelihood indicators
        const technicalOverlap = this.calculateTechnicalOverlap(repo, opportunity);
        if (technicalOverlap > 70) {
            usage.likelihood = 'medium';
            usage.evidence.push(`Technical approach similarity: ${technicalOverlap}%`);
            usage.confidence = 70;
        }

        // Determine usage type
        if (opportunity.technicalApproach?.includes('open source') ||
            opportunity.technicalApproach?.includes('github')) {
            usage.usageType = 'direct_usage';
        } else if (opportunity.awardAmount > 5000000) {
            usage.usageType = 'inspired_by';
        } else {
            usage.usageType = 'reference_material';
        }

        return usage;
    }

    /**
     * Calculate technical overlap between repository and opportunity
     */
    calculateTechnicalOverlap(repo, opportunity) {
        const repoTech = this.extractTechnicalTerms(repo);
        const oppTech = this.extractTechnicalTerms(opportunity);

        const commonTerms = repoTech.filter(term => oppTech.includes(term));
        const totalTerms = new Set([...repoTech, ...oppTech]);

        return Math.round((commonTerms.length / totalTerms.size) * 100);
    }

    /**
     * Extract technical terms from repository/opportunity data
     */
    extractTechnicalTerms(item) {
        const text = [
            item.description,
            item.technicalApproach,
            ...(item.requirements || []),
            ...(item.githubKeywords || [])
        ].filter(Boolean).join(' ').toLowerCase();

        const techTerms = [
            'machine learning', 'neural networks', 'deep learning',
            'blockchain', 'distributed ledger', 'smart contracts',
            'cybersecurity', 'encryption', 'authentication',
            'cloud computing', 'kubernetes', 'docker',
            'microservices', 'api', 'rest', 'graphql',
            'database', 'sql', 'nosql', 'mongodb',
            'devops', 'ci/cd', 'automation', 'testing'
        ];

        return techTerms.filter(term => text.includes(term));
    }

    /**
     * Estimate compensation potential
     */
    estimateCompensation(repo, opportunity, matchScore) {
        const baseValue = opportunity.awardAmount || 1000000;

        // Compensation factor based on match score and project quality
        const matchFactor = matchScore / 100;
        const qualityFactor = Math.min(repo.stargazers_count / 1000, 1); // Cap at 1000 stars
        const complexityFactor = this.getComplexityMultiplier(repo.language);

        const compensation = baseValue * matchFactor * qualityFactor * complexityFactor * 0.1; // 10% of contract value

        return {
            estimatedAmount: Math.round(compensation),
            currency: 'USD',
            confidence: matchScore > 80 ? 'high' : matchScore > 60 ? 'medium' : 'low',
            factors: {
                matchScore: matchScore,
                qualityFactor: qualityFactor,
                complexityFactor: complexityFactor,
                baseContractValue: baseValue
            }
        };
    }

    /**
     * Get complexity multiplier for programming languages
     */
    getComplexityMultiplier(language) {
        const multipliers = {
            'C++': 1.5,
            'Rust': 1.4,
            'Go': 1.3,
            'Java': 1.2,
            'Python': 1.1,
            'JavaScript': 1.0,
            'HTML': 0.8
        };

        return multipliers[language] || 1.0;
    }

    /**
     * Create compensation claim for repository
     */
    async createCompensationClaim(repository, samGovOpportunity, matchData) {
        const claim = {
            id: `CLAIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            repository: {
                owner: repository.owner.login,
                name: repository.name,
                url: repository.html_url,
                stars: repository.stargazers_count,
                forks: repository.forks_count,
                language: repository.language,
                createdAt: repository.created_at,
                lastUpdated: repository.updated_at
            },
            samGovContract: {
                id: samGovOpportunity.id,
                title: samGovOpportunity.title,
                agency: samGovOpportunity.agency,
                awardDate: samGovOpportunity.awardDate,
                awardAmount: samGovOpportunity.awardAmount,
                contractor: samGovOpportunity.contractor
            },
            matchAnalysis: matchData,
            compensationEstimate: matchData.compensationEstimate,
            evidence: this.generateEvidence(repository, samGovOpportunity, matchData),
            status: 'pending_review',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        this.compensationClaims.push(claim);
        return claim;
    }

    /**
     * Generate evidence for compensation claim
     */
    generateEvidence(repository, opportunity, matchData) {
        const evidence = [];

        // Timeline evidence
        const repoDate = new Date(repository.created_at);
        const contractDate = new Date(opportunity.awardDate);
        const monthsDiff = (contractDate - repoDate) / (1000 * 60 * 60 * 24 * 30);

        if (monthsDiff >= 0 && monthsDiff <= 36) {
            evidence.push({
                type: 'timeline',
                strength: monthsDiff <= 12 ? 'strong' : 'moderate',
                description: `Repository created ${Math.round(monthsDiff)} months before contract award`
            });
        }

        // Technical similarity evidence
        if (matchData.matchReasons.length > 0) {
            evidence.push({
                type: 'technical_similarity',
                strength: 'strong',
                description: `Technical approach matches contract requirements: ${matchData.matchReasons.join(', ')}`
            });
        }

        // Usage indicators
        if (opportunity.potentialMatches?.some(match =>
            repository.name.toLowerCase().includes(match.toLowerCase()) ||
            match.toLowerCase().includes(repository.name.toLowerCase())
        )) {
            evidence.push({
                type: 'direct_usage',
                strength: 'very_strong',
                description: 'Direct project name correlation with contract requirements'
            });
        }

        return evidence;
    }

    /**
     * Batch analyze multiple repositories
     */
    async batchAnalyzeRepositories(repositories) {
        const results = [];

        for (const repo of repositories) {
            try {
                const analysis = await this.analyzeRepositoryForContracts(repo.owner.login, repo.name);
                if (analysis && analysis.samGovMatches.length > 0) {
                    results.push(analysis);
                }
            } catch (error) {
                console.error(`Error analyzing ${repo.full_name}:`, error);
            }
        }

        return results;
    }

    /**
     * Get compensation claims
     */
    getCompensationClaims() {
        return this.compensationClaims;
    }

    /**
     * Get detected matches
     */
    getDetectedMatches() {
        return this.detectedMatches;
    }

    /**
     * Export compensation report
     */
    exportCompensationReport() {
        const report = {
            totalClaims: this.compensationClaims.length,
            totalEstimatedValue: this.compensationClaims.reduce((sum, claim) =>
                sum + claim.compensationEstimate.estimatedAmount, 0),
            claims: this.compensationClaims,
            generatedAt: new Date().toISOString(),
            methodology: 'GitHub repository analysis cross-referenced with SAM.gov contract data'
        };

        return report;
    }
}

// Create global instance
window.githubContractDetector = new GitHubContractDetector();

console.log('🔍 GitHub Contract Detector loaded - Government usage analysis available');
