/**
 * OpenAI API Orchestrator for BarbrickDesign Platform
 * Handles all OpenAI model interactions with secure API key management
 *
 * SECURITY NOTE: Never hardcode API keys in client-side code.
 * This module expects API keys to be provided via secure means (environment variables, user input, etc.)
 *
 * @author BarbrickDesign AI Team
 * @version 1.0.0
 */

class OpenAIOrchestrator {
    constructor(apiKey = null) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.openai.com/v1';
        this.models = {
            // Core Intelligence
            'gpt-5': 'gpt-5',
            'gpt-5-pro': 'gpt-5-pro',
            'gpt-5-codex': 'gpt-5-codex',
            'gpt-4.1': 'gpt-4.1',
            'gpt-4o': 'gpt-4o',

            // Visual & Media
            'gpt-image-1': 'gpt-image-1',
            'gpt-image-1-mini': 'gpt-image-1-mini',
            'dall-e-3': 'dall-e-3',
            'sora-2': 'sora-2',
            'sora-2-pro': 'sora-2-pro',

            // Audio & Realtime
            'gpt-4o-tts': 'gpt-4o-tts',
            'gpt-4o-transcribe': 'gpt-4o-transcribe',
            'gpt-audio': 'gpt-audio',
            'gpt-realtime': 'gpt-realtime',

            // Research
            'o3-deep-research': 'o3-deep-research',
            'o4-mini-deep-research': 'o4-mini-deep-research',

            // Open Weight
            'gpt-oss-120b': 'gpt-oss-120b',
            'gpt-oss-20b': 'gpt-oss-20b',

            // Specialized
            'text-embedding-3-large': 'text-embedding-3-large',
            'omni-moderation': 'omni-moderation',
            'computer-use-preview': 'computer-use-preview',
            'codex-mini-latest': 'codex-mini-latest'
        };

        this.agentMappings = {
            'governor': ['gpt-5-pro', 'sora-2'],
            'scout': ['gpt-4.1', 'gpt-realtime'],
            'archivist': ['o3-deep-research', 'gpt-4o-transcribe'],
            'artist': ['gpt-image-1', 'dall-e-3']
        };
    }

    /**
     * Set API key securely
     * @param {string} key - OpenAI API key
     */
    setApiKey(key) {
        this.apiKey = key;
    }

    /**
     * Make authenticated API request
     * @param {string} endpoint - API endpoint
     * @param {object} payload - Request payload
     * @returns {Promise} - API response
     */
    async makeRequest(endpoint, payload) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not set. Please provide API key securely.');
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Chat completion with specified model
     * @param {string} model - Model name
     * @param {Array} messages - Chat messages
     * @param {object} options - Additional options
     */
    async chatCompletion(model, messages, options = {}) {
        const payload = {
            model: this.models[model] || model,
            messages,
            ...options
        };

        return await this.makeRequest('/chat/completions', payload);
    }

    /**
     * Generate image with DALL-E or GPT Image
     * @param {string} prompt - Image prompt
     * @param {object} options - Generation options
     */
    async generateImage(prompt, options = {}) {
        const payload = {
            prompt,
            ...options
        };

        return await this.makeRequest('/images/generations', payload);
    }

    /**
     * Text-to-speech
     * @param {string} text - Text to convert
     * @param {object} options - TTS options
     */
    async textToSpeech(text, options = {}) {
        const payload = {
            model: 'tts-1',
            input: text,
            voice: 'alloy',
            ...options
        };

        const response = await fetch(`${this.baseURL}/audio/speech`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`TTS API error: ${response.status}`);
        }

        return await response.blob();
    }

    /**
     * Speech-to-text
     * @param {Blob} audioBlob - Audio file
     * @param {object} options - Transcribe options
     */
    async speechToText(audioBlob, options = {}) {
        const formData = new FormData();
        formData.append('file', audioBlob);
        formData.append('model', 'whisper-1');

        Object.keys(options).forEach(key => {
            formData.append(key, options[key]);
        });

        const response = await fetch(`${this.baseURL}/audio/transcriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Speech-to-text API error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Generate embeddings
     * @param {string|Array} input - Text input
     * @param {string} model - Embedding model
     */
    async generateEmbeddings(input, model = 'text-embedding-3-large') {
        const payload = {
            input,
            model: this.models[model] || model
        };

        return await this.makeRequest('/embeddings', payload);
    }

    /**
     * Moderate content
     * @param {string|Array} input - Content to moderate
     */
    async moderateContent(input) {
        const payload = { input };
        return await this.makeRequest('/moderations', payload);
    }

    /**
     * Get models for specific agent type
     * @param {string} agentType - Agent type (governor, scout, etc.)
     * @returns {Array} - Array of model names
     */
    getModelsForAgent(agentType) {
        return this.agentMappings[agentType] || [];
    }

    /**
     * Execute agent action with appropriate model
     * @param {string} agentType - Agent type
     * @param {string} action - Action to perform
     * @param {object} params - Action parameters
     */
    async executeAgentAction(agentType, action, params = {}) {
        const models = this.getModelsForAgent(agentType);
        if (models.length === 0) {
            throw new Error(`No models configured for agent type: ${agentType}`);
        }

        const primaryModel = models[0];

        switch (action) {
            case 'reason':
                return await this.chatCompletion(primaryModel, [
                    { role: 'system', content: `You are a ${agentType} agent in the Gem Bot Universe.` },
                    { role: 'user', content: params.prompt }
                ]);

            case 'generate_image':
                return await this.generateImage(params.prompt, params.options);

            case 'transcribe':
                return await this.speechToText(params.audioBlob, params.options);

            case 'embed':
                return await this.generateEmbeddings(params.text);

            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

// Global instance
window.openAIOrchestrator = new OpenAIOrchestrator();

// Security reminder
console.warn('🔐 SECURITY: OpenAI API key must be provided securely. Never hardcode keys in client-side code. Consider using environment variables or secure key management.');

export default OpenAIOrchestrator;
