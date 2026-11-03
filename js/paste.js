// =============================================================================
// paste.js — "Paste prompt from clipboard": read a MiniMax H3 prompt and turn
// it back into shot cards. Parsing (parsePrompt) and the "would this overwrite
// anything?" check (hasShotContent) live in core.js.
//
// Flow: button → navigator.clipboard.readText(); if the browser refuses, a
// modal with a textarea lets the user paste by hand. When the cards already
// hold content, showConfirm() asks before replacing them.
// =============================================================================

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
  let text;
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) throw new Error('Clipboard read unavailable');
    text = await navigator.clipboard.readText();
  } catch (err) {
    console.warn('Clipboard read failed', err);
    openPasteModal();
    return;
  }
  if ((await importPromptText(text)) === 'none') showToast(t('pasteNone'));
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
