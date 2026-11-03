// Capture screenshots of the main UI states for visual review.
// Run: npm run screenshots   → test-results/screenshots/*.png
// Optional filter: npm run screenshots -- zh   (only names containing "zh")
// README image:    npm run screenshots -- readme   → docs/screenshot.png
//   (only when asked by name, so normal runs never change a tracked file)
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, startServer, launchBrowser, openApp, hasStyles } = require('./helpers');

const OUT_DIR = path.join(ROOT, 'test-results', 'screenshots');
const DESKTOP = { width: 1400, height: 1000 };
const MOBILE = { width: 390, height: 844 };

// Fill a representative state: 3 shots (one empty), one timestamp error.
async function fillSample(page) {
  await page.click('#add-shot-btn');
  await page.click('#add-shot-btn');
  const descriptions = page.locator('textarea.shot-input');
  await descriptions.nth(0).fill('a girl turns toward the camera and smiles');
  await descriptions.nth(2).fill('camera slowly pushes in, low-angle shot looking up');
  await descriptions.nth(3).fill('she winks shyly with one eye closed');
  await page.locator('.ts-input').nth(3).fill('00:01.000');
  await page.evaluate(() => window.scrollTo(0, 0));
}

// Clean state for the README: 3 valid shots + ambient sound, no warnings.
async function fillReadme(page) {
  await page.click('#add-shot-btn');
  const descriptions = page.locator('textarea.shot-input');
  await descriptions.nth(0).fill('a girl turns toward the camera and smiles');
  await descriptions.nth(1).fill('camera slowly pushes in, low-angle shot looking up');
  await descriptions.nth(2).fill('she winks shyly with one eye closed');
  await page.fill('#soundscape-input', 'gentle wind, distant city ambience');
  await page.evaluate(() => window.scrollTo(0, 0));
}

const SHOTS = [
  { name: 'desktop-en', viewport: DESKTOP, lang: 'en', setup: fillSample },
  { name: 'desktop-zh', viewport: DESKTOP, lang: 'zh-Hant', setup: fillSample },
  { name: 'desktop-ja', viewport: DESKTOP, lang: 'ja', setup: fillSample },
  { name: 'desktop-en-tag-manager', viewport: DESKTOP, lang: 'en', setup: page => page.click('#manage-tags-btn') },
  { name: 'desktop-en-lang-menu', viewport: DESKTOP, lang: 'en', setup: page => page.click('#lang-btn') },
  { name: 'mobile-en', viewport: MOBILE, lang: 'en', setup: fillSample, fullPage: true },
  { name: 'mobile-zh-tag-manager', viewport: MOBILE, lang: 'zh-Hant', setup: page => page.click('#manage-tags-btn') },
  { name: 'readme', viewport: { width: 1400, height: 860 }, lang: 'en', setup: fillReadme, out: path.join(ROOT, 'docs', 'screenshot.png'), explicit: true },
];

(async () => {
  const filter = process.argv[2] || '';
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { server, url } = await startServer();
  const browser = await launchBrowser();
  try {
    const selected = SHOTS.filter(s => (s.explicit ? s.name === filter : s.name.includes(filter)));
    for (const shot of selected) {
      const { context, page, errors } = await openApp(browser, url, { viewport: shot.viewport, lang: shot.lang });
      if (!(await hasStyles(page))) console.warn('warning: Tailwind not loaded — run `npm install` or check network');
      await shot.setup(page);
      await page.waitForTimeout(250); // let transitions settle
      const file = shot.out || path.join(OUT_DIR, `${shot.name}.png`);
      await page.screenshot({ path: file, fullPage: !!shot.fullPage });
      console.log(`${path.relative(ROOT, file)}${errors.length ? `  (page errors: ${errors.join(' | ')})` : ''}`);
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
