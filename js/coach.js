/**
 * NeetCoach — the built-in AI teacher.
 *
 * A rule-based diagnostic engine that turns a student's raw attempt history into
 * the things a real teacher gives: a readiness verdict, a study streak, accuracy
 * trends, weak/strong spots, spaced-repetition due counts, a personalised note,
 * prioritised suggestions, and a post-session report card.
 *
 * Pure functions only — no DOM, no network. Drop a Claude API call into
 * `getTeacherNote` later if you ever want generated prose; the inputs are ready.
 */
(function (global) {
  const DAY_MS = 86400000;
  const RECENT_WINDOW = 20;     // attempts considered "recent"
  const STREAK_TARGET = 7;      // days that count as a full consistency score
  const SPACED_DAYS = 14;       // mastered items go stale after this many days

  function startOfDay(ts) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  /** Consecutive days (ending today or yesterday) with at least one attempt. */
  function getStudyStreak(history) {
    if (!history || !history.length) {
      return { current: 0, best: 0, activeDays: 0, lastActiveAt: 0, studiedToday: false };
    }
    const days = [...new Set(history.map(h => startOfDay(h.at)))].sort((a, b) => b - a);
    const today = startOfDay(Date.now());
    const studiedToday = days[0] === today;

    let current = 0;
    let cursor = studiedToday ? today : today - DAY_MS;
    for (const day of days) {
      if (day === cursor) {
        current += 1;
        cursor -= DAY_MS;
      } else if (day < cursor) {
        break;
      }
    }

    // Best streak across all recorded days.
    let best = 1;
    let run = 1;
    for (let i = 1; i < days.length; i++) {
      if (days[i - 1] - days[i] === DAY_MS) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 1;
      }
    }

    return {
      current,
      best: Math.max(best, current),
      activeDays: days.length,
      lastActiveAt: days[0],
      studiedToday
    };
  }

  /** Recent accuracy vs. the window before it, plus a rolling sparkline series. */
  function getAccuracyTrend(history, windowSize = RECENT_WINDOW) {
    const sorted = (history || []).slice().sort((a, b) => a.at - b.at);
    const pct = list => (list.length
      ? Math.round((list.filter(h => h.result === 'correct').length / list.length) * 100)
      : 0);

    const recent = sorted.slice(-windowSize);
    const prior = sorted.slice(-windowSize * 2, -windowSize);
    const recentPct = pct(recent);
    const priorPct = pct(prior);

    // Sparkline: accuracy of up to 10 sequential buckets.
    const buckets = 10;
    const series = [];
    if (sorted.length) {
      const size = Math.max(1, Math.ceil(sorted.length / buckets));
      for (let i = 0; i < sorted.length; i += size) {
        series.push(pct(sorted.slice(i, i + size)));
      }
    }

    return {
      recent: recentPct,
      prior: priorPct,
      delta: prior.length ? recentPct - priorPct : 0,
      sampleSize: recent.length,
      series: series.slice(-buckets)
    };
  }

  /**
   * Exam-readiness 0–100. A blend a teacher would weigh:
   *  accuracy (how right), breadth (how much syllabus touched),
   *  consistency (showing up), and backlog (unfixed mistakes drag it down).
   */
  function getReadiness({ summary, streak, trend }) {
    const accuracy = clamp(summary.accuracy || 0);
    const breadth = summary.chaptersTotal
      ? clamp((summary.chaptersStarted / summary.chaptersTotal) * 100)
      : 0;
    const consistency = clamp((streak.current / STREAK_TARGET) * 100);
    const backlogRatio = summary.attempted
      ? summary.wrong / summary.attempted
      : 0;
    const backlog = clamp(100 - backlogRatio * 160);

    const score = Math.round(
      accuracy * 0.40 + breadth * 0.28 + consistency * 0.17 + backlog * 0.15
    );

    let band, label;
    if (score >= 78) { band = 'high'; label = 'Exam-ready'; }
    else if (score >= 58) { band = 'good'; label = 'On track'; }
    else if (score >= 38) { band = 'fair'; label = 'Building up'; }
    else { band = 'low'; label = 'Early days'; }

    return { score: clamp(score), band, label, components: { accuracy, breadth, consistency, backlog } };
  }

  function clamp(n) { return Math.max(0, Math.min(100, Math.round(n))); }

  /** Chapter strengths and weaknesses from the curriculum tree. */
  function rankChapters(tree) {
    const chapters = [];
    tree.forEach(year => year.units.forEach(unit => unit.chapters.forEach(ch => {
      if (ch.inBank && ch.total >= 4) chapters.push(ch);
    })));

    const attemptedChapters = chapters.filter(c => c.attempted > 0);
    const weak = chapters
      .filter(c => c.attempted >= 3)
      .map(c => ({ ...c, mastery: Math.round((c.mastered / c.total) * 100) }))
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 5);
    const strong = attemptedChapters
      .map(c => ({ ...c, mastery: Math.round((c.mastered / c.total) * 100) }))
      .filter(c => c.mastery >= 50)
      .sort((a, b) => b.mastery - a.mastery)
      .slice(0, 3);

    return { weak, strong };
  }

  /** Spaced-repetition: mastered items not seen in SPACED_DAYS. */
  function getDueCount(plan) {
    return {
      mistakes: plan.wrongQueue.length,
      spaced: plan.staleQueue.length,
      pyq: plan.pyqQueue.length,
      total: plan.dailyQueue.length
    };
  }

  /**
   * Pulls everything together. `helpers` provides the per-student data the app
   * already computes, so the coach stays a thin analysis layer.
   */
  function buildInsights({ name, summary, plan, tree, history }) {
    const streak = getStudyStreak(history);
    const trend = getAccuracyTrend(history);
    const readiness = getReadiness({ summary, streak, trend });
    const chapters = rankChapters(tree);
    const due = getDueCount(plan);

    return {
      name: name || 'there',
      summary,
      streak,
      trend,
      readiness,
      weakChapters: chapters.weak,
      strongChapters: chapters.strong,
      due,
      totalAttempts: (history || []).length
    };
  }

  /**
   * The teacher's note — what shows at the top of the dashboard.
   * Returns { tone, greeting, lines[] } so the UI can style it.
   */
  function getTeacherNote(insights) {
    const { name, summary, streak, trend, readiness, weakChapters, strongChapters, due, totalAttempts } = insights;
    const lines = [];
    let tone = readiness.band;

    if (!totalAttempts) {
      return {
        tone: 'fresh',
        greeting: `Welcome, ${name}!`,
        lines: [
          "I'm your study coach. Answer a few MCQs and I'll start tracking exactly where you're strong and where you need work.",
          'Tip: start with one chapter you find hard — fixing weak spots early pays off most.'
        ]
      };
    }

    // Greeting reacts to streak.
    let greeting;
    if (streak.current >= 5) greeting = `${streak.current}-day streak, ${name} — outstanding consistency!`;
    else if (streak.current >= 2) greeting = `Day ${streak.current} in a row, ${name}. Keep the momentum.`;
    else if (streak.studiedToday) greeting = `Good to see you back, ${name}.`;
    else greeting = `Welcome back, ${name} — let's pick up where you left off.`;

    // Readiness verdict.
    lines.push(
      `Exam readiness is **${readiness.score}/100 (${readiness.label})**. ` +
      `Your accuracy across attempts is ${summary.accuracy}% over ${summary.attempted} questions.`
    );

    // Trend sentence.
    if (trend.sampleSize >= 5) {
      if (trend.delta >= 6) lines.push(`📈 You're improving — recent accuracy is up ${trend.delta}% versus before. Whatever you changed, keep doing it.`);
      else if (trend.delta <= -6) lines.push(`📉 Recent accuracy dipped ${Math.abs(trend.delta)}%. Slow down and read each option fully before answering.`);
      else lines.push(`Your recent accuracy is steady at ${trend.recent}%. Time to push into harder material.`);
    }

    // Directive — what to do today.
    if (due.mistakes > 0) {
      lines.push(`🔧 First priority today: re-attempt the **${due.mistakes} question${due.mistakes > 1 ? 's' : ''} you got wrong**. Mistakes you don't revisit become exam-day surprises.`);
    } else if (weakChapters.length) {
      const w = weakChapters[0];
      lines.push(`🎯 Focus chapter: **${w.name}** — only ${w.mastery}% mastered (${w.unsolved} new, ${w.wrong} weak). One focused session here will move your readiness the most.`);
    } else if (due.spaced > 0) {
      lines.push(`🔁 You've cleared your mistakes — now refresh the **${due.spaced} mastered question${due.spaced > 1 ? 's' : ''}** due for spaced revision so they stick.`);
    } else {
      lines.push('🚀 No mistakes pending and chapters look healthy. Open a new chapter or drill PYQs to widen your coverage.');
    }

    // Encouragement / strength callout.
    if (strongChapters.length) {
      lines.push(`💪 Strongest area: ${strongChapters[0].name} (${strongChapters[0].mastery}% mastered). Nice work there.`);
    }

    return { tone, greeting, lines };
  }

  /** Prioritised, clickable suggestions. Each maps to an existing data-action. */
  function getSuggestions(insights) {
    const { due, weakChapters, streak, trend } = insights;
    const out = [];

    if (due.mistakes > 0) {
      out.push({
        icon: '🔧', tone: 'danger',
        title: `Fix ${due.mistakes} past mistake${due.mistakes > 1 ? 's' : ''}`,
        detail: 'Re-attempt questions you got wrong — highest-impact revision.',
        action: 'practice-mistakes', actionLabel: 'Fix mistakes'
      });
    }
    if (weakChapters.length) {
      const w = weakChapters[0];
      out.push({
        icon: '🎯', tone: 'warning',
        title: `Drill ${w.name}`,
        detail: `${w.mastery}% mastered · ${w.unsolved} new · ${w.wrong} weak.`,
        action: 'practice-chapter', actionLabel: 'Practice chapter', data: { chapter: w.name }
      });
    }
    if (due.pyq > 0) {
      out.push({
        icon: '🏆', tone: 'primary',
        title: `${due.pyq} PYQ${due.pyq > 1 ? 's' : ''} untouched`,
        detail: 'Previous-year questions show you the real exam pattern.',
        action: 'practice-pyq', actionLabel: 'Practice PYQs'
      });
    }
    if (due.spaced > 0) {
      out.push({
        icon: '🔁', tone: 'success',
        title: `${due.spaced} due for spaced revision`,
        detail: 'Refresh mastered topics before they fade.',
        action: 'practice-spaced', actionLabel: 'Refresh now'
      });
    }
    if (!streak.studiedToday) {
      out.push({
        icon: '🔥', tone: 'primary',
        title: streak.current > 0 ? `Keep your ${streak.current}-day streak alive` : 'Start a study streak today',
        detail: 'A short daily session beats long irregular ones.',
        action: 'start-revision', actionLabel: "Today's queue"
      });
    }
    if (!out.length) {
      out.push({
        icon: '🚀', tone: 'success',
        title: 'All caught up',
        detail: 'Open a new chapter to widen your syllabus coverage.',
        action: 'goto-chapters', actionLabel: 'Browse chapters'
      });
    }
    return out.slice(0, 4);
  }

  /**
   * Immediate per-question reaction shown right after a student answers.
   * `prior` is the student's record for this question BEFORE this attempt.
   */
  function getAttemptFeedback({ isCorrect, prior, section, streakInSession = 0 }) {
    const hadWrong = prior && prior.wrong > 0;
    const firstTime = !prior || prior.attempts === 0;

    if (isCorrect) {
      if (hadWrong) return { tone: 'win', text: '✅ Fixed it! You got this wrong before — that mistake is now corrected. This is exactly how marks are gained.' };
      if (streakInSession >= 4) return { tone: 'win', text: `🔥 ${streakInSession} in a row! You're in the zone.` };
      if (firstTime) return { tone: 'win', text: '✅ Nailed it on the first try.' };
      return { tone: 'win', text: '✅ Correct — well reasoned.' };
    }

    if (section === 'pyq') return { tone: 'miss', text: '❌ Not quite — and this is a previous-year question, so study the explanation carefully. Expect this pattern in the exam.' };
    if (hadWrong) return { tone: 'miss', text: "❌ Missed again — this one is a recurring weak spot. Read the explanation slowly; I'll keep it near the top of your revision queue." };
    return { tone: 'miss', text: '❌ Not quite. Read the explanation below — understanding *why* the wrong options are wrong is what makes it stick.' };
  }

  /**
   * End-of-session report card.
   * `log` = [{ question, isCorrect, ms }]. Returns score, grade, topic
   * breakdown, time stats, and a teacher's closing note.
   */
  function getSessionReport(log) {
    const total = log.length;
    const correct = log.filter(e => e.isCorrect).length;
    const percent = total ? Math.round((correct / total) * 100) : 0;

    const grade =
      percent >= 90 ? { letter: 'A+', tone: 'win', word: 'Outstanding' } :
      percent >= 75 ? { letter: 'A', tone: 'win', word: 'Strong' } :
      percent >= 60 ? { letter: 'B', tone: 'good', word: 'Solid' } :
      percent >= 45 ? { letter: 'C', tone: 'fair', word: 'Getting there' } :
                      { letter: 'D', tone: 'low', word: 'Needs work' };

    // Per-topic breakdown.
    const topics = new Map();
    log.forEach(e => {
      const t = e.question.topic || 'General';
      if (!topics.has(t)) topics.set(t, { topic: t, total: 0, correct: 0 });
      const row = topics.get(t);
      row.total += 1;
      if (e.isCorrect) row.correct += 1;
    });
    const breakdown = [...topics.values()]
      .map(r => ({ ...r, pct: Math.round((r.correct / r.total) * 100) }))
      .sort((a, b) => a.pct - b.pct);

    const weakTopics = breakdown.filter(r => r.pct < 60).map(r => r.topic);

    // Timing.
    const times = log.map(e => e.ms).filter(ms => ms > 0);
    const avgMs = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    const avgSec = Math.round(avgMs / 1000);

    // Longest correct run.
    let bestRun = 0, run = 0;
    log.forEach(e => { run = e.isCorrect ? run + 1 : 0; bestRun = Math.max(bestRun, run); });

    // Teacher's note.
    const note = [];
    if (percent >= 90) note.push(`${grade.word} session — ${correct}/${total}. You clearly understand this material.`);
    else if (percent >= 60) note.push(`${grade.word} work — ${correct}/${total} correct. A little polish and you'll be in the top band.`);
    else note.push(`${correct}/${total} this round. Don't be discouraged — every wrong answer you review is a mark saved on exam day.`);

    if (weakTopics.length) note.push(`Spend your next session on **${weakTopics.slice(0, 2).join(' and ')}** — that's where points slipped today.`);
    else if (total >= 4) note.push('No weak topic stood out — push into harder questions or a new chapter next.');

    if (avgSec >= 1) {
      if (avgSec <= 25 && percent >= 70) note.push(`Fast *and* accurate (~${avgSec}s/question) — that's exam pace.`);
      else if (avgSec > 75) note.push(`You averaged ~${avgSec}s/question. In the exam you'll have ~50s — practise deciding faster.`);
    }
    if (bestRun >= 5) note.push(`Best streak this session: ${bestRun} in a row. 🔥`);

    return { total, correct, percent, grade, breakdown, weakTopics, avgSec, bestRun, note };
  }

  global.NeetCoach = {
    getStudyStreak,
    getAccuracyTrend,
    getReadiness,
    buildInsights,
    getTeacherNote,
    getSuggestions,
    getAttemptFeedback,
    getSessionReport
  };
})(window);
