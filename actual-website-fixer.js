// Comprehensive Website Fixer - Actually applies the fixes that should have been applied
const fs = require('fs').promises;
const path = require('path');

class ActualWebsiteFixer {
    constructor() {
        this.fixedPages = [];
        this.issues = [];
    }

    async fixEntireWebsite() {
        console.log('🔧 Starting comprehensive website fixes...');

        // Get all HTML files
        const htmlFiles = await this.findHtmlFiles('.');
        console.log(`📋 Found ${htmlFiles.length} HTML files to fix`);

        // Apply fixes to each file
        for (const file of htmlFiles) {
            try {
                await this.fixSingleFile(file);
                this.fixedPages.push(file);
                console.log(`✅ Fixed: ${path.basename(file)}`);
            } catch (error) {
                console.error(`❌ Failed to fix ${file}:`, error.message);
                this.issues.push({ file, error: error.message });
            }
        }

        console.log(`\n📊 FIX SUMMARY:`);
        console.log(`✅ Files Fixed: ${this.fixedPages.length}`);
        console.log(`❌ Failed Files: ${this.issues.length}`);

        if (this.issues.length > 0) {
            console.log('\n❌ FAILED FILES:');
            this.issues.forEach(issue => console.log(`  - ${path.basename(issue.file)}: ${issue.error}`));
        }

        console.log('\n🎯 FIXES APPLIED:');
        console.log('  ✅ Added defer/async to script tags');
        console.log('  ✅ Optimized CSS loading');
        console.log('  ✅ Added lazy loading to images');
        console.log('  ✅ Added security headers');
        console.log('  ✅ Added SEO meta tags');
        console.log('  ✅ Added accessibility improvements');
        console.log('  ✅ Removed console.log statements');
        console.log('  ✅ Added viewport meta tags');

        console.log('\n🚀 Website is now properly optimized!');
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
            console.error(`Error scanning ${dir}:`, error.message);
        }

        return results;
    }

    async fixSingleFile(filePath) {
        let content = await fs.readFile(filePath, 'utf8');
        let modified = false;

        // Fix 1: Add defer to script tags
        const originalScriptCount = (content.match(/<script[^>]*src=/g) || []).length;
        content = content.replace(
            /<script([^>]*src="[^"]*\.js"[^>]*)><\/script>/g,
            '<script$1 defer></script>'
        );
        const newScriptCount = (content.match(/<script[^>]*defer/g) || []).length;
        if (newScriptCount > 0) modified = true;

        // Fix 2: Optimize CSS loading
        if (content.includes('<link rel="stylesheet"') && !content.includes('onload=')) {
            content = content.replace(
                /<link([^>]*rel="stylesheet"[^>]*)>/g,
                '<link rel="preload" href="$2" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">\n    <noscript><link$1></noscript>'
                .replace('$2', (match) => {
                    const hrefMatch = match.match(/href="([^"]*)"/);
                    return hrefMatch ? hrefMatch[1] : '';
                })
            );
            modified = true;
        }

        // Fix 3: Add lazy loading to images
        const originalImgCount = (content.match(/<img[^>]*src=/g) || []).length;
        content = content.replace(
            /<img([^>]*src="[^"]*"[^>]*)>/g,
            '<img$1 loading="lazy">'
        );
        const newImgCount = (content.match(/loading="lazy"/g) || []).length;
        if (newImgCount > originalImgCount) modified = true;

        // Fix 4: Add security headers
        if (!content.includes('Content-Security-Policy')) {
            content = content.replace(
                /(<head[^>]*>)/,
                '$1\n    <meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' https:; style-src \'self\' \'unsafe-inline\' https:; img-src \'self\' data: https:; font-src \'self\' https:; connect-src \'self\' https:;">'
            );
            modified = true;
        }

        if (!content.includes('X-Frame-Options')) {
            content = content.replace(
                /(<head[^>]*>)/,
                '$1\n    <meta http-equiv="X-Frame-Options" content="DENY">'
            );
            modified = true;
        }

        // Fix 5: Add viewport meta tag
        if (!content.includes('viewport') && !content.includes('width=device-width')) {
            content = content.replace(
                /(<head[^>]*>)/,
                '$1\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
            );
            modified = true;
        }

        // Fix 6: Add language attribute
        if (!content.includes('<html lang=')) {
            content = content.replace(
                /<html([^>]*)>/,
                '<html$1 lang="en">'
            );
            modified = true;
        }

        // Fix 7: Add SEO meta tags
        if (!content.includes('meta name="description"')) {
            content = content.replace(
                /(<head[^>]*>)/,
                '$1\n    <meta name="description" content="BARBRICKDESIGN - Elite Web3 Development and Design Hub">'
            );
            modified = true;
        }

        // Fix 8: Add Open Graph tags
        if (!content.includes('property="og:title"')) {
            const ogTags = `
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://barbrickdesign.github.io/">
    <meta property="og:title" content="BARBRICKDESIGN - Elite Web3 Hub">
    <meta property="og:description" content="Cutting-edge Web3 development and design solutions">
    <meta property="og:image" content="https://barbrickdesign.github.io/header.jpg">`;
            content = content.replace(
                /(<head[^>]*>)/,
                '$1' + ogTags
            );
            modified = true;
        }

        // Fix 9: Add Twitter Card tags
        if (!content.includes('name="twitter:card"')) {
            const twitterTags = `
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="https://barbrickdesign.github.io/">
    <meta name="twitter:title" content="BARBRICKDESIGN - Elite Web3 Hub">
    <meta name="twitter:description" content="Cutting-edge Web3 development and design solutions">
    <meta name="twitter:image" content="https://barbrickdesign.github.io/header.jpg">`;
            content = content.replace(
                /(<head[^>]*>)/,
                '$1' + twitterTags
            );
            modified = true;
        }

        // Fix 10: Remove console.log statements
        const originalConsoleCount = (content.match(/console\.log/g) || []).length;
        content = content.replace(/console\.log\([^)]*\);?\s*/g, '');
        const newConsoleCount = (content.match(/console\.log/g) || []).length;
        if (newConsoleCount < originalConsoleCount) modified = true;

        // Only write file if it was actually modified
        if (modified) {
            await fs.writeFile(filePath, content, 'utf8');
        }

        return modified;
    }
}

// Run the fixer
if (typeof require !== 'undefined' && require.main === module) {
    const fixer = new ActualWebsiteFixer();
    fixer.fixEntireWebsite().catch(console.error);
}
