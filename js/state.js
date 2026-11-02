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

// Default sample: two blank shots.
const initialShots = [
  { id: 1, timestamp: '00:00.000', description: '' },
  { id: 2, timestamp: '00:01.000', description: '' },
];

let nextShotId = 100;

const state = {
  tags: loadTags(),
  shots: JSON.parse(JSON.stringify(initialShots)),
  overallSoundscape: 'N/A',
  nonDiegeticMusic: 'N/A',
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
const charCountEl = $('char-count');
const tsWarningEl = $('ts-warning');
const tsWarningTextEl = $('ts-warning-text');
const addShotBtn = $('add-shot-btn');
const addShotBottomBtn = $('add-shot-bottom-btn');

// Global controls
const soundscapeInput = $('soundscape-input');
const musicInput = $('music-input');
const timeStepSelect = $('time-step-select');
const autoPeriodCheck = $('auto-period-check');
const copyBtn = $('copy-btn');
const copyText = $('copy-text');
const resetBtn = $('reset-btn');
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
