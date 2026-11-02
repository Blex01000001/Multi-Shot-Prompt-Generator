// Structural checks for js/*.js. Run: npm test
// All scripts are classic <script>s sharing one global scope, so a name
// declared twice at the top level breaks the whole page with a SyntaxError.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const loaded = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map(m => m[1]);

test('index.html loads every js file exactly once, as classic scripts', () => {
  const onDisk = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => `js/${f}`).sort();
  assert.deepEqual([...loaded].sort(), onDisk);
  assert.equal(new Set(loaded).size, loaded.length);
  assert.ok(!/type="module"/.test(html), 'type="module" breaks file:// usage');
});

test('no top-level name is declared in two scripts', () => {
  const seen = new Map();
  for (const file of loaded) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const m of src.matchAll(/^(?:const|let|var|function|async function|class)\s+([A-Za-z_$][\w$]*)/gm)) {
      const name = m[1];
      assert.ok(!seen.has(name), `"${name}" is declared in both ${seen.get(name)} and ${file}`);
      seen.set(name, file);
    }
  }
});

test('core.js stays pure (no DOM / storage access)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'core.js'), 'utf8').replace(/\/\/.*$/gm, '');
  for (const word of ['document.', 'window.', 'localStorage', 'navigator.']) {
    assert.ok(!src.includes(word), `core.js must not use ${word}`);
  }
});
