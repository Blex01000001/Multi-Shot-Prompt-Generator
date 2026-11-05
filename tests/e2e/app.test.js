// Browser tests (Playwright + Node test runner). Run: npm run test:e2e
// Each test opens a fresh browser context, so localStorage starts empty.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { startServer, launchBrowser, openApp, hasStyles } = require('./helpers');

let server;
let baseUrl;
let browser;
const contexts = [];

test.before(async () => {
  ({ server, url: baseUrl } = await startServer());
  browser = await launchBrowser();
});

test.after(async () => {
  await browser?.close();
  server?.close();
});

async function open(options) {
  const app = await openApp(browser, baseUrl, options);
  contexts.push(app.context);
  return app;
}

test.afterEach(async () => {
  while (contexts.length) await contexts.pop().close();
});

const output = (page) => page.locator('#output-preview').textContent();
const firstLine = async (page) => (await output(page)).split('\n')[0];
const descriptions = (page) => page.locator('textarea.shot-input');
const descriptionValues = (page) => descriptions(page).evaluateAll(els => els.map(e => e.value));
const durations = (page) => page.locator('.dur-input');
const durationValues = (page) => durations(page).evaluateAll(els => els.map(e => e.value));
const starts = (page) => page.locator('.shot-start').allTextContents();
const labels = (page) => page.locator('.shot-label').allTextContents();

test('loads in English by default without errors', async () => {
  const { page, errors } = await open();
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
  assert.equal(await page.title(), 'MiniMax H3 Multi-Shot Prompt Generator');
  assert.ok((await page.getAttribute('link[rel=icon]', 'href')).startsWith('data:image/svg+xml'));
  assert.equal(await page.locator('.shot-card').count(), 2);
  assert.equal(await page.locator('.prompt-chip').count(), 10);
  assert.deepEqual(errors, []);
});

test('empty shots are skipped, renumbered and left out of the timeline', async () => {
  const { page } = await open();
  await page.click('#add-shot-btn');
  await descriptions(page).nth(0).fill('a girl smiles');
  await descriptions(page).nth(2).fill('camera pushes in');
  assert.equal(await firstLine(page),
    'integrated_multimodal_description: [Shot 1] At 00:00.000, a girl smiles. [Shot 2] At 00:01.000, camera pushes in.');
  assert.deepEqual(await labels(page), ['[Shot 1]', '[Shot –]', '[Shot 2]']);
  assert.deepEqual(await starts(page), ['At 00:00.000', 'At –', 'At 00:01.000']);
  assert.equal(await page.textContent('#total-duration'), '00:02.000');
  assert.equal(await page.locator('.shot-card').nth(1).locator('.shot-skip').isVisible(), true);
  assert.equal(await page.textContent('#exported-count'), '(2 in output)');
});
test('durations set the start times; invalid ones are highlighted and tidied on blur', async () => {
  const { page } = await open();
  await page.click('#add-shot-btn');
  for (const [i, text] of ['a', 'b', 'c'].entries()) await descriptions(page).nth(i).fill(text);
  await durations(page).nth(0).fill('1.5');
  await durations(page).nth(1).fill('2.25');
  assert.deepEqual(await starts(page), ['At 00:00.000', 'At 00:01.500', 'At 00:03.750']);
  assert.equal(await page.textContent('#total-duration'), '00:04.750');
  assert.match(await firstLine(page), /\[Shot 3\] At 00:03\.750, c\.$/);

  await durations(page).nth(1).fill('0');
  assert.equal(await page.locator('#ts-warning').isVisible(), true);
  assert.match(await page.locator('.dur-error:visible').first().textContent(), /Invalid duration/);
  assert.equal(await durations(page).nth(1).getAttribute('aria-invalid'), 'true');
  // typing must not steal focus (cards are not re-rendered while typing)
  assert.deepEqual(await page.evaluate(() => {
    const el = document.activeElement;
    return [el.closest('.shot-card').dataset.index, el.dataset.field];
  }), ['1', 'duration']);

  await durations(page).nth(1).fill('2,50s');
  await durations(page).nth(1).blur();
  assert.equal(await durations(page).nth(1).inputValue(), '2.5');
  assert.equal(await page.locator('#ts-warning').isVisible(), false);
  assert.equal(await page.locator('.dur-error:visible').count(), 0);
  assert.equal(await page.textContent('#total-duration'), '00:05.000');
});
test('messages under the description do not change the card height', async () => {
  const { page } = await open();
  const card = page.locator('.shot-card').nth(0);
  const height = async () => Math.round((await card.boundingBox()).height);
  const empty = await height(); // "Empty shot" message
  assert.equal(await card.locator('.shot-skip').isVisible(), true);
  await descriptions(page).nth(0).fill('a');
  assert.equal(await card.locator('.shot-msg p:visible').count(), 0);
  assert.equal(await height(), empty);
  await durations(page).nth(0).fill('0'); // error message
  assert.equal(await card.locator('.dur-error').isVisible(), true);
  assert.equal(await height(), empty);
  await descriptions(page).nth(0).fill(''); // empty + error: only the error is shown
  assert.equal(await card.locator('.shot-msg p:visible').count(), 1);
  assert.equal(await card.locator('.dur-error').isVisible(), true);
});

test('duration nudge buttons', async () => {
  const { page } = await open();
  await page.locator('.shot-card').nth(1).locator('[data-delta="500"]').click();
  await page.locator('.shot-card').nth(1).locator('[data-delta="-100"]').click();
  assert.equal(await durations(page).nth(1).inputValue(), '1.4');
  for (let i = 0; i < 4; i++) await page.locator('.shot-card').nth(0).locator('[data-delta="-500"]').click();
  assert.equal(await durations(page).nth(0).inputValue(), '0.1'); // never below 0.1 s
});
test('add, duplicate, move and delete shots (durations move with the card)', async () => {
  const { page } = await open();
  await descriptions(page).nth(0).fill('first');
  await descriptions(page).nth(1).fill('second');
  await durations(page).nth(0).fill('2.0');
  await page.locator('.shot-card').nth(0).locator('.duplicate-shot-btn').click();
  assert.deepEqual(await descriptionValues(page), ['first', 'first', 'second']);
  assert.deepEqual(await durationValues(page), ['2.0', '2.0', '1.0']);
  assert.deepEqual(await starts(page), ['At 00:00.000', 'At 00:02.000', 'At 00:04.000']);

  await page.locator('.shot-card').nth(2).locator('.move-shot-btn[data-dir="-1"]').click();
  assert.deepEqual(await descriptionValues(page), ['first', 'second', 'first']);
  assert.deepEqual(await durationValues(page), ['2.0', '1.0', '2.0']);
  assert.deepEqual(await starts(page), ['At 00:00.000', 'At 00:02.000', 'At 00:03.000']);
  await page.locator('.shot-card').nth(0).locator('.move-shot-btn[data-dir="1"]').click();
  assert.deepEqual(await descriptionValues(page), ['second', 'first', 'first']);
  assert.deepEqual(await starts(page), ['At 00:00.000', 'At 00:01.000', 'At 00:03.000']);
  assert.equal(await page.textContent('#total-duration'), '00:05.000');

  await page.click('#add-shot-btn');
  assert.equal(await durations(page).nth(3).inputValue(), '1.0');
  await page.locator('.shot-card').nth(0).locator('.delete-shot-btn').click();
  assert.equal(await page.locator('.shot-card').count(), 3);
  await page.locator('.shot-card').nth(0).locator('.delete-shot-btn').click();
  await page.locator('.shot-card').nth(0).locator('.delete-shot-btn').click();
  assert.equal(await page.locator('.delete-shot-btn').count(), 0); // last shot cannot be deleted
});
test('reset restores two blank shots and N/A audio', async () => {
  const { page } = await open();
  assert.equal(await page.inputValue('#soundscape-input'), 'N/A');
  assert.equal(await page.inputValue('#music-input'), 'N/A');
  await page.click('#add-shot-btn');
  await descriptions(page).nth(0).fill('a girl smiles');
  await page.fill('#soundscape-input', 'rain');
  await page.fill('#music-input', 'piano');
  await page.click('#reset-btn');
  assert.equal(await page.locator('.shot-card').count(), 2);
  assert.deepEqual(await durationValues(page), ['1.0', '1.0']);
  assert.equal(await page.inputValue('#soundscape-input'), 'N/A');
  assert.equal(await page.inputValue('#music-input'), 'N/A');
  assert.ok((await output(page)).endsWith('overall_soundscape: N/A\nnon_diegetic_music: N/A'));
});

test('drag a card by its handle to reorder', async (t) => {
  const { page } = await open();
  if (!(await page.evaluate(() => !!window.Sortable))) return t.skip('SortableJS not available (offline without node_modules)');
  await page.click('#add-shot-btn');
  for (const [i, text] of ['AAA', 'BBB', 'CCC'].entries()) await descriptions(page).nth(i).fill(text);
  for (const [i, d] of ['1.0', '2.0', '3.0'].entries()) await durations(page).nth(i).fill(d);

  const from = await page.locator('.drag-handle').nth(2).boundingBox();
  const to = await page.locator('.drag-handle').nth(0).boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 15; i++) {
    await page.mouse.move(from.x + from.width / 2, from.y + (to.y - 10 - from.y) * i / 15);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(300);
  assert.deepEqual(await descriptions(page).evaluateAll(els => els.map(e => e.value)), ['CCC', 'AAA', 'BBB']);
  // durations move with the cards; start times are recalculated
  assert.deepEqual(await durationValues(page), ['3.0', '1.0', '2.0']);
  assert.match(await firstLine(page), /^integrated_multimodal_description: \[Shot 1\] At 00:00\.000, CCC\. \[Shot 2\] At 00:03\.000, AAA\. \[Shot 3\] At 00:04\.000, BBB\.$/);
});

test('tag manager: drag a tag by its handle to reorder (saved, no handles while searching)', async (t) => {
  const { page } = await open({ storage: { 'msp-tags': JSON.stringify([{ text: 'aaa' }, { text: 'bbb' }, { text: 'ccc' }]) } });
  if (!(await page.evaluate(() => !!window.Sortable))) return t.skip('SortableJS not available (offline without node_modules)');
  await page.click('#manage-tags-btn');
  const order = () => page.locator('#tag-manage-list li .font-mono').allTextContents();
  assert.deepEqual(await order(), ['aaa', 'bbb', 'ccc']);

  const from = await page.locator('.tag-drag-handle').nth(2).boundingBox();
  const to = await page.locator('.tag-drag-handle').nth(0).boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 15; i++) {
    await page.mouse.move(from.x + from.width / 2, from.y + (to.y - 10 - from.y) * i / 15);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(300);
  assert.deepEqual(await order(), ['ccc', 'aaa', 'bbb']);
  assert.deepEqual(await page.locator('#chips-list .prompt-chip').allTextContents(), ['ccc', 'aaa', 'bbb']);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('msp-tags')).map(x => x.text));
  assert.deepEqual(saved, ['ccc', 'aaa', 'bbb']);

  await page.fill('#tag-manage-search', 'a');
  assert.equal(await page.locator('.tag-drag-handle').count(), 0);
});

test('copy button writes the prompt to the clipboard', async () => {
  const { page } = await open({ permissions: ['clipboard-read', 'clipboard-write'] });
  await descriptions(page).nth(0).fill('hello');
  await page.click('#copy-btn');
  await page.waitForFunction(() => document.querySelector('#copy-text').textContent === 'Copied!');
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), await output(page));
});

const PASTED = '---\nintegrated_multimodal_description: [Shot 1] At 00:00.000, The girl is standing, and the camera is shooting from behind her.[Shot 2] At 00:01.000, The girl bent down, her hands resting on her knees.[Shot 3] At 00:02.000, The girl turned her head to look at the camera.\n\noverall_soundscape: light rain\nnon_diegetic_music: N/A\n---';

test('paste prompt: empty cards are replaced without asking', async () => {
  const { page } = await open({ permissions: ['clipboard-read', 'clipboard-write'] });
  await page.evaluate(text => navigator.clipboard.writeText(text), PASTED);
  await page.click('#paste-prompt-btn');
  await page.waitForFunction(() => document.querySelectorAll('.shot-card').length === 3);
  assert.equal(await page.locator('#confirm-modal').isVisible(), false);
  assert.deepEqual(await descriptionValues(page), [
    'The girl is standing, and the camera is shooting from behind her.',
    'The girl bent down, her hands resting on her knees.',
    'The girl turned her head to look at the camera.',
  ]);
  // durations are the gaps between the pasted times; the last uses the default duration
  assert.deepEqual(await durationValues(page), ['1.0', '1.0', '1.0']);
  assert.equal(await page.textContent('#total-duration'), '00:03.000');
  assert.equal(await page.inputValue('#soundscape-input'), 'light rain');
  assert.equal(await page.inputValue('#music-input'), 'N/A');
  assert.match(await firstLine(page), /behind her\. \[Shot 2\] At 00:01\.000, The girl bent down/);
});

test('paste prompt: asks before replacing existing content', async () => {
  const { page } = await open({ permissions: ['clipboard-read', 'clipboard-write'] });
  await descriptions(page).nth(0).fill('my own shot');
  await page.evaluate(text => navigator.clipboard.writeText(text), PASTED);

  await page.click('#paste-prompt-btn');
  await page.locator('#confirm-modal').waitFor({ state: 'visible' });
  await page.click('#confirm-cancel');
  assert.equal(await page.locator('#confirm-modal').isVisible(), false);
  assert.deepEqual(await descriptionValues(page), ['my own shot', '']);

  await page.click('#paste-prompt-btn');
  await page.locator('#confirm-modal').waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  assert.deepEqual(await descriptionValues(page), ['my own shot', '']);

  await page.click('#paste-prompt-btn');
  await page.click('#confirm-ok');
  await page.waitForFunction(() => document.querySelectorAll('.shot-card').length === 3);
  assert.equal((await descriptionValues(page))[0], 'The girl is standing, and the camera is shooting from behind her.');
});

test('shot paste button: cleans the text and asks before overwriting', async () => {
  const { page } = await open({ permissions: ['clipboard-read', 'clipboard-write'] });
  const pasteBtn = (i) => page.locator('.shot-card').nth(i).locator('.paste-shot-btn');
  await page.evaluate(() => navigator.clipboard.writeText('  a girl\r\n   turns around\n\n slowly  '));

  await pasteBtn(1).click(); // empty card → no question
  await page.waitForFunction(() => document.querySelectorAll('textarea.shot-input')[1].value !== '');
  assert.equal(await page.locator('#confirm-modal').isVisible(), false);
  assert.deepEqual(await descriptionValues(page), ['', 'a girl turns around slowly']);
  assert.match(await firstLine(page), /\[Shot 1\] At 00:00\.000, a girl turns around slowly\./); // the empty first card is not counted

  await descriptions(page).nth(0).fill('keep me');
  await pasteBtn(0).click();
  await page.locator('#confirm-modal').waitFor({ state: 'visible' });
  await page.click('#confirm-cancel');
  assert.deepEqual(await descriptionValues(page), ['keep me', 'a girl turns around slowly']);

  await pasteBtn(0).click();
  await page.click('#confirm-ok');
  await page.waitForFunction(() => document.querySelectorAll('textarea.shot-input')[0].value !== 'keep me');
  assert.deepEqual(await descriptionValues(page), ['a girl turns around slowly', 'a girl turns around slowly']);
  assert.equal(await page.locator('.shot-card').count(), 2); // only the text changes, not the cards

  await page.evaluate(() => navigator.clipboard.writeText(' \n '));
  await pasteBtn(0).click();
  await page.waitForFunction(() => document.querySelector('#toast-msg').textContent.length > 0 && !document.querySelector('#confirm-modal:not(.hidden)'));
  assert.equal((await descriptionValues(page))[0], 'a girl turns around slowly');
});

test('soundscape / music cards: N/A by default, one line, paste button', async () => {
  const { page } = await open({ permissions: ['clipboard-read', 'clipboard-write'] });
  assert.equal(await page.inputValue('#soundscape-input'), 'N/A');
  assert.equal(await page.inputValue('#music-input'), 'N/A');
  assert.equal(await page.locator('.audio-card').count(), 2);
  assert.equal(await page.locator('.audio-card .dur-input, .audio-card .move-shot-btn, .audio-card .time-adjust-btn').count(), 0);

  // line breaks typed into the box become spaces, so the output stays "field: value"
  await page.fill('#soundscape-input', 'light rain\nthunder');
  assert.equal(await page.inputValue('#soundscape-input'), 'light rain thunder');
  assert.ok((await output(page)).endsWith('overall_soundscape: light rain thunder\nnon_diegetic_music: N/A'));

  // paste into music: N/A counts as empty, so no question
  await page.evaluate(() => navigator.clipboard.writeText('  soft\n piano  '));
  await page.click('[data-audio-paste="music-input"]');
  await page.waitForFunction(() => document.querySelector('#music-input').value === 'soft piano');
  assert.equal(await page.locator('#confirm-modal').isVisible(), false);
  assert.ok((await output(page)).endsWith('non_diegetic_music: soft piano'));

  // soundscape has text: asks first
  await page.click('[data-audio-paste="soundscape-input"]');
  await page.locator('#confirm-modal').waitFor({ state: 'visible' });
  await page.click('#confirm-cancel');
  assert.equal(await page.inputValue('#soundscape-input'), 'light rain thunder');
  await page.click('[data-audio-paste="soundscape-input"]');
  await page.click('#confirm-ok');
  await page.waitForFunction(() => document.querySelector('#soundscape-input').value === 'soft piano');
});

test('shot paste button: blocked clipboard focuses the text box', async () => {
  const { page } = await open();
  await page.evaluate(() => { navigator.clipboard.readText = () => Promise.reject(new Error('denied')); });
  await page.locator('.shot-card').nth(1).locator('.paste-shot-btn').click();
  await page.waitForFunction(() => document.activeElement === document.querySelectorAll('textarea.shot-input')[1]);
  assert.equal(await page.locator('#paste-modal').isVisible(), false);
  assert.deepEqual(await descriptionValues(page), ['', '']);
});

test('paste prompt: text without shots changes nothing', async () => {
  const { page } = await open({ permissions: ['clipboard-read', 'clipboard-write'] });
  await descriptions(page).nth(0).fill('keep me');
  await page.evaluate(() => navigator.clipboard.writeText('hello world'));
  await page.click('#paste-prompt-btn');
  await page.waitForFunction(() => document.querySelector('#toast-msg').textContent.includes('[Shot N]'));
  assert.deepEqual(await descriptionValues(page), ['keep me', '']);
});

test('paste prompt: falls back to a paste box when the clipboard is blocked', async () => {
  const { page } = await open();
  await page.evaluate(() => { navigator.clipboard.readText = () => Promise.reject(new Error('denied')); });
  await page.click('#paste-prompt-btn');
  await page.locator('#paste-modal').waitFor({ state: 'visible' });

  await page.fill('#paste-modal-text', 'not a prompt');
  await page.click('#paste-modal-import');
  assert.equal(await page.locator('#paste-modal-error').isVisible(), true);
  assert.equal(await page.locator('#paste-modal').isVisible(), true);

  await page.fill('#paste-modal-text', '  [Shot 1] At 00:00.000,  a girl\n  smiles  ');
  assert.equal(await page.locator('#paste-modal-error').isVisible(), false);
  await page.click('#paste-modal-import');
  assert.equal(await page.locator('#paste-modal').isVisible(), false);
  assert.deepEqual(await descriptionValues(page), ['a girl smiles']);
  assert.equal(await page.inputValue('#soundscape-input'), 'N/A');
});

test('prompt chips: search and insert into the focused shot', async () => {
  const { page } = await open();
  await page.fill('#tag-search', 'camera');
  assert.deepEqual(await page.locator('.prompt-chip').allTextContents(), ['camera slowly pushes in']);
  await page.fill('#tag-search', 'zzz');
  assert.equal(await page.textContent('#chips-list'), 'No tags match your search.');
  await page.fill('#tag-search', '');

  await descriptions(page).nth(1).fill('smiles');
  await descriptions(page).nth(1).focus();
  await page.locator('.prompt-chip', { hasText: 'camera slowly pushes in' }).click();
  assert.equal(await descriptions(page).nth(1).inputValue(), 'smiles, camera slowly pushes in');
});

test('tag manager: add, validate, edit, delete, search, persist', async () => {
  const { page } = await open();
  await page.click('#manage-tags-btn');
  assert.equal(await page.locator('#tag-modal').isVisible(), true);

  await page.click('#tag-add-form button[type=submit]');
  assert.equal(await page.textContent('#tag-add-error'), 'Prompt text cannot be empty.');
  await page.fill('#tag-add-text', 'Camera Slowly Pushes In');
  await page.press('#tag-add-text', 'Enter');
  assert.equal(await page.textContent('#tag-add-error'), 'This tag already exists.');

  await page.fill('#tag-add-text', 'dolly zoom');
  await page.fill('#tag-add-note', '滑動變焦');
  await page.press('#tag-add-note', 'Enter');
  assert.equal(await page.textContent('#tag-manage-count'), '11 tags');

  const first = page.locator('#tag-manage-list li').first();
  await first.locator('[data-action=edit]').click();
  await page.fill('.tag-edit-text', 'pouting cheeks');
  await page.press('.tag-edit-text', 'Enter');
  assert.equal(await page.locator('#tag-manage-list li').first().locator('p').first().textContent(), 'pouting cheeks');

  const second = () => page.locator('#tag-manage-list li').nth(1);
  await second().locator('[data-action=delete]').click();
  await second().locator('[data-action=confirm-delete]').click();
  assert.equal(await page.textContent('#tag-manage-count'), '10 tags');

  await page.fill('#tag-manage-search', 'dolly');
  assert.equal(await page.locator('#tag-manage-list li').count(), 1);

  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#tag-modal').isHidden(), true);

  await page.reload();
  const chips = await page.locator('.prompt-chip').allTextContents();
  assert.equal(chips.length, 10);
  assert.ok(chips.includes('dolly zoom') && chips.includes('pouting cheeks'));
});

test('tag manager: export, restore defaults, import (merge), bad file', async () => {
  const { page } = await open({ storage: { 'msp-tags': JSON.stringify([{ text: 'mine', note: 'n' }, { text: 'camera slowly pushes in', note: '' }]) } });
  await page.click('#manage-tags-btn');
  assert.equal(await page.textContent('#tag-manage-count'), '2 tags');

  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#tag-export-btn')]);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'msp-'));
  const file = path.join(tmp, download.suggestedFilename());
  await download.saveAs(file);
  const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.match(download.suggestedFilename(), /^minimax-h3-prompt-tags-\d{8}\.json$/);
  assert.equal(exported.type, 'minimax-h3-prompt-tags');
  assert.deepEqual(exported.tags.map(t => t.text), ['mine', 'camera slowly pushes in']);

  await page.click('#tag-restore-btn');
  await page.locator('#confirm-modal').waitFor({ state: 'visible' });
  await page.click('#confirm-cancel');
  assert.equal(await page.textContent('#tag-manage-count'), '2 tags');
  await page.click('#tag-restore-btn');
  await page.click('#confirm-ok');
  assert.equal(await page.textContent('#tag-manage-count'), '10 tags');

  await page.setInputFiles('#tag-import-file', file);
  await page.waitForFunction(() => document.querySelector('#tag-manage-count').textContent === '11 tags');
  assert.equal(await page.textContent('#toast-msg'), 'Imported 1 tag(s), skipped 1 duplicate(s)');

  const bad = path.join(tmp, 'bad.json');
  fs.writeFileSync(bad, '{"x":1}');
  await page.setInputFiles('#tag-import-file', bad);
  await page.waitForFunction(() => document.querySelector('#toast-msg').textContent.startsWith('Import failed'));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('language switcher translates the page and is remembered', async () => {
  const { page } = await open();
  await page.click('#lang-btn');
  await page.click('[data-lang="ja"]');
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'ja');
  assert.equal(await page.locator('h1').textContent(), 'MiniMax H3 マルチショット プロンプトジェネレーター');
  assert.equal(await page.getAttribute('#tag-search', 'placeholder'), 'タグを検索...');

  await page.click('#lang-btn');
  await page.click('[data-lang="zh-Hant"]');
  assert.equal(await page.title(), 'MiniMax H3 多鏡頭提示詞產生器');
  assert.equal(await page.textContent('#copy-text'), '複製 Prompt');
  // the prompt itself stays English
  assert.match(await firstLine(page), /^integrated_multimodal_description: /);

  await page.reload();
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'zh-Hant');
});

test('layout: no horizontal scroll, single-row card header, duration box fits', async (t) => {
  for (const lang of ['en', 'zh-Hant', 'ja']) {
    for (const viewport of [{ width: 1400, height: 900 }, { width: 390, height: 844 }]) {
      const { page, context } = await open({ lang, viewport });
      if (!(await hasStyles(page))) {
        await context.close();
        return t.skip('Tailwind not available (offline without node_modules)');
      }
      const where = `${lang} @ ${viewport.width}px`;
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width, `horizontal scroll: ${where}`);

      if (viewport.width < 640) {
        // phones: action buttons share the [Shot N] row
        const [labelTop, actionsTop] = await page.evaluate(() => ['.shot-label', '.shot-actions']
          .map(sel => document.querySelector(sel).getBoundingClientRect().top));
        assert.ok(Math.abs(labelTop - actionsTop) < 6, `actions not on the [Shot N] row: ${where}`);
      }
      if (viewport.width >= 1024) {
        // a filled shot shows its start time ("At 00:00.000") in the left column
        await page.locator('textarea.shot-input').nth(0).fill('a girl smiles');
        const sameRow = await page.evaluate(() => {
          // duration controls and action buttons (incl. the drag handle) share one row
          const row = document.querySelector('.shot-header');
          const tops = [...row.querySelectorAll('.shot-controls > *, .shot-actions > *')].map(el => {
            const r = el.getBoundingClientRect();
            return r.top + r.height / 2;
          });
          return Math.max(...tops) - Math.min(...tops) < 6;
        });
        assert.ok(sameRow, `card header wraps: ${where}`);
        assert.equal(Math.round(await page.evaluate(() => document.querySelector('header').getBoundingClientRect().height)), 65, `header height: ${where}`);

        const [inputWidth, textWidth] = await page.evaluate(() => {
          const input = document.querySelector('.dur-input');
          const ctx = document.createElement('canvas').getContext('2d');
          ctx.font = getComputedStyle(input).font;
          return [input.clientWidth, ctx.measureText('00.0').width];
        });
        assert.ok(inputWidth >= textWidth, `duration box ${inputWidth}px is narrower than "00.0" (${textWidth}px): ${where}`);
      }
      await context.close();
      contexts.pop();
    }
  }
});
