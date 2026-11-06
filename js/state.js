// =============================================================================
// state.js — app state, DOM element references, shared UI helpers
// Loaded after core.js / i18n.js and before shots.js / tags.js / app.js.
// =============================================================================

const TAGS_STORAGE_KEY = 'msp-tags';

function loadTags() {
  try {
    const raw = localStorage.getItem(TAGS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeTag).filter(Boolean);
    }
  } catch (e) { /* storage unavailable or corrupted: fall back to defaults */ }
  return defaultTags();
}

function saveTags() {
  try {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(serializeTags(state.tags)));
  } catch (e) { /* ignore */ }
}

const PROJECTS_STORAGE_KEY = 'msp-projects';
const LEGACY_STORYBOARD_KEY = 'msp-shots'; // single storyboard, before several could be saved

let nextShotId = 100;

// Give plain { duration, description } shots (from storage / a file) card ids.
function withShotIds(shots) {
  return shots.map(shot => ({ id: nextShotId++, ...shot }));
}

// Saved storyboards → { projects, activeId }, or null when nothing usable is saved.
function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw !== null) return parseProjectsStore(JSON.parse(raw));
    const legacy = localStorage.getItem(LEGACY_STORYBOARD_KEY);
    if (legacy !== null) {
      const board = parseStoryboard(JSON.parse(legacy));
      return { projects: [{ ...board, id: 'p1', name: board.name || 'Storyboard 1' }], activeId: 'p1' };
    }
  } catch (e) { /* storage unavailable or corrupted: start from the sample */ }
  return null;
}

function activeProject() {
  return state.projects.find(p => p.id === state.activeProjectId);
}

// Copy the live shots / soundscape / music into the active project.
function syncActiveProject() {
  const project = activeProject();
  if (!project) return;
  project.shots = state.shots.map(({ duration, description }) => ({ duration, description }));
  project.overallSoundscape = state.overallSoundscape;
  project.nonDiegeticMusic = state.nonDiegeticMusic;
}

function saveStoryboard() {
  syncActiveProject();
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(buildProjectsStore(state.projects, state.activeProjectId)));
    localStorage.removeItem(LEGACY_STORYBOARD_KEY);
  } catch (e) { /* ignore */ }
}

// Download `data` as a pretty-printed JSON file.
function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// YYYYMMDD, for export file names.
function dateStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

const savedProjects = loadProjects() || { projects: [blankProject('p1', 'Storyboard 1')], activeId: 'p1' };
const startProject = savedProjects.projects.find(p => p.id === savedProjects.activeId);

// shots / overallSoundscape / nonDiegeticMusic hold the active storyboard.
const state = {
  tags: loadTags(),
  projects: savedProjects.projects,
  activeProjectId: savedProjects.activeId,
  shots: withShotIds(startProject.shots),
  overallSoundscape: startProject.overallSoundscape,
  nonDiegeticMusic: startProject.nonDiegeticMusic,
  timeStepSec: 1,
  autoPeriod: true,
  activeShotIndex: 0,
};

// Prompt text for the current state.
function currentPrompt() {
  return buildPrompt(state);
}

// -----------------------------------------------------------------------------
// DOM elements (ids are defined in index.html)
// -----------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);

// Shots & output
const shotsListEl = $('shots-list');
const outputPreviewEl = $('output-preview');
const shotCountBadgeEl = $('shot-count-badge');
const exportedCountEl = $('exported-count');
const totalDurationEl = $('total-duration');
const tsWarningEl = $('ts-warning');
const tsWarningTextEl = $('ts-warning-text');
const addShotBtn = $('add-shot-btn');
const addShotBottomBtn = $('add-shot-bottom-btn');

// Paste prompt & confirm dialog
const pastePromptBtn = $('paste-prompt-btn');
const pasteModal = $('paste-modal');
const pasteModalText = $('paste-modal-text');
const pasteModalError = $('paste-modal-error');
const confirmModal = $('confirm-modal');

// Global controls
const soundscapeInput = $('soundscape-input');
const musicInput = $('music-input');
const timeStepSelect = $('time-step-select');
const autoPeriodCheck = $('auto-period-check');
const copyBtn = $('copy-btn');
const copyText = $('copy-text');
const resetBtn = $('reset-btn');
const projectSelect = $('project-select');
const projectNameInput = $('project-name-input');
const projectNewBtn = $('project-new-btn');
const projectDeleteBtn = $('project-delete-btn');
const storyboardExportBtn = $('storyboard-export-btn');
const storyboardImportBtn = $('storyboard-import-btn');
const storyboardImportFile = $('storyboard-import-file');
const langBtn = $('lang-btn');
const langMenu = $('lang-menu');

// Tags panel & manager modal
const chipsListEl = $('chips-list');
const tagSearchInput = $('tag-search');
const manageTagsBtn = $('manage-tags-btn');
const tagModal = $('tag-modal');
const tagModalBackdrop = $('tag-modal-backdrop');
const tagModalClose = $('tag-modal-close');
const tagAddForm = $('tag-add-form');
const tagAddText = $('tag-add-text');
const tagAddNote = $('tag-add-note');
const tagAddError = $('tag-add-error');
const tagManageSearch = $('tag-manage-search');
const tagManageCount = $('tag-manage-count');
const tagManageList = $('tag-manage-list');
const tagExportBtn = $('tag-export-btn');
const tagImportBtn = $('tag-import-btn');
const tagImportFile = $('tag-import-file');
const tagRestoreBtn = $('tag-restore-btn');

// -----------------------------------------------------------------------------
// Icons for HTML built in JS (static icons stay inline in index.html).
// icon('trash') → <svg> string; second argument replaces the default classes.
// -----------------------------------------------------------------------------
const ICONS = {
  drag: { fill: true, d: 'M7 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-1.5 7.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-1.5 7.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16 16a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' },
  up: { d: 'M5 15l7-7 7 7' },
  down: { d: 'M19 9l-7 7-7-7' },
  duplicate: { d: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' },
  trash: { d: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  edit: { d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  paste: { d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7v6m0 0l-3-3m3 3l3-3' },
  info: { d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  warning: { d: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
};

function icon(name, cls = 'w-4 h-4') {
  const { d, fill } = ICONS[name];
  return fill
    ? `<svg class="${cls}" fill="currentColor" viewBox="0 0 20 20"><path d="${d}"/></svg>`
    : `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${d}"></path></svg>`;
}

// -----------------------------------------------------------------------------
// Toast
// -----------------------------------------------------------------------------
let toastTimer = null;

function showToast(message) {
  const toast = $('toast');
  $('toast-msg').textContent = message;

  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 2500);
}

// -----------------------------------------------------------------------------
// Confirm dialog — styled, translated replacement for window.confirm().
// await showConfirm({ title, message, ok }) → true (OK) / false (cancel,
// backdrop click or Escape).
// -----------------------------------------------------------------------------
let confirmResolve = null;

function isConfirmOpen() {
  return !confirmModal.classList.contains('hidden');
}

function closeConfirm(result) {
  if (!confirmResolve) return;
  confirmModal.classList.add('hidden');
  const resolve = confirmResolve;
  confirmResolve = null;
  resolve(result);
}

function showConfirm({ title, message, ok }) {
  closeConfirm(false);
  $('confirm-title').textContent = title;
  $('confirm-message').textContent = message;
  $('confirm-ok').textContent = ok;
  confirmModal.classList.remove('hidden');
  $('confirm-ok').focus();
  return new Promise(resolve => { confirmResolve = resolve; });
}

function initConfirm() {
  $('confirm-ok').addEventListener('click', () => closeConfirm(true));
  $('confirm-cancel').addEventListener('click', () => closeConfirm(false));
  $('confirm-backdrop').addEventListener('click', () => closeConfirm(false));
}

