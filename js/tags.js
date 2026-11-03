// =============================================================================
// tags.js — prompt tag chips (right panel) and the tag manager modal.
// Data helpers (normalize / duplicate check / import / export) live in core.js;
// loadTags() / saveTags() live in state.js.
// =============================================================================

let editingTagId = null;
let pendingDeleteId = null;

const MODAL_INPUT_CLASS = 'w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const ICON_BTN_CLASS = 'p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-all';

// -----------------------------------------------------------------------------
// Chips (right panel)
// -----------------------------------------------------------------------------
function renderChips() {
  const query = tagSearchInput.value;
  const visible = state.tags.filter(tag => tagMatches(tag, query));

  if (visible.length === 0) {
    const msg = state.tags.length === 0 ? t('noTags') : t('noTagsMatch');
    chipsListEl.innerHTML = `<p class="text-xs sm:text-sm text-slate-400 py-1">${escapeHtml(msg)}</p>`;
    return;
  }

  chipsListEl.innerHTML = visible.map(tag => {
    const tip = tagTooltip(tag, currentLang);
    const titleAttr = tip ? ` title="${escapeHtml(tip)}"` : '';
    return `<button type="button" data-tag-id="${escapeHtml(tag.id)}" class="prompt-chip px-3 py-1.5 text-xs sm:text-sm font-medium bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500/50 text-slate-200 hover:text-indigo-100 border border-slate-700/60 rounded-lg transition-all"${titleAttr}>${escapeHtml(tag.text)}</button>`;
  }).join('');
}

// -----------------------------------------------------------------------------
// Manager modal
// -----------------------------------------------------------------------------
function isTagModalOpen() {
  return !tagModal.classList.contains('hidden');
}

function renderTagManager() {
  const query = tagManageSearch.value;
  const visible = state.tags.filter(tag => tagMatches(tag, query));
  tagManageCount.textContent = t('tagCount', { n: state.tags.length });

  if (visible.length === 0) {
    const msg = state.tags.length === 0 ? t('noTags') : t('noTagsMatch');
    tagManageList.innerHTML = `<li class="text-xs sm:text-sm text-slate-400 py-6 text-center">${escapeHtml(msg)}</li>`;
    return;
  }

  tagManageList.innerHTML = visible.map(tag => (
    tag.id === editingTagId ? tagEditRowHtml(tag) : tagRowHtml(tag)
  )).join('');

  if (editingTagId) {
    const input = tagManageList.querySelector('.tag-edit-text');
    if (input) input.focus();
  }
}

function tagEditRowHtml(tag) {
  return `
    <li data-tag-id="${escapeHtml(tag.id)}" class="rounded-xl border border-indigo-500/60 bg-slate-950/70 p-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input type="text" class="tag-edit-text ${MODAL_INPUT_CLASS} font-mono" value="${escapeHtml(tag.text)}" aria-label="${escapeHtml(t('tagTextLabel'))}">
        <input type="text" class="tag-edit-note ${MODAL_INPUT_CLASS}" value="${escapeHtml(tagTooltip(tag, currentLang))}" placeholder="${escapeHtml(t('tagNotePlaceholder'))}" aria-label="${escapeHtml(t('tagNoteLabel'))}">
      </div>
      <p class="tag-edit-error hidden mt-2 text-xs sm:text-sm font-semibold text-rose-300"></p>
      <div class="mt-2.5 flex justify-end gap-2">
        <button type="button" data-action="cancel" class="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-all">${escapeHtml(t('cancel'))}</button>
        <button type="button" data-action="save" class="px-3 py-1.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all">${escapeHtml(t('save'))}</button>
      </div>
    </li>`;
}

function tagRowHtml(tag) {
  const tip = tagTooltip(tag, currentLang);
  const deleteBtn = tag.id === pendingDeleteId
    ? `<button type="button" data-action="confirm-delete" class="px-2.5 py-1 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-all">${escapeHtml(t('confirmDelete'))}</button>`
    : `<button type="button" data-action="delete" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all" title="${escapeHtml(t('deleteTag'))}" aria-label="${escapeHtml(t('deleteTag'))}">
        ${icon('trash')}
      </button>`;
  return `
    <li data-tag-id="${escapeHtml(tag.id)}" class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-slate-700 px-3 py-2 transition-all">
      <div class="flex-1 min-w-0">
        <p class="font-mono text-xs sm:text-sm text-slate-100 break-words">${escapeHtml(tag.text)}</p>
        ${tip ? `<p class="text-xs sm:text-sm text-slate-400 break-words">${escapeHtml(tip)}</p>` : ''}
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button type="button" data-action="edit" class="${ICON_BTN_CLASS}" title="${escapeHtml(t('edit'))}" aria-label="${escapeHtml(t('edit'))}">
          ${icon('edit')}
        </button>
        ${deleteBtn}
      </div>
    </li>`;
}

// Persist tags and refresh every view that shows them.
function refreshTags() {
  saveTags();
  renderChips();
  if (isTagModalOpen()) renderTagManager();
}

function openTagModal() {
  editingTagId = null;
  pendingDeleteId = null;
  tagAddError.classList.add('hidden');
  tagManageSearch.value = '';
  renderTagManager();
  tagModal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  tagAddText.focus();
}

function closeTagModal() {
  tagModal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  editingTagId = null;
  pendingDeleteId = null;
  manageTagsBtn.focus();
}

function showAddError(msg) {
  tagAddError.textContent = msg;
  tagAddError.classList.remove('hidden');
}

// -----------------------------------------------------------------------------
// Actions
// -----------------------------------------------------------------------------
function handleAddTag(e) {
  e.preventDefault();
  const text = tagAddText.value.trim();
  if (!text) return showAddError(t('tagEmptyError'));
  if (isDuplicateTag(state.tags, text)) return showAddError(t('tagDuplicateError'));
  state.tags.push(normalizeTag({ text, note: tagAddNote.value }));
  tagAddText.value = '';
  tagAddNote.value = '';
  tagAddError.classList.add('hidden');
  refreshTags();
  tagManageList.scrollTop = tagManageList.scrollHeight;
  tagAddText.focus();
  showToast(t('toastTagAdded'));
}

function handleTagListClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const item = btn.closest('[data-tag-id]');
  const id = item && item.dataset.tagId;
  const tag = state.tags.find(x => x.id === id);
  if (!tag) return;

  switch (btn.dataset.action) {
    case 'edit':
      editingTagId = id;
      pendingDeleteId = null;
      renderTagManager();
      break;
    case 'cancel':
      editingTagId = null;
      renderTagManager();
      break;
    case 'save':
      saveEditedTag(item, tag);
      break;
    case 'delete':
      pendingDeleteId = id;
      renderTagManager();
      break;
    case 'confirm-delete':
      state.tags = state.tags.filter(x => x.id !== id);
      pendingDeleteId = null;
      refreshTags();
      showToast(t('toastTagDeleted'));
      break;
  }
}

function saveEditedTag(item, tag) {
  const text = item.querySelector('.tag-edit-text').value.trim();
  const note = item.querySelector('.tag-edit-note').value.trim();
  const errEl = item.querySelector('.tag-edit-error');
  const fail = (msg) => { errEl.textContent = msg; errEl.classList.remove('hidden'); };
  if (!text) return fail(t('tagEmptyError'));
  if (isDuplicateTag(state.tags, text, tag.id)) return fail(t('tagDuplicateError'));
  // Editing the note turns a built-in translated tooltip into the user's own note.
  if (note !== tagTooltip(tag, currentLang)) {
    tag.note = note;
    delete tag.notes;
  }
  tag.text = text;
  editingTagId = null;
  refreshTags();
  showToast(t('toastTagUpdated'));
}

function handleTagEditKeydown(e) {
  if (!e.target.matches('.tag-edit-text, .tag-edit-note')) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    e.target.closest('li').querySelector('[data-action="save"]').click();
  } else if (e.key === 'Escape') {
    e.stopPropagation(); // don't close the whole modal
    editingTagId = null;
    renderTagManager();
  }
}

// Download tags as a JSON backup file.
function exportTags() {
  const blob = new Blob([JSON.stringify(buildTagExport(state.tags), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  a.href = url;
  a.download = `minimax-h3-prompt-tags-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(t('toastExported'));
}

// Merge tags from the chosen JSON file, skipping duplicates.
async function importTagsFromFile() {
  const file = tagImportFile.files && tagImportFile.files[0];
  tagImportFile.value = '';
  if (!file) return;
  try {
    const result = mergeImportedTags(state.tags, JSON.parse(await file.text()));
    state.tags = result.tags;
    refreshTags();
    showToast(t('toastImported', { added: result.added, skipped: result.skipped }));
  } catch (err) {
    console.warn('Import failed', err);
    showToast(t('toastImportFail'));
  }
}

function restoreDefaultTags() {
  if (!window.confirm(t('confirmRestore'))) return;
  state.tags = defaultTags();
  editingTagId = null;
  pendingDeleteId = null;
  refreshTags();
  showToast(t('toastRestored'));
}

// Clicking a chip appends its text to the focused shot card.
function handleChipClick(e) {
  const chip = e.target.closest('.prompt-chip');
  if (!chip) return;
  const activeShot = state.shots[state.activeShotIndex];
  if (!activeShot) return;
  activeShot.description = appendTagText(activeShot.description, chip.textContent.trim());
  render();
  showToast(t('toastChip'));
}

function initTags() {
  chipsListEl.addEventListener('click', handleChipClick);
  tagSearchInput.addEventListener('input', renderChips);

  manageTagsBtn.addEventListener('click', openTagModal);
  tagModalClose.addEventListener('click', closeTagModal);
  tagModalBackdrop.addEventListener('click', closeTagModal);

  tagAddForm.addEventListener('submit', handleAddTag);
  tagAddText.addEventListener('input', () => tagAddError.classList.add('hidden'));
  tagManageList.addEventListener('click', handleTagListClick);
  tagManageList.addEventListener('keydown', handleTagEditKeydown);
  tagManageSearch.addEventListener('input', () => {
    pendingDeleteId = null;
    renderTagManager();
  });

  tagExportBtn.addEventListener('click', exportTags);
  tagImportBtn.addEventListener('click', () => tagImportFile.click());
  tagImportFile.addEventListener('change', importTagsFromFile);
  tagRestoreBtn.addEventListener('click', restoreDefaultTags);
}
