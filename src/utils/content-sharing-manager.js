/**
 * Content Sharing Manager for Gem Bot Universe
 * Manages sharing of generated content (images, videos, text, tutorials) across projects
 * Provides access control for Austin, Arya, Andy, and authorized users
 *
 * @author BarbrickDesign AI Team
 * @version 1.0.0
 */

class ContentSharingManager {
    constructor() {
        this.storageKey = 'gem_bot_content_library';
        this.accessKey = 'content_access_permissions';
        this.content = this.loadContent();
        this.permissions = this.loadPermissions();
    }

    /**
     * Authorized users/wallets for content access
     */
    get authorizedUsers() {
        return [
            'austin', 'arya', 'andy', 'ryan', // Named users
            '0xefc6910e7624f164dae9d0f799954aa69c943c8d', // System Architect 1
            '0x4ccbefd7d3554bcbbc489b11af73a84d7baef4cb', // System Architect 2
            '0x45a328572b2a06484e02eb5d4e4cb6004136eb16'  // System Architect 3
        ];
    }

    /**
     * Load stored content library
     */
    loadContent() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {
                images: [],
                videos: [],
                tutorials: [],
                text: [],
                metadata: {
                    totalItems: 0,
                    lastUpdated: new Date().toISOString(),
                    version: '1.0.0'
                }
            };
        } catch (error) {
            console.error('Failed to load content library:', error);
            return this.getDefaultContent();
        }
    }

    /**
     * Load access permissions
     */
    loadPermissions() {
        try {
            const stored = localStorage.getItem(this.accessKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Failed to load permissions:', error);
            return {};
        }
    }

    /**
     * Get default content structure
     */
    getDefaultContent() {
        return {
            images: [],
            videos: [],
            tutorials: [],
            text: [],
            metadata: {
                totalItems: 0,
                lastUpdated: new Date().toISOString(),
                version: '1.0.0'
            }
        };
    }

    /**
     * Check if user has access to content
     * @param {string} userId - User identifier (name or wallet address)
     * @returns {boolean}
     */
    hasAccess(userId) {
        // Case-insensitive wallet comparison
        const normalizedUserId = userId.toLowerCase();
        return this.authorizedUsers.some(user =>
            user.toLowerCase() === normalizedUserId
        );
    }

    /**
     * Grant access to a user
     * @param {string} userId - User identifier
     * @param {string} grantedBy - Who granted access
     */
    grantAccess(userId, grantedBy = 'system') {
        this.permissions[userId] = {
            granted: true,
            grantedBy,
            grantedAt: new Date().toISOString(),
            level: 'full'
        };
        this.savePermissions();
        console.log(`✅ Access granted to ${userId} by ${grantedBy}`);
    }

    /**
     * Add content to library
     * @param {string} type - Content type (image, video, tutorial, text)
     * @param {object} contentData - Content data
     * @param {string} creator - Content creator
     */
    addContent(type, contentData, creator = 'system') {
        if (!this.content[type]) {
            throw new Error(`Invalid content type: ${type}`);
        }

        const item = {
            id: this.generateId(),
            type,
            data: contentData,
            creator,
            createdAt: new Date().toISOString(),
            accessLevel: 'authorized', // authorized, public, private
            tags: contentData.tags || [],
            metadata: {
                project: contentData.project || 'gem-bot-universe',
                category: contentData.category || 'generated',
                ...contentData.metadata
            }
        };

        this.content[type].push(item);
        this.content.metadata.totalItems++;
        this.content.metadata.lastUpdated = new Date().toISOString();

        this.saveContent();
        console.log(`✅ Added ${type} content: ${item.id}`);

        return item.id;
    }

    /**
     * Get content by type and filters
     * @param {string} type - Content type
     * @param {object} filters - Filter options
     * @param {string} userId - Requesting user ID
     * @returns {Array} - Filtered content
     */
    getContent(type = null, filters = {}, userId = null) {
        // Check access
        if (userId && !this.hasAccess(userId)) {
            throw new Error('Access denied: Unauthorized user');
        }

        let results = [];

        if (type) {
            if (!this.content[type]) {
                throw new Error(`Invalid content type: ${type}`);
            }
            results = [...this.content[type]];
        } else {
            // Get all content types
            Object.keys(this.content).forEach(contentType => {
                if (Array.isArray(this.content[contentType])) {
                    results.push(...this.content[contentType]);
                }
            });
        }

        // Apply filters
        if (filters.creator) {
            results = results.filter(item => item.creator === filters.creator);
        }

        if (filters.project) {
            results = results.filter(item => item.metadata.project === filters.project);
        }

        if (filters.category) {
            results = results.filter(item => item.metadata.category === filters.category);
        }

        if (filters.tags && filters.tags.length > 0) {
            results = results.filter(item =>
                filters.tags.some(tag => item.tags.includes(tag))
            );
        }

        if (filters.accessLevel) {
            results = results.filter(item => item.accessLevel === filters.accessLevel);
        }

        // Sort by creation date (newest first)
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return results;
    }

    /**
     * Get content by ID
     * @param {string} contentId - Content ID
     * @param {string} userId - Requesting user ID
     * @returns {object|null} - Content item
     */
    getContentById(contentId, userId = null) {
        // Check access
        if (userId && !this.hasAccess(userId)) {
            throw new Error('Access denied: Unauthorized user');
        }

        // Search all content types
        for (const type of Object.keys(this.content)) {
            if (Array.isArray(this.content[type])) {
                const item = this.content[type].find(item => item.id === contentId);
                if (item) return item;
            }
        }

        return null;
    }

    /**
     * Update content item
     * @param {string} contentId - Content ID
     * @param {object} updates - Updates to apply
     * @param {string} userId - Updating user ID
     */
    updateContent(contentId, updates, userId = null) {
        // Check access
        if (userId && !this.hasAccess(userId)) {
            throw new Error('Access denied: Unauthorized user');
        }

        const item = this.getContentById(contentId);
        if (!item) {
            throw new Error(`Content not found: ${contentId}`);
        }

        // Apply updates
        Object.assign(item, updates);
        item.updatedAt = new Date().toISOString();

        this.saveContent();
        console.log(`✅ Updated content: ${contentId}`);

        return item;
    }

    /**
     * Delete content item
     * @param {string} contentId - Content ID
     * @param {string} userId - Deleting user ID
     */
    deleteContent(contentId, userId = null) {
        // Check access
        if (userId && !this.hasAccess(userId)) {
            throw new Error('Access denied: Unauthorized user');
        }

        // Find and remove item
        for (const type of Object.keys(this.content)) {
            if (Array.isArray(this.content[type])) {
                const index = this.content[type].findIndex(item => item.id === contentId);
                if (index !== -1) {
                    this.content[type].splice(index, 1);
                    this.content.metadata.totalItems--;
                    this.content.metadata.lastUpdated = new Date().toISOString();
                    this.saveContent();
                    console.log(`🗑️ Deleted content: ${contentId}`);
                    return true;
                }
            }
        }

        throw new Error(`Content not found: ${contentId}`);
    }

    /**
     * Share content with specific users
     * @param {string} contentId - Content ID
     * @param {Array} userIds - User IDs to share with
     * @param {string} sharedBy - Who is sharing
     */
    shareContent(contentId, userIds, sharedBy = 'system') {
        const item = this.getContentById(contentId);
        if (!item) {
            throw new Error(`Content not found: ${contentId}`);
        }

        if (!item.sharedWith) {
            item.sharedWith = [];
        }

        userIds.forEach(userId => {
            if (!item.sharedWith.includes(userId)) {
                item.sharedWith.push(userId);
            }
        });

        item.sharedBy = sharedBy;
        item.sharedAt = new Date().toISOString();

        this.saveContent();
        console.log(`📤 Shared content ${contentId} with ${userIds.length} users`);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'content_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Save content to storage
     */
    saveContent() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.content));
        } catch (error) {
            console.error('Failed to save content:', error);
        }
    }

    /**
     * Save permissions to storage
     */
    savePermissions() {
        try {
            localStorage.setItem(this.accessKey, JSON.stringify(this.permissions));
        } catch (error) {
            console.error('Failed to save permissions:', error);
        }
    }

    /**
     * Get content statistics
     */
    getStats() {
        const stats = {
            totalItems: this.content.metadata.totalItems,
            byType: {},
            byCreator: {},
            byProject: {},
            lastUpdated: this.content.metadata.lastUpdated
        };

        // Count by type
        Object.keys(this.content).forEach(type => {
            if (Array.isArray(this.content[type])) {
                stats.byType[type] = this.content[type].length;
            }
        });

        // Count by creator and project
        this.getContent().forEach(item => {
            stats.byCreator[item.creator] = (stats.byCreator[item.creator] || 0) + 1;
            stats.byProject[item.metadata.project] = (stats.byProject[item.metadata.project] || 0) + 1;
        });

        return stats;
    }

    /**
     * Export content library
     */
    exportLibrary() {
        return {
            content: this.content,
            permissions: this.permissions,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * Import content library
     * @param {object} libraryData - Exported library data
     */
    importLibrary(libraryData) {
        if (libraryData.content && libraryData.permissions) {
            this.content = libraryData.content;
            this.permissions = libraryData.permissions;
            this.saveContent();
            this.savePermissions();
            console.log('✅ Content library imported');
        } else {
            throw new Error('Invalid library data format');
        }
    }

    /**
     * Initialize content sharing manager
     */
    init() {
        console.log('📚 Content Sharing Manager initialized');
        console.log('Authorized users:', this.authorizedUsers.length);
        console.log('Content items:', this.content.metadata.totalItems);
    }
}

// Global instance
window.contentSharingManager = new ContentSharingManager();
window.contentSharingManager.init();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentSharingManager;
}

export default ContentSharingManager;
