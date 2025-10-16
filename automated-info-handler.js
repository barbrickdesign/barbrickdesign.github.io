/**
 * AUTOMATED INFORMATION HANDLING FOR CONTRACTORS
 * Automatically validates and completes contractor information
 * Integrates with SAM.gov and other data sources for seamless onboarding
 */

class AutomatedInfoHandler {
    constructor() {
        this.validationRules = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^\+?[\d\s\-\(\)]{10,}$/,
            website: /^https?:\/\/.+/,
            uei: /^[A-Z0-9]{12}$/,
            duns: /^\d{9}$/,
            whiteCardNumber: /^\d{16}$/,
            clearanceLevel: /^(CONFIDENTIAL|SECRET|TOP_SECRET|TS_SCI)$/,
            cardType: /^(PIV|CAC|PIV-I)$/,
            experience: /^(0-2|3-5|6-10|11-15|16-20|20\+)$/,
            teamSize: /^(1-5|6-20|21-50|51-100|100\+)$/
        };

        this.requiredFields = [
            'fullName', 'organization', 'email', 'phone',
            'whiteCardNumber', 'whiteCardType', 'whiteCardExpiry',
            'clearanceLevel', 'capabilities', 'teamSize', 'experience'
        ];

        this.enhancementSources = [
            'samgov', 'github', 'linkedin', 'company_website', 'previous_projects'
        ];
    }

    /**
     * Automatically validate and enhance contractor information
     */
    async autoValidateAndEnhance(contractorData, walletAddress) {
        console.log('🔄 Starting automated information validation and enhancement...');

        const result = {
            original: contractorData,
            validated: {},
            enhanced: {},
            missing: [],
            warnings: [],
            errors: [],
            completenessScore: 0,
            enhancementSuggestions: []
        };

        // Step 1: Validate provided data
        const validation = this.validateContractorData(contractorData);
        result.validated = validation.validated;
        result.errors = validation.errors;
        result.warnings = validation.warnings;

        // Step 2: Identify missing information
        result.missing = this.identifyMissingFields(contractorData);

        // Step 3: Enhance with external data sources
        const enhancements = await this.enhanceWithExternalSources(contractorData, walletAddress);
        result.enhanced = enhancements.enhanced;
        result.enhancementSuggestions = enhancements.suggestions;

        // Step 4: Calculate completeness score
        result.completenessScore = this.calculateCompletenessScore(contractorData, result.enhanced);

        console.log(`✅ Automated processing complete. Score: ${result.completenessScore}%`);
        return result;
    }

    /**
     * Validate contractor data against rules
     */
    validateContractorData(data) {
        const validated = {};
        const errors = [];
        const warnings = [];

        for (const [field, value] of Object.entries(data)) {
            if (this.validationRules[field]) {
                const rule = this.validationRules[field];

                if (typeof rule === 'function') {
                    const validation = rule(value);
                    if (!validation.valid) {
                        errors.push(`${field}: ${validation.error}`);
                    }
                } else if (rule instanceof RegExp) {
                    if (!rule.test(value)) {
                        errors.push(`${field}: Invalid format`);
                    }
                } else if (Array.isArray(rule)) {
                    if (!rule.includes(value)) {
                        errors.push(`${field}: Must be one of ${rule.join(', ')}`);
                    }
                }
            }

            // Check for suspicious data patterns
            if (value && typeof value === 'string') {
                if (value.length < 2) {
                    warnings.push(`${field}: Very short value`);
                }
                if (value.includes('test') || value.includes('example')) {
                    warnings.push(`${field}: Contains test/example data`);
                }
            }

            validated[field] = value;
        }

        return { validated, errors, warnings };
    }

    /**
     * Identify missing required fields
     */
    identifyMissingFields(data) {
        const missing = [];

        this.requiredFields.forEach(field => {
            if (!data[field] || data[field].toString().trim() === '') {
                missing.push(field);
            }
        });

        return missing;
    }

    /**
     * Enhance data with external sources
     */
    async enhanceWithExternalSources(data, walletAddress) {
        const enhanced = { ...data };
        const suggestions = [];

        // Enhance with SAM.gov data if available
        if (window.samGovIntegration && data.uei) {
            try {
                const samGovData = await window.samGovIntegration.validateEntity(data.uei);
                if (samGovData.valid) {
                    enhanced.samGovValidated = true;
                    enhanced.samGovEntityName = samGovData.name;
                    enhanced.samGovStatus = samGovData.status;

                    // Auto-fill missing fields from SAM.gov
                    if (!data.organization && samGovData.name) {
                        enhanced.organization = samGovData.name;
                        suggestions.push('Organization auto-filled from SAM.gov');
                    }

                    if (!data.website && samGovData.website) {
                        enhanced.website = samGovData.website;
                        suggestions.push('Website auto-filled from SAM.gov');
                    }
                }
            } catch (error) {
                console.warn('SAM.gov enhancement failed:', error);
            }
        }

        // Enhance with GitHub data if available
        if (window.githubIntegration && walletAddress) {
            try {
                const githubData = await window.githubIntegration.getUserRepositories();
                if (githubData.length > 0) {
                    enhanced.githubProjects = githubData.length;
                    enhanced.hasActiveProjects = githubData.some(repo => {
                        const updated = new Date(repo.updated_at);
                        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                        return updated > thirtyDaysAgo;
                    });

                    // Infer capabilities from GitHub languages
                    const languages = new Set();
                    githubData.forEach(repo => {
                        if (repo.language) languages.add(repo.language);
                    });

                    if (languages.size > 0) {
                        const inferredCapabilities = this.inferCapabilitiesFromLanguages([...languages]);
                        if (inferredCapabilities.length > 0) {
                            enhanced.inferredCapabilities = inferredCapabilities;
                            suggestions.push(`Capabilities inferred from GitHub projects: ${inferredCapabilities.join(', ')}`);
                        }
                    }
                }
            } catch (error) {
                console.warn('GitHub enhancement failed:', error);
            }
        }

        // Auto-generate missing information where possible
        if (!data.certifications && enhanced.inferredCapabilities) {
            enhanced.certifications = this.generateSuggestedCertifications(enhanced.inferredCapabilities);
            suggestions.push('Suggested certifications based on capabilities');
        }

        if (!data.website && data.organization) {
            enhanced.suggestedWebsite = `https://${data.organization.toLowerCase().replace(/\s+/g, '')}.com`;
            suggestions.push('Suggested website based on organization name');
        }

        return { enhanced, suggestions };
    }

    /**
     * Infer technical capabilities from programming languages
     */
    inferCapabilitiesFromLanguages(languages) {
        const capabilities = [];

        if (languages.includes('JavaScript')) capabilities.push('Web Development');
        if (languages.includes('Python')) capabilities.push('Data Science', 'AI/ML');
        if (languages.includes('Java')) capabilities.push('Enterprise Applications');
        if (languages.includes('C++') || languages.includes('C')) capabilities.push('Systems Programming');
        if (languages.includes('Go')) capabilities.push('Cloud Services');
        if (languages.includes('Rust')) capabilities.push('Security', 'Systems Programming');

        return [...new Set(capabilities)];
    }

    /**
     * Generate suggested certifications based on capabilities
     */
    generateSuggestedCertifications(capabilities) {
        const certMap = {
            'Web Development': ['AWS Certified Developer', 'Google Cloud Developer'],
            'Security': ['CISSP', 'Security+', 'CEH'],
            'AI/ML': ['TensorFlow Developer', 'AWS Machine Learning'],
            'Cloud Services': ['AWS Solutions Architect', 'Azure Administrator'],
            'Data Science': ['Certified Analytics Professional', 'SAS Certified'],
            'Project Management': ['PMP', 'Agile Certified Practitioner']
        };

        const suggestions = [];
        capabilities.forEach(cap => {
            if (certMap[cap]) {
                suggestions.push(...certMap[cap]);
            }
        });

        return [...new Set(suggestions)].slice(0, 3); // Limit to 3 suggestions
    }

    /**
     * Calculate completeness score
     */
    calculateCompletenessScore(original, enhanced) {
        const totalFields = this.requiredFields.length + 5; // Required + optional enhanced fields
        let completedFields = 0;

        // Count completed required fields
        this.requiredFields.forEach(field => {
            if (enhanced[field] && enhanced[field].toString().trim() !== '') {
                completedFields++;
            }
        });

        // Count enhanced fields
        if (enhanced.samGovValidated) completedFields++;
        if (enhanced.githubProjects > 0) completedFields++;
        if (enhanced.inferredCapabilities?.length > 0) completedFields++;
        if (enhanced.certifications?.length > 0) completedFields++;
        if (enhanced.website) completedFields++;

        return Math.round((completedFields / totalFields) * 100);
    }

    /**
     * Auto-complete missing information where possible
     */
    async autoCompleteMissing(data, walletAddress) {
        const completed = { ...data };

        // Auto-complete with SAM.gov data
        if (window.samGovIntegration && data.uei) {
            try {
                const samGovData = await window.samGovIntegration.validateEntity(data.uei);
                if (samGovData.valid) {
                    if (!completed.organization) completed.organization = samGovData.name;
                    if (!completed.website && samGovData.website) completed.website = samGovData.website;
                }
            } catch (error) {
                console.warn('Auto-complete with SAM.gov failed:', error);
            }
        }

        // Auto-complete with GitHub data
        if (window.githubIntegration && walletAddress) {
            try {
                const repos = await window.githubIntegration.getUserRepositories();
                if (repos.length > 0) {
                    const languages = new Set();
                    repos.forEach(repo => {
                        if (repo.language) languages.add(repo.language);
                    });

                    const inferredCapabilities = this.inferCapabilitiesFromLanguages([...languages]);
                    if (inferredCapabilities.length > 0) {
                        completed.capabilities = [...new Set([...(completed.capabilities || []), ...inferredCapabilities])];
                    }
                }
            } catch (error) {
                console.warn('Auto-complete with GitHub failed:', error);
            }
        }

        return completed;
    }

    /**
     * Generate automated enhancement plan
     */
    generateEnhancementPlan(contractorData, missingFields) {
        const plan = {
            immediate: [],
            shortTerm: [],
            longTerm: [],
            estimatedTime: 0
        };

        // Immediate fixes (can be auto-completed)
        missingFields.forEach(field => {
            if (this.canAutoComplete(field, contractorData)) {
                plan.immediate.push({
                    field: field,
                    action: 'Auto-complete',
                    description: `Automatically fill ${field} from available data sources`,
                    time: '1-2 minutes'
                });
                plan.estimatedTime += 1;
            }
        });

        // Short-term enhancements (require user input but guided)
        if (missingFields.includes('capabilities')) {
            plan.shortTerm.push({
                field: 'capabilities',
                action: 'Guided selection',
                description: 'Select from suggested capabilities based on your background',
                time: '3-5 minutes'
            });
            plan.estimatedTime += 3;
        }

        if (missingFields.includes('experience')) {
            plan.shortTerm.push({
                field: 'experience',
                action: 'Experience assessment',
                description: 'Quick assessment of your professional experience level',
                time: '2 minutes'
            });
            plan.estimatedTime += 2;
        }

        // Long-term enhancements (require external verification)
        if (missingFields.includes('certifications')) {
            plan.longTerm.push({
                field: 'certifications',
                action: 'Certification upload',
                description: 'Upload or link professional certifications',
                time: '10-15 minutes'
            });
            plan.estimatedTime += 10;
        }

        return plan;
    }

    /**
     * Check if field can be auto-completed
     */
    canAutoComplete(field, data) {
        const autoCompletableFields = {
            'organization': ['uei', 'samGovEntity'],
            'website': ['uei', 'organization'],
            'capabilities': ['githubProjects', 'inferredCapabilities'],
            'email': ['walletAddress'] // Could infer from wallet if needed
        };

        if (autoCompletableFields[field]) {
            return autoCompletableFields[field].some(source => data[source]);
        }

        return false;
    }

    /**
     * Create guided completion workflow
     */
    createGuidedWorkflow(missingFields, currentData) {
        const workflow = {
            steps: [],
            currentStep: 0,
            totalSteps: 0,
            estimatedCompletionTime: 0
        };

        // Create steps for each missing field
        missingFields.forEach((field, index) => {
            const step = {
                id: index + 1,
                field: field,
                title: this.getStepTitle(field),
                description: this.getStepDescription(field),
                required: this.requiredFields.includes(field),
                canSkip: !this.requiredFields.includes(field),
                estimatedTime: this.getStepTime(field),
                autoComplete: this.canAutoComplete(field, currentData)
            };

            workflow.steps.push(step);
        });

        workflow.totalSteps = workflow.steps.length;
        workflow.estimatedCompletionTime = workflow.steps.reduce((total, step) => total + step.estimatedTime, 0);

        return workflow;
    }

    /**
     * Get step title for field
     */
    getStepTitle(field) {
        const titles = {
            'fullName': 'Personal Information',
            'organization': 'Company Details',
            'email': 'Contact Information',
            'phone': 'Phone Number',
            'whiteCardNumber': 'Security Credentials',
            'whiteCardType': 'Card Type',
            'whiteCardExpiry': 'Card Expiration',
            'clearanceLevel': 'Security Clearance',
            'capabilities': 'Technical Skills',
            'teamSize': 'Team Information',
            'experience': 'Professional Experience',
            'certifications': 'Professional Certifications',
            'uei': 'SAM.gov Registration',
            'website': 'Company Website',
            'linkedin': 'LinkedIn Profile'
        };

        return titles[field] || `${field} Information`;
    }

    /**
     * Get step description
     */
    getStepDescription(field) {
        const descriptions = {
            'fullName': 'Enter your full legal name as it appears on official documents',
            'organization': 'Your company or organization name',
            'email': 'Professional email address for contract communications',
            'phone': 'Phone number for contract coordination',
            'whiteCardNumber': 'Your PIV/CAC card number',
            'whiteCardType': 'Type of government-issued identification card',
            'whiteCardExpiry': 'Expiration date of your security credentials',
            'clearanceLevel': 'Your current security clearance level',
            'capabilities': 'Technical skills and expertise areas',
            'teamSize': 'Size of your development team',
            'experience': 'Years of professional experience',
            'certifications': 'Relevant professional certifications',
            'uei': 'Unique Entity Identifier from SAM.gov',
            'website': 'Company website URL',
            'linkedin': 'LinkedIn profile URL'
        };

        return descriptions[field] || `Complete ${field} information`;
    }

    /**
     * Get estimated time for step
     */
    getStepTime(field) {
        const times = {
            'fullName': 1,
            'organization': 1,
            'email': 1,
            'phone': 1,
            'whiteCardNumber': 2,
            'whiteCardType': 1,
            'whiteCardExpiry': 1,
            'clearanceLevel': 1,
            'capabilities': 3,
            'teamSize': 1,
            'experience': 2,
            'certifications': 5,
            'uei': 2,
            'website': 1,
            'linkedin': 1
        };

        return times[field] || 2;
    }
}

// Create global instance
window.automatedInfoHandler = new AutomatedInfoHandler();

console.log('🤖 Automated Information Handler loaded - Smart validation and completion available');
