// Consistency checks for js/i18n.js. Run: npm test
// Catches the most common slip when editing UI text: a missing language,
// mismatched {placeholders}, or a key used in HTML/JS that does not exist.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { MESSAGES, SUPPORTED_LANGS, t, setCurrentLang } = require('../../js/i18n.js');

const ROOT = path.join(__dirname, '..', '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();

test('every message has a non-empty string for every language', () => {
  for (const [key, entry] of Object.entries(MESSAGES)) {
    assert.deepEqual(Object.keys(entry).sort(), [...SUPPORTED_LANGS].sort(), `languages of "${key}"`);
    for (const lang of SUPPORTED_LANGS) {
      assert.equal(typeof entry[lang], 'string', `${key}.${lang}`);
      assert.ok(entry[lang].trim(), `${key}.${lang} is empty`);
    }
  }
});

test('placeholders such as {n} match across languages', () => {
  for (const [key, entry] of Object.entries(MESSAGES)) {
    const expected = placeholders(entry.en);
    for (const lang of SUPPORTED_LANGS) {
      assert.deepEqual(placeholders(entry[lang]), expected, `placeholders of ${key}.${lang}`);
    }
  }
});

test('every data-i18n* key used in index.html exists', () => {
  const html = read('index.html');
  const used = [...html.matchAll(/data-i18n(?:-title|-aria|-placeholder)?="([^"]+)"/g)].map(m => m[1]);
  assert.ok(used.length > 10, 'expected to find data-i18n attributes');
  for (const key of used) assert.ok(key in MESSAGES, `index.html uses unknown key "${key}"`);
});

test("every t('key') used in js/*.js exists", () => {
  // i18n.js itself is skipped: its header comment shows t('myKey') as an example.
  const files = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js') && f !== 'i18n.js');
  for (const file of files) {
    const src = read(`js/${file}`);
    for (const m of src.matchAll(/\bt\(\s*'([^']+)'/g)) {
      assert.ok(m[1] in MESSAGES, `js/${file} uses unknown key "${m[1]}"`);
    }
  }
});

test('no unused messages', () => {
  const sources = read('index.html') + fs.readdirSync(path.join(ROOT, 'js'))
    .filter(f => f.endsWith('.js') && f !== 'i18n.js')
    .map(f => read(`js/${f}`)).join('\n');
  const unused = Object.keys(MESSAGES).filter(key => !sources.includes(`'${key}'`) && !sources.includes(`"${key}"`));
  assert.deepEqual(unused, [], 'remove these keys or use them');
});

test('t() fills placeholders and falls back to English', () => {
  setCurrentLang('zh-Hant');
  assert.equal(t('exportedCount', { n: 3 }), '（輸出 3 個）');
  setCurrentLang('xx');
  assert.equal(t('exportedCount', { n: 3 }), '(3 in output)');
  assert.equal(t('noSuchKey'), 'noSuchKey');
  setCurrentLang('en');
});
