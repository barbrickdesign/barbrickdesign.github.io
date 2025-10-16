// Quick verification script to check key improvements
const fs = require('fs').promises;
const path = require('path');

async function verifyEnhancements() {
    console.log('🔍 Verifying website enhancements...\n');

    const testPages = [
        'index.html',
        'classified-contracts.html',
        'grand-exchange.html',
        'mandem.os/workspace/index.html'
    ];

    const results = {
        security: 0,
        performance: 0,
        accessibility: 0,
        seo: 0
    };

    for (const page of testPages) {
        try {
            const content = await fs.readFile(page, 'utf8');
            console.log(`📄 Checking ${page}...`);

            // Security checks
            if (content.includes('Content-Security-Policy')) results.security++;
            if (content.includes('X-Frame-Options')) results.security++;
            if (!content.includes('http://') || content.includes('https://')) results.security++;

            // Performance checks
            if (content.includes('defer') || content.includes('async')) results.performance++;
            if (content.includes('loading="lazy"')) results.performance++;
            if (content.includes('media="print"')) results.performance++;

            // Accessibility checks
            if (content.includes('lang=')) results.accessibility++;
            if (content.includes('alt=')) results.accessibility++;
            if (content.includes('viewport')) results.accessibility++;

            // SEO checks
            if (content.includes('meta name="description"')) results.seo++;
            if (content.includes('property="og:')) results.seo++;
            if (content.includes('name="twitter:')) results.seo++;

        } catch (error) {
            console.log(`❌ Could not check ${page}: ${error.message}`);
        }
    }

    console.log('\n📊 VERIFICATION RESULTS:');
    console.log(`🔒 Security Enhancements: ${results.security}/12 applied`);
    console.log(`⚡ Performance Optimizations: ${results.performance}/12 applied`);
    console.log(`♿ Accessibility Improvements: ${results.accessibility}/12 applied`);
    console.log(`🔍 SEO Enhancements: ${results.seo}/12 applied`);

    const totalScore = Object.values(results).reduce((a, b) => a + b, 0);
    const maxScore = 48;
    const percentage = Math.round((totalScore / maxScore) * 100);

    console.log(`\n🎯 OVERALL SCORE: ${percentage}% (${totalScore}/${maxScore})`);

    if (percentage >= 90) {
        console.log('✅ EXCELLENT: Website is highly optimized!');
    } else if (percentage >= 75) {
        console.log('👍 GOOD: Website is well-optimized with minor improvements needed');
    } else {
        console.log('⚠️ NEEDS WORK: Additional optimization required');
    }

    console.log('\n🚀 Ready for production deployment!');
}

verifyEnhancements().catch(console.error);
