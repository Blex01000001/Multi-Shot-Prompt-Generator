// =============================================================================
// ref.js — editor for the multimodal reference (ref2va) format: the reference
// list (subject_definitions + retention_analysis), the summary type chips and
// text, the retention free-text switch and the style line.
// Data and output live in core.js (buildRefPrompt); the fields are kept in
// state.ref. Typing only calls refreshDerived() (no rebuild, so focus stays);
// adding / removing / retyping a reference rebuilds the list with renderRefUi().
// =============================================================================

const REF_CHIP_ON = 'bg-indigo-600/30 border-indigo-400/60 text-indigo-100';
const REF_CHIP_OFF = 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-indigo-500/60 hover:text-indigo-200';

function refOptionsHtml(values, selected) {
  const list = values.includes(selected) ? values : [...values, selected];
  return list.map(v => `<option value="${escapeHtml(v)}"${v === selected ? ' selected' : ''}>${escapeHtml(v)}</option>`).join('');
}

function refItemHtml(item, index, label, free) {
  const hasScope = item.type === 'Picture' || item.type === 'Video';
  const retention = free ? '' : `
    <div class="mt-2 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-2">
      <select data-ref-field="marker" aria-label="${escapeHtml(t('refMarker'))}" class="${MODAL_INPUT_CLASS} font-mono">${refOptionsHtml(markersFor(item.type), item.marker)}</select>
      <input type="text" data-ref-field="note" value="${escapeHtml(item.note)}" spellcheck="false" autocomplete="off"
        placeholder="${escapeHtml(t('refNotePlaceholder'))}" aria-label="${escapeHtml(t('refNotePlaceholder'))}" class="${MODAL_INPUT_CLASS}">
      ${hasScope ? `<input type="text" data-ref-field="scope" value="${escapeHtml(item.scope)}" spellcheck="false" autocomplete="off"
        placeholder="${escapeHtml(t('refScopePlaceholder'))}" aria-label="${escapeHtml(t('refScopePlaceholder'))}" class="${MODAL_INPUT_CLASS} sm:col-span-2">` : ''}
    </div>`;
  return `
    <div class="ref-item rounded-xl border border-slate-700/60 bg-slate-950/40 p-3" data-ref-index="${index}">
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" data-ref-action="insert" title="${escapeHtml(t('refInsert'))}"
          class="ref-label px-2.5 py-1 rounded-lg border font-mono text-xs sm:text-sm font-bold bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 transition-all">${escapeHtml(label)}</button>
        <select data-ref-field="type" aria-label="${escapeHtml(t('refType'))}" class="${MODAL_INPUT_CLASS} !w-auto font-mono">${refOptionsHtml(REF_TYPES, item.type)}</select>
        <button type="button" data-ref-action="delete" title="${escapeHtml(t('refDelete'))}" aria-label="${escapeHtml(t('refDelete'))}"
          class="ml-auto p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-lg transition-all">${icon('trash', ACTION_ICON)}</button>
      </div>
      <textarea data-ref-field="definition" rows="2" spellcheck="false" placeholder="${escapeHtml(t('refDefPlaceholder'))}"
        class="mt-2 ${MODAL_INPUT_CLASS} resize-y leading-relaxed">${escapeHtml(item.definition)}</textarea>
      ${retention}
    </div>`;
}

function summaryChipsHtml() {
  const chosen = state.ref.summaryTypes;
  const all = [...SUMMARY_TYPES, ...chosen.filter(v => !SUMMARY_TYPES.includes(v))];
  return all.map(v => {
    const on = chosen.includes(v);
    return `<button type="button" data-summary-type="${escapeHtml(v)}" aria-pressed="${on}"
      class="px-2.5 py-1 rounded-full border font-mono text-xs sm:text-sm transition-all ${on ? REF_CHIP_ON : REF_CHIP_OFF}">${escapeHtml(v)}</button>`;
  }).join('');
}

// Show / hide the ref2va fields for the current mode and rebuild their content.
function renderRefUi() {
  const isRef = state.mode === 'ref2va';
  refSectionsEl.classList.toggle('hidden', !isRef);
  refStyleWrapEl.classList.toggle('hidden', !isRef);
  shotsFieldNameEl.textContent = isRef ? 'detailed_description' : 'integrated_multimodal_description';
  if (!isRef) return;

  const free = state.ref.retentionMode === 'free';
  const labels = refLabels(state.ref.refs);
  refListEl.innerHTML = state.ref.refs.length
    ? state.ref.refs.map((item, i) => refItemHtml(item, i, labels[i], free)).join('')
    : `<p class="text-xs sm:text-sm text-slate-400">${escapeHtml(t('refEmpty'))}</p>`;
  summaryTypesEl.innerHTML = summaryChipsHtml();
  summaryInput.value = state.ref.summary;
  styleInput.value = state.ref.style;
  retentionFreeCheck.checked = free;
  retentionFreeInput.classList.toggle('hidden', !free);
  retentionFreeInput.value = state.ref.retentionFree;
}

function refItemOf(el) {
  const box = el.closest('.ref-item');
  return box ? state.ref.refs[Number(box.dataset.refIndex)] : null;
}

function handleRefInput(e) {
  const field = e.target.dataset.refField;
  const item = refItemOf(e.target);
  if (!field || !item || e.target.tagName === 'SELECT') return;
  item[field] = e.target.value;
  refreshDerived();
}

function handleRefChange(e) {
  const field = e.target.dataset.refField;
  const item = refItemOf(e.target);
  if (!item || e.target.tagName !== 'SELECT') return;
  item[field] = e.target.value;
  if (field === 'type' && !markersFor(item.type).includes(item.marker)) item.marker = markersFor(item.type)[0];
  if (field === 'type') renderRefUi(); // labels are renumbered, marker list changes
  refreshDerived();
}

function handleRefClick(e) {
  const addBtn = e.target.closest('[data-ref-add]');
  if (addBtn) {
    state.ref.refs.push(blankRefItem(addBtn.dataset.refAdd));
    renderRefUi();
    refreshDerived();
    const boxes = refListEl.querySelectorAll('.ref-item');
    boxes[boxes.length - 1].querySelector('[data-ref-field="definition"]').focus();
    return;
  }
  const chip = e.target.closest('[data-summary-type]');
  if (chip) {
    const type = chip.dataset.summaryType;
    const types = state.ref.summaryTypes;
    state.ref.summaryTypes = types.includes(type) ? types.filter(v => v !== type) : [...types, type];
    summaryTypesEl.innerHTML = summaryChipsHtml();
    refreshDerived();
    return;
  }
  const actionBtn = e.target.closest('[data-ref-action]');
  const item = actionBtn && refItemOf(actionBtn);
  if (!item) return;
  if (actionBtn.dataset.refAction === 'delete') {
    state.ref.refs.splice(state.ref.refs.indexOf(item), 1);
    renderRefUi();
    refreshDerived();
  } else {
    // Insert this label into the focused shot card ("<Subject 1>").
    const shot = state.shots[state.activeShotIndex];
    if (!shot) return;
    const label = actionBtn.textContent.trim();
    shot.description += (shot.description && !/\s$/.test(shot.description) ? ' ' : '') + label;
    render();
    showToast(t('toastChip'));
  }
}

function initRef() {
  refSectionsEl.addEventListener('input', handleRefInput);
  refSectionsEl.addEventListener('change', handleRefChange);
  refSectionsEl.addEventListener('click', handleRefClick);
  summaryInput.addEventListener('input', () => { state.ref.summary = summaryInput.value; refreshDerived(); });
  styleInput.addEventListener('input', () => { state.ref.style = styleInput.value; refreshDerived(); });
  retentionFreeInput.addEventListener('input', () => { state.ref.retentionFree = retentionFreeInput.value; refreshDerived(); });
  retentionFreeCheck.addEventListener('change', () => {
    state.ref.retentionMode = retentionFreeCheck.checked ? 'free' : 'list';
    renderRefUi();
    refreshDerived();
  });
}
