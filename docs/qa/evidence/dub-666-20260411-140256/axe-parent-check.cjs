const fs = require('fs');
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4174';
const outPath = process.env.AXE_OUT || 'axe-parent.json';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.login-page__guest-cta button', { timeout: 60000 });
  await page.click('.login-page__guest-cta button');
  await page.waitForURL('**/profiles', { timeout: 60000 });
  await page.waitForSelector('main footer button:first-child', { timeout: 60000 });
  await page.click('main footer button:first-child');
  await page.waitForURL('**/parent', { timeout: 60000 });
  await page.waitForSelector('.parent-dashboard__header', { timeout: 60000 });

  const results = await new AxeBuilder({ page }).analyze();
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  await browser.close();

  const violations = results.violations || [];
  if (violations.length > 0) {
    console.error(`violations=${violations.length}`);
    for (const v of violations) {
      console.error(`- ${v.id}: ${v.help}`);
    }
    process.exit(2);
  }

  console.log('violations=0');
})();
