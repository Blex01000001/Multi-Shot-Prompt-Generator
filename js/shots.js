// =============================================================================
// shots.js — shot cards: rendering, per-card events, add/delete/duplicate/move,
// drag-and-drop sorting. Pure logic it relies on lives in core.js.
// =============================================================================

function errorMessage(error) {
  if (!error) return '';
  if (error.type === 'invalid') return t('tsInvalid');
  return t('tsOrder', { prev: `[Shot ${error.prevNum}]`, ts: error.prevTs });
}

// ---------------------------------------------------------------------
// Actions (list logic lives in core.js: appendShot / duplicateShotAt /
// removeShotAt / moveShotTo / moveShotKeepingTimes / shiftTimestamp)
// ---------------------------------------------------------------------

// Apply a { shots, active } result from core.js and rebuild the cards.
function applyShotChange({ shots, active }) {
  state.shots = shots;
  state.activeShotIndex = active;
  render();
}

function adjustShotTime(index, deltaMs) {
  const shot = state.shots[index];
  shot.timestamp = shiftTimestamp(shot.timestamp, deltaMs / 1000);
  render();
}

function setShotTimeToZero(index) {
  state.shots[index].timestamp = formatTimestamp(0);
  render();
}

function moveShot(index, direction) {
  // Same as drag-and-drop: the cards swap, the timestamps stay in place.
  applyShotChange(moveShotKeepingTimes(state.shots, index, index + direction, index));
}

function addShot() {
  applyShotChange(appendShot(state.shots, nextShotId++, state.timeStepSec));
}

function deleteShot(index) {
  applyShotChange(removeShotAt(state.shots, index));
}

function duplicateShot(index) {
  applyShotChange(duplicateShotAt(state.shots, index, nextShotId++, state.timeStepSec));
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------
const TS_BOX_BASE = 'ts-box inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs sm:text-sm transition-colors';
const TS_BOX_OK = 'bg-slate-950 border-slate-700/80 focus-within:border-indigo-500';
const TS_BOX_ERR = 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/60';
const LABEL_BASE = 'shot-label px-2.5 py-1 rounded-lg border font-mono text-xs sm:text-sm font-bold';
const LABEL_OUT = 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300';
const LABEL_SKIP = 'bg-slate-800/60 border-slate-700/60 text-slate-400';

function adjustButton(delta) {
  const positive = delta > 0;
  const color = positive
    ? 'hover:bg-emerald-950/80 text-emerald-300 hover:border-emerald-500/60'
    : 'hover:bg-rose-950/80 text-rose-300 hover:border-rose-500/60';
  const title = positive ? t('adjustPlus', { n: delta }) : t('adjustMinus', { n: Math.abs(delta) });
  const label = `${positive ? '+' : '-'}${Math.abs(delta)}ms`;
  return `<button type="button" data-action="nudge" data-delta="${delta}" title="${escapeHtml(title)}" class="time-adjust-btn px-1.5 py-1 text-[11px] sm:text-xs font-mono font-semibold bg-slate-800/80 border border-slate-700/60 ${color} rounded transition-all active:scale-95">${label}</button>`;
}

function render() {
  // 1. Render Shots Cards
  shotsListEl.innerHTML = '';
  state.shots.forEach((shot, index) => {
    const card = document.createElement('div');
    card.dataset.index = index;
    card.className = `shot-card glass-panel rounded-2xl p-5 border transition-all duration-200 ${
      state.activeShotIndex === index
        ? 'border-indigo-500/80 bg-slate-900/90 shadow-md shadow-indigo-500/10'
        : 'border-slate-800 hover:border-slate-700'
    }`;

    card.innerHTML = `
      <div class="pb-3.5 mb-3.5 border-b border-slate-800/80">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <!-- Left: Shot Tag, Timestamp Input, and Fine-tune Buttons -->
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="drag-handle -ml-2 p-1 text-slate-500 hover:text-indigo-300 cursor-grab active:cursor-grabbing rounded-md transition-colors" title="${escapeHtml(t('dragHandle'))}" aria-label="${escapeHtml(t('dragHandle'))}">
              ${icon('drag', 'w-5 h-5')}
            </button>
            <span class="${LABEL_BASE}"></span>

            <label class="${TS_BOX_BASE} ${TS_BOX_OK}">
              <span class="text-slate-500 select-none">At</span>
              <input type="text" data-field="timestamp" value="${escapeHtml(shot.timestamp)}"
                size="9" maxlength="9" spellcheck="false" autocomplete="off" inputmode="decimal"
                class="shot-input ts-input bg-transparent p-0 border-0 font-mono text-xs sm:text-sm text-indigo-200 focus:outline-none focus:ring-0">
            </label>

            <!-- Timestamp Fine-tune Buttons (+/- 100ms, +/- 500ms) -->
            <div class="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              ${adjustButton(-500)}
              ${adjustButton(-100)}
              ${adjustButton(100)}
              ${adjustButton(500)}
            </div>
          </div>

          <!-- Right: Move Up/Down, Duplicate, Delete -->
          <div class="flex items-center gap-0.5">
            <button type="button" data-action="move" data-dir="-1" class="move-shot-btn p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-all ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}" title="${escapeHtml(t('moveUp'))}">
              ${icon('up')}
            </button>
            <button type="button" data-action="move" data-dir="1" class="move-shot-btn p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-all ${index === state.shots.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" title="${escapeHtml(t('moveDown'))}">
              ${icon('down')}
            </button>
            <button type="button" data-action="duplicate" class="duplicate-shot-btn p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-all" title="${escapeHtml(t('duplicate'))}">
              ${icon('duplicate')}
            </button>
            ${state.shots.length > 1 ? `
              <button type="button" data-action="delete" class="delete-shot-btn p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all" title="${escapeHtml(t('delete'))}">
                ${icon('trash')}
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Empty shot note -->
        <p class="shot-skip hidden mt-2.5 text-xs sm:text-sm font-medium text-slate-400 flex items-center gap-1.5">
          ${icon('info', 'w-4 h-4 shrink-0')}
          <span>${escapeHtml(t('skipped'))}</span>
        </p>

        <!-- Timestamp error message -->
        <p class="ts-error hidden mt-2.5 text-xs sm:text-sm font-semibold text-rose-300 flex items-center gap-1.5">
          ${icon('warning', 'w-4 h-4 shrink-0 text-rose-400')}
          <span class="ts-error-text"></span>
        </p>

        <!-- Timestamp reminder (not an error) -->
        <div class="ts-note hidden mt-2.5 text-xs sm:text-sm font-medium text-amber-300 flex flex-wrap items-center gap-x-1.5 gap-y-2">
          ${icon('info', 'w-4 h-4 shrink-0 text-amber-400')}
          <span>${escapeHtml(t('tsFirstNotZero'))}</span>
          <button type="button" data-action="zero-time" class="zero-time-btn ml-1 px-2 py-0.5 rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50 hover:border-amber-400/70 text-amber-200 font-mono text-xs sm:text-sm transition-colors">${escapeHtml(t('setZeroTime'))}</button>
        </div>
      </div>

      <div>
        <textarea data-field="description" rows="3" style="min-height: 110px;"
          placeholder="${escapeHtml(t('placeholder'))}"
          class="shot-input w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y font-sans leading-relaxed">${escapeHtml(shot.description)}</textarea>
      </div>
    `;

    shotsListEl.appendChild(card);
  });

  // Update Shot Counter
  shotCountBadgeEl.textContent = state.shots.length;

  // 2. Labels, validation and live output
  refreshDerived();
}

// Update everything that depends on shot content without rebuilding the
// cards (keeps focus / caret while typing).
function refreshDerived() {
  const analysis = analyzeShots(state.shots);
  const cards = shotsListEl.querySelectorAll('.shot-card');
  let errorCount = 0;
  let exported = 0;

  cards.forEach((card, index) => {
    const info = analysis[index];
    if (!info) return;

    const label = card.querySelector('.shot-label');
    const skip = card.querySelector('.shot-skip');
    const tsBox = card.querySelector('.ts-box');
    const tsInput = card.querySelector('.ts-input');
    const errEl = card.querySelector('.ts-error');
    const errText = card.querySelector('.ts-error-text');

    if (info.outNum) {
      exported += 1;
      label.textContent = `[Shot ${info.outNum}]`;
      label.className = `${LABEL_BASE} ${LABEL_OUT}`;
      skip.classList.add('hidden');
    } else {
      label.textContent = '[Shot –]';
      label.className = `${LABEL_BASE} ${LABEL_SKIP}`;
      skip.classList.remove('hidden');
    }

    if (info.error) {
      errorCount += 1;
      tsBox.className = `${TS_BOX_BASE} ${TS_BOX_ERR}`;
      tsInput.classList.replace('text-indigo-200', 'text-rose-200');
      tsInput.setAttribute('aria-invalid', 'true');
      errText.textContent = errorMessage(info.error);
      errEl.classList.remove('hidden');
    } else {
      tsBox.className = `${TS_BOX_BASE} ${TS_BOX_OK}`;
      tsInput.classList.replace('text-rose-200', 'text-indigo-200');
      tsInput.removeAttribute('aria-invalid');
      errEl.classList.add('hidden');
    }

    card.querySelector('.ts-note').classList.toggle('hidden', !info.warning);
  });

  exportedCountEl.textContent = exported === state.shots.length ? '' : t('exportedCount', { n: exported });

  if (errorCount > 0) {
    tsWarningTextEl.textContent = t('tsSummary', { n: errorCount });
    tsWarningEl.classList.remove('hidden');
  } else {
    tsWarningEl.classList.add('hidden');
  }

  const fullPrompt = currentPrompt();
  outputPreviewEl.textContent = fullPrompt;
  charCountEl.textContent = t('chars', { n: fullPrompt.length });
}

function setActiveShot(index) {
  if (state.activeShotIndex === index) return;
  state.activeShotIndex = index;
  shotsListEl.querySelectorAll('.shot-card').forEach((card, i) => {
    const active = i === index;
    card.classList.toggle('border-indigo-500/80', active);
    card.classList.toggle('bg-slate-900/90', active);
    card.classList.toggle('shadow-md', active);
    card.classList.toggle('shadow-indigo-500/10', active);
    card.classList.toggle('border-slate-800', !active);
    card.classList.toggle('hover:border-slate-700', !active);
  });
}

function initShotSorting() {
  // Drag-and-drop reordering (SortableJS). The up/down buttons keep working
  // if the CDN script fails to load.
  if (window.Sortable) {
    Sortable.create(shotsListEl, {
      handle: '.drag-handle',
      draggable: '.shot-card',
      animation: 180,
      ghostClass: 'sortable-ghost',
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt;
        if (oldIndex === newIndex || oldIndex == null || newIndex == null) return;
        // Timestamps stay in place; only the cards' content changes order.
        applyShotChange(moveShotKeepingTimes(state.shots, oldIndex, newIndex, state.activeShotIndex));
      },
    });
  }
}

// Card events are delegated to the list, so they are bound once and survive
// render(). Buttons say what they do with data-action; the card's data-index
// says which shot.
function cardIndex(el) {
  return parseInt(el.closest('.shot-card').dataset.index, 10);
}

function handleShotClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn || !shotsListEl.contains(btn)) return;
  const index = cardIndex(btn);
  switch (btn.dataset.action) {
    case 'nudge': adjustShotTime(index, parseInt(btn.dataset.delta, 10)); break;
    case 'move': moveShot(index, parseInt(btn.dataset.dir, 10)); break;
    case 'zero-time': setShotTimeToZero(index); break;
    case 'duplicate': duplicateShot(index); break;
    case 'delete': deleteShot(index); break;
  }
}

function handleShotInput(e) {
  const field = e.target.dataset.field;
  if (!field) return;
  state.shots[cardIndex(e.target)][field] = e.target.value;
  refreshDerived();
}

function initShots() {
  shotsListEl.addEventListener('click', handleShotClick);
  shotsListEl.addEventListener('input', handleShotInput);
  shotsListEl.addEventListener('focusin', (e) => {
    if (e.target.matches('.shot-input')) setActiveShot(cardIndex(e.target));
  });
  initShotSorting();
}
