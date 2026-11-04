// =============================================================================
// shots.js — shot cards: rendering, per-card events, add/delete/duplicate/move,
// drag-and-drop sorting. Pure logic it relies on lives in core.js.
// =============================================================================

// ---------------------------------------------------------------------
// Actions (list logic lives in core.js: appendShot / duplicateShotAt /
// removeShotAt / moveShotTo / shiftDuration)
// ---------------------------------------------------------------------

// Apply a { shots, active } result from core.js and rebuild the cards.
function applyShotChange({ shots, active }) {
  state.shots = shots;
  state.activeShotIndex = active;
  render();
}

function adjustShotDuration(index, deltaMs) {
  const shot = state.shots[index];
  shot.duration = shiftDuration(shot.duration, deltaMs / 1000);
  render();
}

function moveShot(index, direction) {
  // The duration moves with the card; start times are recalculated.
  applyShotChange(moveShotTo(state.shots, index, index + direction, index));
}

function addShot() {
  applyShotChange(appendShot(state.shots, nextShotId++, state.timeStepSec));
}

function deleteShot(index) {
  applyShotChange(removeShotAt(state.shots, index));
}

function duplicateShot(index) {
  applyShotChange(duplicateShotAt(state.shots, index, nextShotId++));
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------
const DUR_BOX_BASE = 'dur-box inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs sm:text-sm transition-colors';
const DUR_BOX_OK = 'bg-slate-950 border-slate-700/80 focus-within:border-indigo-500';
const DUR_BOX_ERR = 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/60';
const LABEL_BASE = 'shot-label whitespace-nowrap px-2.5 py-1.5 rounded-lg border font-mono text-xs sm:text-sm font-bold';
// Card action buttons (move / paste / duplicate / delete): larger icons.
const ACTION_ICON = 'w-5 h-5';
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
    card.className = `shot-card glass-panel rounded-2xl px-4 pt-4 pb-3 border transition-all duration-200 ${
      state.activeShotIndex === index
        ? 'border-indigo-500/80 bg-slate-900/90 shadow-md shadow-indigo-500/10'
        : 'border-slate-800 hover:border-slate-700'
    }`;

    card.innerHTML = `
      <div class="pb-3.5 mb-3.5 border-b border-slate-800/80">
        <div class="shot-header flex flex-wrap items-start justify-between gap-x-2 sm:gap-x-3 gap-y-2">
          <!-- Top left: [Shot N] label with its start time underneath -->
          <div class="shot-title flex flex-col items-start gap-1 shrink-0">
            <span class="${LABEL_BASE}"></span>
            <span class="shot-start pl-0.5 font-mono text-xs text-slate-400 whitespace-nowrap" title="${escapeHtml(t('startTime'))}"></span>
          </div>

          <!-- Duration Input and Fine-tune Buttons (own row on phones) -->
          <div class="shot-controls order-3 sm:order-none w-full sm:w-auto flex flex-wrap items-center gap-2 sm:mr-auto">
            <label class="${DUR_BOX_BASE} ${DUR_BOX_OK}" title="${escapeHtml(t('durationLabel'))}">
              <input type="text" data-field="duration" value="${escapeHtml(shot.duration)}"
                maxlength="8" spellcheck="false" autocomplete="off" inputmode="decimal" aria-label="${escapeHtml(t('durationLabel'))}"
                class="shot-input dur-input w-[4ch] bg-transparent p-0 border-0 text-right font-mono text-xs sm:text-sm text-indigo-200 focus:outline-none focus:ring-0">
              <span class="text-slate-500 select-none">s</span>
            </label>

            <!-- Duration Fine-tune Buttons (+/- 100ms, +/- 500ms) -->
            <div class="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              ${adjustButton(-500)}
              ${adjustButton(-100)}
              ${adjustButton(100)}
              ${adjustButton(500)}
            </div>
          </div>

          <!-- Top right: Move Up/Down, Paste, Duplicate, Delete, Drag handle -->
          <div class="shot-actions order-2 sm:order-none h-[34px] flex items-center gap-0.5">
            <button type="button" data-action="move" data-dir="-1" class="move-shot-btn p-1.5 lg:p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-all ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}" title="${escapeHtml(t('moveUp'))}">
              ${icon('up', ACTION_ICON)}
            </button>
            <button type="button" data-action="move" data-dir="1" class="move-shot-btn p-1.5 lg:p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-all ${index === state.shots.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" title="${escapeHtml(t('moveDown'))}">
              ${icon('down', ACTION_ICON)}
            </button>
            <button type="button" data-action="paste-text" class="paste-shot-btn p-1.5 lg:p-1 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition-all" title="${escapeHtml(t('pasteShot'))}" aria-label="${escapeHtml(t('pasteShot'))}">
              ${icon('paste', ACTION_ICON)}
            </button>
            <button type="button" data-action="duplicate" class="duplicate-shot-btn p-1.5 lg:p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-all" title="${escapeHtml(t('duplicate'))}">
              ${icon('duplicate', ACTION_ICON)}
            </button>
            ${state.shots.length > 1 ? `
              <button type="button" data-action="delete" class="delete-shot-btn p-1.5 lg:p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-lg transition-all" title="${escapeHtml(t('delete'))}">
                ${icon('trash', ACTION_ICON)}
              </button>
            ` : ''}
            <button type="button" class="drag-handle sm:ml-1 p-1.5 lg:p-1 text-slate-500 hover:text-indigo-300 cursor-grab active:cursor-grabbing rounded-lg transition-colors" title="${escapeHtml(t('dragHandle'))}" aria-label="${escapeHtml(t('dragHandle'))}">
              ${icon('drag', ACTION_ICON)}
            </button>
          </div>
        </div>
      </div>

      <textarea data-field="description" rows="3" style="min-height: 110px;"
        placeholder="${escapeHtml(t('placeholder'))}"
        class="shot-input w-full block bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y font-sans leading-relaxed">${escapeHtml(shot.description)}</textarea>

      <!-- Message line under the description: always takes one line, so the
           card height does not change when a message appears. -->
      <div class="shot-msg h-5 mt-2 text-xs leading-5 min-w-0">
        <p class="dur-error hidden truncate font-semibold text-rose-300" title="${escapeHtml(t('durInvalid'))}">${escapeHtml(t('durInvalid'))}</p>
        <p class="shot-skip hidden truncate font-medium text-amber-300" title="${escapeHtml(t('skipped'))}">${escapeHtml(t('skipped'))}</p>
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
    const durBox = card.querySelector('.dur-box');
    const durInput = card.querySelector('.dur-input');
    const errEl = card.querySelector('.dur-error');
    card.querySelector('.shot-start').textContent = info.start ? `At ${info.start}` : 'At –';

    if (info.outNum) {
      exported += 1;
      label.textContent = `[Shot ${info.outNum}]`;
      label.className = `${LABEL_BASE} ${LABEL_OUT}`;
      skip.classList.add('hidden');
    } else {
      label.textContent = '[Shot –]';
      label.className = `${LABEL_BASE} ${LABEL_SKIP}`;
      skip.classList.toggle('hidden', !!info.error); // an error message takes the line first
    }

    if (info.error) {
      errorCount += 1;
      durBox.className = `${DUR_BOX_BASE} ${DUR_BOX_ERR}`;
      durInput.classList.replace('text-indigo-200', 'text-rose-200');
      durInput.setAttribute('aria-invalid', 'true');
      errEl.classList.remove('hidden');
    } else {
      durBox.className = `${DUR_BOX_BASE} ${DUR_BOX_OK}`;
      durInput.classList.replace('text-rose-200', 'text-indigo-200');
      durInput.removeAttribute('aria-invalid');
      errEl.classList.add('hidden');
    }
  });

  exportedCountEl.textContent = exported === state.shots.length ? '' : t('exportedCount', { n: exported });

  if (errorCount > 0) {
    tsWarningTextEl.textContent = t('durSummary', { n: errorCount });
    tsWarningEl.classList.remove('hidden');
  } else {
    tsWarningEl.classList.add('hidden');
  }

  const fullPrompt = currentPrompt();
  outputPreviewEl.textContent = fullPrompt;
  totalDurationEl.textContent = formatTimestamp(totalDuration(state.shots));
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
        // The duration moves with the card; start times are recalculated.
        applyShotChange(moveShotTo(state.shots, oldIndex, newIndex, state.activeShotIndex));
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
    case 'nudge': adjustShotDuration(index, parseInt(btn.dataset.delta, 10)); break;
    case 'move': moveShot(index, parseInt(btn.dataset.dir, 10)); break;
    case 'paste-text': pasteIntoShot(index); break;
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
  // Leaving a duration box tidies what was typed ("1,50s" → "1.5").
  shotsListEl.addEventListener('change', (e) => {
    if (e.target.dataset.field !== 'duration') return;
    const index = cardIndex(e.target);
    const value = normalizeDuration(e.target.value);
    e.target.value = value;
    state.shots[index].duration = value;
    refreshDerived();
  });
  shotsListEl.addEventListener('focusin', (e) => {
    if (e.target.matches('.shot-input')) setActiveShot(cardIndex(e.target));
  });
  initShotSorting();
}
