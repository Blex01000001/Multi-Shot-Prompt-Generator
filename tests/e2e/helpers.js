// Shared helpers for browser tests (tests/e2e) and the screenshot script.
//
// - Serves the repo with a tiny static server (no Python / extra packages).
// - CDN handling: if devDependencies are installed (`npm install`), Tailwind and
//   SortableJS are served from node_modules so tests are deterministic and work
//   offline. Without node_modules the page loads them from the real CDN.
//   Google Fonts are always blocked (not needed for tests, avoids slow timeouts).
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..');
const CACHE_DIR = path.join(ROOT, 'tests', '.cache');
const TAILWIND_CLI = path.join(ROOT, 'node_modules', 'tailwindcss', 'lib', 'cli.js');
const SORTABLE_FILE = path.join(ROOT, 'node_modules', 'sortablejs', 'Sortable.min.js');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, url: `http://127.0.0.1:${server.address().port}/` });
    });
  });
}

// Build the same CSS the Tailwind Play CDN would generate, using the config in
// js/tailwind-config.js. Cached by a hash of the source files.
function localTailwindCss() {
  if (!fs.existsSync(TAILWIND_CLI)) return null;
  const sources = ['index.html', 'js/tailwind-config.js', ...fs.readdirSync(path.join(ROOT, 'js')).map(f => `js/${f}`)];
  const hash = crypto.createHash('sha1');
  sources.forEach(f => hash.update(fs.readFileSync(path.join(ROOT, f))));
  const out = path.join(CACHE_DIR, `tailwind-${hash.digest('hex').slice(0, 12)}.css`);
  if (fs.existsSync(out)) return fs.readFileSync(out, 'utf8');

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const sandbox = { tailwind: {} };
  new Function('tailwind', fs.readFileSync(path.join(ROOT, 'js', 'tailwind-config.js'), 'utf8'))(sandbox.tailwind);
  const config = { ...sandbox.tailwind.config, content: [path.join(ROOT, 'index.html'), path.join(ROOT, 'js', '*.js')] };
  const configFile = path.join(CACHE_DIR, 'tailwind.config.js');
  const inputFile = path.join(CACHE_DIR, 'tailwind.in.css');
  fs.writeFileSync(configFile, `module.exports = ${JSON.stringify(config)};\n`);
  fs.writeFileSync(inputFile, '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
  execFileSync(process.execPath, [TAILWIND_CLI, '-c', configFile, '-i', inputFile, '-o', out], { stdio: 'pipe' });
  return fs.readFileSync(out, 'utf8');
}

async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (err) {
    // Fallback for environments with a preinstalled Chromium (e.g. CI images).
    const preinstalled = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
    if (fs.existsSync(preinstalled)) return chromium.launch({ executablePath: preinstalled });
    throw err;
  }
}

async function installRoutes(context) {
  const css = localTailwindCss();
  if (css) {
    const body = `window.tailwind = {}; document.write('<style>' + ${JSON.stringify(css)} + '</style>');`;
    await context.route('https://cdn.tailwindcss.com/**', route => route.fulfill({ contentType: 'text/javascript', body }));
  }
  if (fs.existsSync(SORTABLE_FILE)) {
    await context.route('https://cdn.jsdelivr.net/npm/sortablejs@*/**', route =>
      route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(SORTABLE_FILE, 'utf8') }));
  }
  await context.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
}

// Open the app in a fresh context. Returns { context, page, errors }.
// options: { viewport, lang, storage: { key: value }, permissions }
async function openApp(browser, baseUrl, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1400, height: 1000 },
    acceptDownloads: true,
  });
  await installRoutes(context);
  if (options.permissions) await context.grantPermissions(options.permissions, { origin: baseUrl.replace(/\/$/, '') });

  const storage = { ...(options.storage || {}) };
  if (options.lang) storage['msp-lang'] = options.lang;
  if (Object.keys(storage).length) {
    await context.addInitScript(entries => {
      if (sessionStorage.getItem('__seeded')) return; // seed once, keep data across reloads
      Object.entries(entries).forEach(([k, v]) => localStorage.setItem(k, v));
      sessionStorage.setItem('__seeded', '1');
    }, storage);
  }

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error' && !/Failed to load resource/.test(msg.text())) errors.push(msg.text());
  });
  await page.goto(baseUrl);
  await page.waitForFunction(() => document.querySelectorAll('.shot-card').length > 0);
  return { context, page, errors };
}

// True when Tailwind styles are applied (local copy or real CDN reachable).
async function hasStyles(page) {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(2, 6, 23)');
}

module.exports = { ROOT, startServer, launchBrowser, openApp, hasStyles };
