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

test('createInitialShots: two blank shots, a fresh copy every call', () => {
  const a = core.createInitialShots();
  assert.deepEqual(a.map(s => [s.timestamp, s.description]), [['00:00.000', ''], ['00:01.000', '']]);
  a[0].description = 'changed';
  assert.equal(core.createInitialShots()[0].description, '');
  assert.equal(core.DEFAULT_AUDIO, 'N/A');
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

test('analyzeShots: warns when the first exported shot is not at 00:00.000', () => {
  const info = core.analyzeShots([shot('00:00.500', ''), shot('00:01.000', 'b'), shot('00:02.000', 'c')]);
  assert.deepEqual(info.map(i => i.warning), [null, { type: 'firstNotZero' }, null]);
  assert.deepEqual(info.map(i => i.error), [null, null, null]); // a reminder, not an error
  assert.equal(core.analyzeShots([shot('00:00.000', 'a'), shot('00:01.000', 'b')]).some(i => i.warning), false);
  assert.equal(core.analyzeShots([shot('bad', 'a')])[0].warning, null); // invalid format → error only
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

// ---------------------------------------------------------------------------
// Shot list operations
// ---------------------------------------------------------------------------
const texts = (shots) => shots.map(s => `${s.timestamp} ${s.description}`);

test('shiftTimestamp: adds seconds, clamps at zero', () => {
  assert.equal(core.shiftTimestamp('00:01.000', 0.5), '00:01.500');
  assert.equal(core.shiftTimestamp('00:59.900', 0.2), '01:00.100');
  assert.equal(core.shiftTimestamp('00:00.300', -0.5), '00:00.000');
  assert.equal(core.shiftTimestamp('garbage', 1), '00:01.000');
});

test('appendShot: one step after the last shot, or 00:00.000 when empty', () => {
  const shots = [shot('00:00.000', 'a'), shot('00:02.000', 'b')];
  const r = core.appendShot(shots, 7, 1.5);
  assert.deepEqual(texts(r.shots), ['00:00.000 a', '00:02.000 b', '00:03.500 ']);
  assert.equal(r.shots[2].id, 7);
  assert.equal(r.active, 2);
  assert.equal(shots.length, 2); // input not changed
  assert.deepEqual(texts(core.appendShot([], 1, 1).shots), ['00:00.000 ']);
});

test('duplicateShotAt: copy inserted after the source, one step later', () => {
  const shots = [shot('00:00.000', 'a'), shot('00:01.000', 'b')];
  const r = core.duplicateShotAt(shots, 0, 9, 1);
  assert.deepEqual(texts(r.shots), ['00:00.000 a', '00:01.000 a', '00:01.000 b']);
  assert.equal(r.shots[1].id, 9);
  assert.equal(r.active, 1);
  assert.equal(shots.length, 2);
});

test('removeShotAt: removes and focuses the previous shot, keeps the last one', () => {
  const shots = [shot('00:00.000', 'a'), shot('00:01.000', 'b'), shot('00:02.000', 'c')];
  let r = core.removeShotAt(shots, 1);
  assert.deepEqual(texts(r.shots), ['00:00.000 a', '00:02.000 c']);
  assert.equal(r.active, 0);
  r = core.removeShotAt(shots, 0);
  assert.equal(r.active, 0);
  r = core.removeShotAt([shot('00:00.000', 'only')], 0);
  assert.deepEqual(texts(r.shots), ['00:00.000 only']);
  assert.equal(shots.length, 3);
});

test('moveShotTo: reorders, active follows its shot, out of range is a no-op', () => {
  const shots = [shot('00:00.000', 'a'), shot('00:01.000', 'b'), shot('00:02.000', 'c')];
  let r = core.moveShotTo(shots, 2, 0, 2); // moved shot stays active
  assert.deepEqual(r.shots.map(s => s.description), ['c', 'a', 'b']);
  assert.equal(r.active, 0);
  r = core.moveShotTo(shots, 0, 2, 1); // another shot was active: it keeps focus
  assert.deepEqual(r.shots.map(s => s.description), ['b', 'c', 'a']);
  assert.equal(r.active, 0);
  r = core.moveShotTo(shots, 0, -1, 0);
  assert.deepEqual(r.shots.map(s => s.description), ['a', 'b', 'c']);
  assert.equal(shots[0].description, 'a');
});

// ---------------------------------------------------------------------------
// Prompt text → shots
// ---------------------------------------------------------------------------
const parsed = (text) => {
  const r = core.parsePrompt(text);
  return r && { ...r, shots: r.shots.map(s => `${s.timestamp} ${s.description}`) };
};

test('parsePrompt: reads the example pasted by the user (no space between shots)', () => {
  const text = '---\nintegrated_multimodal_description: [Shot 1] At 00:00.000, The girl is standing, and the camera is shooting from behind her.[Shot 2] At 00:01.000, The girl bent down, her hands resting on her knees.[Shot 3] At 00:02.000, The girl turned her head to look at the camera.\n\noverall_soundscape: N/A\nnon_diegetic_music: N/A\n---';
  assert.deepEqual(parsed(text), {
    shots: [
      '00:00.000 The girl is standing, and the camera is shooting from behind her.',
      '00:01.000 The girl bent down, her hands resting on her knees.',
      '00:02.000 The girl turned her head to look at the camera.',
    ],
    overallSoundscape: 'N/A',
    nonDiegeticMusic: 'N/A',
  });
});

test('parsePrompt: round-trips buildPrompt output', () => {
  const input = {
    shots: [shot('00:00.000', 'a girl smiles.'), shot('00:01.500', 'camera pushes in, low angle.')],
    autoPeriod: true,
    overallSoundscape: 'rain on a window',
    nonDiegeticMusic: 'soft piano',
  };
  const r = core.parsePrompt(core.buildPrompt(input));
  assert.deepEqual(r.shots, input.shots.map(({ timestamp, description }) => ({ timestamp, description })));
  assert.equal(r.overallSoundscape, 'rain on a window');
  assert.equal(r.nonDiegeticMusic, 'soft piano');
});

test('parsePrompt: cleans spaces, line breaks, CRLF and invisible characters', () => {
  const text = '  \r\n\u200bintegrated_multimodal_description:\r\n  [Shot 1]  At 00:00.000 ,  a girl\r\n   smiles\u00a0 \r\n[shot 2] at 00:01.000, she   waves  \r\n\r\noverall_soundscape:   wind \r\n';
  assert.deepEqual(parsed(text), {
    shots: ['00:00.000 a girl smiles', '00:01.000 she waves'],
    overallSoundscape: 'wind',
    nonDiegeticMusic: 'N/A',
  });
});

test('parsePrompt: incomplete text still imports; audio defaults to N/A', () => {
  assert.deepEqual(parsed('[Shot 1] At 00:00.000, only one shot'), {
    shots: ['00:00.000 only one shot'], overallSoundscape: 'N/A', nonDiegeticMusic: 'N/A',
  });
  // near-miss timestamps are fixed; hopeless ones are kept so the card shows an error
  assert.deepEqual(parsed('[Shot 1] At 0:01.5, x [Shot 2] At 1:2, y [Shot 3] At 1:2:3, z').shots,
    ['00:01.500 x', '01:02.000 y', '1:2:3 z']);
  assert.equal(core.parsePrompt('just some text'), null);
  assert.equal(core.parsePrompt(''), null);
  assert.equal(core.parsePrompt(undefined), null);
});

test('hasShotContent: any description or non-default audio counts', () => {
  const blank = { shots: core.createInitialShots(), overallSoundscape: 'N/A', nonDiegeticMusic: ' ' };
  assert.equal(core.hasShotContent(blank), false);
  assert.equal(core.hasShotContent({ ...blank, shots: [shot('00:00.000', ' x ')] }), true);
  assert.equal(core.hasShotContent({ ...blank, overallSoundscape: 'rain' }), true);
  assert.equal(core.hasShotContent({ ...blank, nonDiegeticMusic: 'piano' }), true);
});

test('normalizeTimestamp: fixes common near-miss formats, keeps the rest', () => {
  const cases = {
    '0:01.5': '00:01.500', '00:01.5': '00:01.500', '0:1': '00:01.000', '1:2': '01:02.000',
    '00:01': '00:01.000', '00:01.12345': '00:01.123', '0:75': '01:15.000',
    '1.5': '00:01.500', '2': '00:02.000', ' 00:02.000 ': '00:02.000',
    '1:2:3': '1:2:3', 'abc': 'abc', '': '', '123:00.000': '123:00.000',
  };
  for (const [input, expected] of Object.entries(cases)) assert.equal(core.normalizeTimestamp(input), expected, input);
});

test('moveShotKeepingTimes: cards move, timestamps stay in their positions', () => {
  const shots = [shot('00:00.000', 'a'), shot('00:01.000', 'b'), shot('00:02.500', 'c')];
  let r = core.moveShotKeepingTimes(shots, 2, 0, 1);
  assert.deepEqual(texts(r.shots), ['00:00.000 c', '00:01.000 a', '00:02.500 b']);
  assert.equal(r.active, 2); // the previously active shot ("b") keeps focus
  assert.equal(r.shots[0].id, shots[2].id);
  r = core.moveShotKeepingTimes(shots, 0, 1, 0); // neighbours: times are simply swapped
  assert.deepEqual(texts(r.shots), ['00:00.000 b', '00:01.000 a', '00:02.500 c']);
  assert.deepEqual(texts(shots), ['00:00.000 a', '00:01.000 b', '00:02.500 c']); // input not changed
});
