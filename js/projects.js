// =============================================================================
// projects.js — several saved storyboards: switch / new / rename / delete in
// the Shot Sequence card, plus JSON export and import of one storyboard.
// Data helpers live in core.js; storage (saveStoryboard) lives in state.js.
// =============================================================================

// Fill the select, the name box and the Delete button from state.projects.
function renderProjectUi() {
  projectSelect.innerHTML = state.projects
    .map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`)
    .join('');
  projectSelect.value = state.activeProjectId;
  projectNameInput.value = activeProject().name;
  projectDeleteBtn.disabled = state.projects.length <= 1; // the last one stays
}

// Show the active project's content (state.activeProjectId already points to it).
function loadActiveProject() {
  const project = activeProject();
  state.shots = withShotIds(project.shots);
  state.overallSoundscape = project.overallSoundscape;
  state.nonDiegeticMusic = project.nonDiegeticMusic;
  state.activeShotIndex = 0;
  syncAudioInputs();
  render(); // also saves
  renderProjectUi();
}

function switchProject(id) {
  if (id === state.activeProjectId || !state.projects.some(p => p.id === id)) return;
  syncActiveProject(); // keep the content of the one being left
  state.activeProjectId = id;
  loadActiveProject();
}

// Add a storyboard (blank, or from `board` = parseStoryboard() result) and open it.
function addProject(board) {
  syncActiveProject();
  const id = nextProjectId(state.projects);
  const project = board
    ? { ...board, id, name: board.name || defaultProjectName(state.projects) }
    : blankProject(id, defaultProjectName(state.projects));
  state.projects.push(project);
  state.activeProjectId = id;
  loadActiveProject();
  return project;
}

function createProject() {
  const project = addProject(null);
  showToast(t('toastProjectCreated', { name: project.name }));
  projectNameInput.focus();
  projectNameInput.select();
}

async function deleteProject() {
  if (state.projects.length <= 1) return;
  const project = activeProject();
  const ok = await showConfirm({
    title: t('confirmDeleteProjectTitle'),
    message: t('confirmDeleteProject', { name: project.name }),
    ok: t('deleteProject'),
  });
  if (!ok) return;
  const index = state.projects.indexOf(project);
  state.projects.splice(index, 1);
  state.activeProjectId = state.projects[Math.max(0, index - 1)].id;
  loadActiveProject();
  showToast(t('toastProjectDeleted', { name: project.name }));
}

// Typing in the name box renames the active storyboard right away (an empty
// name is not applied; it is restored when the box loses focus).
function renameProject() {
  const name = collapseSpaces(projectNameInput.value).slice(0, PROJECT_NAME_MAX);
  if (!name) return;
  activeProject().name = name;
  const option = [...projectSelect.options].find(o => o.value === state.activeProjectId);
  if (option) option.textContent = name;
  saveStoryboard();
}

// Download the active storyboard (name, shots, soundscape, music) as JSON.
function exportStoryboard() {
  syncActiveProject();
  const project = activeProject();
  downloadJson(buildStoryboardExport({ ...project, name: project.name }), `minimax-h3-storyboard-${dateStamp()}.json`);
  showToast(t('toastStoryboardExported'));
}

// Add the chosen JSON file as a new storyboard (the current one is kept).
async function importStoryboardFromFile() {
  const file = storyboardImportFile.files && storyboardImportFile.files[0];
  storyboardImportFile.value = '';
  if (!file) return;
  let board;
  try {
    board = parseStoryboard(JSON.parse(await file.text()));
  } catch (err) {
    console.warn('Storyboard import failed', err);
    showToast(t('toastStoryboardImportFail'));
    return;
  }
  const project = addProject(board);
  showToast(t('toastStoryboardImported', { name: project.name, n: project.shots.length }));
}

function initProjects() {
  projectSelect.addEventListener('change', () => switchProject(projectSelect.value));
  projectNewBtn.addEventListener('click', createProject);
  projectDeleteBtn.addEventListener('click', deleteProject);
  projectNameInput.addEventListener('input', renameProject);
  projectNameInput.addEventListener('change', () => { projectNameInput.value = activeProject().name; });
  projectNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') projectNameInput.blur(); });

  storyboardExportBtn.addEventListener('click', exportStoryboard);
  storyboardImportBtn.addEventListener('click', () => storyboardImportFile.click());
  storyboardImportFile.addEventListener('change', importStoryboardFromFile);
  renderProjectUi();
}
