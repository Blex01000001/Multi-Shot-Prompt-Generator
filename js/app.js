// =============================================================================
// app.js — page-level wiring: language switcher, copy button, global controls,
// and start-up. Loaded last.
//
// Script load order (index.html): core.js → i18n.js → state.js → shots.js →
// tags.js → app.js. All are classic scripts sharing top-level names.
// =============================================================================

let copyResetTimer = null;

// -----------------------------------------------------------------------------
// Copy (async Clipboard API, with a select-the-text fallback)
// -----------------------------------------------------------------------------
async function copyPromptToClipboard() {
  const textToCopy = currentPrompt();

  try {
    if (!navigator.clipboard || !window.isSecureContext) {
      throw new Error('Clipboard API unavailable');
    }
    await navigator.clipboard.writeText(textToCopy);
  } catch (err) {
    // Fallback: select the preview text so the user can press Ctrl+C / Cmd+C.
    console.warn('Copy failed', err);
    const range = document.createRange();
    range.selectNodeContents(outputPreviewEl);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    showToast(t('toastSelectCopy'));
    return;
  }

  showToast(t('toastCopied'));

  // Visual feedback on button
  copyText.textContent = t('copied');
  copyBtn.classList.remove('from-indigo-600', 'to-purple-600');
  copyBtn.classList.add('bg-emerald-600');

  clearTimeout(copyResetTimer);
  copyResetTimer = setTimeout(() => {
    copyResetTimer = null;
    copyText.textContent = t('copy');
    copyBtn.classList.remove('bg-emerald-600');
    copyBtn.classList.add('from-indigo-600', 'to-purple-600');
  }, 2000);
}

// -----------------------------------------------------------------------------
// Language
// -----------------------------------------------------------------------------
function renderTimeStepOptions() {
  timeStepSelect.innerHTML = TIME_STEPS.map(step => {
    const selected = step === state.timeStepSec ? ' selected' : '';
    return `<option value="${step}"${selected}>${step.toFixed(1)} ${escapeHtml(t('sec'))} (+${formatTimestamp(step)})</option>`;
  }).join('');
}

// Re-apply every translated string on the page.
function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.title = t('docTitle');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  if (!copyResetTimer) copyText.textContent = t('copy');

  document.querySelectorAll('.lang-option').forEach(opt => {
    const active = opt.dataset.lang === currentLang;
    opt.setAttribute('aria-checked', String(active));
    opt.className = `lang-option w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
      active ? 'bg-indigo-600/30 text-indigo-100' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;
  });

  renderTimeStepOptions();
  renderChips();
  if (isTagModalOpen()) renderTagManager();
  render();
}

function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  saveLang(lang);
  applyLanguage();
}

function toggleLangMenu(open) {
  const show = open ?? langMenu.classList.contains('hidden');
  langMenu.classList.toggle('hidden', !show);
  langBtn.setAttribute('aria-expanded', String(show));
}

function initLanguageMenu() {
  langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLangMenu();
  });

  langMenu.addEventListener('click', (e) => {
    const opt = e.target.closest('.lang-option');
    if (!opt) return;
    setLanguage(opt.dataset.lang);
    toggleLangMenu(false);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#lang-wrap')) toggleLangMenu(false);
  });
}

// -----------------------------------------------------------------------------
// Global controls
// -----------------------------------------------------------------------------
function resetSample() {
  state.shots = JSON.parse(JSON.stringify(initialShots));
  state.overallSoundscape = 'N/A';
  state.nonDiegeticMusic = 'N/A';
  soundscapeInput.value = 'N/A';
  musicInput.value = 'N/A';
  state.activeShotIndex = 0;
  render();
  showToast(t('toastReset'));
}

function initGlobalControls() {
  addShotBtn.addEventListener('click', addShot);
  addShotBottomBtn.addEventListener('click', addShot);
  resetBtn.addEventListener('click', resetSample);
  copyBtn.addEventListener('click', copyPromptToClipboard);

  soundscapeInput.addEventListener('input', (e) => {
    state.overallSoundscape = e.target.value;
    refreshDerived();
  });

  musicInput.addEventListener('input', (e) => {
    state.nonDiegeticMusic = e.target.value;
    refreshDerived();
  });

  timeStepSelect.addEventListener('change', (e) => {
    state.timeStepSec = parseFloat(e.target.value);
  });

  autoPeriodCheck.addEventListener('change', (e) => {
    state.autoPeriod = e.target.checked;
    refreshDerived();
  });

  // Escape closes the language menu and the tag manager.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    toggleLangMenu(false);
    if (isTagModalOpen()) closeTagModal();
  });
}

// -----------------------------------------------------------------------------
// Start-up
// -----------------------------------------------------------------------------
currentLang = loadLang();
initGlobalControls();
initLanguageMenu();
initTags();
initShotSorting();
applyLanguage();
