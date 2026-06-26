/**
 * NeetNotes — syllabus-organised Notes browser, note detail, formula sheets
 * and quick-revision cheat sheets. Notes <-> questions are bidirectionally
 * linked (see app.js initNotesIndex / jumpToNote / practiceNoteQuestions).
 */
(function (global) {
  let deps = {};
  let container = null;

  function init(dependencies) {
    deps = dependencies;
    container = document.getElementById('notesView');
    if (container && !container.dataset.bound) {
      container.addEventListener('click', handleClick);
      container.dataset.bound = '1';
    }
  }

  const esc = t => (deps.escapeHtml ? deps.escapeHtml(t) : String(t ?? ''));
  const studentId = () => deps.getActiveStudentId();

  /** Render text with LaTeX + **bold**. */
  function rich(text) {
    return deps.renderMath(String(text ?? '')).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  /** Lightweight markdown for note bodies (bullets, bold headings, paragraphs). */
  function renderBody(body) {
    if (!body) return '';
    const lines = String(body).split('\n');
    let html = '';
    let inList = false;
    const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
    lines.forEach(raw => {
      const line = raw.trim();
      if (!line) { closeList(); return; }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        if (!inList) { html += '<ul class="note-bullets">'; inList = true; }
        html += `<li>${rich(line.slice(2))}</li>`;
      } else if (/^\*\*[^*]+\*\*$/.test(line)) {
        closeList();
        html += `<h4 class="note-subhead">${rich(line)}</h4>`;
      } else {
        closeList();
        html += `<p>${rich(line)}</p>`;
      }
    });
    closeList();
    return html;
  }

  // ---- progress helpers ----
  function noteCoverage(note) {
    const sid = studentId();
    if (!sid) return 0;
    const qs = deps.getQuestionsForNote(note);
    if (!qs.length) return 0;
    const mastered = qs.filter(q => deps.getQuestionStatus(sid, q.id) === 'mastered').length;
    return Math.round((mastered / qs.length) * 100);
  }

  function noteReviewed(note) {
    const sid = studentId();
    return sid ? Boolean(deps.getSrsCard(sid, 'note', note.id)) : false;
  }

  function chapterNotes(chapter) {
    return (deps.state.notesByChapter.get(chapter) || [])
      .slice()
      .sort((a, b) => (a.subtopic || '').localeCompare(b.subtopic || ''));
  }

  // ---- top-level render ----
  function render(opts = {}) {
    if (!container) container = document.getElementById('notesView');
    if (!container) return;
    const view = deps.state.notesView || 'browse';
    if (view === 'note' && deps.state.selectedNoteId) renderNoteDetail(deps.state.selectedNoteId);
    else if (view === 'cheatsheet' && deps.state.selectedChapter) renderCheatSheet(deps.state.selectedChapter);
    else if (view === 'chapter' && deps.state.selectedChapter) renderChapter(deps.state.selectedChapter);
    else renderBrowse();

    if (opts.flash) {
      requestAnimationFrame(() => {
        const node = container.querySelector(`[data-note-card="${opts.flash}"]`) ||
                     container.querySelector('.note-detail');
        if (node) {
          node.classList.add('note-flash');
          node.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => node.classList.remove('note-flash'), 1600);
        }
      });
    }
    if (global.NeetRevise) { /* keep due badges fresh elsewhere */ }
  }

  // ---- browse: curriculum tree of chapters ----
  function renderBrowse() {
    const tree = deps.curriculum.CURRICULUM;
    const byChapter = deps.state.notesByChapter;

    const chapterCard = (chapterName) => {
      const notes = byChapter.get(chapterName) || [];
      if (!notes.length) {
        return `<div class="note-chap-card disabled"><span class="note-chap-name">${esc(chapterName)}</span><span class="muted">— no notes</span></div>`;
      }
      const formulas = notes.reduce((n, x) => n + (x.formulas ? x.formulas.length : 0), 0);
      const cov = Math.round(notes.reduce((s, n) => s + noteCoverage(n), 0) / notes.length);
      return `
        <button type="button" class="note-chap-card" data-action="open-chapter-notes" data-chapter="${esc(chapterName)}">
          <span class="note-chap-name">${esc(chapterName)}</span>
          <span class="note-chap-meta">${notes.length} notes · 📐 ${formulas} · 📝 ${notes.reduce((s, n) => s + (n.questionIds ? n.questionIds.length : 0), 0)}Q</span>
          <span class="mini-bar"><i style="width:${cov}%"></i></span>
        </button>`;
    };

    // out-of-syllabus chapters (class === '—' / not in curriculum tree)
    const inTree = new Set(deps.curriculum.CURRICULUM.flatMap(y => y.units.flatMap(u => u.chapters)));
    const extras = [...byChapter.keys()].filter(ch => !inTree.has(deps.curriculum.normalizeChapter(ch)));

    container.innerHTML = `
      <div class="notes-hero">
        <div>
          <p class="eyebrow-dark">Study notes</p>
          <h2>Physics notes &amp; formulas</h2>
          <p class="lead">Every chapter, organised by the NEET XI/XII syllabus. Tap a chapter to read notes, see formulas, and jump to linked MCQs.</p>
        </div>
        <div class="notes-view-switch">
          <button type="button" class="primary-btn" data-action="open-revise">📌 Revision hub</button>
        </div>
      </div>
      ${tree.map(year => `
        <div class="note-year">
          <div class="chap-year-sep"><strong>${esc(year.label)}</strong><span>${esc(year.subtitle)}</span></div>
          ${year.units.map(unit => `
            <div class="chap-unit-sep">${esc(unit.label)}</div>
            <div class="note-chap-grid">
              ${unit.chapters.map(chapterCard).join('')}
            </div>
          `).join('')}
        </div>
      `).join('')}
      ${extras.length ? `
        <div class="note-year">
          <div class="chap-unit-sep">Beyond NEET syllabus</div>
          <div class="note-chap-grid">${extras.map(chapterCard).join('')}</div>
        </div>` : ''}
    `;
  }

  // ---- chapter: list of subtopic notes ----
  function renderChapter(chapter) {
    const notes = chapterNotes(chapter);
    const sid = studentId();
    const info = deps.curriculum.getChapterInfo(chapter);
    const formulas = notes.reduce((n, x) => n + (x.formulas ? x.formulas.length : 0), 0);

    container.innerHTML = `
      <button type="button" class="chap-back-btn" data-action="notes-home">← All chapters</button>
      <div class="notes-hero compact">
        <div>
          ${info ? `<p class="eyebrow-dark">${esc(info.classLabel)} · ${esc(info.unitLabel)}</p>` : ''}
          <h2>${esc(chapter)}</h2>
          <p class="muted">${notes.length} notes · 📐 ${formulas} formulas</p>
        </div>
        <div class="notes-view-switch">
          <button type="button" class="secondary-btn" data-action="open-cheatsheet" data-chapter="${esc(chapter)}">📋 Cheat sheet</button>
          <button type="button" class="primary-btn" data-action="flashcards-chapter" data-chapter="${esc(chapter)}">⚡ Flashcards</button>
        </div>
      </div>
      <div class="note-list">
        ${notes.map(note => {
          const cov = noteCoverage(note);
          const mark = sid ? deps.getMark(sid, 'note', note.id) : null;
          const star = mark?.bookmark ? '★' : '☆';
          return `
            <article class="note-card" data-note-card="${esc(note.id)}">
              <button type="button" class="note-card-main" data-action="open-note" data-note="${esc(note.id)}">
                <div class="note-card-head">
                  <h3>${rich(note.title || note.subtopic)}</h3>
                  ${note.source === 'authored' ? '<span class="badge green">Expert</span>' : ''}
                </div>
                <p class="note-card-summary">${rich(note.summary || '')}</p>
                <div class="note-card-meta">
                  <span>📝 ${(note.questionIds || []).length} MCQs</span>
                  ${note.formulas?.length ? `<span>📐 ${note.formulas.length} formulas</span>` : ''}
                  ${cov ? `<span class="learn-badge mastered">${cov}% mastered</span>` : ''}
                  ${noteReviewed(note) ? '<span class="learn-badge attempted">in revision</span>' : ''}
                </div>
              </button>
              <button type="button" class="note-star ${mark?.bookmark ? 'on' : ''}" title="Bookmark"
                data-action="note-bookmark" data-type="note" data-id="${esc(note.id)}">${star}</button>
            </article>`;
        }).join('') || '<p class="muted">No notes in this chapter yet.</p>'}
      </div>
    `;
  }

  // ---- note detail ----
  function renderNoteDetail(noteId) {
    const note = deps.state.noteById.get(noteId);
    if (!note) { renderBrowse(); return; }
    const sid = studentId();
    const qs = deps.getQuestionsForNote(note);
    const newCount = sid ? qs.filter(q => deps.getQuestionStatus(sid, q.id) === 'unsolved').length : qs.length;
    const mark = sid ? deps.getMark(sid, 'note', note.id) : null;
    const siblings = chapterNotes(note.chapter);
    const idx = siblings.findIndex(n => n.id === note.id);
    const prev = idx > 0 ? siblings[idx - 1] : null;
    const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

    const flagBtn = (flag, label, icon) => `
      <button type="button" class="chip-toggle ${mark?.flag === flag ? 'on' : ''}"
        data-action="note-flag" data-type="note" data-id="${esc(note.id)}" data-flag="${flag}">${icon} ${label}</button>`;

    container.innerHTML = `
      <button type="button" class="chap-back-btn" data-action="open-chapter-notes" data-chapter="${esc(note.chapter)}">← ${esc(note.chapter)}</button>
      <article class="note-detail">
        <header class="note-detail-head">
          <div>
            <p class="eyebrow-dark">${esc(note.class)} · ${esc(note.chapter)}</p>
            <h2>${rich(note.title || note.subtopic)}</h2>
          </div>
          <button type="button" class="note-star big ${mark?.bookmark ? 'on' : ''}" title="Bookmark"
            data-action="note-bookmark" data-type="note" data-id="${esc(note.id)}">${mark?.bookmark ? '★' : '☆'}</button>
        </header>

        ${note.summary ? `<p class="note-summary">${rich(note.summary)}</p>` : ''}

        <div class="note-marks">
          ${flagBtn('revise', 'Revise', '🔁')}
          ${flagBtn('doubt', 'Doubt', '❓')}
          ${flagBtn('confident', 'Confident', '✅')}
          <button type="button" class="chip-toggle" data-action="add-note-revision" data-id="${esc(note.id)}">＋ Add to flashcards</button>
        </div>

        ${note.body ? `<div class="note-body">${renderBody(note.body)}</div>` : ''}

        ${note.formulas?.length ? `
          <section class="note-formulas">
            <h3>📐 Formulas</h3>
            <ul class="formula-list">
              ${note.formulas.map(f => `
                <li class="formula-item">
                  <span class="formula-latex">${deps.renderMath('$' + f.latex + '$')}</span>
                  ${f.meaning ? `<span class="formula-meaning">${esc(f.meaning)}</span>` : ''}
                </li>`).join('')}
            </ul>
          </section>` : ''}

        <section class="note-linked">
          <div class="note-linked-head">
            <h3>📝 Linked questions <span class="muted">${qs.length}</span></h3>
            <div class="note-linked-actions">
              <button type="button" class="primary-btn" data-action="practice-note" data-note="${esc(note.id)}">Practice ${qs.length} MCQs</button>
              ${newCount && newCount < qs.length ? `<button type="button" class="secondary-btn" data-action="practice-note-new" data-note="${esc(note.id)}">New only (${newCount})</button>` : ''}
            </div>
          </div>
          <ul class="note-q-list">
            ${qs.slice(0, 12).map(q => {
              const status = sid ? deps.getQuestionStatus(sid, q.id) : 'unsolved';
              const labels = { unsolved: 'New', wrong: 'Weak', mastered: 'Strong', attempted: 'Tried' };
              return `<li class="${status}"><span class="learn-badge ${status}">${labels[status] || ''}</span> <span>${rich((q.question || '').slice(0, 110))}${q.question.length > 110 ? '…' : ''}</span></li>`;
            }).join('')}
            ${qs.length > 12 ? `<li class="muted">+${qs.length - 12} more in practice</li>` : ''}
          </ul>
        </section>

        <footer class="note-nav-footer">
          ${prev ? `<button type="button" class="secondary-btn" data-action="open-note" data-note="${esc(prev.id)}">← ${esc((prev.title || prev.subtopic).slice(0, 28))}</button>` : '<span></span>'}
          ${next ? `<button type="button" class="secondary-btn" data-action="open-note" data-note="${esc(next.id)}">${esc((next.title || next.subtopic).slice(0, 28))} →</button>` : '<span></span>'}
        </footer>
      </article>
    `;
  }

  // ---- cheat sheet: one printable page per chapter ----
  function renderCheatSheet(chapter) {
    const notes = chapterNotes(chapter);
    const allFormulas = [];
    notes.forEach(n => (n.formulas || []).forEach(f => allFormulas.push(f)));

    container.innerHTML = `
      <button type="button" class="chap-back-btn no-print" data-action="open-chapter-notes" data-chapter="${esc(chapter)}">← ${esc(chapter)}</button>
      <div class="cheatsheet" id="cheatSheetPrintable">
        <div class="cheatsheet-head">
          <h2>${esc(chapter)} — Quick revision</h2>
          <button type="button" class="secondary-btn no-print" data-action="print-cheatsheet">🖨 Print</button>
        </div>
        <section class="cheatsheet-formulas">
          <h3>📐 Formula sheet <span class="muted">${allFormulas.length}</span></h3>
          <div class="cheatsheet-formula-grid">
            ${allFormulas.map(f => `
              <div class="cheatsheet-formula">${deps.renderMath('$' + f.latex + '$')}${f.meaning ? `<small>${esc(f.meaning)}</small>` : ''}</div>
            `).join('') || '<p class="muted">No formulas extracted for this chapter yet.</p>'}
          </div>
        </section>
        <section class="cheatsheet-keys">
          <h3>🔑 Key points</h3>
          <ul>
            ${notes.map(n => `<li><strong>${esc(n.subtopic)}:</strong> ${rich(n.summary || '')}</li>`).join('')}
          </ul>
        </section>
      </div>
    `;
  }

  // ---- click routing ----
  function handleClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const a = target.dataset.action;
    const st = deps.state;

    if (a === 'open-chapter-notes') {
      st.selectedChapter = target.dataset.chapter; st.notesView = 'chapter'; render();
    } else if (a === 'notes-home') {
      st.notesView = 'browse'; st.selectedNoteId = ''; render();
    } else if (a === 'open-note') {
      st.selectedNoteId = target.dataset.note; st.notesView = 'note'; render();
    } else if (a === 'open-cheatsheet') {
      st.selectedChapter = target.dataset.chapter; st.notesView = 'cheatsheet'; render();
    } else if (a === 'print-cheatsheet') {
      window.print();
    } else if (a === 'practice-note') {
      deps.practiceNoteQuestions(target.dataset.note, false);
    } else if (a === 'practice-note-new') {
      deps.practiceNoteQuestions(target.dataset.note, true);
    } else if (a === 'note-bookmark') {
      deps.toggleBookmark(studentId(), target.dataset.type, target.dataset.id).then(() => render());
    } else if (a === 'note-flag') {
      deps.setMarkFlag(studentId(), target.dataset.type, target.dataset.id, target.dataset.flag).then(() => render());
    } else if (a === 'add-note-revision') {
      deps.reviewSrs(studentId(), 'note', target.dataset.id, 'good').then(() => {
        deps.showToast('Added to your flashcard revision.', { type: 'success' });
        render();
      });
    } else if (a === 'flashcards-chapter') {
      if (global.NeetRevise) NeetRevise.startSession({ scope: 'chapter', chapter: target.dataset.chapter });
    } else if (a === 'open-revise') {
      deps.switchTab('revise');
    }
  }

  global.NeetNotes = { init, render };
})(window);
