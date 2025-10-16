/**
 * SAM.GOV REAL API INTEGRATION
 * Uses actual SAM.gov data services API v2
 * Documentation: https://open.gsa.gov/api/sam-api/
 * 
 * API Key: Get from https://sam.gov/data-services
 */

class SAMGovAPIIntegration {
    constructor(apiKey = null) {
        // Real SAM.gov API endpoints
        this.baseUrl = 'https://api.sam.gov';
        this.opportunitiesEndpoint = `${this.baseUrl}/prod/opportunities/v2/search`;
        this.contractDataEndpoint = `${this.baseUrl}/prod/federalcontractdata/v1/search`;
        this.entityEndpoint = `${this.baseUrl}/prod/entity-information/v2/entities`;
        
        // API Key from environment or parameter
        this.apiKey = apiKey || this.getApiKeyFromStorage();
        
        this.cache = {
            opportunities: [],
            contracts: [],
            lastUpdate: null
        };
    }

    /**
     * Get or prompt for API key
     */
    getApiKeyFromStorage() {
        const stored = localStorage.getItem('samgov_api_key');
        if (!stored) {
            console.warn('⚠️ SAM.gov API key not found. Get one at: https://sam.gov/data-services');
        }
        return stored;
    }

    /**
     * Set API key and save to localStorage
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('samgov_api_key', apiKey);
        console.log('✅ SAM.gov API key saved');
    }

    /**
     * Search for contract opportunities
     */
    async searchOpportunities(params = {}) {
        if (!this.apiKey) {
            throw new Error('API key required. Get one at https://sam.gov/data-services');
        }

        const defaultParams = {
            limit: 10,
            offset: 0,
            postedFrom: this.getDateDaysAgo(30), // Last 30 days
            postedTo: this.getTodayDate()
        };

        const queryParams = { ...defaultParams, ...params };
        const url = this.buildUrl(this.opportunitiesEndpoint, queryParams);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            this.cache.opportunities = data.opportunitiesData || [];
            this.cache.lastUpdate = new Date().toISOString();
            
            return {
                success: true,
                opportunities: data.opportunitiesData || [],
                total: data.totalRecords || 0,
                metadata: {
                    limit: queryParams.limit,
                    offset: queryParams.offset
                }
            };
        } catch (error) {
            console.error('SAM.gov API Error:', error);
            return {
                success: false,
                error: error.message,
                opportunities: []
            };
        }
    }

    /**
     * Search federal contract award data
     */
    async searchContracts(params = {}) {
        if (!this.apiKey) {
            throw new Error('API key required. Get one at https://sam.gov/data-services');
        }

        const defaultParams = {
            limit: 100,
            offset: 0
        };

        const queryParams = { ...defaultParams, ...params };
        const url = this.buildUrl(this.contractDataEndpoint, queryParams);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            this.cache.contracts = data.results || [];
            
            return {
                success: true,
                contracts: data.results || [],
                total: data.totalRecords || 0
            };
        } catch (error) {
            console.error('SAM.gov Contract API Error:', error);
            return {
                success: false,
                error: error.message,
                contracts: []
            };
        }
    }

    /**
     * Find opportunities matching project keywords
     */
    async findMatchingOpportunities(projectKeywords = []) {
        const allOpportunities = [];
        
        for (const keyword of projectKeywords) {
            const result = await this.searchOpportunities({
                keyword: keyword,
                limit: 50
            });
            
            if (result.success) {
                allOpportunities.push(...result.opportunities);
            }
        }

        // Deduplicate by noticeId
        const uniqueOpps = this.deduplicateByField(allOpportunities, 'noticeId');
        
        return {
            success: true,
            opportunities: uniqueOpps,
            keywords: projectKeywords
        };
    }

    /**
     * Calculate project value based on similar contracts
     */
    async calculateProjectValue(projectType, projectKeywords) {
        const result = await this.searchContracts({
            keyword: projectKeywords.join(' OR ')
        });

        if (!result.success || result.contracts.length === 0) {
            return this.getEstimatedValue(projectType);
        }

        const values = result.contracts
            .filter(c => c.dollarObligated && c.dollarObligated > 0)
            .map(c => parseFloat(c.dollarObligated));

        if (values.length === 0) {
            return this.getEstimatedValue(projectType);
        }

        const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);

        return {
            success: true,
            averageContractValue: Math.round(avgValue),
            highestContractValue: Math.round(maxValue),
            lowestContractValue: Math.round(minValue),
            totalContracts: values.length,
            projectEstimate: Math.round(avgValue * 0.7), // 70% of avg for new project
            confidence: values.length >= 10 ? 'HIGH' : values.length >= 5 ? 'MEDIUM' : 'LOW',
            dataSource: 'SAM.gov Live Data'
        };
    }

    /**
     * Get entity/vendor information
     */
    async getEntityInfo(ueiSAM) {
        if (!this.apiKey) {
            throw new Error('API key required');
        }

        const url = `${this.entityEndpoint}?ueiSAM=${ueiSAM}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                entity: data.entityData?.[0] || null
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Helper: Build URL with query params
     */
    buildUrl(baseUrl, params) {
        const url = new URL(baseUrl);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });
        return url.toString();
    }

    /**
     * Helper: Get date X days ago in YYYY-MM-DD format
     */
    getDateDaysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    }

    /**
     * Helper: Get today's date in YYYY-MM-DD format
     */
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Helper: Deduplicate array by field
     */
    deduplicateByField(arr, field) {
        const seen = new Set();
        return arr.filter(item => {
            const val = item[field];
            if (seen.has(val)) return false;
            seen.add(val);
            return true;
        });
    }

    /**
     * Fallback estimated value
     */
    getEstimatedValue(projectType) {
        const estimates = {
            'web3-platform': 5000000,
            'security-tool': 3500000,
            'infrastructure': 7000000,
            'terminal': 2000000,
            'utility': 1500000,
            'game': 4000000
        };

        return {
            success: true,
            projectEstimate: estimates[projectType] || 2000000,
            confidence: 'ESTIMATED',
            dataSource: 'Estimated (No SAM.gov data available)',
            note: 'Unable to find similar contracts. Using industry estimates.'
        };
    }

    /**
     * Generate API key registration instructions
     */
    static getAPIKeyInstructions() {
        return `
🔑 HOW TO GET SAM.GOV API KEY:

1. Visit: https://sam.gov/data-services
2. Create a free account or sign in
3. Request an API key (approval within 24 hours)
4. Copy your API key
5. Enter it in the app when prompted

API KEY FEATURES:
✅ Free tier: 1,000 requests/day
✅ Access to all federal contract data
✅ Real-time opportunity notifications
✅ Historical contract awards data
✅ Vendor entity information

RATE LIMITS:
- 1,000 requests per 24 hours (free tier)
- 10 requests per second
- Upgrade available for higher limits
        `.trim();
    }
}

// Create global instance
window.samGovAPI = new SAMGovAPIIntegration();

// Check for API key on load
if (!window.samGovAPI.apiKey) {
    console.log('📋 SAM.gov API Integration loaded');
    console.log(SAMGovAPIIntegration.getAPIKeyInstructions());
} else {
    console.log('✅ SAM.gov API Integration loaded with API key');
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SAMGovAPIIntegration;
}
