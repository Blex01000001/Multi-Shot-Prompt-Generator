// Unit tests for js/core.js (pure logic). Run: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../../js/core.js');

const shot = (duration, description) => ({ id: Math.random(), duration, description });

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

test('createInitialShots: two blank one-second shots, a fresh copy every call', () => {
  const a = core.createInitialShots();
  assert.deepEqual(a.map(s => [s.duration, s.description]), [['1.0', ''], ['1.0', '']]);
  a[0].description = 'changed';
  assert.equal(core.createInitialShots()[0].description, '');
  assert.equal(core.DEFAULT_AUDIO, 'N/A');
});
test('buildPrompt: format, spacing, auto period, N/A defaults; At = sum of earlier durations', () => {
  const out = core.buildPrompt({
    shots: [shot('1.5', 'a girl smiles'), shot('2.0', 'camera pushes in.'), shot('1.0', 'she waves')],
    autoPeriod: true,
    overallSoundscape: '',
    nonDiegeticMusic: ' soft piano ',
  });
  assert.equal(out,
    'integrated_multimodal_description: [Shot 1] At 00:00.000, a girl smiles. [Shot 2] At 00:01.500, camera pushes in. [Shot 3] At 00:03.500, she waves.' +
    '\n\noverall_soundscape: N/A\nnon_diegetic_music: soft piano');
});
test('buildPrompt: autoPeriod off leaves text untouched', () => {
  const out = core.buildPrompt({ shots: [shot('1.0', 'no period')], autoPeriod: false });
  assert.match(out, /At 00:00\.000, no period\n/);
});
test('buildPrompt: empty shots are skipped, renumbered and not counted in the timeline', () => {
  const out = core.buildPrompt({
    shots: [shot('1.0', 'one'), shot('5.0', '   '), shot('1.0', 'three')],
    autoPeriod: true,
  });
  assert.match(out, /^integrated_multimodal_description: \[Shot 1\] At 00:00\.000, one\. \[Shot 2\] At 00:01\.000, three\.\n/);
});
test('analyzeShots: numbering and start times skip empty shots', () => {
  const info = core.analyzeShots([shot('1.0', 'a'), shot('3.0', ''), shot('0.5', 'c'), shot('2.0', 'd')]);
  assert.deepEqual(info.map(i => i.outNum), [1, null, 2, 3]);
  assert.deepEqual(info.map(i => i.start), ['00:00.000', null, '00:01.000', '00:01.500']);
  assert.deepEqual(info.map(i => i.error), [null, null, null, null]);
});
test('analyzeShots: durations must be seconds > 0; an invalid one counts as 0', () => {
  const info = core.analyzeShots([shot('abc', 'a'), shot('0', 'b'), shot('1.0', 'c'), shot('-1', '')]);
  assert.deepEqual(info.map(i => i.error), [{ type: 'invalid' }, { type: 'invalid' }, null, { type: 'invalid' }]);
  assert.deepEqual(info.map(i => i.start), ['00:00.000', '00:00.000', '00:00.000', null]);
});
test('totalDuration: sum of the exported shots only', () => {
  assert.equal(core.totalDuration([shot('1.5', 'a'), shot('9', ' '), shot('2.25', 'c'), shot('bad', 'd')]), 3.75);
  assert.equal(core.totalDuration([shot('1.0', '')]), 0);
  assert.equal(core.formatTimestamp(core.totalDuration([shot('0.1', 'a'), shot('0.2', 'b')])), '00:00.300');
});

test('formatDuration / parseDuration / normalizeDuration', () => {
  assert.deepEqual([1, 1.5, 1.25, 0.8, 2.0004, 61].map(core.formatDuration), ['1.0', '1.5', '1.25', '0.8', '2.0', '61.0']);
  const ok = { '1': 1, '1.5': 1.5, ' 2.25 ': 2.25, '1,5': 1.5, '1.5s': 1.5, '3 sec': 3, '0.001': 0.001 };
  for (const [input, expected] of Object.entries(ok)) assert.equal(core.parseDuration(input), expected, input);
  for (const bad of ['', '0', '0.0', '-1', 'abc', '1.2345', '1:00', '.5', null]) assert.equal(core.parseDuration(bad), null, String(bad));
  assert.equal(core.normalizeDuration(' 1,50s '), '1.5');
  assert.equal(core.normalizeDuration(' oops '), 'oops');
});

test('shiftDuration: adds seconds, never below 0.1', () => {
  assert.equal(core.shiftDuration('1.0', 0.5), '1.5');
  assert.equal(core.shiftDuration('1.0', -0.1), '0.9');
  assert.equal(core.shiftDuration('0.3', -0.5), '0.1');
  assert.equal(core.shiftDuration('garbage', 1), '1.0');
});
test('cleanShotText collapses line breaks, spaces and invisible characters', () => {
  assert.equal(core.cleanShotText('  a girl\r\n  turns\t\taround\u200b \u00a0slowly \n'), 'a girl turns around slowly');
  assert.equal(core.cleanShotText('first line\n---\nsecond line'), 'first line second line');
  assert.equal(core.cleanShotText(' \n\u200b '), '');
  assert.equal(core.cleanShotText(null), '');
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
const texts = (shots) => shots.map(s => `${s.duration} ${s.description}`);

test('appendShot: blank shot at the end with the given duration', () => {
  const shots = [shot('1.0', 'a'), shot('2.0', 'b')];
  const r = core.appendShot(shots, 7, 1.5);
  assert.deepEqual(texts(r.shots), ['1.0 a', '2.0 b', '1.5 ']);
  assert.equal(r.shots[2].id, 7);
  assert.equal(r.active, 2);
  assert.equal(shots.length, 2); // input not changed
  assert.deepEqual(texts(core.appendShot([], 1, 1).shots), ['1.0 ']);
});
test('duplicateShotAt: copy (same duration and text) inserted after the source', () => {
  const shots = [shot('1.5', 'a'), shot('1.0', 'b')];
  const r = core.duplicateShotAt(shots, 0, 9);
  assert.deepEqual(texts(r.shots), ['1.5 a', '1.5 a', '1.0 b']);
  assert.equal(r.shots[1].id, 9);
  assert.equal(r.active, 1);
  assert.equal(shots.length, 2);
});
test('removeShotAt: removes and focuses the previous shot, keeps the last one', () => {
  const shots = [shot('1.0', 'a'), shot('1.0', 'b'), shot('2.0', 'c')];
  let r = core.removeShotAt(shots, 1);
  assert.deepEqual(texts(r.shots), ['1.0 a', '2.0 c']);
  assert.equal(r.active, 0);
  r = core.removeShotAt(shots, 0);
  assert.equal(r.active, 0);
  r = core.removeShotAt([shot('1.0', 'only')], 0);
  assert.deepEqual(texts(r.shots), ['1.0 only']);
  assert.equal(shots.length, 3);
});

test('moveShotTo: reorders (durations move along), active follows its shot, out of range is a no-op', () => {
  const shots = [shot('1.0', 'a'), shot('1.5', 'b'), shot('2.0', 'c')];
  let r = core.moveShotTo(shots, 2, 0, 2); // moved shot stays active
  assert.deepEqual(texts(r.shots), ['2.0 c', '1.0 a', '1.5 b']);
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
const parsed = (text, last) => {
  const r = core.parsePrompt(text, last);
  return r && { ...r, shots: r.shots.map(s => `${s.duration} ${s.description}`) };
};

test('parsePrompt: reads the example pasted by the user (no space between shots)', () => {
  const text = '---\nintegrated_multimodal_description: [Shot 1] At 00:00.000, The girl is standing, and the camera is shooting from behind her.[Shot 2] At 00:01.000, The girl bent down, her hands resting on her knees.[Shot 3] At 00:02.000, The girl turned her head to look at the camera.\n\noverall_soundscape: N/A\nnon_diegetic_music: N/A\n---';
  assert.deepEqual(parsed(text), {
    shots: [
      '1.0 The girl is standing, and the camera is shooting from behind her.',
      '1.0 The girl bent down, her hands resting on her knees.',
      '1.0 The girl turned her head to look at the camera.',
    ],
    overallSoundscape: 'N/A',
    nonDiegeticMusic: 'N/A',
  });
});

test('parsePrompt: round-trips buildPrompt output', () => {
  const input = {
    shots: [shot('1.5', 'a girl smiles.'), shot('0.75', 'camera pushes in, low angle.'), shot('2.0', 'she waves.')],
    autoPeriod: true,
    overallSoundscape: 'rain on a window',
    nonDiegeticMusic: 'soft piano',
  };
  // the last duration is not in the prompt: it comes from the second argument
  const r = core.parsePrompt(core.buildPrompt(input), 2);
  assert.deepEqual(r.shots, input.shots.map(({ duration, description }) => ({ duration, description })));
  assert.equal(r.overallSoundscape, 'rain on a window');
  assert.equal(r.nonDiegeticMusic, 'soft piano');
});

test('parsePrompt: cleans spaces, line breaks, CRLF and invisible characters', () => {
  const text = '  \r\n\u200bintegrated_multimodal_description:\r\n  [Shot 1]  At 00:00.000 ,  a girl\r\n   smiles\u00a0 \r\n[shot 2] at 00:01.000, she   waves  \r\n\r\noverall_soundscape:   wind \r\n';
  assert.deepEqual(parsed(text), {
    shots: ['1.0 a girl smiles', '1.0 she waves'],
    overallSoundscape: 'wind',
    nonDiegeticMusic: 'N/A',
  });
});

test('parsePrompt: incomplete text still imports; audio defaults to N/A', () => {
  assert.deepEqual(parsed('[Shot 1] At 00:00.000, only one shot', 1.5), {
    shots: ['1.5 only one shot'], overallSoundscape: 'N/A', nonDiegeticMusic: 'N/A',
  });
  // near-miss timestamps are fixed; gaps around a hopeless one, or gaps that
  // are not positive, give invalid durations so the card shows an error
  assert.deepEqual(parsed('[Shot 1] At 0:01.5, x [Shot 2] At 0:2, y [Shot 3] At 1:2:3, z [Shot 4] At 00:05.000, w').shots,
    ['0.5 x', ' y', ' z', '1.0 w']);
  assert.deepEqual(parsed('[Shot 1] At 00:02.000, a [Shot 2] At 00:01.000, b').shots, ['-1.0 a', '1.0 b']);
  assert.equal(core.parsePrompt('just some text'), null);
  assert.equal(core.parsePrompt(''), null);
  assert.equal(core.parsePrompt(undefined), null);
});

test('hasShotContent: any description or non-default audio counts', () => {
  const blank = { shots: core.createInitialShots(), overallSoundscape: 'N/A', nonDiegeticMusic: ' ' };
  assert.equal(core.hasShotContent(blank), false);
  assert.equal(core.hasShotContent({ ...blank, shots: [shot('1.0', ' x ')] }), true);
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
