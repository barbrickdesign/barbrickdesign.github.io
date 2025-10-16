/**
 * FPDS Contract Number Schema Parser & Validator
 * Based on Federal Procurement Data System contract numbering standards
 * 
 * Standard Contract Number Format:
 * [AGENCY]-[YEAR]-[TYPE]-[NUMBER]-[MOD]
 * 
 * Example: FA8750-23-C-0001-P00001
 * - FA8750: Air Force agency code
 * - 23: Fiscal Year 2023
 * - C: Contract type (C=Contract, D=Delivery Order, etc.)
 * - 0001: Sequential contract number
 * - P00001: Modification number
 */

class FPDSContractSchema {
    constructor() {
        // Prevent infinite recursion
        this._parsingStack = new Set();
        
        // Major Federal Agencies and their contract prefix codes
        this.agencyCodes = {
            // Department of Defense
            'FA': 'Department of the Air Force',
            'W': 'Department of the Army',
            'N': 'Department of the Navy',
            'SP': 'Defense Logistics Agency',
            'H92': 'Defense Information Systems Agency',
            'HQ': 'Defense Contract Management Agency',
            
            // Civilian Agencies
            'GS': 'General Services Administration',
            'NNG': 'NASA',
            'HHSN': 'Health and Human Services',
            'DOE': 'Department of Energy',
            'AG': 'Department of Agriculture',
            'DOT': 'Department of Transportation',
            'HSHQ': 'Department of Homeland Security',
            'DOJ': 'Department of Justice',
            'DHS': 'Department of Homeland Security',
            'ED': 'Department of Education',
            'EPA': 'Environmental Protection Agency',
            'VA': 'Department of Veterans Affairs',
            'DOC': 'Department of Commerce',
            'DOL': 'Department of Labor',
            'DOS': 'Department of State',
            'DOI': 'Department of Interior',
            'USAID': 'U.S. Agency for International Development',
            'NRC': 'Nuclear Regulatory Commission',
            'NSF': 'National Science Foundation',
            'SSA': 'Social Security Administration'
        };
        
        // Contract Types
        this.contractTypes = {
            'C': 'Contract',
            'D': 'Delivery Order',
            'P': 'Purchase Order',
            'A': 'Agreement/Award',
            'M': 'BPA Call',
            'G': 'Grant',
            'L': 'Lease',
            'T': 'Task Order',
            'S': 'Supply Order',
            'R': 'Research Agreement'
        };
        
        // Contract Pricing Types
        this.pricingTypes = {
            'FFP': 'Firm Fixed Price',
            'FPIF': 'Fixed Price Incentive Fee',
            'CPFF': 'Cost Plus Fixed Fee',
            'CPIF': 'Cost Plus Incentive Fee',
            'CPAF': 'Cost Plus Award Fee',
            'T&M': 'Time and Materials',
            'LH': 'Labor Hour',
            'FFP-EPA': 'Firm Fixed Price with Economic Price Adjustment',
            'FP-EPA': 'Fixed Price with Economic Price Adjustment'
        };
        
        // Set-Aside Types
        this.setAsideTypes = {
            'SB': 'Small Business Set-Aside',
            '8A': '8(a) Set-Aside',
            'HZ': 'HUBZone Set-Aside',
            'SDVOSB': 'Service-Disabled Veteran-Owned Small Business',
            'WOSB': 'Women-Owned Small Business',
            'EDWOSB': 'Economically Disadvantaged Women-Owned Small Business',
            'VSB': 'Veteran-Owned Small Business',
            'SDB': 'Small Disadvantaged Business',
            'NONE': 'Full and Open Competition'
        };
    }
    
    /**
     * Parse a contract number into its components
     * @param {string} contractNumber - The contract number to parse
     * @returns {object} Parsed contract details
     */
    parseContractNumber(contractNumber) {
        if (!contractNumber || typeof contractNumber !== 'string') {
            return { valid: false, error: 'Invalid contract number format' };
        }
        
        // Prevent infinite recursion
        const stackKey = contractNumber.toLowerCase().trim();
        if (this._parsingStack.has(stackKey)) {
            return { valid: false, error: 'Circular reference detected' };
        }
        
        this._parsingStack.add(stackKey);
        
        try {
            const cleaned = contractNumber.trim().toUpperCase();
        
            // Try to match standard format: AGENCY-YEAR-TYPE-NUMBER-MOD
            const standardPattern = /^([A-Z0-9]+)-(\d{2})-([A-Z])-(\d+)(-([A-Z]\d+))?$/;
            const match = cleaned.match(standardPattern);
            
            if (match) {
                const [, agencyCode, fiscalYear, typeCode, sequenceNumber, , modNumber] = match;
                
                return {
                    valid: true,
                    raw: contractNumber,
                    normalized: cleaned,
                    components: {
                        agencyCode: agencyCode,
                        agencyName: this.getAgencyName(agencyCode),
                        fiscalYear: '20' + fiscalYear,
                        contractType: typeCode,
                        contractTypeName: this.contractTypes[typeCode] || 'Unknown Type',
                        sequenceNumber: sequenceNumber,
                        modificationNumber: modNumber || 'Base Contract'
                    },
                    isModification: !!modNumber,
                    formattedDisplay: this.formatContractNumber(cleaned)
                };
            }
            
            // Try alternative DoD format: DAAAC-YY-C-NNNN
            const dodPattern = /^([A-Z0-9]{5})-(\d{2})-([A-Z])-(\d{4})(-([A-Z]\d+))?$/;
            const dodMatch = cleaned.match(dodPattern);
            
            if (dodMatch) {
                const [, dodaac, fiscalYear, typeCode, sequenceNumber, , modNumber] = dodMatch;
                
                return {
                    valid: true,
                    raw: contractNumber,
                    normalized: cleaned,
                    components: {
                        agencyCode: dodaac,
                        agencyName: this.getAgencyName(dodaac.substring(0, 2)),
                        dodaac: dodaac,
                        fiscalYear: '20' + fiscalYear,
                        contractType: typeCode,
                        contractTypeName: this.contractTypes[typeCode] || 'Unknown Type',
                        sequenceNumber: sequenceNumber,
                        modificationNumber: modNumber || 'Base Contract'
                    },
                    isModification: !!modNumber,
                    isDoDContract: true,
                    formattedDisplay: this.formatContractNumber(cleaned)
                };
            }
            
            // Try PIID format (Procurement Instrument Identifier)
            const piidPattern = /^([A-Z0-9]+)(\d{13})$/;
            const piidMatch = cleaned.match(piidPattern);
            
            if (piidMatch) {
                return {
                    valid: true,
                    raw: contractNumber,
                    normalized: cleaned,
                    isPIID: true,
                    components: {
                        agencyCode: piidMatch[1],
                        agencyName: this.getAgencyName(piidMatch[1]),
                        piidNumber: piidMatch[2]
                    },
                    formattedDisplay: contractNumber
                };
            }
            
            // Fallback: Try to extract any useful information
            return {
                valid: false,
                raw: contractNumber,
                error: 'Unrecognized contract number format',
                suggestion: 'Expected format: AGENCY-YY-T-NNNN or similar'
            };
            
        } finally {
            // Always clean up the recursion stack
            this._parsingStack.delete(stackKey);
        }
    }
    
    /**
     * Get agency name from code
     */
    getAgencyName(code) {
        // Try exact match
        if (this.agencyCodes[code]) {
            return this.agencyCodes[code];
        }
        
        // Try partial match (e.g., "FA8750" -> "FA")
        for (const [key, value] of Object.entries(this.agencyCodes)) {
            if (code.startsWith(key)) {
                return value;
            }
        }
        
        return 'Unknown Agency';
    }
    
    /**
     * Format contract number for display
     */
    formatContractNumber(contractNumber) {
        const parsed = this.parseContractNumber(contractNumber);
        if (!parsed.valid) return contractNumber;
        
        const comp = parsed.components;
        return `${comp.agencyCode}-${comp.fiscalYear?.slice(-2)}-${comp.contractType}-${comp.sequenceNumber}`;
    }
    
    /**
     * Validate contract number
     */
    validateContractNumber(contractNumber) {
        const parsed = this.parseContractNumber(contractNumber);
        return {
            valid: parsed.valid,
            errors: parsed.valid ? [] : [parsed.error],
            warnings: this.getValidationWarnings(parsed)
        };
    }
    
    /**
     * Get validation warnings
     */
    getValidationWarnings(parsed) {
        const warnings = [];
        
        if (parsed.valid) {
            const comp = parsed.components;
            
            // Check fiscal year validity
            const currentYear = new Date().getFullYear();
            const contractYear = parseInt(comp.fiscalYear);
            
            if (contractYear > currentYear + 1) {
                warnings.push('Contract fiscal year is in the future');
            }
            
            if (contractYear < 1990) {
                warnings.push('Contract fiscal year is very old');
            }
            
            // Check agency recognition
            if (comp.agencyName === 'Unknown Agency') {
                warnings.push('Agency code not recognized');
            }
        }
        
        return warnings;
    }
    
    /**
     * Generate a sample contract number
     */
    generateSampleContractNumber(agencyCode = 'GS', fiscalYear = null) {
        const year = fiscalYear || new Date().getFullYear();
        const yearShort = year.toString().slice(-2);
        const randomSeq = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        
        return `${agencyCode}-${yearShort}-C-${randomSeq}`;
    }
    
    /**
     * Get contract metadata from FPDS
     */
    async fetchContractMetadata(contractNumber) {
        // This would normally call FPDS API
        // For now, return mock data based on parsed number
        const parsed = this.parseContractNumber(contractNumber);
        
        if (!parsed.valid) {
            return { error: 'Invalid contract number' };
        }
        
        // Mock FPDS data
        return {
            piid: contractNumber,
            ...parsed.components,
            awardedDate: `${parsed.components.fiscalYear}-10-01`,
            obligatedAmount: Math.floor(Math.random() * 10000000),
            baseAndAllOptionsValue: Math.floor(Math.random() * 15000000),
            pricingType: 'FFP',
            setAside: 'SB',
            placeOfPerformance: 'Multiple Locations',
            naicsCode: '541512',
            naicsDescription: 'Computer Systems Design Services',
            vendor: {
                name: 'Sample Contractor LLC',
                duns: '123456789',
                cageCode: 'ABCDE'
            },
            description: `${parsed.components.contractTypeName} for technical services`,
            fpdsUrl: `https://www.fpds.gov/fpdsng_cms/index.php/en/reports.html`
        };
    }
    
    /**
     * Search contracts by criteria
     */
    searchContracts(criteria = {}) {
        // Mock search results
        const results = [];
        const agencies = Object.keys(this.agencyCodes).slice(0, 5);
        
        for (let i = 0; i < 10; i++) {
            const agency = agencies[Math.floor(Math.random() * agencies.length)];
            const contractNum = this.generateSampleContractNumber(agency);
            const parsed = this.parseContractNumber(contractNum);
            
            results.push({
                contractNumber: contractNum,
                ...parsed.components,
                value: Math.floor(Math.random() * 10000000),
                status: ['Active', 'Completed', 'In Progress'][Math.floor(Math.random() * 3)]
            });
        }
        
        return results;
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.FPDSContractSchema = FPDSContractSchema;
    window.fpdsSchema = new FPDSContractSchema();
    console.log('📋 FPDS Contract Schema system loaded');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FPDSContractSchema;
}
