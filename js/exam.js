/**
 * NeetExam — NTA/NEET-style CBT mock test (ported & adapted from class_8
 * exam-panel.js). Setup -> timed test with palette -> auto-graded result.
 * Marking: +4 correct, -1 wrong, 0 unattempted. Renders into #examView.
 */
(function (global) {
  let deps = {};
  let container = null;
  let exam = null;
  let timer = null;

  const MARK_CORRECT = 4, MARK_WRONG = -1;
  const LETTERS = ['A', 'B', 'C', 'D'];

  function init(dependencies) {
    deps = dependencies;
    container = document.getElementById('examView');
    if (container && !container.dataset.bound) {
      container.addEventListener('click', handleClick);
      container.addEventListener('change', handleChange);
      container.dataset.bound = '1';
    }
  }

  const esc = t => (deps.escapeHtml ? deps.escapeHtml(t) : String(t ?? ''));
  const sid = () => deps.getActiveStudentId();
  const norm = ch => deps.curriculum.normalizeChapter(ch);

  function correctLetters(q) {
    return String(q.answer || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean).sort().join(',');
  }

  // ---- pool building ----
  function buildPool(config) {
    let pool = deps.state.questions.slice();
    if (config.scope === 'chapter' && config.chapter) {
      pool = pool.filter(q => norm(q.topic) === norm(config.chapter));
    } else if (config.scope === 'class' && config.cls) {
      pool = pool.filter(q => {
        const info = deps.curriculum.getChapterInfo(q.topic);
        return info && info.class === config.cls;
      });
    } else if (config.scope === 'mistakes') {
      pool = deps.getMistakeQuestions(sid()).map(r => r.question);
    }
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return pool.slice(0, config.count);
  }

  function render() {
    if (!container) container = document.getElementById('examView');
    if (!container) return;
    if (!exam) { renderSetup(); return; }
    if (exam.phase === 'active') renderActive();
    else if (exam.phase === 'result') renderResult();
    else renderSetup();
  }

  // ---- setup ----
  function renderSetup() {
    const chapters = [...new Set(deps.state.questions.map(q => norm(q.topic)))].sort();
    container.innerHTML = `
      <div class="view-hero compact">
        <div>
          <p class="eyebrow-dark">Mock test · CBT</p>
          <h2>NEET-style mock test</h2>
          <p class="lead">Timed, +4 / −1 marking, question palette and instant analysis. Build a test from any scope.</p>
        </div>
      </div>
      <section class="panel-card exam-setup">
        <div class="exam-field">
          <label>Scope</label>
          <select id="examScope">
            <option value="full">Full syllabus</option>
            <option value="class">Class XI / XII</option>
            <option value="chapter">Single chapter</option>
            <option value="mistakes">From my mistakes</option>
          </select>
        </div>
        <div class="exam-field" id="examClassWrap" hidden>
          <label>Class</label>
          <select id="examClass"><option value="XI">Class XI</option><option value="XII">Class XII</option></select>
        </div>
        <div class="exam-field" id="examChapterWrap" hidden>
          <label>Chapter</label>
          <select id="examChapter">${chapters.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
        </div>
        <div class="exam-field">
          <label>Questions</label>
          <select id="examCount"><option>15</option><option selected>45</option><option>90</option><option>180</option></select>
        </div>
        <div class="exam-field">
          <label>Duration (min)</label>
          <select id="examDuration"><option>20</option><option selected>60</option><option>180</option></select>
        </div>
        <button type="button" class="primary-btn" data-action="exam-start">Start mock test</button>
      </section>
      ${renderHistory()}
    `;
  }

  function renderHistory() {
    const student = deps.state.progress.students[sid()];
    const tests = (student?.mockTests || []).slice().reverse().slice(0, 8);
    if (!tests.length) return '';
    return `
      <section class="panel-card">
        <div class="panel-head"><h3>Recent mock tests</h3></div>
        <div class="exam-history">
          ${tests.map(t => `
            <div class="exam-history-row">
              <div><strong>${t.score}/${t.max}</strong><small>${esc(t.scopeLabel)}</small></div>
              <span class="muted">${t.correct}✓ ${t.wrong}✗ · ${t.accuracy}%</span>
              <time class="muted">${new Date(t.at).toLocaleDateString()}</time>
            </div>`).join('')}
        </div>
      </section>`;
  }

  function handleChange(event) {
    if (event.target.id === 'examScope') {
      const v = event.target.value;
      const cw = container.querySelector('#examClassWrap');
      const chw = container.querySelector('#examChapterWrap');
      if (cw) cw.hidden = v !== 'class';
      if (chw) chw.hidden = v !== 'chapter';
      return;
    }
    if (event.target.name === 'examOpt' && exam) {
      exam.responses[exam.questions[exam.index].id] = event.target.value;
      const cell = container.querySelector(`.palette-cell[data-idx="${exam.index}"]`);
      if (cell) { cell.classList.remove('visited', 'unseen'); cell.classList.add('answered'); }
      container.querySelectorAll('.exam-option').forEach(o => o.classList.remove('chosen'));
      event.target.closest('.exam-option')?.classList.add('chosen');
    }
  }

  function startExam() {
    const scope = container.querySelector('#examScope').value;
    const config = {
      scope,
      cls: container.querySelector('#examClass')?.value,
      chapter: container.querySelector('#examChapter')?.value,
      count: Number(container.querySelector('#examCount').value),
      durationMin: Number(container.querySelector('#examDuration').value)
    };
    const questions = buildPool(config);
    if (!questions.length) { deps.showToast('No questions for this scope.', { type: 'warning' }); return; }
    config.scopeLabel = scope === 'chapter' ? config.chapter : scope === 'class' ? `Class ${config.cls}` : scope === 'mistakes' ? 'My mistakes' : 'Full syllabus';
    exam = {
      phase: 'active', config, questions, index: 0,
      responses: {}, marked: {}, visited: {},
      startedAt: Date.now(), endsAt: Date.now() + config.durationMin * 60000
    };
    startTimer();
    render();
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(() => {
      const left = exam.endsAt - Date.now();
      const t = container.querySelector('#examTimer');
      if (t) t.textContent = fmtTime(left);
      if (left <= 0) { stopTimer(); submitExam(true); }
    }, 1000);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function fmtTime(ms) {
    if (ms < 0) ms = 0;
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (h ? `${h}:` : '') + `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  // ---- active test ----
  function renderActive() {
    const q = exam.questions[exam.index];
    exam.visited[q.id] = true;
    const chosen = exam.responses[q.id];
    container.innerHTML = `
      <div class="exam-bar">
        <span class="muted">Q ${exam.index + 1} / ${exam.questions.length}</span>
        <span class="exam-timer-wrap">⏱ <strong id="examTimer">${fmtTime(exam.endsAt - Date.now())}</strong></span>
        <button type="button" class="secondary-btn small" data-action="exam-submit">Submit test</button>
      </div>
      <div class="exam-layout">
        <article class="exam-question panel-card">
          <p class="eyebrow-dark">${esc(norm(q.topic))}${q.subtopic ? ` · ${esc(q.subtopic)}` : ''}</p>
          <div class="exam-q-text">${deps.renderMath(q.question)}</div>
          <div class="exam-options">
            ${LETTERS.map(L => {
              const txt = q['option' + L];
              if (!txt) return '';
              return `<label class="exam-option ${chosen === L ? 'chosen' : ''}">
                <input type="radio" name="examOpt" value="${L}" ${chosen === L ? 'checked' : ''}>
                <span class="exam-opt-key">${L}</span><span>${deps.renderMath(txt)}</span></label>`;
            }).join('')}
          </div>
          <div class="exam-q-actions">
            <button type="button" class="secondary-btn" data-action="exam-clear">Clear</button>
            <button type="button" class="chip-toggle ${exam.marked[q.id] ? 'on' : ''}" data-action="exam-mark">${exam.marked[q.id] ? '★ Marked' : '☆ Mark for review'}</button>
            <button type="button" class="secondary-btn" data-action="exam-prev" ${exam.index === 0 ? 'disabled' : ''}>← Prev</button>
            <button type="button" class="primary-btn" data-action="exam-next">${exam.index === exam.questions.length - 1 ? 'Save' : 'Save & Next →'}</button>
          </div>
        </article>
        <aside class="exam-palette">
          <h4>Palette</h4>
          <div class="palette-grid">
            ${exam.questions.map((qq, i) => {
              const ans = exam.responses[qq.id];
              const cls = exam.marked[qq.id] ? 'marked' : ans ? 'answered' : exam.visited[qq.id] ? 'visited' : 'unseen';
              return `<button type="button" class="palette-cell ${cls} ${i === exam.index ? 'current' : ''}" data-action="exam-goto" data-idx="${i}">${i + 1}</button>`;
            }).join('')}
          </div>
          <div class="palette-legend">
            <span><i class="answered"></i> Answered</span>
            <span><i class="marked"></i> Marked</span>
            <span><i class="visited"></i> Seen</span>
            <span><i class="unseen"></i> Not seen</span>
          </div>
        </aside>
      </div>
    `;
  }

  // ---- result ----
  function submitExam(auto) {
    if (!auto && !confirm('Submit the test now?')) return;
    stopTimer();
    let correct = 0, wrong = 0, unattempted = 0;
    exam.questions.forEach(q => {
      const chosen = exam.responses[q.id];
      if (!chosen) { unattempted += 1; return; }
      if (chosen === correctLetters(q)) correct += 1; else wrong += 1;
    });
    const score = correct * MARK_CORRECT + wrong * MARK_WRONG;
    const max = exam.questions.length * MARK_CORRECT;
    const attempted = correct + wrong;
    exam.result = {
      correct, wrong, unattempted, score, max,
      accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
      timeUsed: Date.now() - exam.startedAt
    };
    exam.phase = 'result';
    saveAttempt();
    render();
  }

  async function saveAttempt() {
    const id = sid();
    if (!id) return;
    const student = deps.state.progress.students[id];
    if (!student) return;
    if (!student.mockTests) student.mockTests = [];
    const r = exam.result;
    student.mockTests.push({
      at: Date.now(), scopeLabel: exam.config.scopeLabel,
      score: r.score, max: r.max, correct: r.correct, wrong: r.wrong,
      unattempted: r.unattempted, accuracy: r.accuracy, count: exam.questions.length
    });
    if (student.mockTests.length > 50) student.mockTests = student.mockTests.slice(-50);
    student.updatedAt = Date.now();
    if (deps.persistProgress) await deps.persistProgress();
    if (deps.refreshLearningViews) deps.refreshLearningViews();
  }

  function renderResult() {
    const r = exam.result;
    const wrongQs = exam.questions.filter(q => exam.responses[q.id] && exam.responses[q.id] !== correctLetters(q));
    const scorePct = Math.round((r.score / r.max) * 100);
    container.innerHTML = `
      <div class="exam-result-head">
        <div class="exam-score-ring band-${scorePct >= 60 ? 'good' : scorePct >= 35 ? 'mid' : 'low'}">
          <strong>${r.score}</strong><span>/ ${r.max}</span>
        </div>
        <div>
          <h2>${exam.config.scopeLabel} · ${exam.questions.length} Q</h2>
          <p class="lead">${r.correct} correct · ${r.wrong} wrong · ${r.unattempted} skipped · ${r.accuracy}% accuracy</p>
          <p class="muted">Time used ${fmtTime(r.timeUsed)}</p>
        </div>
      </div>
      <div class="exam-result-actions">
        <button type="button" class="primary-btn" data-action="exam-new">New mock test</button>
        ${r.wrong ? `<button type="button" class="secondary-btn" data-action="exam-retry-wrong">Practice ${r.wrong} wrong</button>` : ''}
      </div>
      <section class="panel-card">
        <div class="panel-head"><h3>Review — wrong answers</h3></div>
        <div class="exam-review">
          ${wrongQs.map(q => {
            const note = deps.getNoteForQuestion(q.id);
            return `
              <article class="exam-review-item">
                <div class="exam-q-text">${deps.renderMath(q.question)}</div>
                <p><span class="learn-badge wrong">You: ${esc(exam.responses[q.id])}</span> <span class="learn-badge mastered">Correct: ${esc(correctLetters(q))}</span></p>
                ${q.explanation ? `<p class="exam-expl">${deps.renderMath(q.explanation)}</p>` : ''}
                ${note ? `<button type="button" class="text-btn" data-action="exam-note" data-note="${esc(note.id)}">📄 Read the note →</button>` : ''}
              </article>`;
          }).join('') || '<p class="muted">No wrong answers — perfect run! 🎯</p>'}
        </div>
      </section>
    `;
  }

  function handleClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const a = target.dataset.action;
    const q = exam ? exam.questions[exam.index] : null;

    if (a === 'exam-start') startExam();
    else if (a === 'exam-next') { if (exam.index < exam.questions.length - 1) { exam.index += 1; renderActive(); } else submitExam(false); }
    else if (a === 'exam-prev') { if (exam.index > 0) { exam.index -= 1; renderActive(); } }
    else if (a === 'exam-goto') { exam.index = Number(target.dataset.idx); renderActive(); }
    else if (a === 'exam-mark') { exam.marked[q.id] = !exam.marked[q.id]; renderActive(); }
    else if (a === 'exam-clear') { delete exam.responses[q.id]; renderActive(); }
    else if (a === 'exam-submit') submitExam(false);
    else if (a === 'exam-new') { exam = null; render(); }
    else if (a === 'exam-retry-wrong') {
      const qs = exam.questions.filter(x => exam.responses[x.id] && exam.responses[x.id] !== correctLetters(x));
      exam = null;
      if (qs.length) deps.startPracticeWithQuestions(qs);
    } else if (a === 'exam-note') {
      const id = target.dataset.note; exam = null; deps.jumpToNote(id);
    }
  }

  global.NeetExam = { init, render };
})(window);
