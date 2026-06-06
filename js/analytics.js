/**
 * Student progress analytics, audit trail, and revision strategy.
 */
(function (global) {
  const DAY_MS = 86400000;

  function getAuditLog(student, questionsById, limit = 200) {
    const history = student?.history || [];
    return history
      .slice()
      .sort((a, b) => b.at - a.at)
      .slice(0, limit)
      .map(entry => {
        const question = questionsById.get(entry.questionId);
        return {
          ...entry,
          questionText: question?.question || entry.questionId,
          topic: entry.topic || question?.topic || '',
          subtopic: entry.subtopic || question?.subtopic || ''
        };
      });
  }

  function getRevisionPlan({ questions, getStatus, getProgress, normalizeSection }) {
    const wrongQueue = [];
    const staleQueue = [];
    const pyqQueue = [];
    const unsolvedQueue = [];
    const chapterGaps = new Map();

    questions.forEach(question => {
      const status = getStatus(question.id);
      const record = getProgress(question.id);
      const section = normalizeSection(question.subtopic);
      const chapter = question.topic || 'General';
      const daysSince = record?.lastAt ? (Date.now() - record.lastAt) / DAY_MS : Infinity;

      if (!chapterGaps.has(chapter)) {
        chapterGaps.set(chapter, { chapter, total: 0, unsolved: 0, wrong: 0 });
      }
      const gap = chapterGaps.get(chapter);
      gap.total += 1;
      if (status === 'unsolved') gap.unsolved += 1;
      if (status === 'wrong') gap.wrong += 1;

      const item = { question, status, record, section, daysSince };

      if (status === 'wrong') {
        wrongQueue.push({ ...item, priority: 1, reason: 'Incorrect on last attempt' });
      } else if (status === 'mastered' && daysSince >= 14) {
        staleQueue.push({ ...item, priority: 2, reason: 'Due for spaced revision (14+ days)' });
      } else if (status === 'unsolved' && section === 'pyq') {
        pyqQueue.push({ ...item, priority: 3, reason: 'Unattempted PYQ' });
      } else if (status === 'unsolved') {
        unsolvedQueue.push({ ...item, priority: 4, reason: 'Not yet attempted' });
      }
    });

    const sortByPriority = list => list.sort((a, b) => a.priority - b.priority);
    const dailyQueue = [
      ...sortByPriority(wrongQueue),
      ...sortByPriority(staleQueue),
      ...sortByPriority(pyqQueue),
      ...sortByPriority(unsolvedQueue)
    ].slice(0, 40);

    const weakChapters = [...chapterGaps.values()]
      .filter(row => row.total >= 5 && (row.unsolved / row.total >= 0.6 || row.wrong >= 3))
      .sort((a, b) => (b.unsolved / b.total) - (a.unsolved / a.total))
      .slice(0, 8);

    const strategy = [
      {
        step: 1,
        title: 'Fix mistakes first',
        detail: `${wrongQueue.length} questions got wrong last time. Re-attempt these before new chapters.`,
        count: wrongQueue.length,
        tone: 'danger'
      },
      {
        step: 2,
        title: 'Close chapter gaps',
        detail: weakChapters.length
          ? `Focus: ${weakChapters.slice(0, 3).map(c => c.chapter).join(', ')}.`
          : 'All chapters have reasonable coverage.',
        count: weakChapters.reduce((sum, c) => sum + c.unsolved, 0),
        tone: 'warning'
      },
      {
        step: 3,
        title: 'PYQ drill',
        detail: `${pyqQueue.length} previous-year questions still untouched.`,
        count: pyqQueue.length,
        tone: 'primary'
      },
      {
        step: 4,
        title: 'Spaced revision',
        detail: `${staleQueue.length} mastered questions are due for a refresh.`,
        count: staleQueue.length,
        tone: 'success'
      }
    ];

    return {
      dailyQueue,
      wrongQueue,
      staleQueue,
      pyqQueue,
      unsolvedQueue,
      weakChapters,
      strategy
    };
  }

  function summarizeStudent(studentId, questions, helpers) {
    const stats = helpers.buildStudentStats(studentId);
    const tree = helpers.buildCurriculumTree(studentId);
    let chaptersTotal = 0;
    let chaptersStarted = 0;
    let chaptersMastered = 0;

    tree.forEach(year => {
      year.units.forEach(unit => {
        unit.chapters.forEach(ch => {
          if (!ch.inBank) return;
          chaptersTotal += 1;
          if (ch.attempted > 0) chaptersStarted += 1;
          if (ch.coverage >= 60) chaptersMastered += 1;
        });
      });
    });

    return {
      ...stats,
      chaptersTotal,
      chaptersStarted,
      chaptersMastered,
      completion: stats.total ? Math.round((stats.mastered / stats.total) * 100) : 0
    };
  }

  global.NeetAnalytics = {
    getAuditLog,
    getRevisionPlan,
    summarizeStudent
  };
})(window);
