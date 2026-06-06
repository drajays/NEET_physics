const STORAGE_KEY = 'neet-mcq-bank-v1';
const PROGRESS_KEY = 'neet-student-progress-v1';
const ACTIVE_STUDENT_KEY = 'neet-active-student-v1';
const ADMIN_SESSION_KEY = 'neet-admin-session-v1';
const IDB_NAME = 'neet-mcq-db';
const IDB_VERSION = 1;
const IDB_STORE = 'bank';

function getAppConfig() {
  return window.APP_CONFIG || {
    remoteBankUrl: '',
    remoteProgressUrl: '',
    adminPin: '1234',
    autoSyncOnLoad: true,
    appName: 'NEET MCQ Practice',
    students: ['Student 1', 'Student 2', 'Student 3', 'Student 4']
  };
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
    selectedOption: null
  },
  bankSearch: '',
  editingId: null,
  bankUpdatedAt: null,
  progress: { version: 1, updatedAt: 0, students: {} },
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
  fAnswer: document.getElementById('fAnswer'),
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
  bankSearch: document.getElementById('bankSearch'),
  bankExportJsonBtn: document.getElementById('bankExportJsonBtn'),
  bankExportCsvBtn: document.getElementById('bankExportCsvBtn'),
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
  adminCancelBtn: document.getElementById('adminCancelBtn'),
  publishBankBtn: document.getElementById('publishBankBtn'),
  studentSelect: document.getElementById('studentSelect'),
  syncProgressBtn: document.getElementById('syncProgressBtn'),
  practiceUnsolvedOnly: document.getElementById('practiceUnsolvedOnly'),
  syncProgressPanelBtn: document.getElementById('syncProgressPanelBtn'),
  publishProgressBtn: document.getElementById('publishProgressBtn'),
  studentDialog: document.getElementById('studentDialog'),
  studentForm: document.getElementById('studentForm'),
  studentDialogSelect: document.getElementById('studentDialogSelect')
};

function isAdmin() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

function requireAdmin(actionLabel = 'change the question bank') {
  if (isAdmin()) return true;
  alert(`Admin access is required to ${actionLabel}. Tap Admin and enter your PIN.`);
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
  const config = getAppConfig();
  if (clean(pin) !== clean(config.adminPin)) return false;
  sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
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
    alert('No matching questions for this selection.');
    return;
  }
  el.practiceCount.value = Math.min(pool.length, sectionKey ? pool.length : 20);
  startPractice();
}

function startRevisionPractice() {
  const plan = getRevisionPlanForStudent(state.activeStudentId);
  const queue = plan.dailyQueue.map(item => item.question);
  if (!queue.length) {
    alert('Revision queue is empty. Explore new chapters instead.');
    return;
  }
  state.practice = {
    active: true,
    questions: shuffle(queue).slice(0, Math.min(25, queue.length)),
    index: 0,
    score: 0,
    answered: false,
    selectedOption: null
  };
  switchTab('practice');
  el.practiceArea.classList.remove('hidden');
  el.practiceResults.classList.add('hidden');
  el.practiceResults.innerHTML = '';
  el.nextQuestionBtn.classList.add('hidden');
  el.finishPracticeBtn.classList.remove('hidden');
  renderPracticeQuestion();
}

function handleViewAction(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  if (action === 'goto-chapters') switchTab('chapters');
  else if (action === 'start-revision') startRevisionPractice();
  else if (action === 'practice-chapter') applyChapterPractice(target.dataset.chapter);
  else if (action === 'open-chapter') {
    state.selectedChapter = target.dataset.chapter || '';
    switchTab('chapters');
    refreshLearningViews();
    if (state.selectedChapter) NeetViews.renderChapterDetail(state.selectedChapter);
  }
  else if (action === 'close-chapter') {
    state.selectedChapter = '';
    if (el.chapterDetail) {
      el.chapterDetail.classList.remove('open');
      el.chapterDetail.innerHTML = '';
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

const sampleQuestions = [
  {
    question: 'Which enzyme is secreted by the pancreas as trypsinogen and activated in the duodenum?',
    options: ['Pepsin', 'Trypsin', 'Lipase', 'Amylase'],
    answer: 'B',
    explanation: 'Trypsin is secreted as inactive trypsinogen and activated by enterokinase in the duodenum.',
    subject: 'Biology',
    topic: 'Human Physiology',
    subtopic: 'Digestion',
    tags: ['NCERT', 'Enzymes']
  },
  {
    question: 'Crossing over occurs during which stage of meiosis?',
    options: ['Leptotene', 'Pachytene', 'Diplotene', 'Metaphase I'],
    answer: 'B',
    explanation: 'Crossing over is the exchange of genetic material between non-sister chromatids during pachytene.',
    subject: 'Biology',
    topic: 'Cell Biology',
    subtopic: 'Cell Cycle',
    tags: ['Important', 'Meiosis']
  },
  {
    question: 'What is the hybridisation and geometry of methane (CH₄)?',
    options: ['sp², trigonal planar', 'sp³, tetrahedral', 'sp, linear', 'dsp², square planar'],
    answer: 'B',
    explanation: 'Methane has sp³ hybridisation with tetrahedral geometry and bond angle ~109.5°.',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    subtopic: 'Hybridisation',
    tags: ['NCERT', 'Basics']
  },
  {
    question: 'The SI unit of power of a lens is:',
    options: ['Watt', 'Joule', 'Dioptre', 'Candela'],
    answer: 'C',
    explanation: 'Power of a lens is the reciprocal of focal length in metres; its SI unit is dioptre.',
    subject: 'Physics',
    topic: 'Optics',
    subtopic: 'Ray Optics',
    tags: ['Formula', 'Units']
  },
  {
    question: 'In a Mendelian dihybrid cross, the phenotypic ratio in F2 generation is:',
    options: ['3:1', '1:2:1', '9:3:3:1', '1:1:1:1'],
    answer: 'C',
    explanation: 'Independent assortment of two gene pairs gives a 9:3:3:1 phenotypic ratio.',
    subject: 'Biology',
    topic: 'Genetics',
    subtopic: 'Mendelism',
    tags: ['PYQ', 'Ratio']
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

function renderImageHtml(src, label = 'MCQ image') {
  if (!src || !src.startsWith('data:image')) return '';
  return `<figure class="mcq-image"><img src="${src}" alt="${escapeHtml(label)}" loading="lazy" /></figure>`;
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
  return OPTION_LETTERS
    .filter(letter => letter !== question.answer && clean(whyWrong[letter]))
    .map(letter => ({
      letter,
      option: question.options[answerLetterToIndex(letter)],
      text: clean(whyWrong[letter])
    }));
}

function renderWhyWrongHtml(question) {
  const entries = getWhyWrongEntries(question);
  if (!entries.length) return '';
  return `
    <div class="why-wrong-block">
      <strong>Why the other options are incorrect:</strong>
      <ul class="why-wrong-list">
        ${entries.map(entry => `
          <li><strong>${entry.letter}. ${escapeHtml(entry.option)}:</strong> ${escapeHtml(entry.text)}</li>
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

  const answer = answerTextToLetter(raw.answer, options);
  if (!answer) return null;

  return {
    id: raw.id || makeId(),
    question,
    options,
    answer,
    explanation: clean(raw.explanation),
    whyWrong: parseWhyWrong(raw),
    questionImage: parseImageField(raw, 'questionImage', 'question_image'),
    explanationImage: parseImageField(raw, 'explanationImage', 'explanation_image'),
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
  const search = state.bankSearch.toLowerCase();
  return getFilteredQuestions(state.bankFilters).filter(q => {
    if (!search) return true;
    const haystack = [q.question, q.subject, q.topic, q.subtopic, ...q.tags, ...q.options, q.explanation].join(' ').toLowerCase();
    return haystack.includes(search);
  });
}

function toggleFilterValue(filters, group, value) {
  const set = filters[group];
  if (set.has(value)) set.delete(value);
  else set.add(value);
}

function applyQuickFilter(group, value) {
  toggleFilterValue(state.bankFilters, group, value);
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
      <label>
        Correct answer
        <select name="answer" required>
          ${letters.map(letter => `
            <option value="${letter}" ${q.answer === letter ? 'selected' : ''}>${letter}</option>
          `).join('')}
        </select>
      </label>
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

  return `
    <article class="bank-card" data-id="${q.id}">
      <div class="mcq-meta">
        <button type="button" class="badge clickable filter-badge" data-group="subjects" data-value="${escapeHtml(q.subject)}">${escapeHtml(q.subject)}</button>
        <button type="button" class="badge green clickable filter-badge" data-group="topics" data-value="${escapeHtml(q.topic)}">${escapeHtml(q.topic)}</button>
        ${q.subtopic ? `<button type="button" class="badge clickable filter-badge" data-group="subtopics" data-value="${escapeHtml(q.subtopic)}">${escapeHtml(q.subtopic)}</button>` : ''}
        ${q.tags.map(tag => `<button type="button" class="badge orange clickable filter-badge" data-group="tags" data-value="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join('')}
      </div>
      <p class="question">${escapeHtml(q.question)}</p>
      ${renderImageHtml(q.questionImage, 'Question image')}
      <ol class="options compact" type="A">
        ${q.options.map((opt, i) => {
          const letter = ['A', 'B', 'C', 'D'][i];
          const isCorrect = letter === q.answer;
          return `<li class="${isCorrect ? 'correct-static' : ''}"><strong>${letter}.</strong> ${escapeHtml(opt)}</li>`;
        }).join('')}
      </ol>
      ${q.explanation ? `<p class="bank-explanation"><strong>Explanation:</strong> ${escapeHtml(q.explanation)}</p>` : ''}
      ${renderImageHtml(q.explanationImage, 'Explanation image')}
      ${renderWhyWrongHtml(q)}
      ${isAdmin() ? `
      <div class="bank-actions">
        <button type="button" class="secondary-btn small edit-btn" data-id="${q.id}">Edit</button>
        <button type="button" class="danger-btn small delete-btn" data-id="${q.id}">Delete</button>
      </div>` : ''}
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

  el.bankList.className = 'bank-list';
  el.bankList.innerHTML = filtered.map(q => renderBankCard(q)).join('');
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
    answer: formData.get('answer'),
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
    alert('Please fill in the question, all four options, and a valid correct answer.');
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
  return true;
}

function deleteQuestion(id) {
  if (!requireAdmin('delete questions')) return;
  if (!confirm('Delete this question permanently?')) return;
  if (state.editingId === id) state.editingId = null;
  state.questions = state.questions.filter(q => q.id !== id);
  saveQuestions();
  refreshUI();
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
    selectedOption: null
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

function renderPracticeQuestion() {
  const session = state.practice;
  const current = session.questions[session.index];
  const total = session.questions.length;
  const progress = ((session.index) / total) * 100;

  el.progressBar.style.width = `${progress}%`;
  el.practiceProgress.textContent = `Question ${session.index + 1} of ${total}`;
  el.practiceScore.textContent = `Score: ${session.score}/${session.index + (session.answered ? 1 : 0)}`;

  const letters = ['A', 'B', 'C', 'D'];
  const correctIndex = answerLetterToIndex(current.answer);

  el.practiceCard.innerHTML = `
    <div class="mcq-meta">
      <span class="badge">${escapeHtml(current.subject)}</span>
      <span class="badge green">${escapeHtml(current.topic)}</span>
      ${current.subtopic ? `<span class="badge">${escapeHtml(current.subtopic)}</span>` : ''}
      ${current.tags.map(tag => `<span class="badge orange">${escapeHtml(tag)}</span>`).join('')}
    </div>
    <p class="question">${escapeHtml(current.question)}</p>
    ${renderImageHtml(current.questionImage, 'Question image')}
    <div class="options interactive">
      ${current.options.map((option, i) => {
        let className = 'option-btn';
        if (session.answered) {
          if (i === correctIndex) className += ' correct';
          else if (letters[i] === session.selectedOption) className += ' wrong';
        }
        const disabled = session.answered ? 'disabled' : '';
        return `<button type="button" class="${className}" data-option="${letters[i]}" ${disabled}>
          <span class="option-letter">${letters[i]}</span>
          <span>${escapeHtml(option)}</span>
        </button>`;
      }).join('')}
    </div>
    ${session.answered ? `
      <div class="answer show">
        <strong>${session.selectedOption === current.answer ? 'Correct!' : 'Incorrect.'}</strong>
        Correct answer: ${current.answer}. ${escapeHtml(current.options[correctIndex])}
        ${current.explanation ? `<br><strong>Explanation:</strong> ${escapeHtml(current.explanation)}` : ''}
        ${renderImageHtml(current.explanationImage, 'Explanation image')}
        ${renderWhyWrongHtml(current)}
      </div>` : ''}
  `;

  el.nextQuestionBtn.classList.toggle('hidden', !session.answered);
  el.nextQuestionBtn.textContent = session.index === total - 1 ? 'View results' : 'Next question';
}

function selectPracticeOption(optionLetter) {
  const session = state.practice;
  if (session.answered) return;

  const current = session.questions[session.index];
  const isCorrect = optionLetter === current.answer;
  session.selectedOption = optionLetter;
  session.answered = true;
  if (isCorrect) session.score += 1;
  recordAttempt(current, isCorrect, optionLetter);
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
  renderPracticeQuestion();
}

function showPracticeResults() {
  const session = state.practice;
  const total = session.questions.length;
  const percent = total ? Math.round((session.score / total) * 100) : 0;

  el.progressBar.style.width = '100%';
  el.practiceProgress.textContent = 'Session complete';
  el.practiceScore.textContent = `Score: ${session.score}/${total}`;
  el.practiceCard.innerHTML = '';
  el.nextQuestionBtn.classList.add('hidden');
  el.finishPracticeBtn.classList.add('hidden');

  el.practiceResults.classList.remove('hidden');
  el.practiceResults.innerHTML = `
    <h3>Practice complete</h3>
    <p class="result-score">${session.score} / ${total} correct (${percent}%)</p>
    <div class="button-row">
      <button type="button" class="primary-btn" id="retryPracticeBtn">Practice again</button>
      <button type="button" class="secondary-btn" id="closePracticeBtn">Back to filters</button>
    </div>
  `;

  document.getElementById('retryPracticeBtn').addEventListener('click', startPractice);
  document.getElementById('closePracticeBtn').addEventListener('click', endPractice);
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
    el.menuToggle.addEventListener('click', () => el.sidebar.classList.toggle('open'));
  }

  [el.dashboardView, el.chaptersView, el.revisionView, el.auditView].forEach(view => {
    if (view) view.addEventListener('click', handleViewAction);
  });

  if (el.chaptersView) {
    el.chaptersView.addEventListener('click', event => {
      const card = event.target.closest('.chapter-card[data-chapter]');
      if (!card || card.classList.contains('disabled')) return;
      state.selectedChapter = card.dataset.chapter || '';
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
    const btn = event.target.closest('.option-btn');
    if (!btn || btn.disabled) return;
    selectPracticeOption(btn.dataset.option);
  });

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
      answer: el.fAnswer.value,
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
    renderBank();
  });

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

    if (removeImageBtn) {
      handleInlineImageRemove(removeImageBtn);
      return;
    }

    if (filterBadge) {
      applyQuickFilter(filterBadge.dataset.group, filterBadge.dataset.value);
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

  el.importFile.addEventListener('change', event => importFile(event.target.files[0]));
  el.loadSampleBtn.addEventListener('click', loadSampleData);
  el.exportJsonBtn.addEventListener('click', exportJson);
  el.exportCsvBtn.addEventListener('click', exportCsv);
  el.bankExportJsonBtn.addEventListener('click', exportJson);
  el.bankExportCsvBtn.addEventListener('click', exportCsv);
  el.resetAllBtn.addEventListener('click', resetAllData);

  if (el.syncBankBtn) {
    el.syncBankBtn.addEventListener('click', () => syncFromRemote({ force: true }));
  }

  if (el.adminUnlockBtn) {
    el.adminUnlockBtn.addEventListener('click', () => {
      if (isAdmin()) lockAdmin();
      else openAdminDialog();
    });
  }

  if (el.adminForm) {
    el.adminForm.addEventListener('submit', event => {
      event.preventDefault();
      const ok = unlockAdmin(el.adminPinInput.value);
      if (!ok) {
        el.adminDialogError.textContent = 'Incorrect admin PIN.';
        el.adminDialogError.hidden = false;
        return;
      }
      el.adminDialog.close();
    });
  }

  if (el.adminCancelBtn) {
    el.adminCancelBtn.addEventListener('click', () => el.adminDialog?.close());
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
  state.questions = await loadQuestionsAsync();
  await loadProgressAsync();

  const config = getAppConfig();
  if (clean(config.remoteBankUrl) && config.autoSyncOnLoad) {
    await syncFromRemote({ silent: true });
  } else {
    await maybeSyncFromRemote();
  }

  if (clean(config.remoteProgressUrl) && config.autoSyncOnLoad) {
    await syncProgressFromRemote({ silent: true });
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
    populateStudentSelect
  });

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

init().catch(error => {
  console.error(error);
  alert('Could not start the app. Try refreshing the page.');
});
