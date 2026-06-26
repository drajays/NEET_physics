/**
 * NeetRevise — the revision hub: spaced-repetition flashcard triage over
 * notes + formulas (SM-2 in app.js), leeches, mistakes notebook, bookmarks,
 * streak and daily goal. Renders into #reviseView.
 */
(function (global) {
  let deps = {};
  let container = null;
  let session = null; // { items, index, revealed, done, again }

  function init(dependencies) {
    deps = dependencies;
    container = document.getElementById('reviseView');
    if (container && !container.dataset.bound) {
      container.addEventListener('click', handleClick);
      container.dataset.bound = '1';
    }
  }

  const esc = t => (deps.escapeHtml ? deps.escapeHtml(t) : String(t ?? ''));
  const studentId = () => deps.getActiveStudentId();

  function render() {
    if (!container) container = document.getElementById('reviseView');
    if (!container) return;
    if (session && !session.done) { renderCard(); return; }
    if (session && session.done) { renderSummary(); return; }
    renderDashboard();
  }

  function renderDashboard() {
    const sid = studentId();
    if (!sid) { container.innerHTML = '<div class="empty-card"><h3>Select a student</h3></div>'; return; }

    const due = deps.getDueLearningItems(sid, { types: ['note', 'formula'] });
    const dueNotes = due.filter(d => d.type === 'note');
    const dueFormulas = due.filter(d => d.type === 'formula');
    const mistakes = deps.getMistakeQuestions(sid);
    const leeches = deps.getLeechQuestions(sid);
    const bookmarks = deps.getMarkedItems(sid, 'bookmark').filter(m => m.type === 'note');
    const reviseFlag = deps.getMarkedItems(sid, 'revise').filter(m => m.type === 'note');
    const streak = deps.getStreakDays(sid);
    const today = deps.getReviewsToday(sid);
    const goal = deps.state.progress.students[sid]?.goals?.daily || 30;
    const goalPct = Math.min(100, Math.round((today / goal) * 100));

    const noteTitle = id => { const n = deps.state.noteById.get(id); return n ? (n.title || n.subtopic) : id; };

    container.innerHTML = `
      <div class="view-hero compact">
        <div>
          <p class="eyebrow-dark">Revision hub</p>
          <h2>Spaced revision &amp; flashcards</h2>
          <p class="lead">Review what's due, fix mistakes, and drill leeches. Ratings schedule each card automatically.</p>
        </div>
        <button type="button" class="primary-btn" data-action="start-due" ${due.length ? '' : 'disabled'}>⚡ Review due (${due.length})</button>
      </div>

      <div class="revise-stats">
        <article class="stat-card accent"><strong>🔥 ${streak}</strong><span>Day streak</span></article>
        <article class="stat-card">
          <strong>${today}/${goal}</strong><span>Today's reviews</span>
          <span class="mini-bar"><i style="width:${goalPct}%"></i></span>
        </article>
        <article class="stat-card"><strong>${due.length}</strong><span>Cards due</span></article>
        <article class="stat-card warn"><strong>${leeches.length}</strong><span>Leeches</span></article>
      </div>

      <div class="revise-modes">
        <button type="button" class="revise-mode" data-action="start-notes" ${dueNotes.length ? '' : 'disabled'}>
          <span class="revise-mode-icon">📖</span><strong>Revise notes</strong><span class="muted">${dueNotes.length} due</span></button>
        <button type="button" class="revise-mode" data-action="start-formulas" ${dueFormulas.length ? '' : 'disabled'}>
          <span class="revise-mode-icon">📐</span><strong>Formula flashcards</strong><span class="muted">${dueFormulas.length} due</span></button>
        <button type="button" class="revise-mode" data-action="practice-mistakes" ${mistakes.length ? '' : 'disabled'}>
          <span class="revise-mode-icon">✍️</span><strong>Mistakes notebook</strong><span class="muted">${mistakes.length} to fix</span></button>
        <button type="button" class="revise-mode" data-action="practice-leeches" ${leeches.length ? '' : 'disabled'}>
          <span class="revise-mode-icon">🪤</span><strong>Leeches</strong><span class="muted">${leeches.length} stuck</span></button>
      </div>

      <div class="split-panels">
        <section class="panel-card">
          <div class="panel-head"><h3>🪤 Leeches — chronically wrong</h3></div>
          <div class="revise-list">
            ${leeches.slice(0, 8).map(row => `
              <article class="revise-row">
                <p>${deps.renderMath((row.question.question || '').slice(0, 100))}${row.question.question.length > 100 ? '…' : ''}</p>
                <small>${esc(row.question.topic)} · wrong ${row.rec.wrong}×</small>
              </article>`).join('') || '<p class="muted">No leeches — nothing is repeatedly wrong. 👏</p>'}
          </div>
        </section>
        <section class="panel-card">
          <div class="panel-head"><h3>★ Bookmarked &amp; flagged notes</h3></div>
          <div class="revise-list">
            ${[...new Map([...bookmarks, ...reviseFlag].map(m => [m.id, m])).values()].slice(0, 10).map(m => `
              <button type="button" class="revise-row link" data-action="open-bookmark" data-id="${esc(m.id)}">
                <p>${m.mark.bookmark ? '★' : '🔁'} ${esc(noteTitle(m.id))}</p>
                <small>${esc(deps.state.noteById.get(m.id)?.chapter || '')}</small>
              </button>`).join('') || '<p class="muted">Bookmark notes (★) or flag them “Revise” to build a quick list.</p>'}
          </div>
        </section>
      </div>
    `;
  }

  // ---- flashcard triage session ----
  function startSession({ scope = 'all', types = ['note', 'formula'], chapter = '' } = {}) {
    const sid = studentId();
    if (!sid) return;
    let items = deps.getDueLearningItems(sid, { types });
    if (scope === 'chapter' && chapter) items = items.filter(it => it.note && it.note.chapter === chapter);
    if (!items.length) { deps.showToast('Nothing due here right now.', { type: 'info' }); return; }
    // shuffle
    for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
    session = { items, index: 0, revealed: false, done: false, rated: 0 };
    deps.switchTab('revise');
    render();
  }

  function currentItem() { return session ? session.items[session.index] : null; }

  function cardFront(item) {
    if (item.type === 'note') {
      const n = item.note;
      return `<p class="flash-kind">📖 ${esc(n.chapter)}</p>
        <h2 class="flash-prompt">${deps.renderMath(n.title || n.subtopic)}</h2>
        <p class="flash-hint">Recall the key idea, then reveal.</p>`;
    }
    const f = item.formula; const n = item.note;
    return `<p class="flash-kind">📐 ${esc(n.chapter)} · ${esc(n.subtopic)}</p>
      <h2 class="flash-prompt">${f.meaning ? esc(f.meaning) : 'Recall the formula for this concept'}</h2>
      <p class="flash-hint">Write the formula, then reveal.</p>`;
  }

  function cardBack(item) {
    if (item.type === 'note') {
      const n = item.note;
      return `
        ${n.summary ? `<p class="flash-answer">${deps.renderMath(n.summary).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>` : ''}
        ${n.formulas?.length ? `<div class="flash-formulas">${n.formulas.slice(0, 4).map(f => deps.renderMath('$' + f.latex + '$')).join('')}</div>` : ''}
        <button type="button" class="text-btn" data-action="open-full-note" data-id="${esc(n.id)}">Open full note →</button>`;
    }
    const f = item.formula;
    return `<div class="flash-formula-big">${deps.renderMath('$' + f.latex + '$')}</div>
      ${f.meaning ? `<p class="flash-answer">${esc(f.meaning)}</p>` : ''}`;
  }

  function renderCard() {
    const item = currentItem();
    if (!item) { session.done = true; render(); return; }
    const total = session.items.length;
    container.innerHTML = `
      <div class="flash-wrap">
        <div class="flash-top">
          <button type="button" class="chap-back-btn" data-action="end-session">✕ End</button>
          <div class="flash-progress"><span style="width:${Math.round((session.index / total) * 100)}%"></span></div>
          <span class="muted">${session.index + 1} / ${total}</span>
        </div>
        <article class="flash-card ${session.revealed ? 'revealed' : ''}">
          <div class="flash-face flash-front">${cardFront(item)}</div>
          ${session.revealed ? `<div class="flash-face flash-back">${cardBack(item)}</div>` : ''}
        </article>
        <div class="flash-controls">
          ${session.revealed ? `
            <button type="button" class="rate-btn again" data-action="rate" data-rating="again">Again</button>
            <button type="button" class="rate-btn hard" data-action="rate" data-rating="hard">Hard</button>
            <button type="button" class="rate-btn good" data-action="rate" data-rating="good">Good</button>
            <button type="button" class="rate-btn easy" data-action="rate" data-rating="easy">Easy</button>
          ` : `<button type="button" class="primary-btn flash-reveal" data-action="reveal">Reveal answer</button>`}
        </div>
      </div>`;
  }

  function renderSummary() {
    const rated = session.rated;
    session = null;
    container.innerHTML = `
      <div class="flash-summary">
        <span class="flash-summary-icon">🎉</span>
        <h2>Session complete</h2>
        <p class="lead">${rated} card${rated === 1 ? '' : 's'} reviewed. They'll resurface when due.</p>
        <button type="button" class="primary-btn" data-action="back-dash">Back to revision hub</button>
      </div>`;
  }

  function handleClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const a = target.dataset.action;
    const sid = studentId();

    if (a === 'start-due') startSession({ types: ['note', 'formula'] });
    else if (a === 'start-notes') startSession({ types: ['note'] });
    else if (a === 'start-formulas') startSession({ types: ['formula'] });
    else if (a === 'practice-mistakes') {
      const qs = deps.getMistakeQuestions(sid).map(r => r.question);
      if (qs.length) deps.startPracticeWithQuestions(qs);
    } else if (a === 'practice-leeches') {
      const qs = deps.getLeechQuestions(sid).map(r => r.question);
      if (qs.length) deps.startPracticeWithQuestions(qs);
    } else if (a === 'reveal') {
      session.revealed = true; renderCard();
    } else if (a === 'rate') {
      const item = currentItem();
      deps.reviewSrs(sid, item.type, item.id, target.dataset.rating).then(() => {});
      session.rated += 1;
      if (target.dataset.rating === 'again') session.items.push(item); // re-show this session
      session.index += 1; session.revealed = false;
      if (session.index >= session.items.length) { session.done = true; render(); }
      else renderCard();
    } else if (a === 'end-session') {
      session.done = true; render();
    } else if (a === 'back-dash') {
      session = null; render();
    } else if (a === 'open-bookmark' || a === 'open-full-note') {
      session = null;
      deps.jumpToNote(target.dataset.id);
    }
  }

  global.NeetRevise = { init, render, startSession };
})(window);
