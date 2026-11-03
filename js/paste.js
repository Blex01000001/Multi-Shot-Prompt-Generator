// =============================================================================
// paste.js — "Paste prompt from clipboard": read a MiniMax H3 prompt and turn
// it back into shot cards. Parsing (parsePrompt) and the "would this overwrite
// anything?" check (hasShotContent) live in core.js.
//
// Flow: button → navigator.clipboard.readText(); if the browser refuses, a
// modal with a textarea lets the user paste by hand. When the cards already
// hold content, showConfirm() asks before replacing them.
//
// Each shot card also has a paste button (pasteIntoShot): the clipboard text,
// cleaned by cleanShotText(), replaces that card's description, asking first
// when the card already has text.
// =============================================================================

// Clipboard text, or null when the browser refuses to read it.
async function readClipboardText() {
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) throw new Error('Clipboard read unavailable');
    return await navigator.clipboard.readText();
  } catch (err) {
    console.warn('Clipboard read failed', err);
    return null;
  }
}

function isPasteModalOpen() {
  return !pasteModal.classList.contains('hidden');
}

function openPasteModal() {
  pasteModalText.value = '';
  pasteModalError.classList.add('hidden');
  pasteModal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  pasteModalText.focus();
}

function closePasteModal() {
  pasteModal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  pastePromptBtn.focus();
}

// Replace the cards with the prompt in `text`.
// Returns 'ok', 'none' (no [Shot N] found) or 'cancelled'.
async function importPromptText(text) {
  const result = parsePrompt(text);
  if (!result) return 'none';
  if (hasShotContent(state)) {
    const ok = await showConfirm({ title: t('confirmTitle'), message: t('confirmReplace'), ok: t('replace') });
    if (!ok) return 'cancelled';
  }
  state.shots = result.shots.map(shot => ({ id: nextShotId++, ...shot }));
  state.overallSoundscape = result.overallSoundscape;
  state.nonDiegeticMusic = result.nonDiegeticMusic;
  state.activeShotIndex = 0;
  syncAudioInputs();
  render();
  showToast(t('toastPasted', { n: result.shots.length }));
  return 'ok';
}

async function pasteFromClipboard() {
  const text = await readClipboardText();
  if (text === null) {
    openPasteModal();
    return;
  }
  if ((await importPromptText(text)) === 'none') showToast(t('pasteNone'));
}

// Replace one shot's description with the (cleaned) clipboard text.
async function pasteIntoShot(index) {
  const shot = state.shots[index];
  const textarea = () => shotsListEl.querySelectorAll('textarea.shot-input')[index];
  const raw = await readClipboardText();
  if (raw === null) {
    // Blocked: let the user paste by hand into the card's text box.
    if (textarea()) textarea().focus();
    showToast(t('pasteShotBlocked'));
    return;
  }
  const text = cleanShotText(raw);
  if (!text) {
    showToast(t('pasteShotEmpty'));
    return;
  }
  if (shot.description.trim()) {
    const ok = await showConfirm({ title: t('confirmShotTitle'), message: t('confirmShotReplace'), ok: t('replace') });
    if (!ok || state.shots[index] !== shot) return; // cancelled, or the cards changed meanwhile
  }
  shot.description = text;
  if (textarea()) textarea().value = text;
  setActiveShot(index);
  refreshDerived();
  showToast(t('toastShotPasted'));
}

async function importFromPasteModal() {
  const outcome = await importPromptText(pasteModalText.value);
  if (outcome === 'ok') {
    closePasteModal();
  } else if (outcome === 'none') {
    pasteModalError.textContent = t('pasteNone');
    pasteModalError.classList.remove('hidden');
  }
}

function initPaste() {
  pastePromptBtn.addEventListener('click', pasteFromClipboard);
  $('paste-modal-import').addEventListener('click', importFromPasteModal);
  $('paste-modal-cancel').addEventListener('click', closePasteModal);
  $('paste-modal-close').addEventListener('click', closePasteModal);
  $('paste-modal-backdrop').addEventListener('click', closePasteModal);
  pasteModalText.addEventListener('input', () => pasteModalError.classList.add('hidden'));
}
