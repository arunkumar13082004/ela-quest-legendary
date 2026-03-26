import { GATE_QUESTIONS, GATE_META, ENCOURAGING_LINES, GENTLE_LINES } from "../data/GateContent.js";

export default class QuestionEngine {
  constructor() {
    // All data lives in the local JS modules — no server needed
    this.questionMap = GATE_QUESTIONS;
    this.gateMeta    = GATE_META;
  }

  // Kept for API-compat with main.js — resolves instantly
  async loadAll() { return Promise.resolve(); }

  getGateMeta(gateId)   { return this.gateMeta[gateId] || null; }
  getAllGateMeta()       { return this.gateMeta; }
  getEncouragingLines() { return ENCOURAGING_LINES || []; }
  getGentleLines()      { return GENTLE_LINES || []; }
  getGateQuestions(gateId) { return this.questionMap[gateId] || []; }

  getQuestion(gateId, desiredDifficulty, usedIds = new Set()) {
    const pool = this.getGateQuestions(gateId);
    if (!pool.length) return null;
    const available = pool.filter(q => !usedIds.has(q.id));
    if (!available.length) return null;
    const sameDiff = available.filter(q => q.difficulty === desiredDifficulty);
    const raw = sameDiff.length
      ? sameDiff[Math.floor(Math.random() * sameDiff.length)]
      : available[Math.floor(Math.random() * available.length)];
    return this._shuffleQuestion(gateId, raw);
  }

  getRandomBossPrompt() {
    const gateId = 1 + Math.floor(Math.random() * 5);
    const list   = this.getGateQuestions(gateId);
    const raw    = list[Math.floor(Math.random() * list.length)];
    return { gateId, question: this._shuffleQuestion(gateId, raw) };
  }

  _shuffleQuestion(gateId, q) {
    if (!q) return q;
    if (Array.isArray(q.options)) {
      const shuf = _shuffle(q.options.map((_, i) => i));
      return { ...q, options: shuf.map(i => q.options[i]), answer: shuf.indexOf(q.answer) };
    }
    if (Array.isArray(q.mainIdeas)) {
      const mShuf = _shuffle(q.mainIdeas.map((_, i) => i));
      const dShuf = _shuffle(q.details.map((_, i) => i));
      return {
        ...q,
        mainIdeas:     mShuf.map(i => q.mainIdeas[i]),
        mainAnswer:    mShuf.indexOf(q.mainAnswer),
        details:       dShuf.map(i => q.details[i]),
        detailAnswers: q.detailAnswers.map(orig => dShuf.indexOf(orig))
      };
    }
    return q;
  }
}

function _shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
