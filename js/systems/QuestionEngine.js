import { GATE_QUESTIONS } from "../data/GateContent.js";

export default class QuestionEngine {
  constructor(questionMap = GATE_QUESTIONS) {
    this.questionMap = questionMap;
  }

  getGateQuestions(gateId) {
    return this.questionMap[gateId] || [];
  }

  getQuestion(gateId, desiredDifficulty, usedIds = new Set()) {
    const pool = this.getGateQuestions(gateId);
    if (!pool.length) return null;

    const available = pool.filter(q => !usedIds.has(q.id));
    if (!available.length) return null;

    const sameDifficulty = available.filter(q => q.difficulty === desiredDifficulty);
    const raw = sameDifficulty.length
      ? sameDifficulty[Math.floor(Math.random() * sameDifficulty.length)]
      : available[Math.floor(Math.random() * available.length)];

    return this._shuffleQuestion(gateId, raw);
  }

  // ── Shuffle options so the correct answer is never always in slot 0 ─────────
  _shuffleQuestion(gateId, q) {
    if (!q) return q;

    // Gate 1 (vocab) & Gate 3 (figurative) & Gate 5 (evidence):
    // have `options` array + `answer` index
    if (Array.isArray(q.options)) {
      const indices = q.options.map((_, i) => i);
      const shuffled = _shuffle(indices);
      return {
        ...q,
        options: shuffled.map(i => q.options[i]),
        answer:  shuffled.indexOf(q.answer)
      };
    }

    // Gate 2 (main idea): has `mainIdeas` + `mainAnswer` + `details` + `detailAnswers`
    if (Array.isArray(q.mainIdeas)) {
      // Shuffle main idea choices
      const mIdx    = q.mainIdeas.map((_, i) => i);
      const mShuf   = _shuffle(mIdx);
      const newMain = mShuf.map(i => q.mainIdeas[i]);
      const newMainAnswer = mShuf.indexOf(q.mainAnswer);

      // Shuffle detail cards, keeping detailAnswers tracking the same items
      const dIdx  = q.details.map((_, i) => i);
      const dShuf = _shuffle(dIdx);
      const newDetails = dShuf.map(i => q.details[i]);
      // detailAnswers stores the indices of the CORRECT detail cards in the original array.
      // After shuffling, find where those originals landed.
      const newDetailAnswers = q.detailAnswers.map(origIdx => dShuf.indexOf(origIdx));

      return {
        ...q,
        mainIdeas:     newMain,
        mainAnswer:    newMainAnswer,
        details:       newDetails,
        detailAnswers: newDetailAnswers
      };
    }

    // Gate 4 (story builder): steps are intentionally shown shuffled in-scene already
    return q;
  }

  getRandomBossPrompt() {
    const gateId = 1 + Math.floor(Math.random() * 5);
    const list   = this.getGateQuestions(gateId);
    const q      = list[Math.floor(Math.random() * list.length)];
    return { gateId, question: this._shuffleQuestion(gateId, q) };
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