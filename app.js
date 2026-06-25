const STORAGE_KEY = 'neet-mcq-bank-v1';
const PROGRESS_KEY = 'neet-student-progress-v1';
const FLAGS_KEY = 'neet-answer-flags-v1';
const ACTIVE_STUDENT_KEY = 'neet-active-student-v1';
const ADMIN_SESSION_KEY = 'neet-admin-session-v1';
const IDB_NAME = 'neet-mcq-db';
const IDB_VERSION = 1;
const IDB_STORE = 'bank';

const DEFAULT_APP_CONFIG = {
  remoteBankUrl: '',
  remoteProgressUrl: '',
  remoteFlagsUrl: '',
  adminPin: '1234',
  autoSyncOnLoad: true,
  appName: 'NEET Physics MCQ Mastery',
  students: ['Student 1', 'Student 2', 'Student 3', 'Student 4']
};

function getAppConfig() {
  return { ...DEFAULT_APP_CONFIG, ...(window.APP_CONFIG || {}) };
}

function normalizePin(value) {
  return String(value ?? '').trim();
}

function getAdminPin() {
  return normalizePin(getAppConfig().adminPin || DEFAULT_APP_CONFIG.adminPin);
}

const state = {
  questions: [],
  activeTab: 'dashboard',
  selectedChapter: '',
  auditFilter: 'all',
  selectedFilters: {
    subjects: new Set(),
    topics: new Set(),
    subtopics: new Set(),
    tags: new Set()
  },
  bankFilters: {
    subjects: new Set(),
    topics: new Set(),
    subtopics: new Set(),
    tags: new Set()
  },
  practice: {
    active: false,
    questions: [],
    index: 0,
    score: 0,
    answered: false,
    selectedOption: null,
    selectedOptions: []
  },
  bankSearch: '',
  bankShowAnswers: false,
  bankPage: 1,
  BANK_PAGE_SIZE: 40,
  search: { query: '', results: [], total: 0, activeIndex: 0, parsed: null },
  editingId: null,
  bankUpdatedAt: null,
  progress: { version: 1, updatedAt: 0, students: {} },
  flags: { version: 1, updatedAt: 0, items: [] },
  flagTargetQuestionId: '',
  activeStudentId: '',
  progressViewStudentId: '',
  progressSelectedTopic: '',
  progressListLimit: 80
};

const el = {
  totalCount: document.getElementById('totalCount'),
  navItems: document.querySelectorAll('.nav-item'),
  viewPanels: document.querySelectorAll('.view-panel'),
  sidebar: document.querySelector('.sidebar'),
  menuToggle: document.getElementById('menuToggle'),
  sidebarBackdrop: document.getElementById('sidebarBackdrop'),
  dashboardView: document.getElementById('dashboardView'),
  chaptersView: document.getElementById('chaptersView'),
  chapterDetail: document.getElementById('chapterDetail'),
  revisionView: document.getElementById('revisionView'),
  auditView: document.getElementById('auditView'),
  filterSubjects: document.getElementById('filterSubjects'),
  filterTopics: document.getElementById('filterTopics'),
  filterSubtopics: document.getElementById('filterSubtopics'),
  filterTags: document.getElementById('filterTags'),
  practiceCount: document.getElementById('practiceCount'),
  matchCount: document.getElementById('matchCount'),
  startPracticeBtn: document.getElementById('startPracticeBtn'),
  clearFiltersBtn: document.getElementById('clearFiltersBtn'),
  practiceArea: document.getElementById('practiceArea'),
  progressBar: document.getElementById('progressBar'),
  practiceProgress: document.getElementById('practiceProgress'),
  practiceScore: document.getElementById('practiceScore'),
  practiceCard: document.getElementById('practiceCard'),
  nextQuestionBtn: document.getElementById('nextQuestionBtn'),
  finishPracticeBtn: document.getElementById('finishPracticeBtn'),
  practiceResults: document.getElementById('practiceResults'),
  mcqForm: document.getElementById('mcqForm'),
  editId: document.getElementById('editId'),
  formMode: document.getElementById('formMode'),
  fQuestion: document.getElementById('fQuestion'),
  fOptionA: document.getElementById('fOptionA'),
  fOptionB: document.getElementById('fOptionB'),
  fOptionC: document.getElementById('fOptionC'),
  fOptionD: document.getElementById('fOptionD'),
  fAnswerA: document.getElementById('fAnswerA'),
  fAnswerB: document.getElementById('fAnswerB'),
  fAnswerC: document.getElementById('fAnswerC'),
  fAnswerD: document.getElementById('fAnswerD'),
  fExplanation: document.getElementById('fExplanation'),
  fQuestionImageFile: document.getElementById('fQuestionImageFile'),
  fQuestionImageData: document.getElementById('fQuestionImageData'),
  fQuestionImagePreviewWrap: document.getElementById('fQuestionImagePreviewWrap'),
  fQuestionImagePreview: document.getElementById('fQuestionImagePreview'),
  fQuestionImageRemove: document.getElementById('fQuestionImageRemove'),
  fExplanationImageFile: document.getElementById('fExplanationImageFile'),
  fExplanationImageData: document.getElementById('fExplanationImageData'),
  fExplanationImagePreviewWrap: document.getElementById('fExplanationImagePreviewWrap'),
  fExplanationImagePreview: document.getElementById('fExplanationImagePreview'),
  fExplanationImageRemove: document.getElementById('fExplanationImageRemove'),
  fWhyWrongA: document.getElementById('fWhyWrongA'),
  fWhyWrongB: document.getElementById('fWhyWrongB'),
  fWhyWrongC: document.getElementById('fWhyWrongC'),
  fWhyWrongD: document.getElementById('fWhyWrongD'),
  fSubject: document.getElementById('fSubject'),
  fTopic: document.getElementById('fTopic'),
  fSubtopic: document.getElementById('fSubtopic'),
  fTags: document.getElementById('fTags'),
  subjectList: document.getElementById('subjectList'),
  topicList: document.getElementById('topicList'),
  subtopicList: document.getElementById('subtopicList'),
  cancelEditBtn: document.getElementById('cancelEditBtn'),
  bankSummary: document.getElementById('bankSummary'),
  bankStorageStatus: document.getElementById('bankStorageStatus'),
  bankSyncStatus: document.getElementById('bankSyncStatus'),
  githubTokenInput: document.getElementById('githubTokenInput'),
  saveGithubTokenBtn: document.getElementById('saveGithubTokenBtn'),
  clearGithubTokenBtn: document.getElementById('clearGithubTokenBtn'),
  pushBankNowBtn: document.getElementById('pushBankNowBtn'),
  githubTokenStatus: document.getElementById('githubTokenStatus'),
  bankSearch: document.getElementById('bankSearch'),
  bankExportJsonBtn: document.getElementById('bankExportJsonBtn'),
  bankExportCsvBtn: document.getElementById('bankExportCsvBtn'),
  bankToggleAnswersBtn: document.getElementById('bankToggleAnswersBtn'),
  bankFilterSubjects: document.getElementById('bankFilterSubjects'),
  bankFilterTopics: document.getElementById('bankFilterTopics'),
  bankFilterSubtopics: document.getElementById('bankFilterSubtopics'),
  bankFilterTags: document.getElementById('bankFilterTags'),
  clearBankFiltersBtn: document.getElementById('clearBankFiltersBtn'),
  practiceFromBankBtn: document.getElementById('practiceFromBankBtn'),
  bankList: document.getElementById('bankList'),
  importFile: document.getElementById('importFile'),
  importStatus: document.getElementById('importStatus'),
  exportStatus: document.getElementById('exportStatus'),
  loadSampleBtn: document.getElementById('loadSampleBtn'),
  exportJsonBtn: document.getElementById('exportJsonBtn'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  resetAllBtn: document.getElementById('resetAllBtn'),
  syncBankBtn: document.getElementById('syncBankBtn'),
  adminUnlockBtn: document.getElementById('adminUnlockBtn'),
  roleBadge: document.getElementById('roleBadge'),
  syncStatus: document.getElementById('syncStatus'),
  adminDialog: document.getElementById('adminDialog'),
  adminForm: document.getElementById('adminForm'),
  adminPinInput: document.getElementById('adminPinInput'),
  adminDialogError: document.getElementById('adminDialogError'),
  adminSubmitBtn: document.getElementById('adminSubmitBtn'),
  adminCancelBtn: document.getElementById('adminCancelBtn'),
  publishBankBtn: document.getElementById('publishBankBtn'),
  studentSelect: document.getElementById('studentSelect'),
  syncProgressBtn: document.getElementById('syncProgressBtn'),
  practiceUnsolvedOnly: document.getElementById('practiceUnsolvedOnly'),
  syncProgressPanelBtn: document.getElementById('syncProgressPanelBtn'),
  publishProgressBtn: document.getElementById('publishProgressBtn'),
  studentDialog: document.getElementById('studentDialog'),
  studentForm: document.getElementById('studentForm'),
  studentDialogSelect: document.getElementById('studentDialogSelect'),
  flagDialog: document.getElementById('flagDialog'),
  flagForm: document.getElementById('flagForm'),
  flagSuggestedAnswer: document.getElementById('flagSuggestedAnswer'),
  flagComment: document.getElementById('flagComment'),
  flagFormError: document.getElementById('flagFormError'),
  flagFormSuccess: document.getElementById('flagFormSuccess'),
  flagSubmitBtn: document.getElementById('flagSubmitBtn'),
  flagCancelBtn: document.getElementById('flagCancelBtn'),
  flagsReviewList: document.getElementById('flagsReviewList'),
  flagsStatus: document.getElementById('flagsStatus'),
  flagPendingBadge: document.getElementById('flagPendingBadge'),
  syncFlagsBtn: document.getElementById('syncFlagsBtn'),
  publishFlagsBtn: document.getElementById('publishFlagsBtn'),
  globalSearchBtn: document.getElementById('globalSearchBtn'),
  searchDialog: document.getElementById('searchDialog'),
  globalSearchInput: document.getElementById('globalSearchInput'),
  searchCloseBtn: document.getElementById('searchCloseBtn'),
  searchMeta: document.getElementById('searchMeta'),
  searchResults: document.getElementById('searchResults'),
  searchPracticeAllBtn: document.getElementById('searchPracticeAllBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  toastContainer: document.getElementById('toastContainer')
};

// ── Toast notification system ─────────────────────────────────────────
function showToast(msg, { type = 'info', title = '', duration = 4000 } = {}) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.setAttribute('role', 'alert');
  t.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-body">
      ${title ? `<p class="toast-title">${escapeHtml(title)}</p>` : ''}
      <p class="toast-msg">${escapeHtml(msg)}</p>
    </div>`;
  t.addEventListener('click', () => dismissToast(t));
  el.toastContainer?.appendChild(t);
  if (duration > 0) setTimeout(() => dismissToast(t), duration);
  return t;
}
function dismissToast(t) {
  if (!t || t.classList.contains('toast-out')) return;
  t.classList.add('toast-out');
  t.addEventListener('animationend', () => t.remove(), { once: true });
}

// ── Dark mode ─────────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('neet-theme') || '';
  document.documentElement.dataset.theme = saved;
  if (el.themeToggleBtn) el.themeToggleBtn.textContent = saved === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  const next = isDark ? '' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('neet-theme', next);
  if (el.themeToggleBtn) el.themeToggleBtn.textContent = next === 'dark' ? '☀️' : '🌙';
}

function isAdmin() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

function requireAdmin(actionLabel = 'change the question bank') {
  if (isAdmin()) return true;
  showToast(`Admin PIN required to ${actionLabel}.`, { type: 'warning', title: 'Admin required' });
  openAdminDialog();
  return false;
}

function openAdminDialog() {
  if (!el.adminDialog) return;
  el.adminDialogError.hidden = true;
  el.adminPinInput.value = '';
  el.adminDialog.showModal();
  el.adminPinInput.focus();
}

function unlockAdmin(pin) {
  if (normalizePin(pin) !== getAdminPin()) return false;
  sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
  el.adminDialogError.hidden = true;
  applyRoleUI();
  return true;
}

function lockAdmin() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  if (state.activeTab === 'add' || state.activeTab === 'import') switchTab('dashboard');
  applyRoleUI();
}

function applyRoleUI() {
  const admin = isAdmin();
  const config = getAppConfig();
  const hasRemote = Boolean(clean(config.remoteBankUrl));

  document.querySelectorAll('.admin-only').forEach(node => {
    node.hidden = !admin;
  });

  if (el.roleBadge) {
    el.roleBadge.textContent = admin ? 'Admin' : 'Student';
    el.roleBadge.classList.toggle('admin-role', admin);
  }

  if (el.adminUnlockBtn) {
    el.adminUnlockBtn.textContent = admin ? 'Lock admin' : 'Admin';
  }

  if (el.syncBankBtn) {
    el.syncBankBtn.hidden = !hasRemote;
    el.syncBankBtn.disabled = !hasRemote;
  }

  if (el.syncStatus && !hasRemote) {
    el.syncStatus.textContent = 'Set remoteBankUrl in config.js to sync the same bank on all devices.';
  }

  renderBank();
  renderStudentSelectors();
  updateProgressSyncUI();
  updateFlagBadge();
  refreshLearningViews();
}

function getConfiguredStudents() {
  const config = getAppConfig();
  const names = Array.isArray(config.students) ? config.students : [];
  const cleaned = names.map(name => clean(name)).filter(Boolean);
  return cleaned.length ? cleaned : ['Student 1', 'Student 2', 'Student 3', 'Student 4'];
}

function studentIdFromName(name) {
  return clean(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'student';
}

function ensureProgressStudent(studentId, name) {
  if (!state.progress.students[studentId]) {
    state.progress.students[studentId] = {
      name,
      updatedAt: Date.now(),
      questions: {},
      history: []
    };
  } else if (name) {
    state.progress.students[studentId].name = name;
  }
  return state.progress.students[studentId];
}

function getActiveStudentRecord() {
  if (!state.activeStudentId) return null;
  return state.progress.students[state.activeStudentId] || null;
}

function setActiveStudent(studentId) {
  const names = getConfiguredStudents();
  const matchName = names.find(name => studentIdFromName(name) === studentId);
  if (!matchName) return;
  state.activeStudentId = studentId;
  localStorage.setItem(ACTIVE_STUDENT_KEY, studentId);
  ensureProgressStudent(studentId, matchName);
  renderStudentSelectors();
  updateFilterUI();
  refreshLearningViews();
}

function renderStudentSelectors() {
  const students = getConfiguredStudents();
  const options = students.map(name => {
    const id = studentIdFromName(name);
    return `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`;
  }).join('');

  if (el.studentSelect) {
    el.studentSelect.innerHTML = options;
    if (state.activeStudentId) el.studentSelect.value = state.activeStudentId;
  }
  if (el.studentDialogSelect) {
    el.studentDialogSelect.innerHTML = options;
    if (state.activeStudentId) el.studentDialogSelect.value = state.activeStudentId;
  }
}

function populateStudentSelect(select, selectedId) {
  if (!select) return;
  const students = getConfiguredStudents();
  select.innerHTML = students.map(name => {
    const id = studentIdFromName(name);
    return `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`;
  }).join('');
  if (selectedId) select.value = selectedId;
}

function openStudentDialog() {
  if (!el.studentDialog) return;
  renderStudentSelectors();
  el.studentDialog.showModal();
}

function updateProgressSyncUI() {
  const hasRemote = Boolean(clean(getAppConfig().remoteProgressUrl));
  if (el.syncProgressBtn) {
    el.syncProgressBtn.hidden = !hasRemote;
    el.syncProgressBtn.disabled = !hasRemote;
  }
}

async function loadProgressAsync() {
  try {
    const saved = await idbGet(PROGRESS_KEY);
    if (saved?.students) {
      state.progress = {
        version: 1,
        updatedAt: saved.updatedAt || Date.now(),
        students: saved.students || {}
      };
    }
  } catch {
    // ignore
  }
  state.activeStudentId = localStorage.getItem(ACTIVE_STUDENT_KEY) || '';
  state.progressViewStudentId = state.activeStudentId;
}

async function persistProgress() {
  state.progress.updatedAt = Date.now();
  await idbSet(PROGRESS_KEY, state.progress);
}

function mergeQuestionProgress(localRecord, remoteRecord) {
  if (!localRecord) return { ...remoteRecord };
  if (!remoteRecord) return { ...localRecord };
  const useRemote = (remoteRecord.lastAt || 0) >= (localRecord.lastAt || 0);
  return {
    attempts: Math.max(localRecord.attempts || 0, remoteRecord.attempts || 0),
    correct: Math.max(localRecord.correct || 0, remoteRecord.correct || 0),
    wrong: Math.max(localRecord.wrong || 0, remoteRecord.wrong || 0),
    lastResult: useRemote ? remoteRecord.lastResult : localRecord.lastResult,
    lastAt: Math.max(localRecord.lastAt || 0, remoteRecord.lastAt || 0),
    subject: remoteRecord.subject || localRecord.subject,
    topic: remoteRecord.topic || localRecord.topic,
    subtopic: remoteRecord.subtopic || localRecord.subtopic
  };
}

function mergeProgressData(local, remote) {
  const merged = {
    version: 1,
    updatedAt: Math.max(local?.updatedAt || 0, remote?.updatedAt || 0, Date.now()),
    students: { ...(local?.students || {}) }
  };

  Object.entries(remote?.students || {}).forEach(([studentId, remoteStudent]) => {
    const localStudent = merged.students[studentId];
    if (!localStudent) {
      merged.students[studentId] = remoteStudent;
      return;
    }
    const questions = { ...(localStudent.questions || {}) };
    Object.entries(remoteStudent.questions || {}).forEach(([questionId, remoteQ]) => {
      questions[questionId] = mergeQuestionProgress(questions[questionId], remoteQ);
    });
    const history = [...(localStudent.history || []), ...(remoteStudent.history || [])]
      .sort((a, b) => b.at - a.at)
      .slice(0, 600);
    merged.students[studentId] = {
      name: remoteStudent.name || localStudent.name,
      updatedAt: Math.max(localStudent.updatedAt || 0, remoteStudent.updatedAt || 0),
      questions,
      history
    };
  });

  return merged;
}

async function fetchRemoteProgress() {
  const url = clean(getAppConfig().remoteProgressUrl);
  if (!url) return null;
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`Could not download progress (${response.status}).`);
  const parsed = await response.json();
  if (!parsed?.students) throw new Error('Remote progress file is invalid.');
  return parsed;
}

async function syncProgressFromRemote({ silent = false } = {}) {
  const config = getAppConfig();
  if (!clean(config.remoteProgressUrl)) {
    if (!silent) alert('Set remoteProgressUrl in config.js first.');
    return false;
  }

  try {
    if (!silent && el.syncStatus) el.syncStatus.textContent = 'Syncing progress...';
    const remote = await fetchRemoteProgress();
    state.progress = mergeProgressData(state.progress, remote);
    await persistProgress();
    refreshLearningViews();
    const message = 'Progress synced from server.';
    if (el.syncStatus) {
      el.syncStatus.textContent = `${message} Last updated ${formatTimestamp(state.progress.updatedAt)}.`;
    }
    if (!silent) alert(message);
    return true;
  } catch (error) {
    const missing = String(error.message).includes('404');
    if (silent && missing) {
      if (el.syncStatus) {
        el.syncStatus.textContent = 'Shared progress not published yet. Practice locally, then admin can download progress.json.';
      }
      return false;
    }
    if (el.syncStatus) el.syncStatus.textContent = `Progress sync failed: ${error.message}`;
    if (!silent) alert(error.message);
    return false;
  }
}

function getQuestionProgress(studentId, questionId) {
  return state.progress.students[studentId]?.questions?.[questionId] || null;
}

function getQuestionStatus(studentId, questionId) {
  const record = getQuestionProgress(studentId, questionId);
  if (!record) return 'unsolved';
  if (record.correct > 0) return 'mastered';
  if (record.lastResult === 'wrong') return 'wrong';
  return 'attempted';
}

function isQuestionUnsolved(studentId, questionId) {
  return !getQuestionProgress(studentId, questionId);
}

async function recordAttempt(question, isCorrect, selectedOption = '') {
  if (!state.activeStudentId || !question?.id) return;
  const student = ensureProgressStudent(
    state.activeStudentId,
    getConfiguredStudents().find(name => studentIdFromName(name) === state.activeStudentId) || state.activeStudentId
  );
  const existing = student.questions[question.id] || {
    attempts: 0,
    correct: 0,
    wrong: 0,
    lastResult: '',
    lastAt: 0,
    subject: question.subject,
    topic: question.topic,
    subtopic: question.subtopic
  };

  existing.attempts += 1;
  if (isCorrect) existing.correct += 1;
  else existing.wrong += 1;
  existing.lastResult = isCorrect ? 'correct' : 'wrong';
  existing.lastAt = Date.now();
  existing.subject = question.subject || existing.subject;
  existing.topic = question.topic || existing.topic;
  existing.subtopic = question.subtopic || existing.subtopic;

  student.questions[question.id] = existing;
  if (!student.history) student.history = [];
  student.history.push({
    at: Date.now(),
    questionId: question.id,
    topic: question.topic,
    subtopic: question.subtopic,
    result: isCorrect ? 'correct' : 'wrong',
    selected: selectedOption,
    answer: question.answer
  });
  if (student.history.length > 600) student.history = student.history.slice(-600);
  student.updatedAt = Date.now();
  await persistProgress();
  refreshLearningViews();
}

function buildStudentStats(studentId) {
  const total = state.questions.length;
  let attempted = 0;
  let mastered = 0;
  let wrong = 0;
  let unsolved = 0;

  state.questions.forEach(question => {
    const status = getQuestionStatus(studentId, question.id);
    if (status === 'unsolved') unsolved += 1;
    else attempted += 1;
    if (status === 'mastered') mastered += 1;
    if (status === 'wrong') wrong += 1;
  });

  const accuracy = attempted ? Math.round((mastered / attempted) * 100) : 0;
  return { total, attempted, mastered, wrong, unsolved, accuracy };
}

function buildTopicStats(studentId) {
  const topics = new Map();
  state.questions.forEach(question => {
    const topic = clean(question.topic) || 'General';
    if (!topics.has(topic)) {
      topics.set(topic, { topic, total: 0, attempted: 0, mastered: 0, wrong: 0, unsolved: 0 });
    }
    const row = topics.get(topic);
    row.total += 1;
    const status = getQuestionStatus(studentId, question.id);
    if (status === 'unsolved') row.unsolved += 1;
    else row.attempted += 1;
    if (status === 'mastered') row.mastered += 1;
    if (status === 'wrong') row.wrong += 1;
  });
  return [...topics.values()].sort((a, b) => a.topic.localeCompare(b.topic));
}

function buildCurriculumTreeForStudent(studentId) {
  const id = studentId || state.activeStudentId;
  return NeetCurriculum.buildCurriculumTree(state.questions, qid => getQuestionStatus(id, qid));
}

function getRevisionPlanForStudent(studentId) {
  const id = studentId || state.activeStudentId;
  return NeetAnalytics.getRevisionPlan({
    questions: state.questions,
    getStatus: qid => getQuestionStatus(id, qid),
    getProgress: qid => getQuestionProgress(id, qid),
    normalizeSection: NeetCurriculum.normalizeSection
  });
}

function summarizeStudentForViews(studentId) {
  return NeetAnalytics.summarizeStudent(studentId, state.questions, {
    buildStudentStats,
    buildCurriculumTree: buildCurriculumTreeForStudent
  });
}

function getAuditLogForStudent(student, limit) {
  const map = new Map(state.questions.map(q => [q.id, q]));
  return NeetAnalytics.getAuditLog(student, map, limit);
}

function getCoachInsightsForStudent(studentId) {
  const id = studentId || state.activeStudentId;
  if (!id || !window.NeetCoach) return null;
  const student = state.progress.students[id];
  return NeetCoach.buildInsights({
    name: student?.name || id,
    summary: summarizeStudentForViews(id),
    plan: getRevisionPlanForStudent(id),
    tree: buildCurriculumTreeForStudent(id),
    history: student?.history || []
  });
}

function refreshLearningViews() {
  if (window.NeetViews) NeetViews.refreshActiveView();
}

function sectionKeyToLabel(key) {
  const match = NeetCurriculum.SECTION_TYPES.find(item => item.key === key);
  return match ? match.label : key;
}

function applyChapterPractice(chapterName, { sectionKey = '', unsolvedOnly = true } = {}) {
  const normalized = NeetCurriculum.normalizeChapter(chapterName);
  state.selectedFilters.topics = new Set([normalized, chapterName].filter(Boolean));
  state.selectedFilters.subtopics.clear();
  state.selectedFilters.tags.clear();
  if (sectionKey && sectionKey !== 'other') {
    const label = sectionKeyToLabel(sectionKey);
    state.selectedFilters.subtopics = new Set(
      state.questions
        .filter(q => NeetCurriculum.normalizeChapter(q.topic) === normalized)
        .filter(q => NeetCurriculum.normalizeSection(q.subtopic) === sectionKey)
        .map(q => q.subtopic)
        .filter(Boolean)
    );
    if (!state.selectedFilters.subtopics.size) state.selectedFilters.subtopics.add(label);
  }
  if (el.practiceUnsolvedOnly) el.practiceUnsolvedOnly.checked = unsolvedOnly;
  updateFilterUI();
  switchTab('practice');
  const pool = getPracticePool(state.selectedFilters);
  if (!pool.length) {
    showToast('No questions match your current filters.', { type: 'warning', title: 'No matches' });
    return;
  }
  el.practiceCount.value = Math.min(pool.length, sectionKey ? pool.length : 20);
  startPractice();
}

function startRevisionPractice() {
  const plan = getRevisionPlanForStudent(state.activeStudentId);
  // dailyQueue is already ordered by priority (mistakes → spaced → PYQ → new).
  // Keep that order so the most important questions are actually included.
  const queue = plan.dailyQueue.map(item => item.question).slice(0, 25);
  if (!queue.length) {
    showToast('Revision queue is empty. Explore new chapters instead.', { type: 'info' });
    return;
  }
  startPracticeWithQuestions(queue);
}

// Practice only one priority bucket from the revision plan.
function startFocusedRevision(kind) {
  const plan = getRevisionPlanForStudent(state.activeStudentId);
  const queues = {
    wrong: { items: plan.wrongQueue, empty: 'No past mistakes to fix — great work! Try a new chapter or PYQs.' },
    pyq: { items: plan.pyqQueue, empty: 'No untouched PYQs right now.' },
    stale: { items: plan.staleQueue, empty: 'Nothing is due for spaced revision yet.' }
  };
  const target = queues[kind];
  if (!target) return;
  const questions = target.items.map(item => item.question);
  if (!questions.length) {
    showToast(target.empty, { type: 'info' });
    return;
  }
  startPracticeWithQuestions(questions);
}

// ---- Global question search (command palette) ----
let searchDebounce = null;
const STATUS_LABELS = { unsolved: 'New', wrong: 'Weak', mastered: 'Strong', attempted: 'Tried' };

function openSearchPalette() {
  if (!el.searchDialog) return;
  if (!el.searchDialog.open) el.searchDialog.showModal();
  el.globalSearchInput.value = state.search.query || '';
  renderSearchResults();
  requestAnimationFrame(() => { el.globalSearchInput.focus(); el.globalSearchInput.select(); });
}

function closeSearchPalette() {
  if (el.searchDialog?.open) el.searchDialog.close();
}

function runGlobalSearch(query) {
  state.search.query = query;
  const trimmed = query.trim();
  state.search.activeIndex = 0;
  if (trimmed.length < 2) {
    state.search.results = [];
    state.search.total = 0;
    state.search.parsed = NeetSearch.parseQuery(trimmed);
  } else {
    const { parsed, results, total } = NeetSearch.searchQuestions(state.questions, trimmed, { limit: 40 });
    state.search.parsed = parsed;
    state.search.results = results;
    state.search.total = total;
  }
  renderSearchResults();
}

function renderSearchResults() {
  const { query, results, total, parsed, activeIndex } = state.search;
  const trimmed = (query || '').trim();

  if (trimmed.length < 2) {
    el.searchMeta.textContent = `Searching ${state.questions.length} questions · type at least 2 characters`;
    el.searchResults.innerHTML = `
      <div class="search-empty">
        <p class="search-empty-title">Find any MCQ instantly</p>
        <p class="muted">Try a keyword like <button type="button" class="search-suggest" data-q="krebs">krebs</button>,
          several words like <button type="button" class="search-suggest" data-q="dna replication">dna replication</button>,
          or an exact phrase like <button type="button" class="search-suggest" data-q='"electron transport chain"'>"electron transport chain"</button>.</p>
      </div>`;
    el.searchPracticeAllBtn.hidden = true;
    return;
  }

  if (!results.length) {
    el.searchMeta.textContent = `No matches for "${trimmed}"`;
    el.searchResults.innerHTML = '<div class="search-empty"><p class="search-empty-title">No questions found</p><p class="muted">Check spelling, use fewer words, or remove quotes.</p></div>';
    el.searchPracticeAllBtn.hidden = true;
    return;
  }

  const shown = results.length;
  el.searchMeta.innerHTML = `<strong>${total}</strong> match${total === 1 ? '' : 'es'}${total > shown ? ` · showing top ${shown}` : ''}`;
  el.searchPracticeAllBtn.hidden = false;
  el.searchPracticeAllBtn.textContent = `Practice these ${shown}`;

  el.searchResults.innerHTML = results.map((row, i) => {
    const q = row.question;
    const status = state.activeStudentId ? getQuestionStatus(state.activeStudentId, q.id) : '';
    const statusLabel = STATUS_LABELS[status] || '';
    return `
      <button type="button" class="search-result${i === activeIndex ? ' active' : ''}" role="option" data-index="${i}">
        <div class="search-result-main">
          <p class="search-result-q">${NeetSearch.highlight(q.question, parsed)}</p>
          <p class="search-result-snip muted">${NeetSearch.snippet(q, parsed)}</p>
          <div class="search-result-meta">
            ${q.topic ? `<span class="badge green">${NeetSearch.highlight(q.topic, parsed)}</span>` : ''}
            ${q.subtopic ? `<span class="badge">${escapeHtml(q.subtopic)}</span>` : ''}
            ${statusLabel ? `<span class="learn-badge ${status}">${statusLabel}</span>` : ''}
          </div>
        </div>
        <span class="search-result-go">Practice →</span>
      </button>`;
  }).join('');

  const active = el.searchResults.querySelector('.search-result.active');
  if (active) active.scrollIntoView({ block: 'nearest' });
}

function moveSearchActive(delta) {
  const n = state.search.results.length;
  if (!n) return;
  state.search.activeIndex = (state.search.activeIndex + delta + n) % n;
  renderSearchResults();
}

function openSearchResult(index) {
  const row = state.search.results[index];
  if (!row) return;
  closeSearchPalette();
  startPracticeWithQuestions([row.question]);
}

function practiceAllSearchResults() {
  const questions = state.search.results.map(r => r.question);
  if (!questions.length) return;
  closeSearchPalette();
  startPracticeWithQuestions(questions);
}

function startPracticeWithQuestions(questions) {
  if (!questions || !questions.length) return;
  state.practice = {
    active: true,
    questions: questions.slice(),
    index: 0,
    score: 0,
    answered: false,
    selectedOption: null,
    selectedOptions: [],
    log: [],
    streakInSession: 0,
    lastFeedback: null,
    questionStartAt: Date.now()
  };
  switchTab('practice');
  el.practiceArea.classList.remove('hidden');
  el.practiceResults.classList.add('hidden');
  el.practiceResults.innerHTML = '';
  el.nextQuestionBtn.classList.add('hidden');
  el.finishPracticeBtn.classList.remove('hidden');
  renderPracticeQuestion();
}

function bindSearchPalette() {
  if (!el.searchDialog) return;

  if (el.globalSearchBtn) el.globalSearchBtn.addEventListener('click', openSearchPalette);
  if (el.searchCloseBtn) el.searchCloseBtn.addEventListener('click', closeSearchPalette);
  if (el.searchPracticeAllBtn) el.searchPracticeAllBtn.addEventListener('click', practiceAllSearchResults);

  el.globalSearchInput.addEventListener('input', event => {
    const value = event.target.value;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => runGlobalSearch(value), 120);
  });

  el.globalSearchInput.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); moveSearchActive(1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); moveSearchActive(-1); }
    else if (event.key === 'Enter') { event.preventDefault(); openSearchResult(state.search.activeIndex); }
  });

  el.searchResults.addEventListener('click', event => {
    const suggest = event.target.closest('.search-suggest');
    if (suggest) {
      el.globalSearchInput.value = suggest.dataset.q;
      runGlobalSearch(suggest.dataset.q);
      el.globalSearchInput.focus();
      return;
    }
    const result = event.target.closest('.search-result');
    if (result) openSearchResult(Number(result.dataset.index));
  });

  el.searchResults.addEventListener('mousemove', event => {
    const result = event.target.closest('.search-result');
    if (!result) return;
    const idx = Number(result.dataset.index);
    if (idx !== state.search.activeIndex) { state.search.activeIndex = idx; renderSearchResults(); }
  });

  document.addEventListener('keydown', event => {
    const tag = document.activeElement?.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      el.searchDialog.open ? closeSearchPalette() : openSearchPalette();
      return;
    }

    // Practice keyboard shortcuts (1-4 for options, Space/Enter for next)
    if (!inInput && state.practice.active) {
      const optionKeys = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
      const letter = event.key.toLowerCase();
      if (!state.practice.answered && letter in optionKeys) {
        const btns = el.practiceCard?.querySelectorAll('.option-btn:not(:disabled)');
        if (btns?.length) {
          const btn = btns[optionKeys[letter]];
          if (btn) { event.preventDefault(); btn.click(); }
        }
      }
      if (state.practice.answered && (event.key === ' ' || event.key === 'Enter') && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        el.practiceNext?.click();
      }
      if (!state.practice.answered && (event.key === ' ' || event.key === 'Enter') && !event.metaKey && !event.ctrlKey) {
        const submitBtn = el.practiceCard?.querySelector('[data-action="submit-multi"]:not(:disabled)');
        if (submitBtn) { event.preventDefault(); submitBtn.click(); }
      }
    }

    // Toggle dark mode with Shift+D
    if (!inInput && event.shiftKey && event.key === 'D') {
      toggleTheme();
    }
  });
}

function handleViewAction(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  if (action === 'goto-chapters') switchTab('chapters');
  else if (action === 'start-revision') startRevisionPractice();
  else if (action === 'practice-mistakes') startFocusedRevision('wrong');
  else if (action === 'practice-pyq') startFocusedRevision('pyq');
  else if (action === 'practice-spaced') startFocusedRevision('stale');
  else if (action === 'practice-chapter') applyChapterPractice(target.dataset.chapter);
  else if (action === 'open-chapter') {
    state.selectedChapter = target.dataset.chapter || '';
    switchTab('chapters');
    refreshLearningViews();
    if (state.selectedChapter) NeetViews.renderChapterDetail(state.selectedChapter);
  }
  else if (action === 'close-chapter') {
    state.selectedChapter = '';
    const chapsLayout = document.getElementById('chapsLayout');
    if (chapsLayout) chapsLayout.classList.remove('detail-open');
    if (el.chapterDetail) {
      el.chapterDetail.innerHTML = `<div class="chaps-detail-empty">
        <span class="hint-icon">📖</span>
        <p>Select a chapter</p>
        <small>Tap any chapter to see its questions and practice options</small>
      </div>`;
    }
    renderChaptersOnly();
  }
  else if (action === 'practice-section') {
    applyChapterPractice(target.dataset.chapter, { sectionKey: target.dataset.section });
  }
  else if (action === 'sync-progress') syncProgressFromRemote({ silent: false });
}

function renderChaptersOnly() {
  if (window.NeetViews) NeetViews.renderChapters();
}

function publishProgressForDevices() {
  if (!requireAdmin('publish progress')) return;
  const payload = {
    app: getAppConfig().appName || 'NEET MCQ Practice',
    version: 1,
    updatedAt: Date.now(),
    students: state.progress.students
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
  if (el.syncStatus) {
    el.syncStatus.textContent = 'Downloaded progress.json — upload to GitHub for multi-device sync.';
  }
}

async function loadFlagsAsync() {
  try {
    const saved = await idbGet(FLAGS_KEY);
    if (saved?.items) {
      state.flags = {
        version: 1,
        updatedAt: saved.updatedAt || Date.now(),
        items: saved.items || []
      };
    }
  } catch {
    // ignore
  }
}

async function persistFlags() {
  state.flags.updatedAt = Date.now();
  await idbSet(FLAGS_KEY, state.flags);
  updateFlagBadge();
}

function getStudentName(studentId) {
  return getConfiguredStudents().find(name => studentIdFromName(name) === studentId) || studentId;
}

function hasPendingFlagForQuestion(questionId, studentId) {
  return (state.flags.items || []).some(
    item => item.questionId === questionId && item.studentId === studentId && item.status === 'pending'
  );
}

function openFlagDialog(question) {
  if (!question?.id || !state.activeStudentId) {
    showToast('Select a student profile first.', { type: 'warning' });
    return;
  }
  if (!el.flagDialog) return;
  state.flagTargetQuestionId = question.id;
  if (el.flagSuggestedAnswer) el.flagSuggestedAnswer.value = '';
  if (el.flagComment) el.flagComment.value = '';
  if (el.flagFormError) el.flagFormError.hidden = true;
  if (el.flagFormSuccess) el.flagFormSuccess.hidden = true;
  el.flagDialog.showModal();
  el.flagComment?.focus();
}

async function submitAnswerFlag(event) {
  event?.preventDefault();
  const questionId = state.flagTargetQuestionId;
  const question = state.questions.find(q => q.id === questionId)
    || state.practice.questions.find(q => q.id === questionId);
  if (!question) {
    if (el.flagFormError) {
      el.flagFormError.textContent = 'Question not found.';
      el.flagFormError.hidden = false;
    }
    return;
  }

  const suggested = clean(el.flagSuggestedAnswer?.value).toUpperCase();
  const comment = clean(el.flagComment?.value);
  if (!['A', 'B', 'C', 'D'].includes(suggested)) {
    if (el.flagFormError) {
      el.flagFormError.textContent = 'Pick the answer you think is correct (A–D).';
      el.flagFormError.hidden = false;
    }
    return;
  }
  if (comment.length < 8) {
    if (el.flagFormError) {
      el.flagFormError.textContent = 'Please add a short comment (at least 8 characters).';
      el.flagFormError.hidden = false;
    }
    return;
  }

  if (hasPendingFlagForQuestion(question.id, state.activeStudentId)) {
    if (el.flagFormError) {
      el.flagFormError.textContent = 'You already submitted a report for this question.';
      el.flagFormError.hidden = false;
    }
    return;
  }

  const flag = NeetFlags.createFlag({
    question,
    studentId: state.activeStudentId,
    studentName: getStudentName(state.activeStudentId),
    suggestedAnswer: suggested,
    comment
  });
  state.flags.items.unshift(flag);
  await persistFlags();
  if (el.flagFormSuccess) {
    el.flagFormSuccess.textContent = 'Report saved. Admin will review it.';
    el.flagFormSuccess.hidden = false;
  }
  if (el.flagFormError) el.flagFormError.hidden = true;
  setTimeout(() => el.flagDialog?.close(), 700);
  renderPracticeQuestion();
}

function updateFlagBadge() {
  if (!el.flagPendingBadge) return;
  const count = NeetFlags.pendingCount(state.flags);
  el.flagPendingBadge.textContent = String(count);
  el.flagPendingBadge.hidden = !count || !isAdmin();
}

async function fetchRemoteFlags() {
  const url = clean(getAppConfig().remoteFlagsUrl);
  if (!url) return null;
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not download flags (${response.status}).`);
  const parsed = await response.json();
  if (!parsed?.items) throw new Error('Remote flags file is invalid.');
  return parsed;
}

async function syncFlagsFromRemote({ silent = false } = {}) {
  if (!clean(getAppConfig().remoteFlagsUrl)) {
    if (!silent) alert('Set remoteFlagsUrl in config.js first.');
    return false;
  }
  try {
    const remote = await fetchRemoteFlags();
    state.flags = NeetFlags.mergeFlagsData(state.flags, remote);
    await persistFlags();
    if (state.activeTab === 'flags') renderFlagReview();
    if (!silent && el.flagsStatus) el.flagsStatus.textContent = 'Flags synced from server.';
    return true;
  } catch (error) {
    if (!silent && el.flagsStatus) el.flagsStatus.textContent = `Flag sync failed: ${error.message}`;
    if (!silent) alert(error.message);
    return false;
  }
}

function publishFlagsForDevices() {
  if (!requireAdmin('publish flags')) return;
  const payload = {
    app: getAppConfig().appName || 'NEET Physics MCQ Mastery',
    version: 1,
    updatedAt: Date.now(),
    items: state.flags.items
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'flags.json';
  link.click();
  URL.revokeObjectURL(link.href);
  if (el.flagsStatus) el.flagsStatus.textContent = 'Downloaded flags.json — upload to GitHub so all devices see reports.';
}

function resolveFlag(flagId, status, adminNote = '') {
  const flag = state.flags.items.find(item => item.id === flagId);
  if (!flag) return null;
  flag.status = status;
  flag.resolvedAt = Date.now();
  flag.adminNote = clean(adminNote);
  return flag;
}

async function approveAnswerFlag(flagId) {
  if (!requireAdmin('approve answer reports')) return;
  const flag = state.flags.items.find(item => item.id === flagId);
  if (!flag || flag.status !== 'pending') return;
  const question = state.questions.find(q => q.id === flag.questionId);
  if (!question) {
    showToast('Question no longer found in bank.', { type: 'error' }); return;
    return;
  }
  const note = flag.comment ? `\n[Student report ${flag.studentName}]: ${flag.comment}` : '';
  const success = upsertQuestion({
    id: question.id,
    question: question.question,
    option_a: question.options[0],
    option_b: question.options[1],
    option_c: question.options[2],
    option_d: question.options[3],
    answer: flag.suggestedAnswer,
    explanation: `${question.explanation || ''}${note}`.trim(),
    subject: question.subject,
    topic: question.topic,
    subtopic: question.subtopic,
    tags: question.tags,
    whyWrong: question.whyWrong,
    questionImage: question.questionImage,
    explanationImage: question.explanationImage,
    createdAt: question.createdAt
  });
  if (!success) return;
  resolveFlag(flagId, 'approved', 'Answer updated to student suggestion.');
  await persistFlags();
  renderFlagReview();
  showToast('Answer updated and flag approved.', { type: 'success', title: 'Done' });
}

async function rejectAnswerFlag(flagId, adminNote) {
  if (!requireAdmin('reject answer reports')) return;
  resolveFlag(flagId, 'rejected', adminNote || 'Rejected by admin.');
  await persistFlags();
  renderFlagReview();
}

async function saveFlagAdminEdit(form) {
  if (!requireAdmin('edit questions from reports')) return;
  const flagId = form.dataset.flagId;
  const flag = state.flags.items.find(item => item.id === flagId);
  if (!flag) return;
  const existing = state.questions.find(q => q.id === flag.questionId);
  const formData = new FormData(form);
  const success = upsertQuestion({
    id: flag.questionId,
    question: formData.get('question'),
    option_a: formData.get('option_a'),
    option_b: formData.get('option_b'),
    option_c: formData.get('option_c'),
    option_d: formData.get('option_d'),
    answer: formData.get('answer'),
    explanation: formData.get('explanation'),
    subject: formData.get('subject') || 'Physics',
    topic: formData.get('topic'),
    subtopic: formData.get('subtopic'),
    tags: formData.get('tags'),
    createdAt: existing?.createdAt
  });
  if (!success) return;
  resolveFlag(flagId, 'approved', clean(formData.get('admin_note')) || 'Modified by admin.');
  await persistFlags();
  renderFlagReview();
  showToast('Question updated and flag resolved.', { type: 'success', title: 'Resolved' });
}

function renderFlagReview() {
  if (!el.flagsReviewList || !isAdmin()) return;
  const items = state.flags.items || [];
  const pending = items.filter(item => item.status === 'pending');
  if (el.flagsStatus) {
    el.flagsStatus.textContent = `${pending.length} pending · ${items.length} total reports`;
  }

  if (!items.length) {
    el.flagsReviewList.innerHTML = '<div class="empty-card"><h3>No reports yet</h3><p>Students can flag answers during practice.</p></div>';
    updateFlagBadge();
    return;
  }

  el.flagsReviewList.innerHTML = items.map(flag => {
    const question = state.questions.find(q => q.id === flag.questionId);
    const snap = flag.snapshot || {};
    const qText = question?.question || snap.question || '(question removed)';
    const currentAnswer = question?.answer || snap.answer || '?';
    const options = question?.options || [
      snap.option_a, snap.option_b, snap.option_c, snap.option_d
    ];

    const adminForm = flag.status === 'pending' ? `
      <form class="flag-admin-form" data-flag-id="${escapeHtml(flag.id)}">
        <p class="muted">Modify anything before saving:</p>
        <label class="full-width">Question<textarea name="question" rows="2" required>${escapeHtml(question?.question || snap.question || '')}</textarea></label>
        <div class="options-grid">
          <label>A <input name="option_a" value="${escapeHtml(options[0] || '')}" required /></label>
          <label>B <input name="option_b" value="${escapeHtml(options[1] || '')}" required /></label>
          <label>C <input name="option_c" value="${escapeHtml(options[2] || '')}" required /></label>
          <label>D <input name="option_d" value="${escapeHtml(options[3] || '')}" required /></label>
        </div>
        <label>Correct answer
          <select name="answer" required>
            ${['A', 'B', 'C', 'D'].map(letter => `<option value="${letter}" ${(question?.answer || flag.suggestedAnswer) === letter ? 'selected' : ''}>${letter}</option>`).join('')}
          </select>
        </label>
        <label class="full-width">Explanation<textarea name="explanation" rows="2">${escapeHtml(question?.explanation || snap.explanation || '')}</textarea></label>
        <div class="meta-grid">
          <label>Chapter <input name="topic" value="${escapeHtml(question?.topic || snap.topic || '')}" /></label>
          <label>Section <input name="subtopic" value="${escapeHtml(question?.subtopic || snap.subtopic || '')}" /></label>
          <label>Tags <input name="tags" value="${escapeHtml((question?.tags || []).join('; '))}" /></label>
          <label>Admin note <input name="admin_note" placeholder="Optional note" /></label>
        </div>
        <div class="button-row">
          <button type="button" class="primary-btn small approve-flag-btn" data-flag-id="${escapeHtml(flag.id)}">Quick approve (${escapeHtml(flag.suggestedAnswer)})</button>
          <button type="submit" class="secondary-btn small">Save full edit</button>
          <button type="button" class="danger-btn small reject-flag-btn" data-flag-id="${escapeHtml(flag.id)}">Reject</button>
        </div>
      </form>
    ` : `<p class="muted">Resolved · ${flag.adminNote ? escapeHtml(flag.adminNote) : ''}</p>`;

    return `
      <article class="flag-review-card ${flag.status}">
        <div class="flag-review-head">
          <div>
            <strong>${escapeHtml(flag.studentName)}</strong>
            <div class="flag-review-meta">${formatTimestamp(flag.createdAt)} · ${escapeHtml(snap.topic || question?.topic || '')} · <span class="learn-badge ${flag.status === 'pending' ? 'wrong' : flag.status}">${flag.status}</span></div>
          </div>
        </div>
        <p class="question">${renderMath(qText)}</p>
        <div class="flag-answer-compare">
          <div class="flag-answer-box"><strong>Current key</strong>${escapeHtml(currentAnswer)} — ${renderMath(options[answerLetterToIndex(currentAnswer)] || '')}</div>
          <div class="flag-answer-box suggested"><strong>Student says</strong>${escapeHtml(flag.suggestedAnswer)} — ${renderMath(options[answerLetterToIndex(flag.suggestedAnswer)] || '')}</div>
        </div>
        <div class="flag-comment"><strong>Comment:</strong> ${escapeHtml(flag.comment)}</div>
        ${adminForm}
      </article>
    `;
  }).join('');

  updateFlagBadge();
}

function openIdb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local database.'));
  });
}

async function idbGet(key) {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(key, value) {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function parseBankPayload(parsed) {
  const bank = parseStoredBank(parsed);
  return bank.questions.map(normaliseQuestion).filter(Boolean);
}

async function loadQuestionsAsync() {
  try {
    const saved = await idbGet(STORAGE_KEY);
    if (saved) return parseBankPayload(saved);
  } catch {
    // fall through to legacy storage
  }

  try {
    const legacy = localStorage.getItem(STORAGE_KEY);
    if (!legacy) return [];
    const parsed = JSON.parse(legacy);
    const questions = parseBankPayload(parsed);
    if (questions.length) {
      await idbSet(STORAGE_KEY, parsed);
    }
    return questions;
  } catch {
    return [];
  }
}

async function fetchRemoteBank() {
  const config = getAppConfig();
  const url = clean(config.remoteBankUrl);
  if (!url) return null;

  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`Could not download question bank (${response.status}).`);

  const parsed = await response.json();
  const bank = parseStoredBank(parsed);
  return {
    updatedAt: bank.updatedAt || Date.now(),
    questions: bank.questions.map(normaliseQuestion).filter(Boolean)
  };
}

async function syncFromRemote({ force = false, silent = false } = {}) {
  const config = getAppConfig();
  if (!clean(config.remoteBankUrl)) {
    if (!silent) alert('Set remoteBankUrl in config.js first.');
    return false;
  }

  try {
    if (!silent && el.syncStatus) el.syncStatus.textContent = 'Syncing questions...';
    const remote = await fetchRemoteBank();
    if (!remote?.questions?.length) throw new Error('Remote bank is empty or invalid.');

    state.questions = remote.questions;
    await persistQuestions();
    refreshUI();

    const message = `Synced ${remote.questions.length} questions from server.`;
    if (el.syncStatus) el.syncStatus.textContent = `${message} Last updated ${formatTimestamp(remote.updatedAt)}.`;
    if (!silent) alert(message);
    return true;
  } catch (error) {
    if (el.syncStatus) el.syncStatus.textContent = `Sync failed: ${error.message}`;
    if (!silent) alert(error.message);
    return false;
  }
}

async function maybeSyncFromRemote() {
  const config = getAppConfig();
  if (!config.autoSyncOnLoad || !clean(config.remoteBankUrl)) return;

  if (isAdmin() && state.questions.length) {
    if (el.syncStatus) {
      el.syncStatus.textContent = 'Admin device: local bank loaded. Publish bank.json after imports to update other devices.';
    }
    return;
  }

  const localUpdated = getBankUpdatedAt();
  if (state.questions.length && localUpdated) {
    try {
      const remote = await fetchRemoteBank();
      if (remote && remote.updatedAt <= localUpdated) {
        if (el.syncStatus) {
          el.syncStatus.textContent = `Using local bank (${state.questions.length} questions).`;
        }
        return;
      }
    } catch {
      if (el.syncStatus) el.syncStatus.textContent = 'Could not check remote bank. Using local copy.';
      return;
    }
  }

  await syncFromRemote({ silent: true });
}

function publishBankForDevices() {
  if (!requireAdmin('publish the shared bank')) return;
  const payload = buildExportEnvelope();
  download('bank.json', JSON.stringify(payload, null, 2), 'application/json');
  if (el.exportStatus) {
    el.exportStatus.textContent = 'Downloaded bank.json. Upload this file to your hosting URL so other devices can sync.';
  }
}

function buildExportEnvelope() {
  return {
    app: getAppConfig().appName || 'NEET MCQ Practice',
    version: 1,
    updatedAt: Date.now(),
    questionCount: state.questions.length,
    questions: state.questions.map(toExportQuestion).filter(Boolean)
  };
}

// ── GitHub Contents API sync ──────────────────────────────────────────────────

function getGitHubToken() {
  return localStorage.getItem('neet-github-token') || '';
}

function parseGitHubCoords() {
  const url = (getAppConfig().remoteBankUrl || '').trim();
  // https://raw.githubusercontent.com/OWNER/REPO/BRANCH/PATH
  const m = url.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2], branch: m[3], path: m[4] };
}

function setBankSyncStatus(msg, isError = false) {
  if (!el.bankSyncStatus) return;
  el.bankSyncStatus.textContent = msg;
  el.bankSyncStatus.style.color = isError ? 'var(--danger)' : '';
}

async function pushBankToGitHub(silent = false) {
  const token = getGitHubToken();
  if (!token) {
    if (!silent) showToast('No GitHub token. Go to Import → GitHub Auto-sync to save one.', { type: 'warning', title: 'Token missing' });
    setBankSyncStatus('No GitHub token — edits saved locally only.', true);
    return false;
  }
  const coords = parseGitHubCoords();
  if (!coords) {
    if (!silent) showToast('Cannot parse repo from remoteBankUrl in config.js.', { type: 'error' });
    return false;
  }

  setBankSyncStatus('Pushing to GitHub…');
  const apiUrl = `https://api.github.com/repos/${coords.owner}/${coords.repo}/contents/${coords.path}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  // Fetch current file SHA (needed for updates)
  let sha;
  try {
    const r = await fetch(`${apiUrl}?ref=${coords.branch}`, { headers });
    if (r.ok) {
      sha = (await r.json()).sha;
    } else if (r.status !== 404) {
      const err = await r.json().catch(() => ({}));
      throw new Error(`GitHub ${r.status}: ${err.message || r.statusText}`);
    }
  } catch (err) {
    setBankSyncStatus(`GitHub sync failed: ${err.message}`, true);
    return false;
  }

  // Encode and push
  const payload = buildExportEnvelope();
  const jsonStr = JSON.stringify(payload, null, 2);
  // btoa on UTF-8 requires encoding first
  const b64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g,
    (_, p1) => String.fromCharCode('0x' + p1)));

  const body = { message: `Update bank.json (${payload.questionCount} questions)`, content: b64, branch: coords.branch };
  if (sha) body.sha = sha;

  try {
    const r = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(`GitHub ${r.status}: ${err.message || r.statusText}`);
    }
    const ts = new Date().toLocaleTimeString();
    setBankSyncStatus(`Synced to GitHub ✓  ${ts}`);
    showToast(`Bank synced to GitHub at ${ts}`, { type: 'success', title: 'Synced ✓' });
    if (el.githubTokenStatus) el.githubTokenStatus.textContent = `Last push: ${ts}`;
    return true;
  } catch (err) {
    setBankSyncStatus(`GitHub sync failed: ${err.message}`, true);
    showToast(`Sync failed: ${err.message}`, { type: 'error', title: 'GitHub error' });
    return false;
  }
}

const sampleQuestions = [
  {
    question: 'The SI unit of electric field intensity is:',
    options: ['N/C', 'C/N', 'V·m', 'J/C'],
    answer: 'A',
    explanation: 'Electric field intensity E = F/q, so its SI unit is newton per coulomb (N/C), equivalent to V/m.',
    subject: 'Physics',
    topic: 'Electric Charges and Fields',
    subtopic: 'Electric Field',
    tags: ['NEET 2019']
  },
  {
    question: 'A body falls freely from rest. The ratio of distance covered in 1st, 2nd and 3rd second of its motion is:',
    options: ['1:4:9', '1:2:3', '1:3:5', '1:5:9'],
    answer: 'C',
    explanation: 'Using s = ½g(2n-1), distances in successive seconds are in ratio 1:3:5 (odd numbers).',
    subject: 'Physics',
    topic: 'Motion in a Straight Line',
    subtopic: 'Kinematic Equations',
    tags: ['AIPMT 2000']
  },
  {
    question: 'Which of the following is a dimensional constant?',
    options: ['Refractive index', 'Poisson\'s ratio', 'Relative density', 'Gravitational constant'],
    answer: 'D',
    explanation: 'Gravitational constant G has dimensions [M⁻¹L³T⁻²] and a constant numerical value — a dimensional constant.',
    subject: 'Physics',
    topic: 'Units and Measurement',
    subtopic: 'Dimensions of Physical Quantities',
    tags: ['AIPMT 1995']
  }
];

function clean(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function escapeHtml(value) {
  return clean(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render text that may contain LaTeX math ($ inline $ and $$ display $$).
 * Falls back to escapeHtml when KaTeX is unavailable.
 */
function renderMath(text) {
  if (!text) return '';
  if (typeof katex === 'undefined') return escapeHtml(text);

  // Split text into [text, display-math, inline-math] segments.
  const segments = [];
  const displayRe = /\$\$([\s\S]+?)\$\$/g;
  const inlineRe  = /\$([^$\n]+?)\$/g;
  let last = 0;

  // Pass 1: extract display math $$...$$
  displayRe.lastIndex = 0;
  let m;
  while ((m = displayRe.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: 'text', val: text.slice(last, m.index) });
    segments.push({ type: 'display', val: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ type: 'text', val: text.slice(last) });

  // Pass 2: within text segments, extract inline math $...$
  const final = [];
  for (const seg of segments) {
    if (seg.type !== 'text') { final.push(seg); continue; }
    inlineRe.lastIndex = 0;
    let start = 0;
    while ((m = inlineRe.exec(seg.val)) !== null) {
      if (m.index > start) final.push({ type: 'text', val: seg.val.slice(start, m.index) });
      final.push({ type: 'inline', val: m[1].trim() });
      start = m.index + m[0].length;
    }
    if (start < seg.val.length) final.push({ type: 'text', val: seg.val.slice(start) });
  }

  // Render each segment
  return final.map(seg => {
    if (seg.type === 'text') return escapeHtml(seg.val);
    try {
      return katex.renderToString(seg.val, {
        displayMode: seg.type === 'display',
        throwOnError: false,
        strict: false,
        trust: false
      });
    } catch (_) {
      return escapeHtml(seg.val);
    }
  }).join('');
}

function makeId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function parseTags(raw) {
  if (Array.isArray(raw)) return unique(raw.map(clean).filter(Boolean));
  return unique(clean(raw).split(/[,;|]/).map(clean).filter(Boolean));
}

function unique(values) {
  const seen = new Set();
  return values.filter(value => {
    const key = clean(value).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function answerLetterToIndex(letter) {
  return { A: 0, B: 1, C: 2, D: 3 }[clean(letter).toUpperCase()] ?? -1;
}

function answerTextToLetter(answer, options) {
  const letter = clean(answer).toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(letter)) return letter;
  const index = options.findIndex(opt => opt.toLowerCase() === clean(answer).toLowerCase());
  return index >= 0 ? ['A', 'B', 'C', 'D'][index] : '';
}

// Some questions (e.g. "Objective II" style) allow more than one correct option.
// Their `answer` field is stored as a comma-joined letter list, e.g. "A,C,D".
function parseAnswerLetters(answer, options) {
  const raw = clean(answer).toUpperCase();
  const candidates = raw.split(/[,\s/]+/).filter(Boolean);
  const valid = candidates.filter(letter => ['A', 'B', 'C', 'D'].includes(letter));
  if (valid.length) return [...new Set(valid)].sort();
  const single = answerTextToLetter(answer, options);
  return single ? [single] : [];
}

function getCorrectLetters(question) {
  return clean(question?.answer)
    .toUpperCase()
    .split(',')
    .map(letter => letter.trim())
    .filter(letter => ['A', 'B', 'C', 'D'].includes(letter));
}

function isMultiCorrect(question) {
  return getCorrectLetters(question).length > 1;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 960;

function parseImageField(raw, ...keys) {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'string' && value.startsWith('data:image')) return value;
  }
  return '';
}

// Normalises an array of figure sources (data URLs or images/ paths),
// dropping anything that is not a renderable image. Used by bulk imports.
function parseImageList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(value => clean(value)).filter(isRenderableImageSrc);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
  });
}

function compressDataUrl(dataUrl, maxWidth, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxWidth / image.width);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    image.onerror = () => reject(new Error('Invalid image file.'));
    image.src = dataUrl;
  });
}

async function processImageFile(file) {
  if (!file) return '';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Use JPG, PNG, WebP or GIF images only.');
  }
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    throw new Error('Image must be smaller than 5 MB.');
  }

  const dataUrl = await readFileAsDataUrl(file);
  if (file.type === 'image/gif') return dataUrl;
  return compressDataUrl(dataUrl, MAX_IMAGE_WIDTH);
}

// An image source the app will render: either an inline data URL (legacy,
// uploaded via the Add MCQ form) or a repo-relative path under images/
// (used by bulk-imported question sets like reNEET 2026).
function isRenderableImageSrc(src) {
  return typeof src === 'string' && (src.startsWith('data:image') || src.startsWith('images/'));
}

// Accepts a single source or an array of sources and renders each as a figure.
function renderImageHtml(src, label = 'MCQ image') {
  const sources = (Array.isArray(src) ? src : [src]).filter(isRenderableImageSrc);
  if (!sources.length) return '';
  const imgs = sources
    .map(s => `<img src="${escapeHtml(s)}" alt="${escapeHtml(label)}" loading="lazy" />`)
    .join('');
  return `<figure class="mcq-image">${imgs}</figure>`;
}

function renderImageUploadFields(questionImage = '', explanationImage = '') {
  const blocks = [
    { name: 'question_image', label: 'Question image (optional)', value: questionImage },
    { name: 'explanation_image', label: 'Explanation image (optional)', value: explanationImage }
  ];

  return blocks.map(block => `
    <div class="image-upload-block" data-image-field="${block.name}">
      <label class="image-upload-label">${block.label}
        <input type="file" accept="image/*" class="image-file-input" data-target="${block.name}" />
      </label>
      <input type="hidden" name="${block.name}" value="" />
      <div class="image-preview-wrap ${block.value ? '' : 'hidden'}">
        <img class="image-preview" src="${block.value}" alt="${escapeHtml(block.label)}" />
        <button type="button" class="secondary-btn small remove-image-btn" data-target="${block.name}">Remove image</button>
      </div>
    </div>
  `).join('');
}

function setImagePreview(hiddenInput, previewWrap, previewImg, dataUrl = '') {
  hiddenInput.value = dataUrl;
  if (dataUrl) {
    previewImg.src = dataUrl;
    previewWrap.classList.remove('hidden');
  } else {
    previewImg.removeAttribute('src');
    previewWrap.classList.add('hidden');
  }
}

async function bindImageControl(fileInput, hiddenInput, previewWrap, previewImg, removeBtn) {
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      setImagePreview(hiddenInput, previewWrap, previewImg, dataUrl);
    } catch (error) {
      alert(error.message);
      fileInput.value = '';
    }
  });

  removeBtn.addEventListener('click', () => {
    fileInput.value = '';
    setImagePreview(hiddenInput, previewWrap, previewImg, '');
  });
}

function hydrateInlineImageFields(form) {
  form.querySelectorAll('.image-upload-block').forEach(block => {
    const hidden = block.querySelector('input[type="hidden"]');
    const previewWrap = block.querySelector('.image-preview-wrap');
    const previewImg = block.querySelector('.image-preview');
    if (!hidden?.value || !previewWrap || !previewImg) return;
    previewImg.src = hidden.value;
    previewWrap.classList.remove('hidden');
  });
}

async function handleInlineImageChange(input) {
  const block = input.closest('.image-upload-block');
  if (!block) return;
  const field = input.dataset.target || block.dataset.imageField;
  const hidden = block.querySelector(`input[name="${field}"]`);
  const previewWrap = block.querySelector('.image-preview-wrap');
  const previewImg = block.querySelector('.image-preview');
  const file = input.files[0];

  if (!file) return;
  try {
    const dataUrl = await processImageFile(file);
    hidden.value = dataUrl;
    previewImg.src = dataUrl;
    previewWrap.classList.remove('hidden');
  } catch (error) {
    alert(error.message);
    input.value = '';
  }
}

function handleInlineImageRemove(button) {
  const block = button.closest('.image-upload-block');
  if (!block) return;
  const field = button.dataset.target || block.dataset.imageField;
  const hidden = block.querySelector(`input[name="${field}"]`);
  const fileInput = block.querySelector('.image-file-input');
  const previewWrap = block.querySelector('.image-preview-wrap');
  const previewImg = block.querySelector('.image-preview');

  hidden.value = '';
  if (fileInput) fileInput.value = '';
  previewImg.removeAttribute('src');
  previewWrap.classList.add('hidden');
}

function parseWhyWrong(raw) {
  if (raw.whyWrong && typeof raw.whyWrong === 'object' && !Array.isArray(raw.whyWrong)) {
    return Object.fromEntries(OPTION_LETTERS.map(letter => [letter, clean(raw.whyWrong[letter])]));
  }
  return Object.fromEntries(OPTION_LETTERS.map(letter => [
    letter,
    clean(raw[`why_wrong_${letter.toLowerCase()}`] ?? raw[`whyWrong${letter}`])
  ]));
}

function readWhyWrongFromForm(formLike) {
  if (formLike instanceof FormData) {
    return Object.fromEntries(OPTION_LETTERS.map(letter => [
      letter,
      clean(formLike.get(`why_wrong_${letter.toLowerCase()}`))
    ]));
  }
  return {
    A: clean(el.fWhyWrongA?.value),
    B: clean(el.fWhyWrongB?.value),
    C: clean(el.fWhyWrongC?.value),
    D: clean(el.fWhyWrongD?.value)
  };
}

function setWhyWrongFields(whyWrong = {}) {
  el.fWhyWrongA.value = whyWrong.A || '';
  el.fWhyWrongB.value = whyWrong.B || '';
  el.fWhyWrongC.value = whyWrong.C || '';
  el.fWhyWrongD.value = whyWrong.D || '';
}

function getWhyWrongEntries(question) {
  const whyWrong = question.whyWrong || {};
  const correctLetters = getCorrectLetters(question);
  return OPTION_LETTERS
    .filter(letter => !correctLetters.includes(letter) && clean(whyWrong[letter]))
    .map(letter => ({
      letter,
      option: question.options[answerLetterToIndex(letter)],
      text: clean(whyWrong[letter])
    }));
}

function renderWhyWrongHtml(question, displayLetterByCanonical = null) {
  const entries = getWhyWrongEntries(question);
  if (!entries.length) return '';
  const letterOf = entry => (displayLetterByCanonical && displayLetterByCanonical[entry.letter]) || entry.letter;
  return `
    <div class="why-wrong-block">
      <strong>Why the other options are incorrect:</strong>
      <ul class="why-wrong-list">
        ${entries.map(entry => `
          <li><strong>${letterOf(entry)}. ${renderMath(entry.option)}:</strong> ${renderMath(entry.text)}</li>
        `).join('')}
      </ul>
    </div>
  `;
}

function renderWhyWrongFieldsHtml(whyWrong = {}, compact = false) {
  const rows = OPTION_LETTERS.map(letter => `
    <label class="${compact ? '' : 'full-width'}">Option ${letter}
      <textarea name="why_wrong_${letter.toLowerCase()}" rows="2" placeholder="Why ${letter} is incorrect">${escapeHtml(whyWrong[letter] || '')}</textarea>
    </label>
  `).join('');

  return `
    <fieldset class="why-wrong-section ${compact ? 'compact' : ''}">
      <legend>Why the other options are incorrect</legend>
      <div class="why-wrong-grid">${rows}</div>
    </fieldset>
  `;
}

function normaliseQuestion(raw) {
  const options = [
    clean(raw.option_a ?? raw.optionA ?? raw.options?.[0] ?? raw.a),
    clean(raw.option_b ?? raw.optionB ?? raw.options?.[1] ?? raw.b),
    clean(raw.option_c ?? raw.optionC ?? raw.options?.[2] ?? raw.c),
    clean(raw.option_d ?? raw.optionD ?? raw.options?.[3] ?? raw.d)
  ];

  if (Array.isArray(raw.options) && raw.options.length === 4) {
    options.splice(0, 4, ...raw.options.map(clean));
  }

  const question = clean(raw.question);
  if (!question || options.some(opt => !opt)) return null;

  const answerLetters = parseAnswerLetters(raw.answer, options);
  if (!answerLetters.length) return null;
  const answer = answerLetters.join(',');

  return {
    id: raw.id || makeId(),
    question,
    options,
    answer,
    explanation: clean(raw.explanation),
    whyWrong: parseWhyWrong(raw),
    questionImage: parseImageField(raw, 'questionImage', 'question_image'),
    explanationImage: parseImageField(raw, 'explanationImage', 'explanation_image'),
    questionImages: parseImageList(raw.questionImages || raw.question_images),
    solutionImages: parseImageList(raw.solutionImages || raw.solution_images),
    subject: clean(raw.subject) || 'General',
    topic: clean(raw.topic) || 'General',
    subtopic: clean(raw.subtopic || raw.chapter) || '',
    tags: parseTags(raw.tags),
    createdAt: raw.createdAt || raw.created_at || Date.now(),
    updatedAt: raw.updatedAt || raw.updated_at || raw.createdAt || raw.created_at || Date.now()
  };
}

function sanitizeTagsForExport(tags) {
  return (tags || []).filter(tag => tag && !/pearson/i.test(tag));
}

function toExportQuestion(raw) {
  const question = normaliseQuestion(raw);
  if (!question) return null;
  return {
    id: question.id,
    question: question.question,
    option_a: question.options[0],
    option_b: question.options[1],
    option_c: question.options[2],
    option_d: question.options[3],
    options: question.options,
    answer: question.answer,
    explanation: question.explanation,
    questionImages: question.questionImages,
    solutionImages: question.solutionImages,
    whyWrong: question.whyWrong,
    why_wrong_a: question.whyWrong.A,
    why_wrong_b: question.whyWrong.B,
    why_wrong_c: question.whyWrong.C,
    why_wrong_d: question.whyWrong.D,
    subject: question.subject,
    topic: question.topic,
    subtopic: question.subtopic,
    tags: sanitizeTagsForExport(question.tags),
    createdAt: question.createdAt,
    updatedAt: question.updatedAt
  };
}

function parseStoredBank(raw) {
  if (Array.isArray(raw)) {
    return {
      version: 1,
      updatedAt: null,
      questions: raw
    };
  }
  if (raw && Array.isArray(raw.questions)) {
    return {
      version: raw.version || 1,
      updatedAt: raw.updatedAt || null,
      questions: raw.questions
    };
  }
  return { version: 1, updatedAt: null, questions: [] };
}

function syncFromStorage() {
  state.questions = loadQuestions();
}

function getExportSnapshot() {
  syncFromStorage();
  return state.questions.map(toExportQuestion).filter(Boolean);
}

function formatTimestamp(value) {
  if (!value) return 'not saved yet';
  return new Date(value).toLocaleString();
}

function updateStorageStatus(options = {}) {
  const count = state.questions.length;
  const bankUpdatedAt = getBankUpdatedAt();

  if (el.bankStorageStatus) {
    el.bankStorageStatus.textContent = `${count} question${count === 1 ? '' : 's'} saved locally · last updated ${formatTimestamp(bankUpdatedAt)}`;
  }
  if (el.exportStatus) {
    el.exportStatus.textContent = options.exportMessage
      || `Export includes all ${count} saved question${count === 1 ? '' : 's'} in their latest form.`;
  }
}

function getBankUpdatedAt() {
  if (state.bankUpdatedAt) return state.bankUpdatedAt;
  const latestQuestionUpdate = state.questions.reduce((latest, question) => {
    const stamp = question.updatedAt || question.createdAt || 0;
    return stamp > latest ? stamp : latest;
  }, 0);
  return latestQuestionUpdate || null;
}

function exportFilename(extension) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `neet-mcq-bank-${stamp}.${extension}`;
}


function migrateKnownWhyWrongNotes() {
  const patches = {
    'Static concept of species was put forward by': {
      whyWrong: {
        A: 'Augustin Pyramus de Candolle was a Swiss botanist who made major contributions to plant taxonomy and introduced the term taxonomy itself, but he did not propose the static species concept.',
        B: 'Linnaeus is famous for binomial nomenclature and systematic classification, but he is not the credited source of the static species concept in this context.',
        D: 'Charles Darwin explicitly opposed the static concept by introducing the dynamic/evolutionary concept of species, proving that species change over time through natural selection and are not immutable.'
      }
    }
  };

  let changed = false;
  state.questions = state.questions.map(question => {
    const patchKey = Object.keys(patches).find(key => question.question.includes(key));
    if (!patchKey) return question;

    const patch = patches[patchKey];
    const mergedWhyWrong = { ...question.whyWrong, ...patch.whyWrong };
    const hasNewNotes = OPTION_LETTERS.some(letter => !clean(question.whyWrong?.[letter]) && clean(mergedWhyWrong[letter]));
    if (!hasNewNotes) return question;

    changed = true;
    return normaliseQuestion({ ...question, whyWrong: mergedWhyWrong });
  });

  if (changed) saveQuestions();
}

async function persistQuestions() {
  const now = Date.now();
  state.questions = state.questions
    .map(question => {
      const normalised = normaliseQuestion(question);
      if (!normalised) return null;
      return {
        ...normalised,
        updatedAt: question.updatedAt || normalised.updatedAt || now
      };
    })
    .filter(Boolean);

  const payload = {
    version: 1,
    updatedAt: now,
    questions: state.questions
  };

  try {
    await idbSet(STORAGE_KEY, payload);
    state.bankUpdatedAt = now;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore legacy cleanup errors
    }
  } catch (error) {
    alert('Could not save all data. Try fewer/smaller images, export a backup, or remove some images.');
    throw error;
  }
  updateStorageStatus();
}

function saveQuestions() {
  persistQuestions().catch(() => {});
}

function getTaxonomy() {
  const subjects = new Set();
  const topics = new Set();
  const subtopics = new Set();
  const tags = new Set();

  state.questions.forEach(q => {
    if (q.subject) subjects.add(q.subject);
    if (q.topic) topics.add(q.topic);
    if (q.subtopic) subtopics.add(q.subtopic);
    q.tags.forEach(tag => tags.add(tag));
  });

  const curriculumOrder = NeetCurriculum.CURRICULUM.flatMap(
    year => year.units.flatMap(unit => unit.chapters)
  );

  const sortByCurriculum = (a, b) => {
    const ai = curriculumOrder.indexOf(NeetCurriculum.normalizeChapter(a));
    const bi = curriculumOrder.indexOf(NeetCurriculum.normalizeChapter(b));
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  };

  return {
    subjects: [...subjects].sort((a, b) => a.localeCompare(b)),
    topics: [...topics].sort(sortByCurriculum),
    subtopics: [...subtopics].sort((a, b) => a.localeCompare(b)),
    tags: [...tags].sort((a, b) => a.localeCompare(b))
  };
}

function matchesFilters(question, filters = state.selectedFilters) {
  if (filters.subjects.size && !filters.subjects.has(question.subject)) return false;
  if (filters.topics.size) {
    const normalized = NeetCurriculum.normalizeChapter(question.topic);
    const topicMatch = [...filters.topics].some(
      value => value === question.topic || NeetCurriculum.normalizeChapter(value) === normalized
    );
    if (!topicMatch) return false;
  }
  if (filters.subtopics.size && !filters.subtopics.has(question.subtopic)) return false;
  if (filters.tags.size && !question.tags.some(tag => filters.tags.has(tag))) return false;
  return true;
}

function getFilteredQuestions(filters) {
  return state.questions.filter(q => matchesFilters(q, filters));
}

function getPracticePool(filters = state.selectedFilters) {
  let pool = getFilteredQuestions(filters);
  if (el.practiceUnsolvedOnly?.checked && state.activeStudentId) {
    pool = pool.filter(q => isQuestionUnsolved(state.activeStudentId, q.id));
  }
  return pool;
}

function getBankFilteredQuestions() {
  const filtered = getFilteredQuestions(state.bankFilters);
  const query = (state.bankSearch || '').trim();
  if (!query) return filtered;
  const { results } = NeetSearch.searchQuestions(filtered, query, { limit: filtered.length });
  return results.map(r => r.question);
}

function toggleFilterValue(filters, group, value) {
  const set = filters[group];
  if (set.has(value)) set.delete(value);
  else set.add(value);
}

function applyQuickFilter(group, value) {
  toggleFilterValue(state.bankFilters, group, value);
  state.bankPage = 1;
  updateBankFilterUI();
  renderBank();
  el.bankList.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderChipGroup(container, values, selectedSet, groupKey) {
  if (!values.length) {
    container.innerHTML = '<span class="chip empty-chip">No values yet — add MCQs first</span>';
    return;
  }

  container.innerHTML = values.map(value => {
    const active = selectedSet.has(value) ? ' active' : '';
    return `<button type="button" class="chip${active}" data-group="${groupKey}" data-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`;
  }).join('');
}

function updateDatalists() {
  const taxonomy = getTaxonomy();
  el.subjectList.innerHTML = taxonomy.subjects.map(v => `<option value="${escapeHtml(v)}">`).join('');
  el.topicList.innerHTML = taxonomy.topics.map(v => `<option value="${escapeHtml(v)}">`).join('');
  el.subtopicList.innerHTML = taxonomy.subtopics.map(v => `<option value="${escapeHtml(v)}">`).join('');
}

function updateFilterUI() {
  const taxonomy = getTaxonomy();
  renderChipGroup(el.filterSubjects, taxonomy.subjects, state.selectedFilters.subjects, 'subjects');
  renderChipGroup(el.filterTopics, taxonomy.topics, state.selectedFilters.topics, 'topics');
  renderChipGroup(el.filterSubtopics, taxonomy.subtopics, state.selectedFilters.subtopics, 'subtopics');
  renderChipGroup(el.filterTags, taxonomy.tags, state.selectedFilters.tags, 'tags');

  const matched = getPracticePool(state.selectedFilters);
  const requested = Math.max(1, Number(el.practiceCount.value) || 1);
  const available = matched.length;
  const unsolvedNote = el.practiceUnsolvedOnly?.checked ? ' (unsolved only)' : '';

  el.matchCount.textContent = available
    ? `${available} question${available === 1 ? '' : 's'} match your filters${unsolvedNote}.`
    : `No questions match your filters${unsolvedNote}.`;

  el.startPracticeBtn.disabled = available === 0;
  el.practiceCount.max = Math.max(1, available || 200);

  if (available && requested > available) {
    el.practiceCount.value = available;
  }

  el.totalCount.textContent = `${state.questions.length} MCQ${state.questions.length === 1 ? '' : 's'}`;
}

function updateBankFilterUI() {
  const taxonomy = getTaxonomy();
  renderChipGroup(el.bankFilterSubjects, taxonomy.subjects, state.bankFilters.subjects, 'subjects');
  renderChipGroup(el.bankFilterTopics, taxonomy.topics, state.bankFilters.topics, 'topics');
  renderChipGroup(el.bankFilterSubtopics, taxonomy.subtopics, state.bankFilters.subtopics, 'subtopics');
  renderChipGroup(el.bankFilterTags, taxonomy.tags, state.bankFilters.tags, 'tags');

  const matched = getBankFilteredQuestions().length;
  el.practiceFromBankBtn.disabled = matched === 0;
}

function renderBankEditForm(q) {
  const letters = ['A', 'B', 'C', 'D'];
  return `
    <form class="inline-edit-form" data-edit-id="${q.id}">
      <label class="full-width">
        Question
        <textarea name="question" rows="3" required>${escapeHtml(q.question)}</textarea>
      </label>
      <div class="inline-options-grid">
        ${letters.map((letter, i) => `
          <label>Option ${letter}
            <input type="text" name="option_${letter.toLowerCase()}" value="${escapeHtml(q.options[i])}" required />
          </label>
        `).join('')}
      </div>
      <fieldset class="answer-checkbox-group">
        <legend>Correct answer(s) <span class="muted">(tick more than one if multiple options are correct)</span></legend>
        ${letters.map(letter => `
          <label class="checkbox-inline">
            <input type="checkbox" name="answer" value="${letter}" ${getCorrectLetters(q).includes(letter) ? 'checked' : ''} />
            ${letter}
          </label>
        `).join('')}
      </fieldset>
      <label class="full-width">
        Explanation
        <textarea name="explanation" rows="2">${escapeHtml(q.explanation)}</textarea>
      </label>
      ${renderImageUploadFields(q.questionImage, q.explanationImage)}
      ${renderWhyWrongFieldsHtml(q.whyWrong, true)}
      <div class="inline-meta-grid">
        <label>Subject <input type="text" name="subject" list="subjectList" value="${escapeHtml(q.subject)}" required /></label>
        <label>Topic <input type="text" name="topic" list="topicList" value="${escapeHtml(q.topic)}" required /></label>
        <label>Subtopic <input type="text" name="subtopic" list="subtopicList" value="${escapeHtml(q.subtopic)}" /></label>
        <label>Tags <input type="text" name="tags" value="${escapeHtml(q.tags.join(', '))}" placeholder="Comma separated" /></label>
      </div>
      <div class="bank-actions">
        <button type="submit" class="primary-btn small">Save changes</button>
        <button type="button" class="secondary-btn small cancel-inline-btn" data-id="${q.id}">Cancel</button>
      </div>
    </form>
  `;
}

function bankHighlight(text) {
  const query = (state.bankSearch || '').trim();
  if (!query) return renderMath(text);
  return NeetSearch.highlight(text, NeetSearch.parseQuery(query));
}

function renderBankCard(q) {
  if (state.editingId === q.id) {
    return `
      <article class="bank-card editing" data-id="${q.id}">
        <div class="mcq-meta">
          <span class="badge">Editing</span>
        </div>
        ${renderBankEditForm(q)}
      </article>
    `;
  }

  const answersVisible = state.bankShowAnswers;
  return `
    <article class="bank-card" data-id="${q.id}">
      <div class="mcq-meta">
        <button type="button" class="badge clickable filter-badge" data-group="subjects" data-value="${escapeHtml(q.subject)}">${escapeHtml(q.subject)}</button>
        <button type="button" class="badge green clickable filter-badge" data-group="topics" data-value="${escapeHtml(q.topic)}">${escapeHtml(q.topic)}</button>
        ${q.subtopic ? `<button type="button" class="badge clickable filter-badge" data-group="subtopics" data-value="${escapeHtml(q.subtopic)}">${escapeHtml(q.subtopic)}</button>` : ''}
        ${q.tags.map(tag => `<button type="button" class="badge orange clickable filter-badge" data-group="tags" data-value="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join('')}
      </div>
      <p class="question">${bankHighlight(q.question)}</p>
      ${renderImageHtml(q.questionImage, 'Question image')}
      ${renderImageHtml(q.questionImages, 'Figure')}
      <ol class="options compact" type="A">
        ${q.options.map((opt, i) => {
          const letter = ['A', 'B', 'C', 'D'][i];
          return `<li><strong>${letter}.</strong> ${bankHighlight(opt)}</li>`;
        }).join('')}
      </ol>
      <div class="bank-answer-section" ${answersVisible ? '' : 'hidden'}>
        <div class="bank-correct-answer">
          ${getCorrectLetters(q).map(letter => `<div><strong>Answer: ${letter}.</strong> ${bankHighlight(q.options[['A','B','C','D'].indexOf(letter)] || '')}</div>`).join('')}
        </div>
        ${q.explanation ? `<p class="bank-explanation"><strong>Explanation:</strong> ${bankHighlight(q.explanation)}</p>` : ''}
        ${renderImageHtml(q.explanationImage, 'Explanation image')}
        ${renderImageHtml(q.solutionImages, 'Solution figure')}
        ${renderWhyWrongHtml(q)}
      </div>
      <div class="bank-card-actions">
        <button type="button" class="secondary-btn small reveal-answer-btn" data-id="${q.id}">${answersVisible ? 'Hide Answer' : 'Show Answer'}</button>
        <button type="button" class="secondary-btn small edit-btn" data-id="${q.id}">Edit</button>
        <button type="button" class="danger-btn small delete-btn" data-id="${q.id}">Delete</button>
      </div>
    </article>
  `;
}

function renderBank() {
  const filtered = getBankFilteredQuestions();
  const filterActive = Object.values(state.bankFilters).some(set => set.size > 0);
  const filterNote = filterActive ? ' (filtered)' : '';

  el.bankSummary.textContent = `${state.questions.length} total · showing ${filtered.length}${filterNote}`;

  if (!state.questions.length) {
    el.bankList.className = 'bank-list empty-state';
    el.bankList.innerHTML = isAdmin()
      ? '<h3>No questions yet</h3><p>Unlock admin, import a JSON file, then publish bank.json for your other devices.</p>'
      : '<h3>No questions yet</h3><p>Tap <strong>Sync questions</strong> after the admin has published the shared bank.</p>';
    updateBankFilterUI();
    return;
  }

  if (!filtered.length) {
    el.bankList.className = 'bank-list empty-state';
    el.bankList.innerHTML = '<h3>No matches</h3><p>Try different filters or search terms.</p>';
    updateBankFilterUI();
    return;
  }

  const page = state.bankPage;
  const size = state.BANK_PAGE_SIZE;
  const visible = filtered.slice(0, page * size);
  const hasMore = visible.length < filtered.length;

  el.bankList.className = 'bank-list';
  el.bankList.innerHTML =
    visible.map(q => renderBankCard(q)).join('') +
    (hasMore ? `<div class="bank-load-more">
      <button class="secondary-btn" id="bankLoadMoreBtn" type="button">
        Load more · showing ${visible.length} of ${filtered.length}
      </button></div>` : '');

  const loadMoreBtn = document.getElementById('bankLoadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      state.bankPage++;
      renderBank();
      loadMoreBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  updateBankFilterUI();
}

function switchTab(tabName) {
  state.activeTab = tabName;
  el.navItems.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
  el.viewPanels.forEach(panel => {
    const isActive = panel.id === `tab-${tabName}`;
    panel.classList.toggle('active', isActive);
    panel.hidden = !isActive;
  });
  if (el.sidebar) el.sidebar.classList.remove('open');
  if (el.sidebarBackdrop) el.sidebarBackdrop.hidden = true;
  if (tabName === 'flags') renderFlagReview();
  if (tabName === 'journey') renderJourney();
  refreshLearningViews();
}

function resetForm() {
  el.mcqForm.reset();
  el.editId.value = '';
  setWhyWrongFields();
  setImagePreview(el.fQuestionImageData, el.fQuestionImagePreviewWrap, el.fQuestionImagePreview, '');
  setImagePreview(el.fExplanationImageData, el.fExplanationImagePreviewWrap, el.fExplanationImagePreview, '');
  el.fQuestionImageFile.value = '';
  el.fExplanationImageFile.value = '';
  el.formMode.textContent = 'Fill in the question, four options, and classification fields.';
  el.cancelEditBtn.classList.add('hidden');
}

function populateFormImages(question) {
  setImagePreview(el.fQuestionImageData, el.fQuestionImagePreviewWrap, el.fQuestionImagePreview, question.questionImage || '');
  setImagePreview(el.fExplanationImageData, el.fExplanationImagePreviewWrap, el.fExplanationImagePreview, question.explanationImage || '');
}

function startEdit(id) {
  if (!requireAdmin('edit questions')) return;
  state.editingId = id;
  const question = state.questions.find(q => q.id === id);
  renderBank();
  const form = el.bankList.querySelector(`form[data-edit-id="${id}"]`);
  if (form && question) {
    form.querySelector('input[name="question_image"]').value = question.questionImage || '';
    form.querySelector('input[name="explanation_image"]').value = question.explanationImage || '';
    hydrateInlineImageFields(form);
  }
  const card = el.bankList.querySelector(`[data-id="${id}"]`);
  card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelInlineEdit() {
  state.editingId = null;
  renderBank();
}

function saveInlineEdit(form) {
  if (!requireAdmin('edit questions')) return;
  const id = form.dataset.editId;
  const existing = state.questions.find(q => q.id === id);
  if (!existing) return;

  const formData = new FormData(form);
  state.editingId = null;
  const success = upsertQuestion({
    id,
    question: formData.get('question'),
    option_a: formData.get('option_a'),
    option_b: formData.get('option_b'),
    option_c: formData.get('option_c'),
    option_d: formData.get('option_d'),
    answer: formData.getAll('answer').join(','),
    explanation: formData.get('explanation'),
    whyWrong: readWhyWrongFromForm(formData),
    questionImage: formData.get('question_image'),
    explanationImage: formData.get('explanation_image'),
    subject: formData.get('subject'),
    topic: formData.get('topic'),
    subtopic: formData.get('subtopic'),
    tags: formData.get('tags'),
    createdAt: existing.createdAt
  });

  if (!success) {
    state.editingId = id;
    renderBank();
  }
}

function upsertQuestion(data) {
  if (!requireAdmin('add or edit questions')) return false;
  const question = normaliseQuestion(data);
  if (!question) {
    showToast('Fill in the question, all four options, and a correct answer.', { type: 'warning', title: 'Incomplete' });
    return false;
  }

  const existingIndex = state.questions.findIndex(q => q.id === question.id);
  question.updatedAt = Date.now();
  if (existingIndex >= 0) {
    question.createdAt = state.questions[existingIndex].createdAt;
    state.questions[existingIndex] = question;
  } else {
    state.questions.unshift(question);
  }

  saveQuestions();
  refreshUI();
  showToast('Question saved — syncing to GitHub…', { type: 'success', duration: 2500 });
  pushBankToGitHub(true);
  return true;
}

function deleteQuestion(id) {
  if (!requireAdmin('delete questions')) return;
  const q = state.questions.find(x => x.id === id);
  if (!q) return;
  const snippet = q.question.slice(0, 60) + (q.question.length > 60 ? '…' : '');
  showConfirm(`Delete: "${snippet}"?`, () => {
    if (state.editingId === id) state.editingId = null;
    state.questions = state.questions.filter(x => x.id !== id);
    saveQuestions();
    refreshUI();
    pushBankToGitHub(true);
    showToast('Question deleted and syncing…', { type: 'success' });
  });
}

function showConfirm(msg, onConfirm) {
  const t = document.createElement('div');
  t.className = 'toast toast-warning';
  t.style.maxWidth = '380px';
  t.innerHTML = `
    <span class="toast-icon">🗑️</span>
    <div class="toast-body" style="flex:1">
      <p class="toast-title">Confirm delete</p>
      <p class="toast-msg">${escapeHtml(msg)}</p>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="danger-btn small confirm-yes" style="flex:1">Delete</button>
        <button class="secondary-btn small confirm-no" style="flex:1">Cancel</button>
      </div>
    </div>`;
  el.toastContainer?.appendChild(t);
  t.querySelector('.confirm-yes').addEventListener('click', () => { dismissToast(t); onConfirm(); });
  t.querySelector('.confirm-no').addEventListener('click', () => dismissToast(t));
}

function clearFilters() {
  Object.values(state.selectedFilters).forEach(set => set.clear());
  updateFilterUI();
}

function clearBankFilters() {
  Object.values(state.bankFilters).forEach(set => set.clear());
  updateBankFilterUI();
  renderBank();
}

function syncPracticeFiltersFromBank() {
  state.selectedFilters.subjects = new Set(state.bankFilters.subjects);
  state.selectedFilters.topics = new Set(state.bankFilters.topics);
  state.selectedFilters.subtopics = new Set(state.bankFilters.subtopics);
  state.selectedFilters.tags = new Set(state.bankFilters.tags);
  updateFilterUI();
}

function practiceFromBank() {
  syncPracticeFiltersFromBank();
  const matched = getBankFilteredQuestions();
  el.practiceCount.value = matched.length;
  switchTab('practice');
  startPractice();
}

function startPractice() {
  const pool = getPracticePool(state.selectedFilters);
  if (!pool.length) {
    alert(state.activeStudentId && el.practiceUnsolvedOnly?.checked
      ? 'No unsolved questions match your filters for this student.'
      : 'No questions match your filters.');
    return;
  }
  const count = Math.min(pool.length, Math.max(1, Number(el.practiceCount.value) || 1));
  state.practice = {
    active: true,
    questions: shuffle(pool).slice(0, count),
    index: 0,
    score: 0,
    answered: false,
    selectedOption: null,
    selectedOptions: [],
    log: [],
    streakInSession: 0,
    lastFeedback: null,
    questionStartAt: Date.now()
  };

  el.practiceArea.classList.remove('hidden');
  el.practiceResults.classList.add('hidden');
  el.practiceResults.innerHTML = '';
  el.nextQuestionBtn.classList.add('hidden');
  el.finishPracticeBtn.classList.remove('hidden');
  renderPracticeQuestion();
}

function endPractice() {
  state.practice.active = false;
  el.practiceArea.classList.add('hidden');
}

// Per-question shuffled display order so options rotate across A/B/C/D.
// Cached on the session per question index so the order stays stable across
// the answer reveal (we never re-shuffle once a question is showing).
function getOptionOrder(session, current) {
  if (!session.optionOrders) session.optionOrders = {};
  let order = session.optionOrders[session.index];
  if (!order || order.length !== current.options.length) {
    order = shuffle(current.options.map((_, i) => i));
    session.optionOrders[session.index] = order;
  }
  return order;
}

function renderPracticeQuestion() {
  const session = state.practice;
  const current = session.questions[session.index];
  const total = session.questions.length;
  const progress = ((session.index) / total) * 100;

  el.progressBar.style.width = `${progress}%`;
  el.practiceProgress.textContent = `Question ${session.index + 1} of ${total}`;
  el.practiceScore.textContent = `Score: ${session.score}/${session.index + (session.answered ? 1 : 0)}`;

  const letters = ['A', 'B', 'C', 'D'];
  const multi = isMultiCorrect(current);
  const correctLetters = getCorrectLetters(current);
  const order = getOptionOrder(session, current);
  // Map each canonical option letter -> the letter it is displayed under now.
  const displayLetterByCanonical = {};
  order.forEach((originalIndex, displayPos) => {
    displayLetterByCanonical[letters[originalIndex]] = letters[displayPos];
  });
  const correctDisplayLetters = correctLetters.map(letter => displayLetterByCanonical[letter] || letter);
  const selected = multi ? (session.selectedOptions || []) : (session.selectedOption ? [session.selectedOption] : []);

  el.practiceCard.innerHTML = `
    <div class="mcq-meta">
      <span class="badge">${escapeHtml(current.subject)}</span>
      <span class="badge green">${escapeHtml(current.topic)}</span>
      ${current.subtopic ? `<span class="badge">${escapeHtml(current.subtopic)}</span>` : ''}
      ${current.tags.map(tag => `<span class="badge orange">${escapeHtml(tag)}</span>`).join('')}
      ${multi ? '<span class="badge purple">Multiple correct</span>' : ''}
    </div>
    <p class="question">${renderMath(current.question)}</p>
    ${multi && !session.answered ? '<p class="mcq-hint">Select every option you think is correct, then submit.</p>' : ''}
    ${renderImageHtml(current.questionImage, 'Question image')}
    ${renderImageHtml(current.questionImages, 'Figure')}
    <div class="options interactive ${multi ? 'multi-select' : ''}">
      ${order.map((originalIndex, displayPos) => {
        const option = current.options[originalIndex];
        const canonicalLetter = letters[originalIndex];   // identity for scoring
        const displayLetter = letters[displayPos];        // position shown on screen
        const isChosen = selected.includes(canonicalLetter);
        let className = 'option-btn';
        if (multi && !session.answered && isChosen) className += ' selected';
        if (session.answered) {
          if (correctLetters.includes(canonicalLetter)) className += ' correct';
          else if (isChosen) className += ' wrong';
        }
        const disabled = session.answered ? 'disabled' : '';
        const marker = multi && !session.answered ? (isChosen ? '✓' : displayLetter) : displayLetter;
        return `<button type="button" class="${className}" data-option="${canonicalLetter}" ${disabled}>
          <span class="option-letter">${marker}</span>
          <span>${renderMath(option)}</span>
        </button>`;
      }).join('')}
    </div>
    ${multi && !session.answered ? `
      <div class="practice-actions inline">
        <button type="button" class="primary-btn" data-action="submit-multi" ${selected.length ? '' : 'disabled'}>Submit answer</button>
      </div>` : ''}
    ${session.answered ? `
      ${session.lastFeedback ? `<div class="coach-feedback ${session.lastFeedback.tone}">${escapeHtml(session.lastFeedback.text)}</div>` : ''}
      <div class="answer show">
        <strong>Correct answer${correctDisplayLetters.length > 1 ? 's' : ''}: ${correctDisplayLetters.join(', ')}.</strong>
        ${correctLetters.map(letter => renderMath(current.options[answerLetterToIndex(letter)])).join('<br>')}
        ${current.explanation ? `<br><strong>Explanation:</strong> ${renderMath(current.explanation)}` : ''}
        ${renderImageHtml(current.explanationImage, 'Explanation image')}
        ${renderImageHtml(current.solutionImages, 'Solution figure')}
        ${renderWhyWrongHtml(current, displayLetterByCanonical)}
        ${!multi ? `<button type="button" class="flag-report-btn" data-action="open-flag" ${hasPendingFlagForQuestion(current.id, state.activeStudentId) ? 'disabled' : ''}>
          ${hasPendingFlagForQuestion(current.id, state.activeStudentId) ? '✓ Report submitted — pending review' : '⚑ Flag wrong answer / suggest correction'}
        </button>` : ''}
      </div>` : ''}
  `;

  el.nextQuestionBtn.classList.toggle('hidden', !session.answered);
  el.nextQuestionBtn.textContent = session.index === total - 1 ? 'View results' : 'Next question';

  if (!session.answered) session.questionStartAt = Date.now();
}

function selectPracticeOption(optionLetter) {
  const session = state.practice;
  if (session.answered) return;
  const current = session.questions[session.index];

  if (isMultiCorrect(current)) {
    const chosen = new Set(session.selectedOptions || []);
    if (chosen.has(optionLetter)) chosen.delete(optionLetter);
    else chosen.add(optionLetter);
    session.selectedOptions = [...chosen];
    renderPracticeQuestion();
    return;
  }

  const isCorrect = optionLetter === current.answer;
  session.selectedOption = optionLetter;
  session.answered = true;
  if (isCorrect) session.score += 1;
  finishPracticeAttempt(current, isCorrect, optionLetter);
}

function submitMultiPracticeAnswer() {
  const session = state.practice;
  if (session.answered) return;
  const current = session.questions[session.index];
  if (!isMultiCorrect(current)) return;

  const selected = (session.selectedOptions || []).slice().sort();
  if (!selected.length) return;
  const correct = getCorrectLetters(current);
  const isCorrect = selected.length === correct.length && selected.every((letter, i) => letter === correct[i]);
  session.answered = true;
  if (isCorrect) session.score += 1;
  finishPracticeAttempt(current, isCorrect, selected.join(','));
}

function finishPracticeAttempt(current, isCorrect, selectedLabel) {
  const session = state.practice;
  // Capture state BEFORE recording so the coach can react to the prior history.
  const prior = getQuestionProgress(state.activeStudentId, current.id);
  const ms = session.questionStartAt ? Date.now() - session.questionStartAt : 0;
  session.streakInSession = isCorrect ? (session.streakInSession || 0) + 1 : 0;

  if (window.NeetCoach) {
    session.lastFeedback = NeetCoach.getAttemptFeedback({
      isCorrect,
      prior,
      section: NeetCurriculum.normalizeSection(current.subtopic),
      streakInSession: session.streakInSession
    });
  }
  if (!session.log) session.log = [];
  session.log.push({ question: current, isCorrect, ms });

  recordAttempt(current, isCorrect, selectedLabel);
  renderPracticeQuestion();
}

function nextPracticeQuestion() {
  const session = state.practice;
  if (session.index >= session.questions.length - 1) {
    showPracticeResults();
    return;
  }

  session.index += 1;
  session.answered = false;
  session.selectedOption = null;
  session.selectedOptions = [];
  session.lastFeedback = null;
  renderPracticeQuestion();
}

function showPracticeResults() {
  const session = state.practice;
  const log = session.log && session.log.length
    ? session.log
    : session.questions.slice(0, session.index).map(q => ({ question: q, isCorrect: false, ms: 0 }));
  const report = window.NeetCoach
    ? NeetCoach.getSessionReport(log)
    : null;
  const total = log.length;
  const correct = session.score;
  const percent = total ? Math.round((correct / total) * 100) : 0;

  el.progressBar.style.width = '100%';
  el.practiceProgress.textContent = 'Session complete';
  el.practiceScore.textContent = `Score: ${correct}/${total}`;
  el.practiceCard.innerHTML = '';
  el.nextQuestionBtn.classList.add('hidden');
  el.finishPracticeBtn.classList.add('hidden');

  el.practiceResults.classList.remove('hidden');

  if (!report) {
    el.practiceResults.innerHTML = `
      <h3>Practice complete</h3>
      <p class="result-score">${correct} / ${total} correct (${percent}%)</p>
      <div class="button-row">
        <button type="button" class="primary-btn" id="retryPracticeBtn">Practice again</button>
        <button type="button" class="secondary-btn" id="closePracticeBtn">Back to filters</button>
      </div>`;
  } else {
    el.practiceResults.innerHTML = `
      <div class="report-card">
        <div class="report-head tone-${report.grade.tone}">
          <div class="report-grade">${report.grade.letter}</div>
          <div>
            <p class="eyebrow-dark">Session report card</p>
            <h3>${escapeHtml(report.grade.word)} · ${report.correct}/${report.total} correct (${report.percent}%)</h3>
            <p class="muted">${report.avgSec ? `~${report.avgSec}s per question` : ''}${report.bestRun >= 3 ? ` · best run ${report.bestRun} 🔥` : ''}</p>
          </div>
        </div>

        <div class="report-note">
          ${report.note.map(line => `<p>${escapeHtml(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`).join('')}
        </div>

        <div class="report-breakdown">
          <h4>By topic</h4>
          ${report.breakdown.map(row => `
            <div class="report-topic">
              <span class="report-topic-name">${escapeHtml(row.topic)}</span>
              <span class="track-bar"><i class="${row.pct < 60 ? 'bar-weak' : ''}" style="width:${row.pct}%"></i></span>
              <span class="report-topic-score ${row.pct < 60 ? 'weak' : ''}">${row.correct}/${row.total}</span>
            </div>
          `).join('')}
        </div>

        <div class="button-row">
          ${report.weakTopics.length ? `<button type="button" class="primary-btn" data-action="practice-chapter" data-chapter="${escapeHtml(report.weakTopics[0])}">Drill ${escapeHtml(report.weakTopics[0])}</button>` : ''}
          <button type="button" class="secondary-btn" id="retryPracticeBtn">Practice again</button>
          <button type="button" class="secondary-btn" id="closePracticeBtn">Back to filters</button>
        </div>
      </div>`;
  }

  const retry = document.getElementById('retryPracticeBtn');
  const close = document.getElementById('closePracticeBtn');
  if (retry) retry.addEventListener('click', startPractice);
  if (close) close.addEventListener('click', endPractice);
}

function refreshUI() {
  updateDatalists();
  updateFilterUI();
  updateBankFilterUI();
  renderBank();
  updateStorageStatus();
  refreshLearningViews();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(cell);
      if (row.some(v => clean(v))) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some(v => clean(v))) rows.push(row);

  if (!rows.length) return [];
  const headers = rows[0].map((h, index) => clean(h) || `Column ${index + 1}`);
  return rows.slice(1).map(values => Object.fromEntries(headers.map((h, i) => [h, clean(values[i])])));
}

async function parseImportFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  if (extension === 'csv') return parseCsv(await file.text());
  if (extension === 'json') {
    const data = JSON.parse(await file.text());
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.questions)) return data.questions;
    if (Array.isArray(data.rows)) return data.rows;
    if (Array.isArray(data.data)) return data.data;
    return [data];
  }
  if (['xlsx', 'xls'].includes(extension)) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
  }
  throw new Error('Unsupported file type. Use .csv, .json, .xlsx or .xls');
}

async function importFile(file) {
  if (!file) return;
  if (!requireAdmin('import questions')) return;
  try {
    el.importStatus.textContent = `Reading ${file.name}...`;
    const rows = await parseImportFile(file);
    const imported = rows.map(normaliseQuestion).filter(Boolean);
    if (!imported.length) throw new Error('No valid MCQs found. Check question, options and answer columns.');

    const { added, updated } = mergeImportedQuestions(imported);
    saveQuestions();
    refreshUI();

    const parts = [];
    if (added) parts.push(`${added} new`);
    if (updated) parts.push(`${updated} updated`);
    el.importStatus.textContent = parts.length
      ? `Imported from ${file.name}: ${parts.join(', ')}. Download bank.json and upload it to your hosting URL so other devices can sync.`
      : `No changes from ${file.name}. All matching questions were already up to date.`;
  } catch (error) {
    el.importStatus.textContent = error.message;
  }
}

function mergeImportedQuestions(imported) {
  const byId = new Map(state.questions.map(question => [question.id, question]));
  const byText = new Map(state.questions.map(question => [question.question.toLowerCase(), question]));
  let added = 0;
  let updated = 0;

  imported.forEach(item => {
    const existing = (item.id && byId.get(item.id)) || byText.get(item.question.toLowerCase());
    if (existing) {
      const merged = normaliseQuestion({
        ...existing,
        ...item,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: Date.now()
      });
      if (!merged) return;

      const index = state.questions.findIndex(question => question.id === existing.id);
      state.questions[index] = merged;
      byId.set(merged.id, merged);
      byText.set(merged.question.toLowerCase(), merged);
      updated += 1;
      return;
    }

    item.updatedAt = Date.now();
    state.questions.unshift(item);
    byId.set(item.id, item);
    byText.set(item.question.toLowerCase(), item);
    added += 1;
  });

  return { added, updated };
}

function loadSampleData() {
  if (!requireAdmin('load sample questions')) return;
  let added = 0;
  const existing = new Set(state.questions.map(q => q.question.toLowerCase()));
  sampleQuestions.forEach(raw => {
    const item = normaliseQuestion(raw);
    if (!item || existing.has(item.question.toLowerCase())) return;
    state.questions.unshift(item);
    existing.add(item.question.toLowerCase());
    added += 1;
  });
  saveQuestions();
  refreshUI();
  el.importStatus.textContent = added
    ? `Added ${added} sample question${added === 1 ? '' : 's'}.`
    : 'Sample questions are already in your bank.';
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportJson() {
  if (state.editingId) {
    alert('Finish or cancel the question you are editing before exporting.');
    return;
  }

  const questions = getExportSnapshot();
  const payload = {
    app: 'NEET MCQ Practice',
    version: 1,
    exportedAt: new Date().toISOString(),
    questionCount: questions.length,
    questions
  };

  download(exportFilename('json'), JSON.stringify(payload, null, 2), 'application/json');
  updateStorageStatus({
    exportMessage: `Exported ${questions.length} question${questions.length === 1 ? '' : 's'} to JSON with the latest saved data.`
  });
}

function exportCsv() {
  if (state.editingId) {
    alert('Finish or cancel the question you are editing before exporting.');
    return;
  }

  const headers = [
    'id', 'question', 'option_a', 'option_b', 'option_c', 'option_d',
    'answer', 'explanation',
    'why_wrong_a', 'why_wrong_b', 'why_wrong_c', 'why_wrong_d',
    'subject', 'topic', 'subtopic', 'tags', 'created_at', 'updated_at'
  ];
  const lines = [headers.join(',')];
  const questions = getExportSnapshot();

  questions.forEach(q => {
    const row = [
      q.id,
      q.question,
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d,
      q.answer,
      q.explanation,
      q.why_wrong_a,
      q.why_wrong_b,
      q.why_wrong_c,
      q.why_wrong_d,
      q.subject,
      q.topic,
      q.subtopic,
      q.tags.join('; '),
      q.createdAt,
      q.updatedAt
    ];
    lines.push(row.map(value => `"${clean(value).replace(/"/g, '""')}"`).join(','));
  });

  download(exportFilename('csv'), lines.join('\n'), 'text/csv');
  updateStorageStatus({
    exportMessage: `Exported ${questions.length} question${questions.length === 1 ? '' : 's'} to CSV with the latest saved data.`
  });
}

function resetAllData() {
  if (!requireAdmin('clear the question bank')) return;
  if (!confirm('Delete ALL saved questions from this browser? This cannot be undone.')) return;
  state.questions = [];
  state.editingId = null;
  saveQuestions();
  endPractice();
  clearFilters();
  clearBankFilters();
  refreshUI();
  el.importStatus.textContent = 'All data cleared.';
}

function bindEvents() {
  el.navItems.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  if (el.menuToggle && el.sidebar) {
    el.menuToggle.addEventListener('click', () => {
      const isOpen = el.sidebar.classList.toggle('open');
      if (el.sidebarBackdrop) el.sidebarBackdrop.hidden = !isOpen;
    });
  }
  if (el.sidebarBackdrop) {
    el.sidebarBackdrop.addEventListener('click', () => {
      el.sidebar.classList.remove('open');
      el.sidebarBackdrop.hidden = true;
    });
  }

  // Collapsible chapter list panel
  const chapsToggle = document.getElementById('chapsToggle');
  if (chapsToggle) {
    chapsToggle.addEventListener('click', () => {
      const layout = document.getElementById('chapsLayout');
      if (layout) layout.classList.toggle('panel-collapsed');
    });
  }

  // Collapsible filter panel
  const filterToggle = document.getElementById('filterToggle');
  if (filterToggle) {
    filterToggle.addEventListener('click', () => {
      const layout = document.querySelector('.practice-layout');
      if (layout) layout.classList.toggle('filter-collapsed');
    });
  }

  [el.dashboardView, el.chaptersView, el.revisionView, el.auditView, el.practiceResults].forEach(view => {
    if (view) view.addEventListener('click', handleViewAction);
  });

  if (el.chaptersView) {
    el.chaptersView.addEventListener('click', event => {
      const card = event.target.closest('[data-chapter]');
      if (!card || card.classList.contains('chap-row--disabled')) return;
      state.selectedChapter = card.dataset.chapter || '';
      const chapsLayout = document.getElementById('chapsLayout');
      if (chapsLayout) chapsLayout.classList.toggle('detail-open', !!state.selectedChapter);
      renderChaptersOnly();
      if (state.selectedChapter) NeetViews.renderChapterDetail(state.selectedChapter);
    });
  }

  if (el.chapterDetail) {
    el.chapterDetail.addEventListener('click', handleViewAction);
  }

  [el.filterSubjects, el.filterTopics, el.filterSubtopics, el.filterTags].forEach(container => {
    container.addEventListener('click', event => {
      const chip = event.target.closest('.chip');
      if (!chip || chip.classList.contains('empty-chip')) return;
      toggleFilterValue(state.selectedFilters, chip.dataset.group, chip.dataset.value);
      updateFilterUI();
    });
  });

  [el.bankFilterSubjects, el.bankFilterTopics, el.bankFilterSubtopics, el.bankFilterTags].forEach(container => {
    container.addEventListener('click', event => {
      const chip = event.target.closest('.chip');
      if (!chip || chip.classList.contains('empty-chip')) return;
      toggleFilterValue(state.bankFilters, chip.dataset.group, chip.dataset.value);
      updateBankFilterUI();
      renderBank();
    });
  });

  el.clearBankFiltersBtn.addEventListener('click', clearBankFilters);
  el.practiceFromBankBtn.addEventListener('click', practiceFromBank);

  el.practiceCount.addEventListener('input', updateFilterUI);
  if (el.practiceUnsolvedOnly) {
    el.practiceUnsolvedOnly.addEventListener('change', updateFilterUI);
  }
  el.clearFiltersBtn.addEventListener('click', clearFilters);
  el.startPracticeBtn.addEventListener('click', startPractice);
  el.finishPracticeBtn.addEventListener('click', endPractice);
  el.nextQuestionBtn.addEventListener('click', nextPracticeQuestion);

  el.practiceCard.addEventListener('click', event => {
    const flagBtn = event.target.closest('[data-action="open-flag"]');
    if (flagBtn && !flagBtn.disabled) {
      const current = state.practice.questions[state.practice.index];
      if (current) openFlagDialog(current);
      return;
    }
    const submitBtn = event.target.closest('[data-action="submit-multi"]');
    if (submitBtn && !submitBtn.disabled) {
      submitMultiPracticeAnswer();
      return;
    }
    const btn = event.target.closest('.option-btn');
    if (!btn || btn.disabled) return;
    selectPracticeOption(btn.dataset.option);
  });

  if (el.flagForm) {
    el.flagForm.addEventListener('submit', submitAnswerFlag);
  }
  if (el.flagCancelBtn) {
    el.flagCancelBtn.addEventListener('click', () => el.flagDialog?.close());
  }

  if (el.flagsReviewList) {
    el.flagsReviewList.addEventListener('click', event => {
      const approveBtn = event.target.closest('.approve-flag-btn');
      if (approveBtn) {
        approveAnswerFlag(approveBtn.dataset.flagId);
        return;
      }
      const rejectBtn = event.target.closest('.reject-flag-btn');
      if (rejectBtn) {
        const note = prompt('Optional note for rejection (leave blank to skip):') || '';
        rejectAnswerFlag(rejectBtn.dataset.flagId, note);
      }
    });
    el.flagsReviewList.addEventListener('submit', event => {
      const form = event.target.closest('.flag-admin-form');
      if (!form) return;
      event.preventDefault();
      saveFlagAdminEdit(form);
    });
  }

  if (el.syncFlagsBtn) {
    el.syncFlagsBtn.addEventListener('click', () => syncFlagsFromRemote({ silent: false }));
  }
  if (el.publishFlagsBtn) {
    el.publishFlagsBtn.addEventListener('click', publishFlagsForDevices);
  }

  el.mcqForm.addEventListener('submit', event => {
    event.preventDefault();
    const id = el.editId.value || makeId();
    const success = upsertQuestion({
      id,
      question: el.fQuestion.value,
      option_a: el.fOptionA.value,
      option_b: el.fOptionB.value,
      option_c: el.fOptionC.value,
      option_d: el.fOptionD.value,
      answer: [el.fAnswerA, el.fAnswerB, el.fAnswerC, el.fAnswerD]
        .filter(box => box.checked)
        .map(box => box.value)
        .join(','),
      explanation: el.fExplanation.value,
      whyWrong: readWhyWrongFromForm(),
      questionImage: el.fQuestionImageData.value,
      explanationImage: el.fExplanationImageData.value,
      subject: el.fSubject.value,
      topic: el.fTopic.value,
      subtopic: el.fSubtopic.value,
      tags: el.fTags.value
    });
    if (success) {
      resetForm();
      switchTab('bank');
    }
  });

  el.cancelEditBtn.addEventListener('click', resetForm);
  el.bankSearch.addEventListener('input', event => {
    state.bankSearch = event.target.value;
    state.bankPage = 1;
    renderBank();
  });

  bindSearchPalette();

  el.bankList.addEventListener('change', event => {
    const imageInput = event.target.closest('.image-file-input');
    if (imageInput) handleInlineImageChange(imageInput);
  });

  el.bankList.addEventListener('click', event => {
    const filterBadge = event.target.closest('.filter-badge');
    const editBtn = event.target.closest('.edit-btn');
    const deleteBtn = event.target.closest('.delete-btn');
    const cancelBtn = event.target.closest('.cancel-inline-btn');
    const removeImageBtn = event.target.closest('.remove-image-btn');
    const revealBtn = event.target.closest('.reveal-answer-btn');

    if (removeImageBtn) {
      handleInlineImageRemove(removeImageBtn);
      return;
    }

    if (filterBadge) {
      applyQuickFilter(filterBadge.dataset.group, filterBadge.dataset.value);
      return;
    }
    if (revealBtn) {
      const card = revealBtn.closest('.bank-card');
      const section = card?.querySelector('.bank-answer-section');
      if (section) {
        const nowVisible = section.hidden;
        section.hidden = !nowVisible;
        revealBtn.textContent = nowVisible ? 'Hide Answer' : 'Show Answer';
      }
      return;
    }
    if (editBtn) startEdit(editBtn.dataset.id);
    if (deleteBtn) deleteQuestion(deleteBtn.dataset.id);
    if (cancelBtn) cancelInlineEdit();
  });

  el.bankList.addEventListener('submit', event => {
    const form = event.target.closest('.inline-edit-form');
    if (!form) return;
    event.preventDefault();
    saveInlineEdit(form);
  });

  if (el.themeToggleBtn) el.themeToggleBtn.addEventListener('click', toggleTheme);

  el.importFile.addEventListener('change', event => importFile(event.target.files[0]));
  el.loadSampleBtn.addEventListener('click', loadSampleData);
  el.exportJsonBtn.addEventListener('click', exportJson);
  el.exportCsvBtn.addEventListener('click', exportCsv);
  el.bankExportJsonBtn.addEventListener('click', exportJson);
  el.bankExportCsvBtn.addEventListener('click', exportCsv);
  if (el.bankToggleAnswersBtn) {
    el.bankToggleAnswersBtn.addEventListener('click', () => {
      state.bankShowAnswers = !state.bankShowAnswers;
      el.bankToggleAnswersBtn.textContent = state.bankShowAnswers ? 'Hide All Answers' : 'Show All Answers';
      renderBank();
    });
  }
  el.resetAllBtn.addEventListener('click', resetAllData);

  if (el.syncBankBtn) {
    el.syncBankBtn.addEventListener('click', () => syncFromRemote({ force: true }));
  }

  // GitHub token management
  if (el.saveGithubTokenBtn) {
    el.saveGithubTokenBtn.addEventListener('click', () => {
      const token = (el.githubTokenInput?.value || '').trim();
      if (!token) { alert('Paste a GitHub PAT first.'); return; }
      localStorage.setItem('neet-github-token', token);
      el.githubTokenInput.value = '';
      if (el.githubTokenStatus) el.githubTokenStatus.textContent = 'Token saved on this device.';
    });
  }
  if (el.clearGithubTokenBtn) {
    el.clearGithubTokenBtn.addEventListener('click', () => {
      localStorage.removeItem('neet-github-token');
      if (el.githubTokenInput) el.githubTokenInput.value = '';
      if (el.githubTokenStatus) el.githubTokenStatus.textContent = 'Token cleared.';
    });
  }
  if (el.pushBankNowBtn) {
    el.pushBankNowBtn.addEventListener('click', () => {
      if (!requireAdmin('push bank to GitHub')) return;
      pushBankToGitHub(false);
    });
  }
  // Show saved-token indicator on load
  if (el.githubTokenStatus && getGitHubToken()) {
    el.githubTokenStatus.textContent = 'Token is saved on this device.';
  }

  if (el.adminUnlockBtn) {
    el.adminUnlockBtn.addEventListener('click', () => {
      if (isAdmin()) lockAdmin();
      else openAdminDialog();
    });
  }

  if (el.adminSubmitBtn) {
    el.adminSubmitBtn.addEventListener('click', event => {
      event.preventDefault();
      const ok = unlockAdmin(el.adminPinInput.value);
      if (!ok) {
        el.adminDialogError.textContent = 'Incorrect admin PIN.';
        el.adminDialogError.hidden = false;
        el.adminPinInput.focus();
        el.adminPinInput.select();
        return;
      }
      el.adminDialog?.close();
    });
  }

  if (el.adminForm) {
    el.adminForm.addEventListener('submit', event => {
      event.preventDefault();
      el.adminSubmitBtn?.click();
    });
  }

  if (el.adminCancelBtn) {
    el.adminCancelBtn.addEventListener('click', () => {
      el.adminDialogError.hidden = true;
      el.adminDialog?.close();
    });
  }

  if (el.publishBankBtn) {
    el.publishBankBtn.addEventListener('click', publishBankForDevices);
  }

  if (el.studentSelect) {
    el.studentSelect.addEventListener('change', () => setActiveStudent(el.studentSelect.value));
  }

  if (el.studentForm) {
    el.studentForm.addEventListener('submit', event => {
      event.preventDefault();
      setActiveStudent(el.studentDialogSelect.value);
      el.studentDialog?.close();
    });
  }

  document.addEventListener('change', event => {
    if (event.target.id === 'auditStudentSelect') {
      state.progressViewStudentId = event.target.value;
      refreshLearningViews();
    }
    if (event.target.id === 'auditFilterSelect') {
      state.auditFilter = event.target.value;
      refreshLearningViews();
    }
  });

  const syncProgress = () => syncProgressFromRemote({ silent: false });
  if (el.syncProgressBtn) el.syncProgressBtn.addEventListener('click', syncProgress);
  if (el.syncProgressPanelBtn) el.syncProgressPanelBtn.addEventListener('click', syncProgress);
  if (el.publishProgressBtn) el.publishProgressBtn.addEventListener('click', publishProgressForDevices);

}

async function init() {
  // Wire up the views layer first so any refresh triggered during the
  // auto-sync steps below has its dependencies available (state, el, helpers).
  NeetViews.init({
    state,
    el,
    escapeHtml,
    summarizeStudent: summarizeStudentForViews,
    getRevisionPlan: getRevisionPlanForStudent,
    buildCurriculumTree: buildCurriculumTreeForStudent,
    findChapter: (tree, name) => NeetCurriculum.findChapter(tree, name),
    getQuestionStatus,
    getAuditLog: getAuditLogForStudent,
    getCoachInsights: getCoachInsightsForStudent,
    populateStudentSelect
  });

  state.questions = await loadQuestionsAsync();
  await loadProgressAsync();
  await loadFlagsAsync();

  const config = getAppConfig();
  if (clean(config.remoteBankUrl) && config.autoSyncOnLoad) {
    await syncFromRemote({ silent: true });
  } else {
    await maybeSyncFromRemote();
  }

  if (clean(config.remoteProgressUrl) && config.autoSyncOnLoad) {
    await syncProgressFromRemote({ silent: true });
  }

  if (clean(config.remoteFlagsUrl) && config.autoSyncOnLoad) {
    await syncFlagsFromRemote({ silent: true });
  }

  if (!state.questions.length && !clean(config.remoteBankUrl)) {
    sampleQuestions.forEach(raw => {
      const item = normaliseQuestion(raw);
      if (item) state.questions.push(item);
    });
    if (state.questions.length) await persistQuestions();
  }
  migrateKnownWhyWrongNotes();
  bindImageControl(
    el.fQuestionImageFile,
    el.fQuestionImageData,
    el.fQuestionImagePreviewWrap,
    el.fQuestionImagePreview,
    el.fQuestionImageRemove
  );
  bindImageControl(
    el.fExplanationImageFile,
    el.fExplanationImageData,
    el.fExplanationImagePreviewWrap,
    el.fExplanationImagePreview,
    el.fExplanationImageRemove
  );

  initTheme();
  bindEvents();
  applyRoleUI();
  refreshUI();

  getConfiguredStudents().forEach(name => ensureProgressStudent(studentIdFromName(name), name));

  if (!state.activeStudentId) {
    openStudentDialog();
  } else {
    setActiveStudent(state.activeStudentId);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// JOURNEY MODULE — per-student Physics journey tracker
// ═══════════════════════════════════════════════════════════════════════════

const JRN = {
  mocks:    id => `neet-phys-mocks-${id}`,
  errors:   id => `neet-phys-errors-${id}`,
  revision: id => `neet-phys-revision-${id}`,
  checklist:id => `neet-phys-checklist-${id}`,
  get(key, fb = []) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; }
  },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
};

const REV_OFFSETS = [0, 1, 7, 21, 45, 75];

function jrnTodayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function jrnToDate(iso) { const d = new Date(iso); d.setHours(0,0,0,0); return d; }
function jrnDaysFrom(iso) {
  return Math.round((jrnToDate(iso) - jrnToDate(jrnTodayISO())) / 86400000);
}
function jrnAddDays(iso, n) {
  const d = jrnToDate(iso); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function jrnNextDue(row) {
  const ticks = row.ticks || Array(6).fill(false);
  const idx = ticks.findIndex(t => !t);
  if (idx === -1) return { label: 'Done', date: '—', idx: -1, due: false };
  const date = jrnAddDays(row.added || jrnTodayISO(), REV_OFFSETS[idx]);
  const days = jrnDaysFrom(date);
  return { label: `R${idx + 1}`, date, idx, due: days <= 0, overdue: days < 0 };
}
function jrnEscHtml(s) {
  return String(s ?? '').replace(/[&<>'"]/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
}

// Get unique chapter names from the loaded bank
function jrnGetBankChapters() {
  const seen = new Set();
  const list = [];
  (state.questions || []).forEach(q => {
    const t = q.topic || '';
    if (t && !seen.has(t)) { seen.add(t); list.push(t); }
  });
  list.sort((a, b) => {
    const na = parseInt(a.match(/\d+/)?.[0] || 0);
    const nb = parseInt(b.match(/\d+/)?.[0] || 0);
    return na - nb || a.localeCompare(b);
  });
  return list;
}

// ── Journey render entry point ───────────────────────────────────────────────

function jrnBuildCard(name, activeId) {
  const id = studentIdFromName(name);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const prog = state.progress.students[id] || {};
  const qs = prog.questions || {};
  const totalDone = Object.keys(qs).length;
  const correct = Object.values(qs).filter(q => q.correct).length;
  const acc = totalDone ? Math.round(correct / totalDone * 100) : 0;
  const errors = JRN.get(JRN.errors(id)).filter(e => (e.status || 'Open') !== 'Fixed');
  const revDue = JRN.get(JRN.revision(id)).filter(r => jrnNextDue(r).due).length;
  const mocks = JRN.get(JRN.mocks(id));
  const lastMock = mocks.length ? mocks[0].score : '—';
  const isActive = id === activeId;
  return `<div class="journey-student-card ${isActive ? 'active-student' : ''}" onclick="jrnOpenStudent('${jrnEscHtml(id)}')">
    <h3><span class="avatar">${jrnEscHtml(initials)}</span>${jrnEscHtml(name)}</h3>
    <div class="journey-mini-stats">
      <div class="journey-mini-stat"><span>MCQs done</span><strong>${totalDone}</strong></div>
      <div class="journey-mini-stat"><span>Accuracy</span><strong>${acc}%</strong></div>
      <div class="journey-mini-stat"><span>Open errors</span><strong style="${errors.length > 0 ? 'color:var(--danger)' : ''}">${errors.length}</strong></div>
      <div class="journey-mini-stat"><span>Last mock</span><strong>${lastMock === '—' ? '—' : lastMock + '/180'}</strong></div>
    </div>
    ${revDue > 0 ? `<div class="journey-badge due" style="margin-bottom:6px">↻ ${revDue} revision${revDue > 1 ? 's' : ''} due</div>` : ''}
    <button class="primary-btn small" style="width:100%;margin-top:4px" onclick="event.stopPropagation();jrnOpenStudent('${jrnEscHtml(id)}')">Open Journey</button>
  </div>`;
}

// Refreshes only the summary cards — does NOT re-render the student detail or resources
function jrnRefreshCards() {
  const grid = document.querySelector('.journey-student-grid');
  if (!grid) return;
  const activeId = state.activeStudentId;
  grid.innerHTML = getConfiguredStudents().map(n => jrnBuildCard(n, activeId)).join('');
}

function renderJourney() {
  const container = document.getElementById('journeyView');
  if (!container) return;

  const activeId = state.activeStudentId;
  const studentCards = getConfiguredStudents().map(n => jrnBuildCard(n, activeId)).join('');

  container.innerHTML = `
    <div class="view-hero compact">
      <div class="journey-hero">
        <h2>Student Journey</h2>
        <p>Track each student's Physics progress, errors, mock scores and revision schedule. Switch students using the selector above.</p>
      </div>
    </div>
    <div class="journey-student-grid">${studentCards}</div>
    <div id="jrnDetail"></div>
    <div id="jrnResources" style="margin-top:32px">${jrnResourcesHtml()}</div>`;

  if (activeId) jrnRenderDetail(activeId);
  jrnInitNcertGrid();
}

function jrnOpenStudent(id) {
  setActiveStudent(id);
  jrnRenderDetail(id);
  document.getElementById('jrnDetail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Re-render cards to highlight active
  renderJourney();
}

// ── Per-student detail view ──────────────────────────────────────────────────

let jrnTimerId = null;
let jrnTimerSec = 50 * 60;
let jrnTimerInit = 50 * 60;

function jrnRenderDetail(id) {
  const detail = document.getElementById('jrnDetail');
  if (!detail) return;
  const name = (state.progress.students[id]?.name) ||
    getConfiguredStudents().find(n => studentIdFromName(n) === id) || id;

  detail.innerHTML = `
    <div class="journey-detail">
      <div class="journey-detail-header">
        <span class="avatar" style="width:42px;height:42px;font-size:1rem;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:inline-flex;align-items:center;justify-content:center;color:white;font-weight:800;flex-shrink:0">
          ${jrnEscHtml(name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase())}
        </span>
        <div>
          <h3 style="margin:0">${jrnEscHtml(name)}'s Journey</h3>
          <span style="font-size:0.8rem;color:var(--muted)">Physics · NEET preparation tracker</span>
        </div>
      </div>

      <div class="journey-tabs">
        <button class="journey-tab active" onclick="jrnTab(this,'jrn-plan')">Daily Plan</button>
        <button class="journey-tab" onclick="jrnTab(this,'jrn-mock')">Mock Analyzer</button>
        <button class="journey-tab" onclick="jrnTab(this,'jrn-errors')">Error Log</button>
        <button class="journey-tab" onclick="jrnTab(this,'jrn-revision')">Revision Tracker</button>
        <button class="journey-tab" onclick="jrnTab(this,'jrn-timer')">Focus Timer</button>
        <button class="journey-tab" onclick="jrnTab(this,'jrn-roadmap')">Roadmap</button>
      </div>

      <div id="jrn-plan" class="journey-tab-panel active">${jrnPlanHtml(id)}</div>
      <div id="jrn-mock" class="journey-tab-panel">${jrnMockHtml(id)}</div>
      <div id="jrn-errors" class="journey-tab-panel">${jrnErrorsHtml(id)}</div>
      <div id="jrn-revision" class="journey-tab-panel">${jrnRevisionHtml(id)}</div>
      <div id="jrn-timer" class="journey-tab-panel">${jrnTimerHtml()}</div>
      <div id="jrn-roadmap" class="journey-tab-panel">${jrnRoadmapHtml()}</div>
    </div>`;
}

function jrnTab(btn, panelId) {
  const detail = document.getElementById('jrnDetail');
  if (!detail) return;
  detail.querySelectorAll('.journey-tab').forEach(b => b.classList.remove('active'));
  detail.querySelectorAll('.journey-tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
}

// ── Daily Plan ───────────────────────────────────────────────────────────────

function jrnPlanHtml(id) {
  const errors = JRN.get(JRN.errors(id)).filter(e => (e.status||'Open') !== 'Fixed');
  const revDue = JRN.get(JRN.revision(id)).filter(r => jrnNextDue(r).due);
  const mocks = JRN.get(JRN.mocks(id));
  const prog = state.progress.students[id] || {};
  const qs = prog.questions || {};
  const totalDone = Object.keys(qs).length;

  const weakChapters = {};
  Object.entries(qs).forEach(([qid, rec]) => {
    if (!rec.correct) {
      const q = state.questions.find(x => x.id === qid);
      if (q?.topic) weakChapters[q.topic] = (weakChapters[q.topic] || 0) + 1;
    }
  });
  const weakChap = Object.entries(weakChapters).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]).join(', ') || 'None';
  const weakSubCnt = Object.values(weakChapters).reduce((a,b)=>a+b,0);

  const openMistakeList = errors.slice(0,3).map(e=>e.chapter).join(', ');
  const dueRevList = revDue.slice(0,3).map(r=>r.chapter).join(', ');

  const topMistake = (() => {
    const cnt = {};
    errors.forEach(e => { cnt[e.type] = (cnt[e.type]||0)+1; });
    const top = Object.entries(cnt).sort((a,b)=>b[1]-a[1]);
    return top.length ? top[0][0] : '—';
  })();
  const lastScore = mocks.length ? mocks[0].score : null;

  return `
    <div class="journey-insight-grid">
      <div class="journey-insight"><span>Open errors</span><strong>${errors.length}</strong><small>Not yet fixed</small></div>
      <div class="journey-insight"><span>Revisions due</span><strong>${revDue.length}</strong><small>Overdue or today</small></div>
      <div class="journey-insight"><span>Weak chapters</span><strong style="font-size:0.95rem;line-height:1.3">${weakChap ? weakChap.split(',')[0] : '—'}</strong><small>${weakSubCnt} wrong MCQs</small></div>
      <div class="journey-insight"><span>Top mistake</span><strong style="font-size:0.95rem;line-height:1.3">${jrnEscHtml(topMistake)}</strong><small>Most frequent error type</small></div>
    </div>
    <div class="journey-form-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">
      <label>Study hours today
        <input id="jrnPlanHours" type="number" min="1" max="12" step="0.5" value="6">
      </label>
      <label>Energy level
        <select id="jrnPlanEnergy">
          <option value="high">High</option>
          <option value="medium" selected>Medium</option>
          <option value="low">Low</option>
        </select>
      </label>
      <label>Prep phase
        <select id="jrnPlanPhase">
          <option value="foundation">Foundation</option>
          <option value="post-syllabus">Post-syllabus</option>
          <option value="mock-phase" selected>Mock phase</option>
          <option value="final-month">Final 30 days</option>
        </select>
      </label>
    </div>
    <div class="journey-btn-row">
      <button class="primary-btn small" onclick="jrnGeneratePlan('${jrnEscHtml(id)}')">Generate Today's Plan</button>
      <button class="secondary-btn small" onclick="jrnCopyPlan()">Copy Plan</button>
    </div>
    <div id="jrnPlanOutput" class="journey-plan-list"></div>`;
}

function jrnGeneratePlan(id) {
  const hours = Math.max(1, Math.min(12, Number(document.getElementById('jrnPlanHours')?.value || 6)));
  const energy = document.getElementById('jrnPlanEnergy')?.value || 'medium';
  const phase = document.getElementById('jrnPlanPhase')?.value || 'mock-phase';
  const totalMin = Math.round(hours * 60);

  const errors = JRN.get(JRN.errors(id)).filter(e => (e.status||'Open') !== 'Fixed');
  const revDue = JRN.get(JRN.revision(id)).filter(r => jrnNextDue(r).due);
  const prog = state.progress.students[id] || {};
  const qs = prog.questions || {};

  const weakChapters = {};
  Object.entries(qs).forEach(([qid, rec]) => {
    if (!rec.correct) {
      const q = state.questions.find(x => x.id === qid);
      if (q?.topic) weakChapters[q.topic] = (weakChapters[q.topic]||0)+1;
    }
  });
  const weakChap = Object.keys(weakChapters).sort((a,b)=>weakChapters[b]-weakChapters[a])[0] || '';

  const base = energy === 'low' ? 35 : energy === 'high' ? 60 : 50;
  const long = energy === 'low' ? 50 : energy === 'high' ? 90 : 70;
  const blocks = [];
  const add = (min, title, detail, tag) => blocks.push({ min, title, detail, tag });

  if (revDue.length) add(base, 'Due Revision Queue', `Complete overdue revisions: ${revDue.slice(0,3).map(r=>r.chapter).join(', ')}${revDue.length>3?'…':''}. Revision-first is the most consistent topper pattern.`, 'due');
  if (errors.length) add(base, 'Mistake Repair Block', `Reattempt and re-learn: ${errors.slice(0,3).map(e=>e.chapter).join(', ')}. Write what you did wrong vs what is correct.`, 'hot');

  if (phase === 'foundation') {
    add(long, 'HC Verma / NCERT Concept Study', 'Study one new Physics chapter. Derive key formulas once, then close the book and recall.', 'ncert');
    add(base, 'Immediate MCQ Practice', 'Solve 50–80 MCQs from today\'s topic in the app immediately after reading. Log every miss.', 'mcq');
    add(35, 'Formula Notebook Update', 'Add today\'s formulas to your formula sheet. This creates your revision artifact.', 'formula');
  } else if (phase === 'post-syllabus') {
    add(long, 'HC Verma Chapter PYQ Drill', `Focus on: ${weakChap || 'your weakest chapter'}. Classify each error as concept, formula, silly or guesswork.`, 'pyq');
    add(base, weakChap ? `${weakChap.replace(/Chapter \d+: /,'')} Repair` : 'Weak Chapter Repair', 'Re-read theory for one weak chapter, then solve 40 timed questions.', 'weak');
    add(base, 'Mixed MCQ Practice', 'Do 60–100 mixed MCQs across topics. Note recurring error patterns.', 'mcq');
    add(40, 'Sectional Test', 'Take a timed chapter-level test and record mistakes in error log.', 'test');
  } else if (phase === 'final-month') {
    add(long, 'Formula + Graph Rapid Revision', 'Revise all formulas, important graphs (v-t, x-t, P-V etc.) and derivation checkpoints.', 'formula');
    add(base, 'Physics PYQ Mixed Set', 'Do 40 NEET PYQs across random chapters under exam-like timing.', 'pyq');
    add(long, 'Mock / Old Mock Analysis', 'Attempt a full Physics timed mock or deeply analyze the last mock. Fix every wrong/guessed question.', 'mock');
    add(30, 'Error Log Final Pass', 'Read through all open error-log entries. If you truly know it now, mark it fixed.', 'errors');
  } else { // mock-phase
    add(long, 'Timed Physics Practice Block', 'Attempt 45 questions in 40 minutes. Simulate exam pressure. Start with high-confidence chapters.', 'mock');
    add(base, 'Mock Analysis Deep Work', 'For every wrong/guessed question: find the concept, re-read it, reattempt tomorrow.', 'analysis');
    add(base, weakChap ? `${weakChap.replace(/Chapter \d+: /,'')} Targeted Drill` : 'Weak Chapter Drill', `Focused repair: ${weakChap || 'pick your weakest chapter from audit'}. Theory + 30 timed questions.`, 'weak');
    add(35, 'HC Verma Active Recall', 'Read one chapter, close book, write/recite key formulas and concepts from memory.', 'ncert');
  }

  blocks.sort((a,b) => (b.tag==='due'?2:b.tag==='hot'?1:0) - (a.tag==='due'?2:a.tag==='hot'?1:0));
  let used = 0;
  const selected = [];
  for (const b of blocks) {
    if (used >= totalMin) break;
    const min = Math.min(b.min, totalMin - used);
    if (min >= 20) { selected.push({ ...b, min }); used += min; }
  }
  if (used < totalMin - 15) selected.push({ min: totalMin - used, title: 'Buffer / Backlog', detail: 'Use for pending revision, error log review, or reattempting wrong questions.', tag: '' });

  const phaseLabel = { foundation:'Foundation phase', 'post-syllabus':'Post-syllabus phase', 'mock-phase':'Mock-test phase', 'final-month':'Final 30 days' }[phase];
  const html = `<div class="journey-flash info"><strong>${phaseLabel}:</strong> Plan uses topper patterns — revision-first, immediate practice, mistake repair, timed simulation.</div>` +
    selected.map((b,i) => `<div class="journey-plan-item">
      <div class="journey-plan-time">${b.min} min</div>
      <div><h4>${i+1}. ${jrnEscHtml(b.title)}</h4><p>${jrnEscHtml(b.detail)}</p></div>
    </div>`).join('');

  const out = document.getElementById('jrnPlanOutput');
  if (out) out.innerHTML = html;
}

function jrnCopyPlan() {
  const items = [...document.querySelectorAll('#jrnPlanOutput .journey-plan-item')];
  if (!items.length) { showToast('Generate a plan first.', 'warn'); return; }
  const text = items.map(x => x.innerText.trim()).join('\n\n');
  navigator.clipboard?.writeText(text).then(() => showToast('Plan copied!', 'success'));
}

// ── Mock Analyzer ────────────────────────────────────────────────────────────

function jrnMockHtml(id) {
  const mocks = JRN.get(JRN.mocks(id));
  const rows = mocks.map(m => `<tr>
    <td>${jrnEscHtml(m.name)}</td>
    <td><strong>${m.score}</strong></td>
    <td>${jrnEscHtml(m.issue || '—')}</td>
    <td>${jrnEscHtml(m.date ? m.date.slice(0,10) : '')}</td>
    <td><button class="secondary-btn small" onclick="jrnDeleteMock('${jrnEscHtml(id)}','${jrnEscHtml(m.id)}')">Delete</button></td>
  </tr>`).join('') || '<tr><td colspan="5">No mocks recorded yet.</td></tr>';

  const best = mocks.length ? Math.max(...mocks.map(m=>m.score)) : 0;
  const avg  = mocks.length ? Math.round(mocks.reduce((s,m)=>s+m.score,0)/mocks.length) : 0;
  const trend = mocks.length > 1 ? (mocks[0].score > mocks[1].score ? '↑ Improving' : mocks[0].score < mocks[1].score ? '↓ Declining' : '→ Stable') : '—';

  return `
    <div class="journey-stat-row">
      <div class="journey-stat"><span>Mocks taken</span><strong>${mocks.length}</strong></div>
      <div class="journey-stat ${best >= 150 ? 'good' : best >= 120 ? '' : 'warn'}"><span>Best score</span><strong>${best}/180</strong></div>
      <div class="journey-stat"><span>Average</span><strong>${avg ? avg+'/180' : '—'}</strong></div>
      <div class="journey-stat"><span>Trend</span><strong style="font-size:1rem">${trend}</strong></div>
    </div>
    <div style="background:var(--surface-2);border-radius:var(--radius);padding:16px;margin-bottom:16px">
      <h4 style="margin:0 0 12px;font-size:0.95rem">Record New Mock</h4>
      <div class="journey-form-grid">
        <label>Mock name / date<input id="jrnMockName" placeholder="e.g., Full Mock 3 · 9 Jun"></label>
        <label>Physics score (0–180)<input id="jrnMockScore" type="number" min="0" max="180" placeholder="0–180"></label>
        <label>Concept mistakes<input id="jrnMockConcept" type="number" min="0" value="0"></label>
        <label>Silly mistakes<input id="jrnMockSilly" type="number" min="0" value="0"></label>
        <label>Time-pressure mistakes<input id="jrnMockTime" type="number" min="0" value="0"></label>
        <label>Formula gaps<input id="jrnMockFormula" type="number" min="0" value="0"></label>
      </div>
      <div class="journey-btn-row">
        <button class="primary-btn small" onclick="jrnAddMock('${jrnEscHtml(id)}')">Save & Analyze</button>
        <button class="secondary-btn small" onclick="jrnClearMockInputs()">Clear</button>
      </div>
      <div id="jrnMockAdvice" style="display:none"></div>
    </div>
    <div class="journey-table-wrap">
      <table class="journey-table" id="jrnMockTable_${jrnEscHtml(id)}">
        <thead><tr><th>Mock</th><th>Score / 180</th><th>Main Issue</th><th>Date</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function jrnAddMock(id) {
  const score = Number(document.getElementById('jrnMockScore')?.value || 0);
  const name  = document.getElementById('jrnMockName')?.value.trim() || jrnTodayISO();
  const issues = {
    'Concept gap':    Number(document.getElementById('jrnMockConcept')?.value||0),
    'Silly mistake':  Number(document.getElementById('jrnMockSilly')?.value||0),
    'Time pressure':  Number(document.getElementById('jrnMockTime')?.value||0),
    'Formula gap':    Number(document.getElementById('jrnMockFormula')?.value||0),
  };
  const topIssue = Object.entries(issues).sort((a,b)=>b[1]-a[1]).find(x=>x[1]>0)?.[0] || 'None logged';

  const advice = [];
  if (score < 120) advice.push('Score below 120: Increase formula practice and attempt HC Verma Objective II questions daily.');
  if (score >= 120 && score < 150) advice.push('Score 120–149: Focus on converting concept errors to zero. Do chapter PYQs for each weak topic.');
  if (score >= 150) advice.push('Score 150+: Strong. Focus on eliminating silly mistakes and improving time efficiency.');
  if (topIssue === 'Silly mistake') advice.push('For silly mistakes: underline key terms in each question, check units, and slow down the first read.');
  if (topIssue === 'Formula gap') advice.push('For formula gaps: revise your formula sheet every 3 days minimum. Re-derive formulas once a week.');
  if (topIssue === 'Time pressure') advice.push('For time pressure: practice 45 Qs in 40 minutes regularly. Skip and return — don\'t spend >90 s on any question.');
  if (topIssue === 'Concept gap') advice.push('For concept gaps: re-read HC Verma theory for the specific chapter, then solve 30 easy MCQs before harder ones.');

  const advEl = document.getElementById('jrnMockAdvice');
  if (advEl) {
    advEl.style.display = 'block';
    advEl.innerHTML = `<div class="journey-flash ${score>=150?'good':''}" style="margin-top:12px"><strong>Analysis:</strong><br>${advice.join('<br>')}</div>`;
  }

  const mocks = JRN.get(JRN.mocks(id));
  mocks.unshift({ id: crypto.randomUUID?.() || String(Date.now()), name, score, issue: topIssue, date: new Date().toISOString() });
  JRN.set(JRN.mocks(id), mocks.slice(0, 50));

  // Refresh table
  const tbody = document.querySelector(`#jrnMockTable_${id} tbody`);
  if (tbody) tbody.innerHTML = mocks.map(m => `<tr>
    <td>${jrnEscHtml(m.name)}</td><td><strong>${m.score}</strong></td>
    <td>${jrnEscHtml(m.issue||'—')}</td><td>${jrnEscHtml(m.date?.slice(0,10)||'')}</td>
    <td><button class="secondary-btn small" onclick="jrnDeleteMock('${jrnEscHtml(id)}','${jrnEscHtml(m.id)}')">Delete</button></td>
  </tr>`).join('');

  showToast(`Mock saved (${score}/180 · ${topIssue})`, 'success');
  jrnRefreshCards();
}

function jrnDeleteMock(id, mockId) {
  const mocks = JRN.get(JRN.mocks(id)).filter(m => m.id !== mockId);
  JRN.set(JRN.mocks(id), mocks);
  // Refresh just the mock table without re-rendering the whole detail
  const tbody = document.querySelector(`#jrnMockTable_${id} tbody`);
  if (tbody) tbody.innerHTML = mocks.length ? mocks.map(m => `<tr>
    <td>${jrnEscHtml(m.name)}</td><td><strong>${m.score}</strong></td>
    <td>${jrnEscHtml(m.issue||'—')}</td><td>${jrnEscHtml(m.date?.slice(0,10)||'')}</td>
    <td><button class="secondary-btn small" onclick="jrnDeleteMock('${jrnEscHtml(id)}','${jrnEscHtml(m.id)}')">Delete</button></td>
  </tr>`).join('') : '<tr><td colspan="5">No mocks recorded yet.</td></tr>';
  jrnRefreshCards();
}

function jrnClearMockInputs() {
  ['jrnMockName','jrnMockScore','jrnMockConcept','jrnMockSilly','jrnMockTime','jrnMockFormula']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = id.includes('Mock') && !['jrnMockName','jrnMockScore'].includes(id) ? 0 : ''; });
}

// ── Error Log ────────────────────────────────────────────────────────────────

function jrnErrorsHtml(id) {
  const errors = JRN.get(JRN.errors(id));
  const chapters = jrnGetBankChapters();
  const chapterOptions = chapters.map(c => `<option value="${jrnEscHtml(c)}">${jrnEscHtml(c)}</option>`).join('');
  const open = errors.filter(e => (e.status||'Open') !== 'Fixed').length;
  const fixed = errors.length - open;
  const due = errors.filter(e => e.retest && jrnDaysFrom(e.retest) <= 0 && (e.status||'Open') !== 'Fixed').length;
  const cnt = {}; errors.forEach(e => { cnt[e.type] = (cnt[e.type]||0)+1; });
  const topType = Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';

  const rows = errors.map(e => {
    const status = e.status || 'Open';
    const isDue = e.retest && jrnDaysFrom(e.retest) <= 0 && status !== 'Fixed';
    return `<tr>
      <td>${jrnEscHtml(e.date||'')}</td>
      <td>${jrnEscHtml(e.chapter)}<br><small style="color:var(--muted)">${jrnEscHtml(e.source||'')}</small></td>
      <td>${jrnEscHtml(e.type)}</td>
      <td style="max-width:200px;white-space:normal">${jrnEscHtml(e.fix)}</td>
      <td><span class="journey-badge ${status==='Fixed'?'fixed':'open'}">${jrnEscHtml(status)}</span></td>
      <td><span class="journey-badge ${isDue?'due':''}">${jrnEscHtml(e.retest||'—')}</span></td>
      <td>
        <button class="secondary-btn small" onclick="jrnToggleError('${jrnEscHtml(id)}','${jrnEscHtml(e.id)}')">${status==='Fixed'?'Reopen':'Fix'}</button>
        <button class="secondary-btn small" onclick="jrnDeleteError('${jrnEscHtml(id)}','${jrnEscHtml(e.id)}')">✕</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="7">No errors logged yet.</td></tr>';

  return `
    <div class="journey-stat-row">
      <div class="journey-stat ${open>0?'warn':'good'}"><span>Open errors</span><strong>${open}</strong></div>
      <div class="journey-stat good"><span>Fixed</span><strong>${fixed}</strong></div>
      <div class="journey-stat ${due>0?'danger':''}"><span>Retest due</span><strong>${due}</strong></div>
      <div class="journey-stat"><span>Top mistake</span><strong style="font-size:0.9rem">${jrnEscHtml(topType)}</strong></div>
    </div>
    <div style="background:var(--surface-2);border-radius:var(--radius);padding:16px;margin-bottom:14px">
      <h4 style="margin:0 0 12px;font-size:0.95rem">Log a New Error</h4>
      <div class="journey-form-grid">
        <label>Date<input id="jrnErrDate" type="date" value="${jrnTodayISO()}"></label>
        <label>Chapter
          <select id="jrnErrChapter">${chapterOptions}</select>
        </label>
        <label>Mistake type
          <select id="jrnErrType">
            <option>Concept not known</option>
            <option>Formula forgotten</option>
            <option>Calculation mistake</option>
            <option>Silly mistake</option>
            <option>Misread question</option>
            <option>Time pressure</option>
            <option>Guesswork error</option>
          </select>
        </label>
        <label>Retest date<input id="jrnErrRetest" type="date"></label>
        <label>Source<input id="jrnErrSource" placeholder="e.g., Mock 4 Q31 / HC Verma Ch8 Ex5"></label>
      </div>
      <div class="journey-form-single">
        <label>What went wrong → what is correct
          <textarea id="jrnErrFix" placeholder="Write the exact correction. e.g., Used v²=u²+2as forgetting direction. Correct: direction matters — use vector form or signed scalars."></textarea>
        </label>
      </div>
      <div class="journey-btn-row">
        <button class="primary-btn small" onclick="jrnAddError('${jrnEscHtml(id)}')">Add Error</button>
        <button class="secondary-btn small" onclick="jrnExportErrors('${jrnEscHtml(id)}')">Export CSV</button>
        <button class="danger-btn small" onclick="jrnClearErrors('${jrnEscHtml(id)}')">Clear All</button>
      </div>
    </div>
    <div class="journey-table-wrap">
      <table class="journey-table" id="jrnErrTable_${jrnEscHtml(id)}">
        <thead><tr><th>Date</th><th>Chapter</th><th>Type</th><th>Fix</th><th>Status</th><th>Retest</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function jrnAddError(id) {
  const chapter = document.getElementById('jrnErrChapter')?.value?.trim();
  const fix = document.getElementById('jrnErrFix')?.value?.trim();
  if (!chapter || !fix) { showToast('Add chapter and the correction note.', 'warn'); return; }
  const item = {
    id: crypto.randomUUID?.() || String(Date.now()),
    date: document.getElementById('jrnErrDate')?.value || jrnTodayISO(),
    chapter,
    type: document.getElementById('jrnErrType')?.value,
    retest: document.getElementById('jrnErrRetest')?.value || '',
    source: document.getElementById('jrnErrSource')?.value?.trim() || '',
    fix,
    status: 'Open'
  };
  const errors = JRN.get(JRN.errors(id));
  errors.unshift(item);
  JRN.set(JRN.errors(id), errors);
  ['jrnErrRetest','jrnErrSource','jrnErrFix'].forEach(k => { const e = document.getElementById(k); if(e) e.value = ''; });
  jrnRefreshErrors(id);
  jrnRefreshCards();
  showToast('Error logged.', 'success');
}

function jrnToggleError(id, errId) {
  const errors = JRN.get(JRN.errors(id));
  const err = errors.find(e => e.id === errId);
  if (err) err.status = (err.status||'Open') === 'Fixed' ? 'Open' : 'Fixed';
  JRN.set(JRN.errors(id), errors);
  jrnRefreshErrors(id);
  jrnRefreshCards();
}

function jrnDeleteError(id, errId) {
  JRN.set(JRN.errors(id), JRN.get(JRN.errors(id)).filter(e => e.id !== errId));
  jrnRefreshErrors(id);
  jrnRefreshCards();
}

function jrnClearErrors(id) {
  if (!confirm('Clear all error-log entries for this student?')) return;
  JRN.set(JRN.errors(id), []);
  jrnRefreshErrors(id);
  jrnRefreshCards();
}

function jrnRefreshErrors(id) {
  const errors = JRN.get(JRN.errors(id));
  const tbody = document.querySelector(`#jrnErrTable_${id} tbody`);
  if (!tbody) return;
  tbody.innerHTML = errors.map(e => {
    const status = e.status || 'Open';
    const isDue = e.retest && jrnDaysFrom(e.retest) <= 0 && status !== 'Fixed';
    return `<tr>
      <td>${jrnEscHtml(e.date||'')}</td>
      <td>${jrnEscHtml(e.chapter)}<br><small style="color:var(--muted)">${jrnEscHtml(e.source||'')}</small></td>
      <td>${jrnEscHtml(e.type)}</td>
      <td style="max-width:200px;white-space:normal">${jrnEscHtml(e.fix)}</td>
      <td><span class="journey-badge ${status==='Fixed'?'fixed':'open'}">${jrnEscHtml(status)}</span></td>
      <td><span class="journey-badge ${isDue?'due':''}">${jrnEscHtml(e.retest||'—')}</span></td>
      <td>
        <button class="secondary-btn small" onclick="jrnToggleError('${jrnEscHtml(id)}','${jrnEscHtml(e.id)}')">${status==='Fixed'?'Reopen':'Fix'}</button>
        <button class="secondary-btn small" onclick="jrnDeleteError('${jrnEscHtml(id)}','${jrnEscHtml(e.id)}')">✕</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="7">No errors logged yet.</td></tr>';
}

function jrnExportErrors(id) {
  const rows = JRN.get(JRN.errors(id));
  if (!rows.length) { showToast('No errors to export.', 'warn'); return; }
  const header = ['Date','Chapter','Mistake Type','Source','Correct Fix','Status','Retest Date'];
  const csv = [header, ...rows.map(e => [e.date,e.chapter,e.type,e.source,e.fix,e.status||'Open',e.retest])]
    .map(row => row.map(v => `"${String(v||'').replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `errors-${id}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ── Revision Tracker ─────────────────────────────────────────────────────────

function jrnRevisionHtml(id) {
  const rows = JRN.get(JRN.revision(id));
  const chapters = jrnGetBankChapters();
  const chapterOptions = chapters.map(c => `<option value="${jrnEscHtml(c)}">${jrnEscHtml(c)}</option>`).join('');

  const ticks = rows.reduce((s,r) => s + (r.ticks||[]).filter(Boolean).length, 0);
  const total = rows.length * 6;
  const pct = total ? Math.round(ticks / total * 100) : 0;
  const dueNow = rows.filter(r => jrnNextDue(r).due).length;

  const tableRows = rows.map(r => {
    const next = jrnNextDue(r);
    const dueLabel = next.idx === -1 ? '<span class="journey-badge done">Completed</span>' :
      `<span class="journey-badge ${next.overdue?'open':next.due?'due':''}">${next.label}: ${next.date}${next.overdue?' (overdue)':next.due?' (today)':''}</span>`;
    const tickCells = (r.ticks||Array(6).fill(false)).map((t,i) =>
      `<td><input type="checkbox" ${t?'checked':''} onchange="jrnToggleRev('${jrnEscHtml(id)}','${jrnEscHtml(r.id)}',${i})"></td>`
    ).join('');
    return `<tr>
      <td>${jrnEscHtml(r.chapter)}</td>
      <td>${dueLabel}</td>
      ${tickCells}
      <td><button class="secondary-btn small" onclick="jrnDeleteRev('${jrnEscHtml(id)}','${jrnEscHtml(r.id)}')">✕</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="9">No chapters added yet.</td></tr>';

  return `
    <div class="journey-stat-row">
      <div class="journey-stat"><span>Chapters</span><strong>${rows.length}</strong></div>
      <div class="journey-stat"><span>Ticks done</span><strong>${ticks}</strong></div>
      <div class="journey-stat ${pct===100?'good':''}"><span>Completion</span><strong>${pct}%</strong></div>
      <div class="journey-stat ${dueNow>0?'warn':'good'}"><span>Due now</span><strong>${dueNow}</strong></div>
    </div>
    <div class="journey-progress-bar"><div class="journey-progress-fill" style="width:${pct}%"></div></div>
    <div class="journey-flash info" style="margin-bottom:12px">Spaced revision: R1 same day · R2 next day · R3 after 7 days · R4 after 21 days · R5 after 45 days · R6 after 75 days</div>
    <div style="background:var(--surface-2);border-radius:var(--radius);padding:14px;margin-bottom:14px">
      <div class="journey-form-grid" style="grid-template-columns:1fr 1fr auto">
        <label>Chapter<select id="jrnRevChapter">${chapterOptions}</select></label>
        <label>Priority
          <select id="jrnRevPriority"><option>High</option><option selected>Medium</option><option>Low</option></select>
        </label>
        <label style="justify-content:end;align-items:end">
          <button class="primary-btn small" onclick="jrnAddRev('${jrnEscHtml(id)}')">Add</button>
        </label>
      </div>
    </div>
    <div class="journey-table-wrap">
      <table class="journey-table" id="jrnRevTable_${jrnEscHtml(id)}">
        <thead><tr><th>Chapter</th><th>Next Due</th><th>R1</th><th>R2</th><th>R3</th><th>R4</th><th>R5</th><th>R6</th><th></th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
    <button class="danger-btn small" style="margin-top:10px" onclick="jrnClearRev('${jrnEscHtml(id)}')">Clear tracker</button>`;
}

function jrnAddRev(id) {
  const chapter = document.getElementById('jrnRevChapter')?.value;
  if (!chapter) return;
  const rows = JRN.get(JRN.revision(id));
  if (rows.find(r => r.chapter === chapter)) { showToast('Already tracking that chapter.', 'warn'); return; }
  rows.unshift({ id: crypto.randomUUID?.() || String(Date.now()), chapter, priority: document.getElementById('jrnRevPriority')?.value || 'Medium', added: jrnTodayISO(), ticks: Array(6).fill(false) });
  JRN.set(JRN.revision(id), rows);
  jrnRefreshRevision(id);
  jrnRefreshCards();
  showToast(`Added revision: ${chapter}`, 'success');
}

function jrnToggleRev(id, rowId, idx) {
  const rows = JRN.get(JRN.revision(id));
  const row = rows.find(r => r.id === rowId);
  if (row) { row.ticks = row.ticks || Array(6).fill(false); row.ticks[idx] = !row.ticks[idx]; }
  JRN.set(JRN.revision(id), rows);
  jrnRefreshRevision(id);
  jrnRefreshCards();
}

function jrnDeleteRev(id, rowId) {
  JRN.set(JRN.revision(id), JRN.get(JRN.revision(id)).filter(r => r.id !== rowId));
  jrnRefreshRevision(id);
  jrnRefreshCards();
}

function jrnClearRev(id) {
  if (!confirm('Clear revision tracker for this student?')) return;
  JRN.set(JRN.revision(id), []);
  jrnRefreshRevision(id);
  jrnRefreshCards();
}

function jrnRefreshRevision(id) {
  const rows = JRN.get(JRN.revision(id));
  const tbody = document.querySelector(`#jrnRevTable_${id} tbody`);
  if (!tbody) return;
  const ticks = rows.reduce((s,r) => s + (r.ticks||[]).filter(Boolean).length, 0);
  const total = rows.length * 6;
  const pct = total ? Math.round(ticks / total * 100) : 0;
  const bar = document.querySelector('#jrn-revision .journey-progress-fill');
  if (bar) bar.style.width = pct + '%';
  tbody.innerHTML = rows.map(r => {
    const next = jrnNextDue(r);
    const dueLabel = next.idx === -1 ? '<span class="journey-badge done">Completed</span>' :
      `<span class="journey-badge ${next.overdue?'open':next.due?'due':''}">${next.label}: ${next.date}${next.overdue?' (overdue)':next.due?' (today)':''}</span>`;
    return `<tr>
      <td>${jrnEscHtml(r.chapter)}</td>
      <td>${dueLabel}</td>
      ${(r.ticks||Array(6).fill(false)).map((t,i) => `<td><input type="checkbox" ${t?'checked':''} onchange="jrnToggleRev('${jrnEscHtml(id)}','${jrnEscHtml(r.id)}',${i})"></td>`).join('')}
      <td><button class="secondary-btn small" onclick="jrnDeleteRev('${jrnEscHtml(id)}','${jrnEscHtml(r.id)}')">✕</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="9">No chapters added yet.</td></tr>';
}

// ── Focus Timer ───────────────────────────────────────────────────────────────

function jrnTimerHtml() {
  return `
    <p style="color:var(--muted);font-size:0.88rem;margin-bottom:16px">50 minutes of focused study + 10 minutes of error-log update beats 3 hours of passive reading.</p>
    <div class="journey-timer-display" id="jrnTimerDisplay">50:00</div>
    <div class="journey-form-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:14px">
      <label>Minutes<input id="jrnTimerMins" type="number" min="5" max="120" value="50" onchange="jrnResetTimer()"></label>
      <label>Session tag
        <select id="jrnTimerTag">
          <option>HC Verma MCQ Practice</option>
          <option>Formula Revision</option>
          <option>Physics PYQs</option>
          <option>Error Log Repair</option>
          <option>Mock Analysis</option>
          <option>Concept Reading</option>
        </select>
      </label>
    </div>
    <div class="journey-btn-row">
      <button class="primary-btn" onclick="jrnStartTimer()">Start</button>
      <button class="secondary-btn" onclick="jrnPauseTimer()">Pause</button>
      <button class="danger-btn" onclick="jrnResetTimer()">Reset</button>
    </div>
    <div class="journey-flash info" style="margin-top:16px"><strong>After each block:</strong> Update the error log or tick a revision checkbox. Immediate feedback is the topper pattern.</div>`;
}

function jrnFmtTimer(s) {
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
function jrnSetTimerDisplay() {
  const el = document.getElementById('jrnTimerDisplay');
  if (el) el.textContent = jrnFmtTimer(jrnTimerSec);
}
function jrnStartTimer() {
  if (!jrnTimerId) {
    if (jrnTimerSec <= 0) jrnResetTimer();
    jrnTimerId = setInterval(() => {
      jrnTimerSec--;
      jrnSetTimerDisplay();
      if (jrnTimerSec <= 0) {
        jrnPauseTimer();
        const tag = document.getElementById('jrnTimerTag')?.value || 'Focus';
        showToast(`Block complete: ${tag}. Update your error log or tick a revision.`, 'success');
      }
    }, 1000);
  }
}
function jrnPauseTimer() { if (jrnTimerId) clearInterval(jrnTimerId); jrnTimerId = null; }
function jrnResetTimer() {
  jrnPauseTimer();
  jrnTimerInit = Math.max(5, Math.min(120, Number(document.getElementById('jrnTimerMins')?.value || 50))) * 60;
  jrnTimerSec = jrnTimerInit;
  jrnSetTimerDisplay();
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

function jrnRoadmapHtml() {
  return `
    <div class="journey-flash info" style="margin-bottom:16px">
      <strong>Physics Topper Pattern (10 Years of Interviews):</strong> NCERT + HC Verma concepts → chapter tests → PYQ analysis → mock simulation → mistake repair cycle. Physics decides rank — own it.
    </div>
    <div class="journey-roadmap">
      <div class="journey-phase">
        <div class="phase-label">Months 1–3<br>Foundation</div>
        <div>
          <h4>Concept Build</h4>
          <p>Complete HC Verma Vol 1 & 2 chapter-by-chapter. Derive formulas once, solve Obj I & II. Build a running formula notebook. Start Obj II questions once Obj I mastery is solid. Do 50–80 MCQs per chapter immediately after reading.</p>
        </div>
      </div>
      <div class="journey-phase">
        <div class="phase-label">Months 4–6<br>Syllabus</div>
        <div>
          <h4>Syllabus Completion</h4>
          <p>Cover all chapters at least once. Start chapter-wise PYQs. Add every missed question to the error log. Weekly part tests. Revision tracker R1–R2 checkboxes per chapter. Accuracy should reach 60–70%.</p>
        </div>
      </div>
      <div class="journey-phase">
        <div class="phase-label">Months 7–9<br>Strengthen</div>
        <div>
          <h4>PYQs + Sectional Tests</h4>
          <p>Do full 15-year Physics PYQ set. Fix all open errors. Take sectional tests every week and record mock scores. Revisions tracker R3 checkboxes. Accuracy target: 70–80%. Identify top 5 weak chapters and drill them.</p>
        </div>
      </div>
      <div class="journey-phase">
        <div class="phase-label">Month 10<br>Mock Phase</div>
        <div>
          <h4>Full Mock Simulation</h4>
          <p>2–3 mocks per week at NEET time slot (2 PM). Deep post-mock analysis every time — do not skip. Record every mock score. Formula + graph revision daily. Aim 150+/180. Silly mistakes must reach zero.</p>
        </div>
      </div>
      <div class="journey-phase">
        <div class="phase-label">Final 30<br>Retention</div>
        <div>
          <h4>Retention & Confidence</h4>
          <p>No new books. Revise formula sheet daily. Reattempt all open error-log questions. Mock every 2–3 days. R5–R6 revision checkboxes. Maintain sleep and routine. Calm on exam day beats last-minute panic.</p>
        </div>
      </div>
    </div>`;
}

// ── Physics Resources ─────────────────────────────────────────────────────────

const JRN_NCERT_BOOKS = [
  {
    code: 'keph1', label: 'Class 11 Physics Part I', start: 1, end: 7,
    complete: 'keph1dd.zip',
    chapters: ['Physical World','Units and Measurements','Motion in a Straight Line','Motion in a Plane','Laws of Motion','Work, Energy and Power','System of Particles and Rotational Motion','Gravitation']
  },
  {
    code: 'keph2', label: 'Class 11 Physics Part II', start: 8, end: 14,
    complete: 'keph2dd.zip',
    chapters: ['Mechanical Properties of Solids','Mechanical Properties of Fluids','Thermal Properties of Matter','Thermodynamics','Kinetic Theory','Oscillations','Waves']
  },
  {
    code: 'leph1', label: 'Class 12 Physics Part I', start: 1, end: 8,
    complete: 'leph1dd.zip',
    chapters: ['Electric Charges and Fields','Electrostatic Potential and Capacitance','Current Electricity','Moving Charges and Magnetism','Magnetism and Matter','Electromagnetic Induction','Alternating Current','Electromagnetic Waves']
  },
  {
    code: 'leph2', label: 'Class 12 Physics Part II', start: 9, end: 14,
    complete: 'leph2dd.zip',
    chapters: ['Ray Optics and Optical Instruments','Wave Optics','Dual Nature of Radiation and Matter','Atoms','Nuclei','Semiconductor Electronics: Materials, Devices and Simple Circuits']
  }
];

function jrnNcertUrl(book, ch) {
  return `https://ncert.nic.in/textbook.php?${book.code}=${ch}-${book.end}`;
}

function jrnResourcesHtml() {
  const bookOpts = JRN_NCERT_BOOKS.map(b =>
    `<option value="${b.code}">${jrnEscHtml(b.label)}</option>`
  ).join('');

  return `
  <div class="journey-detail" style="margin-bottom:24px">
    <h3 style="margin:0 0 4px;font-size:1.2rem;font-weight:800">Physics Resources</h3>
    <p style="margin:0 0 20px;color:var(--muted);font-size:0.88rem">All reference links for NEET Physics — NCERT, HC Verma, PYQs, video lectures, test series and topper interviews.</p>

    <!-- NCERT Chapter Reader -->
    <div class="res-section">
      <div class="res-section-head"><span class="res-icon">📖</span><h4>NCERT Physics — Chapter Reader</h4></div>
      <p class="res-desc">Open any chapter directly on the official NCERT portal. Select book → click a chapter tile.</p>
      <div class="res-ncert-toolbar">
        <label class="res-label">Book
          <select id="jrnNcertBook" onchange="jrnRenderNcertChapters()">${bookOpts}</select>
        </label>
        <label class="res-label">Chapter no.
          <input id="jrnNcertCh" type="number" min="1" placeholder="e.g. 3" oninput="jrnUpdateNcertCustom()">
        </label>
        <button class="primary-btn small" onclick="jrnOpenNcertCustom()">Open</button>
        <button class="secondary-btn small" onclick="jrnCopyNcertCustom()">Copy link</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
        <a id="jrnNcertPrelims" class="secondary-btn small" target="_blank" href="#">Prelims</a>
        <a id="jrnNcertAnswers" class="secondary-btn small" target="_blank" href="#">Answers</a>
        <a id="jrnNcertFull"    class="primary-btn small"    target="_blank" href="#">Download Full Book PDF</a>
      </div>
      <div id="jrnNcertGrid" class="res-chapter-grid"></div>
    </div>

    <!-- NCERT PDFs -->
    <div class="res-section">
      <div class="res-section-head"><span class="res-icon">📄</span><h4>NCERT Physics — Full Book PDFs</h4></div>
      <div class="res-link-grid">
        <a class="res-link" href="https://ncert.nic.in/textbook/pdf/keph1ps.pdf" target="_blank">
          <span class="res-link-title">Class 11 Physics Part I</span>
          <span class="res-link-sub">Units & Measurements · Kinematics · Laws of Motion · Work-Energy · Rotational · Gravitation</span>
        </a>
        <a class="res-link" href="https://ncert.nic.in/textbook/pdf/keph2ps.pdf" target="_blank">
          <span class="res-link-title">Class 11 Physics Part II</span>
          <span class="res-link-sub">Mechanical Properties · Thermal Properties · Thermodynamics · Kinetic Theory · Oscillations · Waves</span>
        </a>
        <a class="res-link" href="https://ncert.nic.in/textbook/pdf/leph1ps.pdf" target="_blank">
          <span class="res-link-title">Class 12 Physics Part I</span>
          <span class="res-link-sub">Electrostatics · Current Electricity · Magnetism · EMI · AC · Electromagnetic Waves</span>
        </a>
        <a class="res-link" href="https://ncert.nic.in/textbook/pdf/leph2ps.pdf" target="_blank">
          <span class="res-link-title">Class 12 Physics Part II</span>
          <span class="res-link-sub">Ray Optics · Wave Optics · Dual Nature · Atoms · Nuclei · Semiconductors</span>
        </a>
        <a class="res-link" href="https://ncert.nic.in/textbook.php" target="_blank">
          <span class="res-link-title">NCERT Textbook Portal</span>
          <span class="res-link-sub">Official NCERT portal — browse all textbooks Class I–XII</span>
        </a>
      </div>
    </div>

    <!-- HC Verma -->
    <div class="res-section">
      <div class="res-section-head"><span class="res-icon">📘</span><h4>HC Verma — Solutions & Reference</h4></div>
      <p class="res-desc">HC Verma Concepts of Physics Vol 1 &amp; Vol 2 — solutions, chapter summaries and exercise guidance.</p>
      <div class="res-link-grid">
        <a class="res-link" href="https://www.completephysics.in/downloads/hc-verma-solutions" target="_blank">
          <span class="res-link-title">Complete Physics — HC Verma Solutions</span>
          <span class="res-link-sub">Chapter-wise exercise solutions for Vol 1 &amp; Vol 2</span>
        </a>
        <a class="res-link" href="https://solutions.shaalaa.com/hc-verma-class-11-physics-solutions" target="_blank">
          <span class="res-link-title">Shaalaa — HC Verma Class 11 Solutions</span>
          <span class="res-link-sub">Detailed Obj I, Obj II and exercise solutions with explanations</span>
        </a>
        <a class="res-link" href="https://solutions.shaalaa.com/hc-verma-class-12-physics-solutions" target="_blank">
          <span class="res-link-title">Shaalaa — HC Verma Class 12 Solutions</span>
          <span class="res-link-sub">Vol 2 solutions — Modern Physics, Optics, Electrostatics, etc.</span>
        </a>
        <a class="res-link" href="https://www.vedantu.com/book-solutions/hc-verma" target="_blank">
          <span class="res-link-title">Vedantu — HC Verma Chapter Solutions</span>
          <span class="res-link-sub">Chapter-wise MCQ &amp; exercise walkthrough with concept notes</span>
        </a>
      </div>
    </div>

    <!-- Official Exam -->
    <div class="res-section">
      <div class="res-section-head"><span class="res-icon">🏛</span><h4>Official NEET / NTA</h4></div>
      <div class="res-link-grid">
        <a class="res-link" href="https://neet.nta.nic.in" target="_blank">
          <span class="res-link-title">NTA NEET Official Website</span>
          <span class="res-link-sub">Admit cards, results, notices, official answer keys</span>
        </a>
        <a class="res-link" href="https://neet.nta.nic.in/documents/" target="_blank">
          <span class="res-link-title">NTA NEET Documents</span>
          <span class="res-link-sub">Information bulletin, public notices, previous year answer keys</span>
        </a>
        <a class="res-link" href="https://neet.nta.nic.in/document/information-bulletin-english/" target="_blank">
          <span class="res-link-title">NEET Information Bulletin</span>
          <span class="res-link-sub">Exam pattern, rules, syllabus and instructions — read once at start</span>
        </a>
        <a class="res-link" href="https://www.nta.ac.in/Abhyas" target="_blank">
          <span class="res-link-title">NTA Abhyas App / Portal</span>
          <span class="res-link-sub">Official NTA mock-test practice — simulates real NEET interface</span>
        </a>
      </div>
    </div>

    <!-- PYQs & Test Series -->
    <div class="res-section">
      <div class="res-section-head"><span class="res-icon">📊</span><h4>PYQ Practice &amp; Test Series</h4></div>
      <p class="res-desc">Physics decides rank — do every PYQ at least twice. Chapter-wise first, then full mixed sets.</p>
      <div class="res-link-grid">
        <a class="res-link" href="https://www.embibe.com/exams/neet/physics-questions/" target="_blank">
          <span class="res-link-title">Embibe — NEET Physics Practice</span>
          <span class="res-link-sub">Topic-wise adaptive questions + free PYQ papers with solutions</span>
        </a>
        <a class="res-link" href="https://www.sarthaks.com/tag/neet-previous-year-questions" target="_blank">
          <span class="res-link-title">Sarthaks — NEET PYQ Bank</span>
          <span class="res-link-sub">Searchable previous year questions with community explanations</span>
        </a>
        <a class="res-link" href="https://www.dpp.pw/neet" target="_blank">
          <span class="res-link-title">DPP.pw — NEET Daily Practice Problems</span>
          <span class="res-link-sub">Chapter-wise DPPs in NEET format — track attempts and accuracy</span>
        </a>
        <a class="res-link" href="https://www.pw.live/chapter-neet" target="_blank">
          <span class="res-link-title">Physics Wallah — Chapter Tests</span>
          <span class="res-link-sub">Free chapter-wise NEET mock tests; includes PYQ-type questions</span>
        </a>
        <a class="res-link" href="https://www.allen.ac.in/test-series/neet" target="_blank">
          <span class="res-link-title">Allen NEET Test Series</span>
          <span class="res-link-sub">India's largest NEET test series — sectional + full mocks</span>
        </a>
        <a class="res-link" href="https://www.aakash.ac.in/neet/test-series" target="_blank">
          <span class="res-link-title">Aakash NEET Test Series</span>
          <span class="res-link-sub">Online sectional and full mock tests with detailed analysis</span>
        </a>
      </div>
    </div>

    <!-- Video Lectures -->
    <div class="res-section">
      <div class="res-section-head"><span class="res-icon">🎬</span><h4>Video Lectures — Physics</h4></div>
      <p class="res-desc">Use video for first-time understanding of hard concepts only. Do not re-watch without solving questions.</p>
      <div class="res-link-grid">
        <a class="res-link" href="https://www.youtube.com/@PhysicsWallah" target="_blank">
          <span class="res-link-title">Physics Wallah (Alakh Pandey)</span>
          <span class="res-link-sub">NEET-focused; free full-course HC Verma &amp; NCERT coverage; most popular</span>
        </a>
        <a class="res-link" href="https://www.youtube.com/@VedantuNEETMadeEjee" target="_blank">
          <span class="res-link-title">Vedantu NEET Made Ejee</span>
          <span class="res-link-sub">Daily live classes, PYQ sessions, doubt clearing; strong Physics faculty</span>
        </a>
        <a class="res-link" href="https://www.youtube.com/@MotionEducation" target="_blank">
          <span class="res-link-title">Motion Education</span>
          <span class="res-link-sub">Kota-style JEE/NEET Physics — strong conceptual depth and numericals</span>
        </a>
        <a class="res-link" href="https://www.youtube.com/@PradeepKshetrapal" target="_blank">
          <span class="res-link-title">Pradeep Kshetrapal Physics</span>
          <span class="res-link-sub">NCERT-aligned Physics; clear blackboard-style explanations for NEET</span>
        </a>
        <a class="res-link" href="https://www.youtube.com/@unacademy" target="_blank">
          <span class="res-link-title">Unacademy NEET</span>
          <span class="res-link-sub">Free NEET Physics lectures, revision series and crash courses</span>
        </a>
        <a class="res-link" href="https://www.khanacademy.org/science/physics" target="_blank">
          <span class="res-link-title">Khan Academy Physics</span>
          <span class="res-link-sub">Concept-first explanations for Mechanics, Electricity, Waves — great for foundation</span>
        </a>
      </div>
    </div>

    <!-- Formula & Concept References -->
    <div class="res-section">
      <div class="res-section-head"><span class="res-icon">🧮</span><h4>Formula &amp; Concept References</h4></div>
      <div class="res-link-grid">
        <a class="res-link" href="http://hyperphysics.phy-astr.gsu.edu/hbase/hframe.html" target="_blank">
          <span class="res-link-title">HyperPhysics (GSU)</span>
          <span class="res-link-sub">Interactive concept maps for every Physics topic — excellent for understanding derivations</span>
        </a>
        <a class="res-link" href="https://www.physicscatalyst.com/neet/neet-physics.php" target="_blank">
          <span class="res-link-title">Physics Catalyst — NEET Notes</span>
          <span class="res-link-sub">Chapter-wise theory, formulas and revision notes aligned to NEET syllabus</span>
        </a>
        <a class="res-link" href="https://byjus.com/neet/physics-formulas/" target="_blank">
          <span class="res-link-title">BYJU'S — NEET Physics Formulas</span>
          <span class="res-link-sub">Comprehensive chapter-wise formula lists — use as quick-revision reference</span>
        </a>
        <a class="res-link" href="https://www.toppr.com/guides/physics-formulas/" target="_blank">
          <span class="res-link-title">Toppr — Physics Formula Guide</span>
          <span class="res-link-sub">Sortable formula sheets by chapter; includes derivation hints</span>
        </a>
      </div>
    </div>

    <!-- Topper Interviews -->
    <div class="res-section">
      <div class="res-section-head"><span class="res-icon">🏆</span><h4>Topper Interviews (2016–2025)</h4></div>
      <p class="res-desc">Physics strategy from every NEET/AIPMT Air-1 — read the key rule extracted from each interview.</p>
      <div class="journey-table-wrap">
        <table class="journey-table">
          <thead><tr><th>Year</th><th>Topper</th><th>Physics Key Rule</th><th>Link</th></tr></thead>
          <tbody>
            <tr><td>2025</td><td>Mahesh Kumar, AIR 1</td><td>Structured DPPs + error improvement over mock-score obsession; never burn out</td><td><a class="res-inline-link" href="https://medicine.careers360.com/articles/mahesh-kumar-neet-2025-topper-air-1-interview" target="_blank">Interview →</a></td></tr>
            <tr><td>2024</td><td>Aditya Kumar Panda, AIR 1</td><td>Stored every wrong Physics question digitally; wrote "mistake made" vs "correct approach" for each</td><td><a class="res-inline-link" href="https://medicine.careers360.com/articles/neet-2024-topper-interview-air-1-aditya-kumar-panda" target="_blank">Interview →</a></td></tr>
            <tr><td>2023</td><td>Parth Khandelwal, AIR 10</td><td>Personal chapter targets for Physics; NCERT repeated + mock at NEET 2 PM time slot in final phase</td><td><a class="res-inline-link" href="https://www.shiksha.com/medicine-health-sciences/articles/neet-2023-topper-interview-preparing-from-ncert-books-was-my-priority-says-air-10-parth-khandelwal-blogId-127619" target="_blank">Interview →</a></td></tr>
            <tr><td>2022</td><td>Tanishka, AIR 1</td><td>Doubt clearing immediately after each Physics topic; revision intensity increases as exam approaches</td><td><a class="res-inline-link" href="https://medicine.careers360.com/articles/neet-2022-topper-interview-tanishka-air-1" target="_blank">Interview →</a></td></tr>
            <tr><td>2021</td><td>Mrinal Kutteri, AIR 1</td><td>Topic test after every Physics chapter; full mocks only after full syllabus; 45-min focused blocks</td><td><a class="res-inline-link" href="https://www.shiksha.com/medicine-health-sciences/articles/neet-2021-topper-interview-mrinal-kutteri-air-1-blogId-72337" target="_blank">Interview →</a></td></tr>
            <tr><td>2020</td><td>Soyeb Aftab, AIR 1</td><td>Every Physics session must produce output — solved questions, revised formula, or fixed error. No passive study.</td><td><a class="res-inline-link" href="https://educereindia.com/articles/neet-topper-interview-in-conversation-with-soyeb-aftab-air-i-neet-2020" target="_blank">Interview →</a></td></tr>
            <tr><td>2019</td><td>Nalin Khandelwal, AIR 1</td><td>Finish daily Physics targets before sleep; repeat NCERT for weak areas before adding extra resources</td><td><a class="res-inline-link" href="https://myexam.allen.in/success-journey-of-neet-ug-2019-topper-nalin-khandelwal-air-1-watch-full-interview/" target="_blank">Interview →</a></td></tr>
            <tr><td>2018</td><td>Kalpana Kumari, AIR 1</td><td>Mocks must diagnose time-consuming Physics sections; reserve dedicated time for numericals every day</td><td><a class="res-inline-link" href="https://blog.pcmbtoday.com/neet-2018-topper-kalpana-kumaris-success-story/" target="_blank">Story →</a></td></tr>
            <tr><td>2017</td><td>Navdeep Singh, AIR 1</td><td>Finish HC Verma/NCERT base first; online test series builds exam temperament for Physics timing</td><td><a class="res-inline-link" href="https://collegedunia.com/news/e-457-know-neet-air-i-navdeep-singhs-success-story" target="_blank">Story →</a></td></tr>
            <tr><td>2016</td><td>Het Shah, AIR 1</td><td>15-year PYQs are compulsory for Physics; exam-day calmness must be practised in mocks not just hoped for</td><td><a class="res-inline-link" href="https://indianexpress.com/article/education/neet-2016-topper-het-shah-shares-his-success-story-and-exam-strategy/" target="_blank">Interview →</a></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// NCERT chapter grid interactions
function jrnSelectedNcertBook() {
  const code = document.getElementById('jrnNcertBook')?.value || 'keph1';
  return JRN_NCERT_BOOKS.find(b => b.code === code) || JRN_NCERT_BOOKS[0];
}

function jrnInitNcertGrid() {
  jrnRenderNcertChapters();
}

function jrnRenderNcertChapters() {
  const book = jrnSelectedNcertBook();
  const prelims = document.getElementById('jrnNcertPrelims');
  const answers = document.getElementById('jrnNcertAnswers');
  const full    = document.getElementById('jrnNcertFull');
  if (prelims) prelims.href = `https://ncert.nic.in/textbook.php?${book.code}=ps-${book.end}`;
  if (answers) answers.href = `https://ncert.nic.in/textbook.php?${book.code}=an-${book.end}`;
  if (full)    full.href    = `https://ncert.nic.in/textbook/pdf/${book.complete}`;

  const grid = document.getElementById('jrnNcertGrid');
  if (!grid) return;
  let html = '';
  for (let ch = book.start; ch <= book.end; ch++) {
    const title = book.chapters[ch - book.start] || `Chapter ${ch}`;
    html += `<a class="res-chapter-tile" href="${jrnNcertUrl(book, ch)}" target="_blank">
      <strong>Ch ${ch}</strong>
      <span>${jrnEscHtml(title)}</span>
    </a>`;
  }
  grid.innerHTML = html;
  jrnUpdateNcertCustom();
}

function jrnUpdateNcertCustom() {
  const book = jrnSelectedNcertBook();
  const ch = Number(document.getElementById('jrnNcertCh')?.value || book.start);
  const urlEl = document.getElementById('jrnNcertCustomUrl');
  if (urlEl) urlEl.value = jrnNcertUrl(book, ch);
}

function jrnOpenNcertCustom() {
  const book = jrnSelectedNcertBook();
  const ch = Number(document.getElementById('jrnNcertCh')?.value || book.start);
  if (ch >= 1) window.open(jrnNcertUrl(book, ch), '_blank');
}

function jrnCopyNcertCustom() {
  const book = jrnSelectedNcertBook();
  const ch = Number(document.getElementById('jrnNcertCh')?.value || book.start);
  const url = jrnNcertUrl(book, ch);
  navigator.clipboard?.writeText(url).then(() => showToast('NCERT link copied!', 'success'));
}

init().catch(error => {
  console.error(error);
  alert('Could not start the app. Try refreshing the page.');
});
