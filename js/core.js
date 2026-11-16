// =============================================================================
// core.js — pure logic (no DOM, no localStorage)
//
// Everything here takes plain data and returns plain data, so it is covered by
// fast Node unit tests (tests/unit/core.test.js). Put new logic here whenever
// it does not need the page; keep DOM code in shots.js / tags.js / app.js.
//
// Loads in the browser (top-level names become globals shared with the other
// scripts) and in Node (module.exports at the bottom).
// =============================================================================

// -----------------------------------------------------------------------------
// Timestamps (MM:SS.mmm)
// -----------------------------------------------------------------------------
const TIMESTAMP_RE = /^\d{2}:[0-5]\d\.\d{3}$/;

// Default-duration options for new shots (seconds).
const TIME_STEPS = [0.8, 1, 1.5, 2, 3];

// Format seconds into a MM:SS.mmm timestamp string.
function formatTimestamp(totalSeconds) {
  const totalMs = Math.round(totalSeconds * 1000);
  const mins = Math.floor(totalMs / 60000);
  const secs = (totalMs % 60000) / 1000;
  const minsStr = String(mins).padStart(2, '0');
  const secsStr = secs.toFixed(3).padStart(6, '0');
  return `${minsStr}:${secsStr}`;
}

// Parse MM:SS.mmm into seconds. Lenient: anything unparsable becomes 0.
function parseTimestamp(tsString) {
  const parts = String(tsString).trim().split(':');
  if (parts.length === 2) {
    const m = parseFloat(parts[0]) || 0;
    const s = parseFloat(parts[1]) || 0;
    return m * 60 + s;
  }
  return 0;
}

function isValidTimestamp(tsString) {
  return TIMESTAMP_RE.test(String(tsString).trim());
}

// Fix common near-miss timestamps into MM:SS.mmm; anything else is returned
// unchanged (trimmed) so the card shows the usual "invalid" error.
//   '0:01.5' → '00:01.500'   '1:2' → '01:02.000'   '00:01.12345' → '00:01.123'
//   '0:75'   → '01:15.000'   '1.5' → '00:01.500' (seconds only)
function normalizeTimestamp(tsString) {
  const ts = String(tsString ?? '').trim();
  const minSec = ts.match(/^(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/);
  if (minSec) return formatTimestamp(Number(minSec[1]) * 60 + Number(minSec[2]));
  if (/^\d{1,2}(?:\.\d+)?$/.test(ts)) return formatTimestamp(Number(ts));
  return ts;
}

// -----------------------------------------------------------------------------
// Shot durations (seconds, e.g. "1.5"). Each shot stores how long it lasts;
// its "At MM:SS.mmm" start time is the sum of the exported shots before it.
// -----------------------------------------------------------------------------
const DURATION_RE = /^\d{1,4}(?:\.\d{1,3})?$/;
const MIN_DURATION_SEC = 0.1;

// Seconds → "1.0", "1.5", "1.25" (millisecond precision, at least one decimal).
function formatDuration(seconds) {
  const ms = Math.round(seconds * 1000);
  return (ms / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '.0');
}

// "1.5" / " 1.5s " / "1,5" → 1.5; null when not a positive number of seconds.
function parseDuration(str) {
  const text = String(str ?? '').trim().replace(/\s*(?:s|sec)$/i, '').replace(',', '.');
  if (!DURATION_RE.test(text)) return null;
  const seconds = Number(text);
  return seconds > 0 ? seconds : null;
}

// Tidy a typed duration ("1,50s" → "1.5"); invalid input is returned trimmed.
function normalizeDuration(str) {
  const seconds = parseDuration(str);
  return seconds === null ? String(str ?? '').trim() : formatDuration(seconds);
}

// Change a duration by `seconds` (may be negative); never below MIN_DURATION_SEC.
function shiftDuration(str, seconds) {
  return formatDuration(Math.max(MIN_DURATION_SEC, (parseDuration(str) ?? 0) + seconds));
}

// -----------------------------------------------------------------------------
// Shots → output numbering, validation, prompt text
// A shot is { id, duration, description }.
// -----------------------------------------------------------------------------

// Value used for an empty soundscape / music field (also the initial value).
const DEFAULT_AUDIO = 'N/A';

// Starting content (page load and Reset): two blank one-second shots.
function createInitialShots() {
  return [
    { id: 1, duration: '1.0', description: '' },
    { id: 2, duration: '1.0', description: '' },
  ];
}

// -----------------------------------------------------------------------------
// Shot list operations. Each returns { shots, active }: a new array (the input
// is not changed) and the index of the shot that should be focused/active.
// -----------------------------------------------------------------------------

// New blank shot at the end, lasting `durationSec`.
function appendShot(shots, id, durationSec) {
  return { shots: [...shots, { id, duration: formatDuration(durationSec), description: '' }], active: shots.length };
}

// Copy of shots[index] (same duration and text) inserted right after it.
function duplicateShotAt(shots, index, id) {
  const source = shots[index];
  const copy = { id, duration: source.duration, description: source.description };
  return { shots: [...shots.slice(0, index + 1), copy, ...shots.slice(index + 1)], active: index + 1 };
}

// Remove shots[index]; the last remaining shot is never removed.
function removeShotAt(shots, index) {
  if (shots.length <= 1) return { shots: shots.slice(), active: 0 };
  return { shots: shots.filter((_, i) => i !== index), active: Math.max(0, index - 1) };
}

// Move shots[from] to position `to` (its duration moves with it, so the start
// times of the shots in between change). `active` follows the shot that was at
// activeIndex (pass activeIndex = from to make the moved shot active).
// Out-of-range indexes leave the order unchanged.
function moveShotTo(shots, from, to, activeIndex) {
  const result = shots.slice();
  if (from !== to && from >= 0 && to >= 0 && from < shots.length && to < shots.length) {
    const [moved] = result.splice(from, 1);
    result.splice(to, 0, moved);
  }
  const activeShot = shots[activeIndex];
  const active = activeShot ? result.indexOf(activeShot) : 0;
  return { shots: result, active };
}

// For every shot returns { outNum, start, error }:
//  - outNum: number in the output ([Shot N]); null for empty shots (skipped).
//  - start:  "MM:SS.mmm" start time; null for empty shots. The first exported
//            shot starts at 00:00.000, each later one when the previous ends.
//  - error:  null | { type: 'invalid' } (duration is not seconds > 0).
// Empty shots are not part of the timeline: their duration is not counted
// (but is still checked). An invalid duration counts as 0.
function analyzeShots(shots) {
  let outNum = 0;
  let elapsed = 0;
  return shots.map(shot => {
    const seconds = parseDuration(shot.duration);
    const info = { outNum: null, start: null, error: seconds === null ? { type: 'invalid' } : null };
    if (shot.description.trim().length === 0) return info;

    outNum += 1;
    info.outNum = outNum;
    info.start = formatTimestamp(elapsed);
    elapsed += seconds ?? 0;
    return info;
  });
}

// Total length in seconds of the exported (non-empty) shots.
function totalDuration(shots) {
  return shots.reduce((sum, shot) => (
    shot.description.trim() ? sum + (parseDuration(shot.duration) ?? 0) : sum
  ), 0);
}

// Build the MiniMax H3 prompt. See docs/FORMAT.md — do not change the
// format without asking the user.
// `mode`: 'i2va' (default) starts with the keyframe alignment sentence and a
// blank line; 't2va' (text only, no input image) leaves both out; 'ref2va' is
// the six-section multimodal reference format (buildRefPrompt, `ref` holds its
// extra fields).
//   <KEYFRAME_ALIGNMENT line>   (i2va only)
//
//   integrated_multimodal_description: [Shot 1] At 00:00.000, text. [Shot 2] ...
//
//   overall_soundscape: ...
//   non_diegetic_music: ...
const BASE_MODES = ['i2va', 't2va'];
const PROMPT_MODES = [...BASE_MODES, 'ref2va'];
const KEYFRAME_ALIGNMENT = 'For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.';

function buildPrompt({ shots, autoPeriod, overallSoundscape, nonDiegeticMusic, mode = 'i2va', ref }) {
  if (mode === 'ref2va') return buildRefPrompt({ shots, autoPeriod, overallSoundscape, nonDiegeticMusic, ref });
  const parts = [];
  const analysis = analyzeShots(shots);

  shots.forEach((shot, i) => {
    let text = shot.description.trim();
    if (text.length === 0) return; // empty shots are skipped, the rest renumbered

    if (autoPeriod && !text.endsWith('.')) {
      text += '.';
    }

    parts.push(`[Shot ${parts.length + 1}] At ${analysis[i].start}, ${text}`);
  });

  const soundscape = (overallSoundscape || '').trim() || DEFAULT_AUDIO;
  const music = (nonDiegeticMusic || '').trim() || DEFAULT_AUDIO;

  const intro = mode === 't2va' ? '' : `${KEYFRAME_ALIGNMENT}\n\n`;
  return `${intro}integrated_multimodal_description: ${parts.join(' ')}\n\noverall_soundscape: ${soundscape}\nnon_diegetic_music: ${music}`;
}

// -----------------------------------------------------------------------------
// Multimodal reference format (MiniMax H3 "Ref2VA"): six sections. Rules are
// summarized in docs/MULTIMODAL-SPEC.md. `ref` holds the extra fields:
//   { style, summaryTypes: [..], summary, retentionMode: 'list' | 'free',
//     retentionFree, refs: [{ type, definition, marker, scope, note }] }
// A saved project also keeps the shots / audio of this format in `project.ref`.
// -----------------------------------------------------------------------------
const REF_TYPES = ['Subject', 'Picture', 'Video', 'Audio'];
// Relationship markers (fixed English values). Add a value here and it shows
// up in the marker lists; the first one of each list is the default.
const RETENTION_MARKERS = {
  visual: ['fully_preserved', 'partially_preserved', 'attribute_transfer', 'weak_reference'],
  audio: ['fully_copy', 'partially_copy', 'reference', 'weak_reference'],
};
const SUMMARY_TYPES = ['reference generation', 'keyframe completion', 'video editing', 'video continuation', 'audio reuse', 'audio reference'];

function markersFor(type) {
  return type === 'Audio' ? RETENTION_MARKERS.audio : RETENTION_MARKERS.visual;
}

function blankRefItem(type = 'Subject') {
  return { type, definition: '', marker: markersFor(type)[0], scope: '', note: '' };
}

// Extra fields only (no shots / audio): what the UI edits.
function blankRefFields() {
  return {
    style: '',
    summaryTypes: ['reference generation'],
    summary: '',
    refs: [],
    retentionMode: 'list',
    retentionFree: '',
  };
}

// A saved ref2va content: shots / audio of this format plus the extra fields.
function blankRef() {
  return {
    ...blankRefFields(),
    shots: createInitialShots().map(({ duration, description }) => ({ duration, description })),
    overallSoundscape: DEFAULT_AUDIO,
    nonDiegeticMusic: DEFAULT_AUDIO,
  };
}

// Clean up a ref value read from storage / a file. Missing parts get defaults.
function normalizeRef(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const text = (v) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
  const blank = blankRef();
  const refs = (Array.isArray(r.refs) ? r.refs : [])
    .filter(x => x && typeof x === 'object')
    .map(x => {
      const type = REF_TYPES.includes(x.type) ? x.type : 'Subject';
      return { type, definition: text(x.definition), marker: text(x.marker).trim() || markersFor(type)[0], scope: text(x.scope), note: text(x.note) };
    });
  const types = Array.isArray(r.summaryTypes)
    ? [...new Set(r.summaryTypes.map(v => text(v).trim()).filter(Boolean))]
    : blank.summaryTypes;
  const shots = (Array.isArray(r.shots) ? r.shots : [])
    .filter(s => s && typeof s === 'object')
    .map(s => ({ duration: text(s.duration) || '1.0', description: text(s.description) }));
  const audio = (v) => collapseSpaces(text(v)) || DEFAULT_AUDIO;
  return {
    style: text(r.style),
    summaryTypes: types,
    summary: text(r.summary),
    refs,
    retentionMode: r.retentionMode === 'free' ? 'free' : 'list',
    retentionFree: text(r.retentionFree),
    shots: shots.length ? shots : blank.shots,
    overallSoundscape: audio(r.overallSoundscape),
    nonDiegeticMusic: audio(r.nonDiegeticMusic),
  };
}

// Plain copy for saving (no card ids; shots may be omitted for the live fields).
function serializeRef(ref) {
  const r = normalizeRef(ref);
  return {
    ...r,
    refs: r.refs.map(item => ({ ...item })),
    shots: r.shots.map(({ duration, description }) => ({ duration, description })),
  };
}

// "<Subject 1>", "<Picture 1>", "<Subject 2>", ...: each type counts on its own.
function refLabels(refs) {
  const count = {};
  return refs.map(item => {
    count[item.type] = (count[item.type] || 0) + 1;
    return `<${item.type} ${count[item.type]}>`;
  });
}

// Output shot numbers (1-based, empty shots skipped) whose description uses `label`.
function shotsUsingLabel(shots, label) {
  const found = [];
  let n = 0;
  shots.forEach(shot => {
    if (!shot.description.trim()) return;
    n += 1;
    if (shot.description.includes(label)) found.push(n);
  });
  return found;
}

// Label + text. A text that starts with ":" is joined without a space
// ("<Picture 1>: …"); otherwise "<Subject 1> is …".
function joinLabel(label, text) {
  const body = collapseSpaces(text);
  return body.startsWith(':') ? label + body : `${label} ${body}`;
}

function buildRefPrompt({ shots, autoPeriod, overallSoundscape, nonDiegeticMusic, ref }) {
  const r = ref || blankRefFields();
  const analysis = analyzeShots(shots);
  const labels = refLabels(r.refs);

  const definitions = r.refs
    .map((item, i) => (collapseSpaces(item.definition) ? joinLabel(labels[i], item.definition) : null))
    .filter(Boolean);

  const types = (r.summaryTypes || []).filter(Boolean);
  const summaryText = collapseSpaces(r.summary || '');
  const summary = [types.length ? `[${types.join(' + ')}]` : '', summaryText].filter(Boolean).join(' ');

  let retention;
  if (r.retentionMode === 'free') {
    retention = (r.retentionFree || '').trim();
  } else {
    retention = r.refs.map((item, i) => {
      let scope = '';
      if (item.type === 'Subject') {
        const used = shotsUsingLabel(shots, labels[i]);
        if (used.length) scope = `appears in ${used.map(n => `[Shot ${n}]`).join(', ')}`;
      } else if (item.type !== 'Audio') {
        scope = collapseSpaces(item.scope || '');
      }
      const note = collapseSpaces(item.note || '');
      return `${labels[i]}${scope ? ` (${scope})` : ''}: ${item.marker || markersFor(item.type)[0]}${note ? ` - ${note}` : ''}`;
    }).join('\n');
  }

  const lines = [];
  const style = collapseSpaces(r.style || '');
  if (style) lines.push(style);
  let n = 0;
  shots.forEach((shot, i) => {
    let text = shot.description.trim();
    if (!text) return;
    n += 1;
    if (autoPeriod && !text.endsWith('.')) text += '.';
    lines.push(n === 1 ? `[Shot 1] ${text}` : `[Shot ${n}] At ${analysis[i].start}, ${text}`);
  });

  const sections = [
    ['subject_definitions', definitions.join('\n')],
    ['summary', summary],
    ['retention_analysis', retention],
    ['detailed_description', lines.join('\n')],
    ['overall_soundscape', (overallSoundscape || '').trim() || DEFAULT_AUDIO],
    ['non_diegetic_music', (nonDiegeticMusic || '').trim() || DEFAULT_AUDIO],
  ];
  return sections.map(([name, body]) => (body ? `${name}:\n${body}` : `${name}:`)).join('\n\n');
}

// -----------------------------------------------------------------------------
// Prompt text → shots (reverse of buildPrompt, used by "Paste prompt").
// Lenient: missing field names / audio lines are fine, extra spaces, line
// breaks, CRLF, non-breaking / zero-width spaces and "---" lines are cleaned,
// near-miss timestamps are fixed with normalizeTimestamp().
// Durations are the gaps between consecutive "At" times; the last shot gets
// `lastDurationSec`. A gap that is not positive (or an unreadable time) gives
// an invalid duration so the card shows the error.
// Returns { shots: [{ duration, description }], overallSoundscape,
// nonDiegeticMusic, mode }, or null when no "[Shot N] At ..." is found.
// mode is 'i2va' when the text has the keyframe alignment sentence, else 't2va'.
// -----------------------------------------------------------------------------
const ALIGNMENT_RE = /seconds into the target video|reference pictures align with the target video/i;
const PROMPT_FIELD_RE = /(integrated_multimodal_description|overall_soundscape|non_diegetic_music)\s*:/gi;
const SHOT_MARK_RE = /\[\s*shot\s*\d*\s*\]\s*at\s+([0-9:.]+)\s*,?/gi;

function collapseSpaces(str) {
  return str.replace(/\s+/g, ' ').trim();
}

function cleanPromptText(text) {
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/^[ \t]*[-=]{3,}[ \t]*$/gm, '')
    .trim();
}

// Clipboard text for a single shot's description: same clean-up as a pasted
// prompt, then every run of spaces / line breaks becomes one space.
function cleanShotText(text) {
  return collapseSpaces(cleanPromptText(text));
}

function parsePrompt(text, lastDurationSec = 1) {
  const clean = cleanPromptText(text);
  if (REF_DETECT_RE.test(clean)) return parseRefPrompt(clean, lastDurationSec);

  // Split into { fieldName: value }; text before the first field name is the preamble.
  const fields = {};
  const marks = [...clean.matchAll(PROMPT_FIELD_RE)];
  const preamble = clean.slice(0, marks.length ? marks[0].index : clean.length);
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].index : clean.length;
    fields[m[1].toLowerCase()] = clean.slice(m.index + m[0].length, end);
  });

  const source = fields.integrated_multimodal_description ?? preamble;
  const shotMarks = [...source.matchAll(SHOT_MARK_RE)];
  if (shotMarks.length === 0) return null;

  const times = shotMarks.map(m => {
    const ts = normalizeTimestamp(m[1]);
    return isValidTimestamp(ts) ? parseTimestamp(ts) : null;
  });
  const shots = shotMarks.map((m, i) => {
    const end = i + 1 < shotMarks.length ? shotMarks[i + 1].index : source.length;
    let duration;
    if (i + 1 === shotMarks.length) duration = formatDuration(lastDurationSec);
    else if (times[i] === null || times[i + 1] === null) duration = '';
    else duration = formatDuration(times[i + 1] - times[i]);
    return { duration, description: collapseSpaces(source.slice(m.index + m[0].length, end)) };
  });
  const audio = (name) => collapseSpaces(fields[name] || '') || DEFAULT_AUDIO;
  return {
    shots,
    overallSoundscape: audio('overall_soundscape'),
    nonDiegeticMusic: audio('non_diegetic_music'),
    mode: ALIGNMENT_RE.test(clean) ? 'i2va' : 't2va',
  };
}

// Reverse of buildRefPrompt (used by "Paste prompt"). Lenient like parsePrompt.
// Returns { shots, overallSoundscape, nonDiegeticMusic, mode: 'ref2va',
// ref: { style, summaryTypes, summary, refs, retentionMode, retentionFree } }
// or null when no shot is found. A retention_analysis that does not fit the
// "<Label> (…): marker - note" lines of the defined labels is kept as free text.
const REF_FIELD_RE = /^[ \t]*(subject_definitions|summary|retention_analysis|detailed_description|overall_soundscape|non_diegetic_music)[ \t]*:/gim;
const REF_DETECT_RE = /^[ \t]*(subject_definitions|retention_analysis|detailed_description)[ \t]*:/im;
const REF_LABEL_RE = /^<\s*(Subject|Picture|Video|Audio)\s+(\d+)\s*>\s*/i;
const REF_SHOT_RE = /\[\s*shot\s*\d*\s*\]\s*(?:at\s+([0-9:.]+)\s*,?)?/gi;

function parseRefPrompt(clean, lastDurationSec = 1) {
  const fields = {};
  const marks = [...clean.matchAll(REF_FIELD_RE)];
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].index : clean.length;
    fields[m[1].toLowerCase()] = clean.slice(m.index + m[0].length, end).trim();
  });

  const detailed = fields.detailed_description || '';
  const shotMarks = [...detailed.matchAll(REF_SHOT_RE)];
  if (shotMarks.length === 0) return null;
  const style = collapseSpaces(detailed.slice(0, shotMarks[0].index));
  const times = shotMarks.map((m, i) => {
    if (!m[1]) return i === 0 ? 0 : null;
    const ts = normalizeTimestamp(m[1]);
    return isValidTimestamp(ts) ? parseTimestamp(ts) : null;
  });
  const shots = shotMarks.map((m, i) => {
    const end = i + 1 < shotMarks.length ? shotMarks[i + 1].index : detailed.length;
    let duration;
    if (i + 1 === shotMarks.length) duration = formatDuration(lastDurationSec);
    else if (times[i] === null || times[i + 1] === null) duration = '';
    else duration = formatDuration(times[i + 1] - times[i]);
    return { duration, description: collapseSpaces(detailed.slice(m.index + m[0].length, end)) };
  });

  // subject_definitions: one "<Type N> text" per line (other lines continue the previous one)
  const refs = [];
  (fields.subject_definitions || '').split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
    const m = REF_LABEL_RE.exec(line);
    if (m) {
      const type = REF_TYPES.find(x => x.toLowerCase() === m[1].toLowerCase());
      refs.push({ ...blankRefItem(type), definition: line.slice(m[0].length) });
    } else if (refs.length) {
      refs[refs.length - 1].definition += ` ${line}`;
    }
  });
  refs.forEach(item => { item.definition = collapseSpaces(item.definition); });
  const labels = refLabels(refs);

  // retention_analysis: list mode when every line is "<label> (scope): marker - note" of a defined label
  let retentionMode = 'list';
  let retentionFree = '';
  const retentionText = fields.retention_analysis || '';
  if (retentionText) {
    const lines = retentionText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedLines = lines.map(line => {
      const m = /^(<\s*(?:Subject|Picture|Video|Audio)\s+\d+\s*>)\s*(?:\(([^)]*)\))?\s*:\s*([A-Za-z_]+)\s*(?:-\s*([\s\S]*))?$/.exec(line);
      if (!m) return null;
      const label = m[1].replace(/\s+/g, ' ').replace('< ', '<').replace(' >', '>');
      const index = labels.findIndex(l => l.toLowerCase() === label.toLowerCase());
      return index < 0 ? null : { index, scope: collapseSpaces(m[2] || ''), marker: m[3], note: collapseSpaces(m[4] || '') };
    });
    if (parsedLines.every(Boolean)) {
      parsedLines.forEach(p => {
        const item = refs[p.index];
        item.marker = p.marker;
        item.note = p.note;
        if (item.type === 'Picture' || item.type === 'Video') item.scope = p.scope;
      });
    } else {
      retentionMode = 'free';
      retentionFree = lines.join('\n');
    }
  }

  const summaryRaw = collapseSpaces(fields.summary || '');
  const sm = /^\[([^\]]*)\]\s*([\s\S]*)$/.exec(summaryRaw);
  const summaryTypes = sm ? [...new Set(sm[1].split('+').map(v => v.trim()).filter(Boolean))] : [];
  const audio = (name) => collapseSpaces(fields[name] || '') || DEFAULT_AUDIO;
  return {
    shots,
    overallSoundscape: audio('overall_soundscape'),
    nonDiegeticMusic: audio('non_diegetic_music'),
    mode: 'ref2va',
    ref: { style, summaryTypes, summary: sm ? sm[2] : summaryRaw, refs, retentionMode, retentionFree },
  };
}

// True when the user has typed anything that a paste / import would overwrite.
function hasShotContent({ shots, overallSoundscape, nonDiegeticMusic }) {
  const audioSet = (v) => { const x = (v || '').trim(); return x !== '' && x !== DEFAULT_AUDIO; };
  return shots.some(shot => shot.description.trim() !== '') || audioSet(overallSoundscape) || audioSet(nonDiegeticMusic);
}

// Append a prompt tag to a shot description (", " separated).
function appendTagText(description, tagText) {
  if (description.length > 0 && !description.endsWith(' ')) {
    return `${description}, ${tagText}`;
  }
  return description + tagText;
}

// -----------------------------------------------------------------------------
// HTML
// -----------------------------------------------------------------------------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// -----------------------------------------------------------------------------
// Prompt tags
// A tag is { id, text, note, notes? }:
//  - text:  sent to the model (English)
//  - note:  the user's own tooltip text
//  - notes: built-in translations { 'zh-Hant': ..., ja: ... } used when note is empty
// -----------------------------------------------------------------------------
const TAG_LANGS = ['en', 'zh-Hant', 'ja'];
const TAGS_EXPORT_TYPE = 'minimax-h3-prompt-tags';

const DEFAULT_TAGS = [
  { text: 'pouting with flushed cheeks', notes: { 'zh-Hant': '傲嬌鼓嘴臉紅', ja: '頬を赤らめてふくれっ面' } },
  { text: 'looking back over her shoulder', notes: { 'zh-Hant': '轉頭回眸看', ja: '肩越しに振り返る' } },
  { text: 'camera slowly pushes in', notes: { 'zh-Hant': '鏡頭緩慢推進', ja: 'カメラがゆっくり寄る' } },
  { text: 'smoothly orbits around to her back', notes: { 'zh-Hant': '平滑環繞到身後', ja: '背後へ滑らかに回り込む' } },
  { text: 'panting and breathing rapidly', notes: { 'zh-Hant': '喘氣急促呼吸', ja: '息を切らして荒く呼吸する' } },
  { text: 'winks shyly with one eye closed', notes: { 'zh-Hant': '害羞閉單眼', ja: '恥ずかしそうに片目をつぶる' } },
  { text: 'viscous clear liquid slowly drips', notes: { 'zh-Hant': '黏稠透明液體緩慢滴落', ja: '粘り気のある透明な液体がゆっくり滴る' } },
  { text: 'stretches into thin strands', notes: { 'zh-Hant': '拉成細絲狀', ja: '細い糸状に伸びる' } },
  { text: 'low-angle shot looking up', notes: { 'zh-Hant': '仰角向上拍攝', ja: 'ローアングルで見上げる' } },
  { text: 'lifting skirt and swaying back and forth', notes: { 'zh-Hant': '拉起裙襬搖擺', ja: 'スカートを持ち上げて左右に揺れる' } },
];

function makeTagId() {
  return 'tag-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// Normalise anything tag-like (string or object) into a tag; null if unusable.
function normalizeTag(raw) {
  if (typeof raw === 'string') raw = { text: raw };
  if (!raw || typeof raw !== 'object' || typeof raw.text !== 'string') return null;
  const text = raw.text.trim();
  if (!text) return null;
  const tag = { id: makeTagId(), text, note: typeof raw.note === 'string' ? raw.note.trim() : '' };
  if (raw.notes && typeof raw.notes === 'object') {
    const notes = {};
    TAG_LANGS.forEach(lang => {
      if (typeof raw.notes[lang] === 'string' && raw.notes[lang].trim()) notes[lang] = raw.notes[lang].trim();
    });
    if (Object.keys(notes).length) tag.notes = notes;
  }
  return tag;
}

function defaultTags() {
  return DEFAULT_TAGS.map(normalizeTag);
}

// Strip ids for storage / export.
function serializeTags(tags) {
  return tags.map(({ text, note, notes }) => (notes ? { text, note, notes } : { text, note }));
}

function buildTagExport(tags, now = new Date()) {
  return {
    type: TAGS_EXPORT_TYPE,
    version: 1,
    exportedAt: now.toISOString(),
    tags: serializeTags(tags),
  };
}

function tagKey(text) {
  return text.trim().toLowerCase();
}

function isDuplicateTag(tags, text, ignoreId = null) {
  const key = tagKey(text);
  return tags.some(tag => tag.id !== ignoreId && tagKey(tag.text) === key);
}

// -----------------------------------------------------------------------------
// Storyboard save / load (localStorage and JSON file share one format)
// -----------------------------------------------------------------------------
const STORYBOARD_EXPORT_TYPE = 'minimax-h3-prompt-storyboard';

// Longest storyboard name kept.
const PROJECT_NAME_MAX = 60;

// Plain-data snapshot of the shots, soundscape and music (ids are not saved).
// `state.name` (optional) is written as the storyboard name.
function buildStoryboardExport(state, now = new Date()) {
  return {
    type: STORYBOARD_EXPORT_TYPE,
    version: 1,
    exportedAt: now.toISOString(),
    ...(state.name ? { name: state.name } : {}),
    mode: PROMPT_MODES.includes(state.mode) ? state.mode : 'i2va',
    shots: state.shots.map(({ duration, description }) => ({ duration, description })),
    overallSoundscape: state.overallSoundscape,
    nonDiegeticMusic: state.nonDiegeticMusic,
    ...(state.ref ? { ref: serializeRef(state.ref) } : {}),
  };
}

// Read a saved storyboard. Returns { name, mode, shots: [{ duration, description }],
// overallSoundscape, nonDiegeticMusic, ref } (name is '' when missing; mode is
// 'i2va' unless the file says otherwise; ref is the ref2va content, see
// normalizeRef; callers add
// the shot ids); throws if
// `data` holds no shot list. Missing durations become "1.0", audio fields are
// one line and fall back to N/A; other bad values are kept so the card shows
// its error instead of silently changing them.
function parseStoryboard(data) {
  const list = data && typeof data === 'object' && Array.isArray(data.shots) ? data.shots : null;
  if (!list) throw new Error('No shot list found');
  const text = (v) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
  const shots = list
    .filter(s => s && typeof s === 'object')
    .map(s => ({ duration: text(s.duration) || '1.0', description: text(s.description) }));
  if (shots.length === 0) throw new Error('No shot list found');
  const audio = (v) => collapseSpaces(text(v)) || DEFAULT_AUDIO;
  return {
    name: collapseSpaces(text(data.name)).slice(0, PROJECT_NAME_MAX),
    mode: PROMPT_MODES.includes(data.mode) ? data.mode : 'i2va',
    shots,
    overallSoundscape: audio(data.overallSoundscape),
    nonDiegeticMusic: audio(data.nonDiegeticMusic),
    ref: normalizeRef(data.ref),
  };
}

// -----------------------------------------------------------------------------
// Several storyboards ("projects"): { id, name, shots, overallSoundscape,
// nonDiegeticMusic } with plain shots (no card ids). One is active; its live
// content is kept in the app state and copied back when saving.
// -----------------------------------------------------------------------------
const PROJECTS_STORE_TYPE = 'minimax-h3-prompt-projects';

// A new storyboard with the starting content (two blank one-second shots).
function blankProject(id, name) {
  return {
    id,
    name,
    mode: 'i2va',
    shots: createInitialShots().map(({ duration, description }) => ({ duration, description })),
    overallSoundscape: DEFAULT_AUDIO,
    nonDiegeticMusic: DEFAULT_AUDIO,
    ref: blankRef(),
  };
}

// "Storyboard N" with the smallest N (starting at the count + 1) not used yet.
function defaultProjectName(projects) {
  const used = new Set(projects.map(p => p.name));
  let n = projects.length + 1;
  while (used.has(`Storyboard ${n}`)) n += 1;
  return `Storyboard ${n}`;
}

// Ids are "p1", "p2", ...; this returns one larger than every id in use.
function nextProjectId(projects) {
  const max = projects.reduce((m, p) => {
    const found = /^p(\d+)$/.exec(p.id || '');
    return found ? Math.max(m, parseInt(found[1], 10)) : m;
  }, 0);
  return `p${max + 1}`;
}

// Settings kept with the storyboards: the default duration of new shots and
// the "append a period" switch. Bad or missing values fall back to the defaults.
function normalizeSettings(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    timeStepSec: TIME_STEPS.includes(r.timeStepSec) ? r.timeStepSec : 1,
    autoPeriod: typeof r.autoPeriod === 'boolean' ? r.autoPeriod : true,
  };
}

function buildProjectsStore(projects, activeId, settings) {
  return {
    type: PROJECTS_STORE_TYPE,
    version: 1,
    activeId,
    settings: normalizeSettings(settings),
    projects: projects.map(({ id, name, mode, shots, overallSoundscape, nonDiegeticMusic, ref }) => (
      { id, name, mode, shots, overallSoundscape, nonDiegeticMusic, ref: serializeRef(ref) }
    )),
  };
}

// Read a saved projects store. Returns { projects, activeId, settings }; unreadable
// projects are dropped, bad / duplicate ids and missing names are replaced,
// and an unknown activeId becomes the first project. Throws if none is left.
function parseProjectsStore(data) {
  const list = data && Array.isArray(data.projects) ? data.projects : null;
  if (!list) throw new Error('No projects found');
  const projects = [];
  list.forEach(raw => {
    let board;
    try { board = parseStoryboard(raw); } catch (e) { return; }
    const idOk = typeof raw.id === 'string' && /^p\d+$/.test(raw.id) && !projects.some(p => p.id === raw.id);
    projects.push({ ...board, id: idOk ? raw.id : null });
  });
  if (projects.length === 0) throw new Error('No projects found');
  projects.forEach(p => {
    if (!p.id) p.id = nextProjectId(projects);
    if (!p.name) p.name = defaultProjectName(projects.filter(q => q !== p && q.name));
  });
  const activeId = projects.some(p => p.id === data.activeId) ? data.activeId : projects[0].id;
  return { projects, activeId, settings: normalizeSettings(data.settings) };
}

// Return a copy of `tags` with the tag at index `from` moved to index `to`.
// Out-of-range or equal indexes return an unchanged copy.
function moveTag(tags, from, to) {
  const result = tags.slice();
  if (from !== to && from >= 0 && to >= 0 && from < tags.length && to < tags.length) {
    const [moved] = result.splice(from, 1);
    result.splice(to, 0, moved);
  }
  return result;
}

// Merge an imported JSON value (export object, or plain array of strings /
// { text, note } objects) into `tags`. Duplicates (case-insensitive) are skipped.
// Returns { tags, added, skipped }; throws if `data` holds no tag list.
function mergeImportedTags(tags, data) {
  const list = Array.isArray(data) ? data : (data && Array.isArray(data.tags) ? data.tags : null);
  if (!list) throw new Error('No tag list found');
  const result = tags.slice();
  let added = 0;
  let skipped = 0;
  list.forEach(raw => {
    const tag = normalizeTag(raw);
    if (!tag) return;
    if (isDuplicateTag(result, tag.text)) { skipped += 1; return; }
    result.push(tag);
    added += 1;
  });
  return { tags: result, added, skipped };
}

function tagTooltip(tag, lang) {
  return tag.note || (tag.notes && tag.notes[lang]) || '';
}

function tagMatches(tag, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;
  const haystack = [tag.text, tag.note, ...(tag.notes ? Object.values(tag.notes) : [])].join(' ').toLowerCase();
  return haystack.includes(q);
}

if (typeof module === 'object' && module.exports) {
  module.exports = {
    TIMESTAMP_RE,
    BASE_MODES,
    PROMPT_MODES,
    REF_TYPES,
    RETENTION_MARKERS,
    SUMMARY_TYPES,
    markersFor,
    blankRefItem,
    blankRefFields,
    blankRef,
    normalizeRef,
    serializeRef,
    refLabels,
    buildRefPrompt,
    KEYFRAME_ALIGNMENT,
    TIME_STEPS,
    formatTimestamp,
    cleanShotText,
    parseTimestamp,
    isValidTimestamp,
    normalizeTimestamp,
    DURATION_RE,
    formatDuration,
    parseDuration,
    normalizeDuration,
    shiftDuration,
    appendShot,
    duplicateShotAt,
    removeShotAt,
    moveShotTo,
    DEFAULT_AUDIO,
    createInitialShots,
    analyzeShots,
    totalDuration,
    buildPrompt,
    parsePrompt,
    hasShotContent,
    appendTagText,
    escapeHtml,
    TAG_LANGS,
    TAGS_EXPORT_TYPE,
    DEFAULT_TAGS,
    normalizeTag,
    defaultTags,
    serializeTags,
    buildTagExport,
    tagKey,
    isDuplicateTag,
    moveTag,
    STORYBOARD_EXPORT_TYPE,
    buildStoryboardExport,
    PROJECT_NAME_MAX,
    PROJECTS_STORE_TYPE,
    parseStoryboard,
    normalizeSettings,
    blankProject,
    defaultProjectName,
    nextProjectId,
    buildProjectsStore,
    parseProjectsStore,
    mergeImportedTags,
    tagTooltip,
    tagMatches,
  };
}
