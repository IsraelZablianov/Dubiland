const fs = require('fs');
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

const baseUrl = process.env.BASE_URL;
const outPath = process.env.AXE_OUT;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.login-page__guest-cta button', { timeout: 60000 });
  await page.click('.login-page__guest-cta button');
  await page.waitForURL('**/profiles', { timeout: 60000 });
  await page.waitForSelector('footer button:last-child', { timeout: 60000 });
  await page.click('footer button:last-child');
  await page.waitForURL('**/games', { timeout: 60000 });

  await page.goto(`${baseUrl}/games/reading/interactive-handbook`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.interactive-handbook', { timeout: 60000 });

  const results = await new AxeBuilder({ page }).include('.interactive-handbook').analyze();
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  await browser.close();

  if (results.violations.length > 0) {
    console.error(`violations=${results.violations.length}`);
    for (const v of results.violations) {
      console.error(`- ${v.id}: ${v.help}`);
    }
    process.exit(2);
  }

  console.log('violations=0');
})();
