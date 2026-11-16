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
    core.KEYFRAME_ALIGNMENT + '\n\n' +
    'integrated_multimodal_description: [Shot 1] At 00:00.000, a girl smiles. [Shot 2] At 00:01.500, camera pushes in. [Shot 3] At 00:03.500, she waves.' +
    '\n\noverall_soundscape: N/A\nnon_diegetic_music: soft piano');
});
test('buildPrompt: starts with the I2VA keyframe alignment line and one blank line', () => {
  const out = core.buildPrompt({ shots: [shot('1.0', 'x')], autoPeriod: true });
  assert.equal(core.KEYFRAME_ALIGNMENT,
    'For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.');
  assert.ok(out.startsWith(core.KEYFRAME_ALIGNMENT + '\n\nintegrated_multimodal_description: '));
});
test('buildPrompt: t2va mode leaves out the alignment sentence; unknown mode behaves like i2va', () => {
  const input = { shots: [shot('1.0', 'x')], autoPeriod: true };
  const t2va = core.buildPrompt({ ...input, mode: 't2va' });
  assert.ok(t2va.startsWith('integrated_multimodal_description: [Shot 1] At 00:00.000, x.'));
  assert.ok(!t2va.includes('<Picture 1>'));
  assert.equal(core.buildPrompt({ ...input, mode: 'i2va' }), core.buildPrompt(input));
  assert.deepEqual(core.parsePrompt(t2va, 1).shots.map(s => s.description), ['x.']);
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
  assert.match(out, /\nintegrated_multimodal_description: \[Shot 1\] At 00:00\.000, one\. \[Shot 2\] At 00:01\.000, three\.\n/);
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

test('buildStoryboardExport / parseStoryboard round-trip and tolerate bad input', () => {
  const state = {
    shots: [{ id: 5, duration: '1.5', description: 'a girl smiles' }, { id: 6, duration: '2.0', description: '' }],
    overallSoundscape: 'wind',
    nonDiegeticMusic: 'N/A',
  };
  const out = core.buildStoryboardExport(state, new Date('2026-01-02T03:04:05Z'));
  assert.equal(out.type, 'minimax-h3-prompt-storyboard');
  assert.equal(out.exportedAt, '2026-01-02T03:04:05.000Z');
  assert.deepEqual(out.shots, [{ duration: '1.5', description: 'a girl smiles' }, { duration: '2.0', description: '' }]);
  assert.deepEqual(core.parseStoryboard(JSON.parse(JSON.stringify(out))), {
    name: '', mode: 'i2va', shots: out.shots, overallSoundscape: 'wind', nonDiegeticMusic: 'N/A',
    ref: core.normalizeRef(null),
  });
  // the prompt mode is exported and read back; anything unknown means i2va
  assert.equal(core.buildStoryboardExport({ ...state, mode: 't2va' }).mode, 't2va');
  assert.equal(core.parseStoryboard({ ...out, mode: 't2va' }).mode, 't2va');
  assert.equal(core.parseStoryboard({ ...out, mode: 'nonsense' }).mode, 'i2va');
  // the name is exported when set, and read back trimmed to one line
  const named = core.buildStoryboardExport({ ...state, name: 'Intro scene' });
  assert.equal(named.name, 'Intro scene');
  assert.equal(core.parseStoryboard({ ...named, name: '  Intro \n scene ' }).name, 'Intro scene');

  // missing / odd values: default duration, numbers become text, audio is one line
  const loose = core.parseStoryboard({ shots: [{ description: 'x' }, { duration: 2, description: 'y' }, null, { duration: 'abc', description: 5 }], overallSoundscape: 'a\n b', nonDiegeticMusic: '  ' });
  assert.deepEqual(loose.shots, [{ duration: '1.0', description: 'x' }, { duration: '2', description: 'y' }, { duration: 'abc', description: '5' }]);
  assert.equal(loose.overallSoundscape, 'a b');
  assert.equal(loose.nonDiegeticMusic, 'N/A');

  for (const bad of [null, 'x', 5, {}, { shots: 'x' }, { shots: [] }, { shots: [null] }]) {
    assert.throws(() => core.parseStoryboard(bad), /No shot list/);
  }
});

test('project helpers: blank project, names, ids', () => {
  const blank = core.blankProject('p1', 'Storyboard 1');
  assert.equal(blank.shots.length, 2);
  assert.deepEqual(blank.shots[0], { duration: '1.0', description: '' });
  assert.equal(blank.overallSoundscape, 'N/A');
  assert.ok(!('id' in blank.shots[0])); // plain shots, no card ids

  assert.equal(core.defaultProjectName([]), 'Storyboard 1');
  assert.equal(core.defaultProjectName([{ name: 'Storyboard 2' }, { name: 'x' }]), 'Storyboard 3');
  assert.equal(core.defaultProjectName([{ name: 'Storyboard 3' }, { name: 'x' }, { name: 'y' }]), 'Storyboard 4');

  assert.equal(core.nextProjectId([]), 'p1');
  assert.equal(core.nextProjectId([{ id: 'p1' }, { id: 'p7' }, { id: 'weird' }]), 'p8');
});

test('buildProjectsStore / parseProjectsStore round-trip and repair bad data', () => {
  const a = { ...core.blankProject('p1', 'One'), overallSoundscape: 'wind' };
  const b = core.blankProject('p4', 'Two');
  b.mode = 't2va';
  const store = core.buildProjectsStore([a, b], 'p4', { timeStepSec: 2, autoPeriod: false });
  assert.equal(store.type, 'minimax-h3-prompt-projects');
  const back = core.parseProjectsStore(JSON.parse(JSON.stringify(store)));
  assert.equal(back.activeId, 'p4');
  assert.deepEqual(back.projects.map(p => p.mode), ['i2va', 't2va']);
  assert.deepEqual(back.settings, { timeStepSec: 2, autoPeriod: false });
  assert.deepEqual(back.projects.map(p => [p.id, p.name, p.overallSoundscape]), [['p1', 'One', 'wind'], ['p4', 'Two', 'N/A']]);

  // bad / duplicate ids and missing names are replaced; unreadable entries and an unknown activeId are dropped
  const messy = core.parseProjectsStore({
    activeId: 'nope',
    projects: [
      { id: 'p2', shots: [{ duration: '1', description: 'a' }] },
      { id: 'p2', name: 'Dup', shots: [{ duration: '1', description: 'b' }] },
      { id: 5, name: 'Numeric id', shots: [{ duration: '1', description: 'c' }] },
      { id: 'p9', name: 'Broken', shots: [] },
      null,
    ],
  });
  assert.equal(messy.projects.length, 3);
  assert.equal(new Set(messy.projects.map(p => p.id)).size, 3);
  assert.equal(messy.projects[0].id, 'p2');
  assert.match(messy.projects[0].name, /^Storyboard \d+$/);
  assert.equal(new Set(messy.projects.map(p => p.name)).size, 3);
  assert.equal(messy.activeId, 'p2');

  for (const bad of [null, {}, { projects: 'x' }, { projects: [] }, { projects: [{ shots: [] }] }]) {
    assert.throws(() => core.parseProjectsStore(bad), /No projects/);
  }
});

test('normalizeSettings keeps valid values and repairs the rest', () => {
  assert.deepEqual(core.normalizeSettings({ timeStepSec: 1.5, autoPeriod: false }), { timeStepSec: 1.5, autoPeriod: false });
  for (const bad of [null, undefined, 'x', {}, { timeStepSec: 7, autoPeriod: 'yes' }]) {
    assert.deepEqual(core.normalizeSettings(bad), { timeStepSec: 1, autoPeriod: true });
  }
  // an old store without settings loads with the defaults
  const old = core.parseProjectsStore({ projects: [{ id: 'p1', name: 'A', shots: [{ duration: '1', description: 'x' }] }] });
  assert.deepEqual(old.settings, { timeStepSec: 1, autoPeriod: true });
  assert.equal(old.projects[0].mode, 'i2va');
});

test('moveTag moves one tag and ignores bad indexes', () => {
  const tags = ['a', 'b', 'c'].map(text => core.normalizeTag({ text }));
  const texts = list => list.map(x => x.text).join('');
  assert.equal(texts(core.moveTag(tags, 2, 0)), 'cab');
  assert.equal(texts(core.moveTag(tags, 0, 1)), 'bac');
  assert.equal(texts(core.moveTag(tags, 1, 1)), 'abc');
  assert.equal(texts(core.moveTag(tags, -1, 1)), 'abc');
  assert.equal(texts(core.moveTag(tags, 0, 3)), 'abc');
  assert.equal(texts(tags), 'abc'); // input untouched
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
  if (!r) return r;
  const { mode, ...rest } = r; // the mode has its own test
  return { ...rest, shots: r.shots.map(s => `${s.duration} ${s.description}`) };
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

test('parsePrompt: mode is i2va with the alignment sentence, t2va without', () => {
  const body = '[Shot 1] At 00:00.000, one.';
  assert.equal(core.parsePrompt('integrated_multimodal_description: ' + body).mode, 't2va');
  assert.equal(core.parsePrompt(core.KEYFRAME_ALIGNMENT + '\n\nintegrated_multimodal_description: ' + body).mode, 'i2va');
  assert.equal(core.parsePrompt('How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video.\n\n' + body).mode, 'i2va');
  for (const mode of core.BASE_MODES) {
    assert.equal(core.parsePrompt(core.buildPrompt({ shots: [shot('1.0', 'x')], autoPeriod: true, mode })).mode, mode);
  }
});

test('parsePrompt: ignores the keyframe alignment line, with or without field names', () => {
  const line = core.KEYFRAME_ALIGNMENT;
  const bare = core.parsePrompt(line + '\n\n[Shot 1] At 00:00.000, one. [Shot 2] At 00:01.000, two.', 1);
  assert.deepEqual(bare.shots.map(s => s.description), ['one.', 'two.']);
  const full = core.parsePrompt(line + '\n\nintegrated_multimodal_description: [Shot 1] At 00:00.000, one.', 1);
  assert.deepEqual(full.shots.map(s => s.description), ['one.']);
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

// ---------------------------------------------------------------------------
// Multimodal reference format (ref2va)
// ---------------------------------------------------------------------------
const refItem = (type, definition, extra = {}) => ({ ...core.blankRefItem(type), definition, ...extra });
const sampleRef = () => ({
  ...core.blankRefFields(),
  style: 'The target video is in a warm style.',
  summary: 'A woman reads in a shop.',
  refs: [
    refItem('Subject', 'is the woman in <Picture 1>, with a grey sweater', { note: 'face and sweater kept' }),
    refItem('Subject', 'is the bookshop interior', { marker: 'partially_preserved' }),
    refItem('Picture', 'is the first frame of [Shot 1]', { scope: '[Shot 1] first frame' }),
    refItem('Video', 'is the source video', { scope: 'cut and pacing structure', marker: 'weak_reference' }),
    refItem('Audio', 'is the voice-timbre reference for <Subject 1> (S1)', { marker: 'reference', note: 'timbre only' }),
  ],
});
const sampleShots = () => [
  shot('1.5', '<Subject 2> holds <Subject 1>, she reads'),
  shot('5', '   '),
  shot('2', 'close-up of <Subject 1>.'),
];

test('refLabels numbers each type on its own', () => {
  assert.deepEqual(core.refLabels(sampleRef().refs), ['<Subject 1>', '<Subject 2>', '<Picture 1>', '<Video 1>', '<Audio 1>']);
});

test('buildPrompt ref2va: six sections, first shot without At, appears-in computed from the shots', () => {
  const out = core.buildPrompt({
    shots: sampleShots(), autoPeriod: true, overallSoundscape: 'rain', nonDiegeticMusic: '', mode: 'ref2va', ref: sampleRef(),
  });
  assert.equal(out, [
    'subject_definitions:',
    '<Subject 1> is the woman in <Picture 1>, with a grey sweater',
    '<Subject 2> is the bookshop interior',
    '<Picture 1> is the first frame of [Shot 1]',
    '<Video 1> is the source video',
    '<Audio 1> is the voice-timbre reference for <Subject 1> (S1)',
    '',
    'summary:',
    '[reference generation] A woman reads in a shop.',
    '',
    'retention_analysis:',
    '<Subject 1> (appears in [Shot 1], [Shot 2]): fully_preserved - face and sweater kept',
    '<Subject 2> (appears in [Shot 1]): partially_preserved',
    '<Picture 1> ([Shot 1] first frame): fully_preserved',
    '<Video 1> (cut and pacing structure): weak_reference',
    '<Audio 1>: reference - timbre only',
    '',
    'detailed_description:',
    'The target video is in a warm style.',
    '[Shot 1] <Subject 2> holds <Subject 1>, she reads.',
    '[Shot 2] At 00:01.500, close-up of <Subject 1>.',
    '',
    'overall_soundscape:',
    'rain',
    '',
    'non_diegetic_music:',
    'N/A',
  ].join('\n'));
});

test('buildPrompt ref2va: summary prefixes join with +, ":" definitions, free retention, empty sections', () => {
  const ref = {
    ...core.blankRefFields(),
    summaryTypes: ['video editing', 'reference generation', 'audio reuse'],
    retentionMode: 'free',
    retentionFree: 'Keep the face.\nKeep the coat.',
    refs: [refItem('Picture', ': The main man'), refItem('Subject', '')],
  };
  const out = core.buildPrompt({ shots: [shot('1', 'x')], autoPeriod: false, mode: 'ref2va', ref });
  assert.ok(out.startsWith('subject_definitions:\n<Picture 1>: The main man\n\nsummary:\n[video editing + reference generation + audio reuse]\n\nretention_analysis:\nKeep the face.\nKeep the coat.\n\n'));
  const empty = core.buildPrompt({ shots: [shot('1', '')], mode: 'ref2va', ref: core.blankRefFields() });
  assert.ok(empty.startsWith('subject_definitions:\n\nsummary:\n[reference generation]\n\nretention_analysis:\n\ndetailed_description:\n\n'));
});

test('parsePrompt ref2va: round-trips buildPrompt (list mode)', () => {
  const input = { shots: sampleShots(), autoPeriod: true, overallSoundscape: 'rain', nonDiegeticMusic: 'soft piano', mode: 'ref2va', ref: sampleRef() };
  const r = core.parsePrompt(core.buildPrompt(input), 2);
  assert.equal(r.mode, 'ref2va');
  assert.deepEqual(r.shots, [{ duration: '1.5', description: '<Subject 2> holds <Subject 1>, she reads.' }, { duration: '2.0', description: 'close-up of <Subject 1>.' }]);
  assert.equal(r.overallSoundscape, 'rain');
  assert.equal(r.nonDiegeticMusic, 'soft piano');
  assert.deepEqual(r.ref, { ...sampleRef(), summaryTypes: ['reference generation'], retentionMode: 'list', retentionFree: '' });
  // building again from the parsed pieces gives the same text
  const again = core.buildPrompt({ ...input, shots: r.shots.map(s => ({ ...s })), ref: { ...sampleRef(), ...r.ref } });
  assert.equal(again, core.buildPrompt(input));
});

test('parsePrompt ref2va: reads the official example, falls back to free retention text for other styles', () => {
  const official = [
    'subject_definitions:',
    '<Subject 1> is the young woman in <Picture 1>, with auburn hair.',
    '<Subject 2> is the narrow bookshop interior in <Picture 2>.',
    '',
    'summary:',
    '[reference generation] <Subject 1> takes a volume down.',
    '',
    'retention_analysis:',
    '<Subject 1> (appears in [Shot 1], [Shot 2]): fully_preserved - her face is kept.',
    '<Subject 2> (appears in [Shot 1], [Shot 2]): fully_preserved - the oak shelving remains.',
    '',
    'detailed_description:',
    'The target video is in a warm, realistic style.',
    '[Shot 1] A medium-wide shot establishes <Subject 2>.',
    '[Shot 2] At 00:04.000, the shot cuts to a close-up of <Subject 1>.',
    '',
    'overall_soundscape:',
    'A quiet room tone.',
    '',
    'non_diegetic_music:',
    'A sparse guitar.',
  ].join('\n');
  const r = core.parsePrompt('---\n' + official + '\n---', 1);
  assert.deepEqual(r.shots.map(s => s.duration), ['4.0', '1.0']);
  assert.equal(r.ref.style, 'The target video is in a warm, realistic style.');
  assert.equal(r.ref.retentionMode, 'list');
  assert.deepEqual(r.ref.refs.map(x => [x.type, x.marker, x.note]), [['Subject', 'fully_preserved', 'her face is kept.'], ['Subject', 'fully_preserved', 'the oak shelving remains.']]);
  assert.equal(core.buildPrompt({ shots: r.shots, autoPeriod: false, overallSoundscape: r.overallSoundscape, nonDiegeticMusic: r.nonDiegeticMusic, mode: 'ref2va', ref: r.ref }).replace(/ \(appears in[^)]*\)/g, ' (appears in [Shot 1], [Shot 2])').split('\n\n')[3],
    'detailed_description:\nThe target video is in a warm, realistic style.\n[Shot 1] A medium-wide shot establishes <Subject 2>.\n[Shot 2] At 00:04.000, the shot cuts to a close-up of <Subject 1>.');

  const community = official.replace(/retention_analysis:[\s\S]*?\n\ndetailed/, 'retention_analysis:\nRetain the face of the man from <Picture 1>. Keep the coat.\n\ndetailed');
  const c = core.parsePrompt(community, 1);
  assert.equal(c.ref.retentionMode, 'free');
  assert.equal(c.ref.retentionFree, 'Retain the face of the man from <Picture 1>. Keep the coat.');
  // no ref2va field at all: still the base format
  assert.equal(core.parsePrompt('integrated_multimodal_description: [Shot 1] At 00:00.000, a.').mode, 't2va');
});

test('normalizeRef / serializeRef repair bad data and keep the content', () => {
  const messy = core.normalizeRef({
    style: {}, summaryTypes: ['a', 'a', ' ', 7], refs: [null, { type: 'Nope', definition: 'x' }, { type: 'Audio', marker: '' }],
    retentionMode: 'weird', shots: [{ duration: 2, description: 'd' }, 'bad'], overallSoundscape: 'a\nb',
  });
  assert.equal(messy.style, '');
  assert.deepEqual(messy.summaryTypes, ['a', '7']);
  assert.deepEqual(messy.refs.map(x => [x.type, x.marker]), [['Subject', 'fully_preserved'], ['Audio', 'fully_copy']]);
  assert.equal(messy.retentionMode, 'list');
  assert.deepEqual(messy.shots, [{ duration: '2', description: 'd' }]);
  assert.equal(messy.overallSoundscape, 'a b');
  assert.deepEqual(core.normalizeRef(undefined).summaryTypes, ['reference generation']);
  assert.equal(core.normalizeRef(undefined).shots.length, 2);
  const ref = sampleRef();
  assert.deepEqual(core.serializeRef({ ...ref, shots: [{ id: 9, duration: '1.0', description: 'x' }] }).shots, [{ duration: '1.0', description: 'x' }]);
});

test('storyboards and the projects store keep the ref2va content', () => {
  const ref = { ...sampleRef(), shots: [{ duration: '2.0', description: 'in ref' }] };
  const project = { ...core.blankProject('p1', 'A'), mode: 'ref2va', ref };
  const exported = core.buildStoryboardExport({ ...project, shots: [{ duration: '1.0', description: 'live' }] });
  assert.equal(exported.mode, 'ref2va');
  assert.equal(core.parseStoryboard(JSON.parse(JSON.stringify(exported))).ref.refs.length, 5);
  const store = core.buildProjectsStore([project], 'p1');
  const back = core.parseProjectsStore(JSON.parse(JSON.stringify(store)));
  assert.equal(back.projects[0].mode, 'ref2va');
  assert.deepEqual(back.projects[0].ref.shots, [{ duration: '2.0', description: 'in ref' }]);
  assert.equal(back.projects[0].ref.refs[0].definition, ref.refs[0].definition);
  // an older store without "ref" loads with a blank one
  const old = core.parseProjectsStore({ projects: [{ id: 'p1', name: 'A', shots: [{ duration: '1', description: 'x' }] }] });
  assert.deepEqual(old.projects[0].ref, core.normalizeRef(null));
});
