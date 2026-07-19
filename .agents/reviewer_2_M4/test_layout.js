const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('file:///C:/Users/PRASANTH/.gemini/antigravity/scratch/Luna/Luna-v2.15.05.26-main/index.html');
  
  // > 1000px
  await page.setViewport({ width: 1100, height: 800 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/PRASANTH/.gemini/antigravity/scratch/Luna/Luna-v2.15.05.26-main/.agents/reviewer_2_M4/1100px.png' });

  // ~700px
  await page.setViewport({ width: 700, height: 800 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/PRASANTH/.gemini/antigravity/scratch/Luna/Luna-v2.15.05.26-main/.agents/reviewer_2_M4/700px.png' });

  // <500px
  await page.setViewport({ width: 450, height: 800 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/PRASANTH/.gemini/antigravity/scratch/Luna/Luna-v2.15.05.26-main/.agents/reviewer_2_M4/450px.png' });

  await browser.close();
  console.log("Screenshots captured.");
})();
