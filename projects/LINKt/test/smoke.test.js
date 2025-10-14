const puppeteer = require('puppeteer');

(async ()=>{
  const browser = await puppeteer.launch({ headless: true, args:['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err=> errors.push({type:'pageerror', message:err.message}));
  page.on('error', err=> errors.push({type:'error', message:err.message}));
  page.on('console', msg=>{
    if(msg.type()==='error') errors.push({type:'console', message:msg.text()});
  });

  const fileUrl = 'file:///' + require('path').resolve(__dirname,'..','link.html').replace(/\\/g,'/');
  console.log('Loading', fileUrl);
  await page.goto(fileUrl, { waitUntil:'networkidle2', timeout: 30000 });

  // Simulation removed: skip simulate-wallet click
  // Try generate QR (may warn but should not throw)
  try{ await page.click('#mkQR'); }catch(e){}
  // Click test all links
  try{ await page.click('#testAll'); }catch(e){}
  // Generate nonce
  try{ await page.click('#genNonce'); }catch(e){}

  // Wait a moment for background tasks
  await page.waitForTimeout(1500);

  if(errors.length){ console.error('Errors captured during smoke test:'); console.error(errors); await browser.close(); process.exit(1); }
  console.log('Smoke test passed: no uncaught errors detected');
  await browser.close(); process.exit(0);
})();
