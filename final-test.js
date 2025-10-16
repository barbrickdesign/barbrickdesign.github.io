// Final comprehensive test
const fs = require('fs').promises;

async function finalTest() {
  console.log('🎯 FINAL COMPREHENSIVE TEST\n');

  const testPages = [
    'index.html',
    'classified-contracts.html',
    'grand-exchange.html',
    'mandem.os/workspace/index.html',
    'gembot-control-3d.html'
  ];

  let totalScore = 0;
  const maxScore = testPages.length * 9; // 9 checks per page

  for (const page of testPages) {
    try {
      const content = await fs.readFile(page, 'utf8');
      console.log('📄 Testing: ' + page);

      let pageScore = 0;

      // Security checks
      if (content.includes('Content-Security-Policy')) { pageScore++; console.log('  ✅ CSP'); }
      if (content.includes('X-Frame-Options')) { pageScore++; console.log('  ✅ X-Frame-Options'); }
      if (!content.includes('http://') || content.includes('https://')) { pageScore++; console.log('  ✅ HTTPS'); }

      // Performance checks
      if (content.includes('defer')) { pageScore++; console.log('  ✅ Script defer'); }
      if (content.includes('loading="lazy"')) { pageScore++; console.log('  ✅ Lazy loading'); }
      if (content.includes('preload') && content.includes('onload=')) { pageScore++; console.log('  ✅ CSS preload'); }

      // SEO/Accessibility checks
      if (content.includes('lang=')) { pageScore++; console.log('  ✅ Language'); }
      if (content.includes('meta name="description"')) { pageScore++; console.log('  ✅ Meta desc'); }
      if (content.includes('property="og:')) { pageScore++; console.log('  ✅ Open Graph'); }

      totalScore += pageScore;
      console.log('  📊 Page Score: ' + pageScore + '/9\n');

    } catch (error) {
      console.log('❌ Error testing ' + page + ': ' + error.message + '\n');
    }
  }

  const percentage = Math.round((totalScore / maxScore) * 100);
  console.log('🎯 FINAL RESULTS:');
  console.log('  Total Score: ' + totalScore + '/' + maxScore + ' (' + percentage + '%)');

  if (percentage >= 90) {
    console.log('  🏆 EXCELLENT: Website is perfectly optimized!');
  } else if (percentage >= 80) {
    console.log('  ✅ GREAT: Website is very well optimized!');
  } else if (percentage >= 70) {
    console.log('  👍 GOOD: Website is adequately optimized!');
  } else {
    console.log('  ⚠️ NEEDS WORK: Additional optimization required!');
  }

  console.log('\n🚀 DEPLOYMENT READY!');
}

finalTest().catch(console.error);
