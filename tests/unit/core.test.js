// Unit tests for js/core.js (pure logic). Run: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../../js/core.js');

const shot = (timestamp, description) => ({ id: Math.random(), timestamp, description });

test('formatTimestamp / parseTimestamp round-trip', () => {
  assert.equal(core.formatTimestamp(0), '00:00.000');
  assert.equal(core.formatTimestamp(1.5), '00:01.500');
  assert.equal(core.formatTimestamp(61.25), '01:01.250');
  assert.equal(core.formatTimestamp(0.1 + 0.2), '00:00.300'); // float noise is rounded away
  assert.equal(core.parseTimestamp('01:02.500'), 62.5);
  assert.equal(core.parseTimestamp('garbage'), 0);
});

test('isValidTimestamp requires exactly MM:SS.mmm', () => {
  for (const ok of ['00:00.000', '12:59.999', ' 00:01.000 ']) assert.ok(core.isValidTimestamp(ok), ok);
  for (const bad of ['0:1', '00:60.000', '00:01.5', '00:01', 'aa:bb.ccc', '']) assert.ok(!core.isValidTimestamp(bad), bad);
});

test('buildPrompt: format, spacing, auto period, N/A defaults', () => {
  const out = core.buildPrompt({
    shots: [shot('00:00.000', 'a girl smiles'), shot('00:01.000', 'camera pushes in.')],
    autoPeriod: true,
    overallSoundscape: '',
    nonDiegeticMusic: ' soft piano ',
  });
  assert.equal(out,
    'integrated_multimodal_description: [Shot 1] At 00:00.000, a girl smiles. [Shot 2] At 00:01.000, camera pushes in.' +
    '\n\noverall_soundscape: N/A\nnon_diegetic_music: soft piano');
});

test('buildPrompt: autoPeriod off leaves text untouched', () => {
  const out = core.buildPrompt({ shots: [shot('00:00.000', 'no period')], autoPeriod: false });
  assert.match(out, /At 00:00\.000, no period\n/);
});

test('buildPrompt: empty shots are skipped and the rest renumbered', () => {
  const out = core.buildPrompt({
    shots: [shot('00:00.000', 'one'), shot('00:01.000', '   '), shot('00:02.000', 'three')],
    autoPeriod: true,
  });
  assert.match(out, /^integrated_multimodal_description: \[Shot 1\] At 00:00\.000, one\. \[Shot 2\] At 00:02\.000, three\.\n/);
});

test('analyzeShots: numbering skips empty shots', () => {
  const info = core.analyzeShots([shot('00:00.000', 'a'), shot('00:01.000', ''), shot('00:02.000', 'c')]);
  assert.deepEqual(info.map(i => i.outNum), [1, null, 2]);
  assert.deepEqual(info.map(i => i.error), [null, null, null]);
});

test('analyzeShots: order must strictly increase between exported shots', () => {
  const info = core.analyzeShots([shot('00:01.000', 'a'), shot('00:01.000', 'b'), shot('00:00.500', 'c')]);
  assert.equal(info[0].error, null);
  assert.deepEqual(info[1].error, { type: 'order', prevNum: 1, prevTs: '00:01.000' });
  assert.deepEqual(info[2].error, { type: 'order', prevNum: 2, prevTs: '00:01.000' });
});

test('analyzeShots: empty shots are format-checked but ignored for ordering', () => {
  const info = core.analyzeShots([shot('00:02.000', 'a'), shot('bad', ''), shot('00:00.000', ''), shot('00:03.000', 'd')]);
  assert.deepEqual(info[1].error, { type: 'invalid' });
  assert.equal(info[2].error, null); // earlier time, but empty → not compared
  assert.equal(info[3].error, null);
});

test('appendTagText joins with ", "', () => {
  assert.equal(core.appendTagText('', 'x'), 'x');
  assert.equal(core.appendTagText('a', 'x'), 'a, x');
  assert.equal(core.appendTagText('a ', 'x'), 'a x');
});

test('escapeHtml', () => {
  assert.equal(core.escapeHtml('<b a="1">&</b>'), '&lt;b a=&quot;1&quot;&gt;&amp;&lt;/b&gt;');
});

test('normalizeTag accepts strings / objects and rejects junk', () => {
  assert.equal(core.normalizeTag('  dolly zoom ').text, 'dolly zoom');
  const t = core.normalizeTag({ text: 'x', note: ' n ', notes: { ja: 'j', fr: 'ignored', 'zh-Hant': '' } });
  assert.equal(t.note, 'n');
  assert.deepEqual(t.notes, { ja: 'j' });
  assert.ok(t.id.startsWith('tag-'));
  for (const bad of [null, 1, {}, { text: '  ' }, { text: 5 }]) assert.equal(core.normalizeTag(bad), null);
});

test('defaultTags are valid and unique', () => {
  const tags = core.defaultTags();
  assert.equal(tags.length, core.DEFAULT_TAGS.length);
  assert.equal(new Set(tags.map(t => core.tagKey(t.text))).size, tags.length);
  assert.equal(new Set(tags.map(t => t.id)).size, tags.length);
});

test('isDuplicateTag is case-insensitive and can ignore one id', () => {
  const tags = [core.normalizeTag('Camera Pan')];
  assert.ok(core.isDuplicateTag(tags, ' camera pan '));
  assert.ok(!core.isDuplicateTag(tags, 'camera pan', tags[0].id));
});

test('buildTagExport → mergeImportedTags round-trip', () => {
  const tags = [core.normalizeTag({ text: 'a', note: 'na' }), core.normalizeTag({ text: 'b', notes: { ja: 'jb' } })];
  const exported = JSON.parse(JSON.stringify(core.buildTagExport(tags, new Date('2026-01-02T03:04:05Z'))));
  assert.equal(exported.type, core.TAGS_EXPORT_TYPE);
  assert.equal(exported.exportedAt, '2026-01-02T03:04:05.000Z');
  assert.deepEqual(exported.tags, [{ text: 'a', note: 'na' }, { text: 'b', note: '', notes: { ja: 'jb' } }]);

  const merged = core.mergeImportedTags([core.normalizeTag('A')], exported);
  assert.equal(merged.added, 1);
  assert.equal(merged.skipped, 1);
  assert.deepEqual(merged.tags.map(t => t.text), ['A', 'b']);
});

test('mergeImportedTags accepts plain arrays and rejects non-tag JSON', () => {
  const merged = core.mergeImportedTags([], ['x', { text: 'y', note: 'n' }, { nope: 1 }]);
  assert.deepEqual(merged.tags.map(t => t.text), ['x', 'y']);
  assert.throws(() => core.mergeImportedTags([], { x: 1 }));
});

test('tagTooltip and tagMatches', () => {
  const builtIn = core.normalizeTag({ text: 'low-angle shot', notes: { 'zh-Hant': '仰角', ja: 'ローアングル' } });
  assert.equal(core.tagTooltip(builtIn, 'zh-Hant'), '仰角');
  assert.equal(core.tagTooltip(builtIn, 'en'), '');
  assert.equal(core.tagTooltip({ ...builtIn, note: 'mine' }, 'ja'), 'mine');
  assert.ok(core.tagMatches(builtIn, 'ANGLE'));
  assert.ok(core.tagMatches(builtIn, '仰角'));
  assert.ok(core.tagMatches(builtIn, ''));
  assert.ok(!core.tagMatches(builtIn, 'zzz'));
});
