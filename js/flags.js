/**
 * Answer flag reports — students challenge MCQ keys; admin reviews.
 */
(function (global) {
  function makeFlagId() {
    return `flag_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function questionSnapshot(question) {
    if (!question) return {};
    return {
      question: question.question,
      option_a: question.options?.[0] || '',
      option_b: question.options?.[1] || '',
      option_c: question.options?.[2] || '',
      option_d: question.options?.[3] || '',
      answer: question.answer,
      topic: question.topic,
      subtopic: question.subtopic,
      explanation: question.explanation || ''
    };
  }

  function createFlag({ question, studentId, studentName, suggestedAnswer, comment }) {
    return {
      id: makeFlagId(),
      questionId: question.id,
      studentId,
      studentName,
      status: 'pending',
      suggestedAnswer: String(suggestedAnswer || '').trim().toUpperCase(),
      comment: String(comment || '').trim(),
      createdAt: Date.now(),
      resolvedAt: null,
      adminNote: '',
      snapshot: questionSnapshot(question)
    };
  }

  function mergeFlagsData(local, remote) {
    const merged = {
      version: 1,
      updatedAt: Math.max(local?.updatedAt || 0, remote?.updatedAt || 0, Date.now()),
      items: []
    };
    const byId = new Map();

    [...(local?.items || []), ...(remote?.items || [])].forEach(item => {
      if (!item?.id) return;
      const existing = byId.get(item.id);
      if (!existing) {
        byId.set(item.id, item);
        return;
      }
      const useRemote = (item.resolvedAt || item.createdAt || 0) >= (existing.resolvedAt || existing.createdAt || 0);
      byId.set(item.id, useRemote ? item : existing);
    });

    merged.items = [...byId.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return merged;
  }

  function pendingCount(store) {
    return (store?.items || []).filter(item => item.status === 'pending').length;
  }

  global.NeetFlags = {
    createFlag,
    mergeFlagsData,
    pendingCount,
    questionSnapshot
  };
})(window);
