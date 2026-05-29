const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating to Vercel...');
  await page.goto('https://studentos-alpha.vercel.app/', { waitUntil: 'networkidle2' });

  console.log('Loaded.');
  
  // Wait a moment for any react crashes
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
