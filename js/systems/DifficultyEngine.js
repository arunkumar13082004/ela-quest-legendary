const CLAMP_MIN = -4;
const CLAMP_MAX = 4;

export default class DifficultyEngine {
  constructor() {
    this.byGate = {};
  }

  hydrate(snapshot = {}) {
    this.byGate = snapshot && typeof snapshot === "object" ? snapshot : {};
  }

  toJSON() {
    return { ...this.byGate };
  }

  getGateState(gateId) {
    if (!this.byGate[gateId]) {
      this.byGate[gateId] = {
        score: 0,
        streak: 0,
        misses: 0
      };
    }
    return this.byGate[gateId];
  }

  recordResult(gateId, correct) {
    const gateState = this.getGateState(gateId);
    if (correct) {
      gateState.streak += 1;
      gateState.misses = 0;
      gateState.score = Math.min(CLAMP_MAX, gateState.score + (gateState.streak >= 2 ? 1 : 0.5));
    } else {
      gateState.misses += 1;
      gateState.streak = 0;
      gateState.score = Math.max(CLAMP_MIN, gateState.score - (gateState.misses >= 2 ? 1 : 0.5));
    }
    return gateState;
  }

  getDifficulty(gateId) {
    const score = this.getGateState(gateId).score;
    if (score <= -1) {
      return "easy";
    }
    if (score >= 2) {
      return "hard";
    }
    return "medium";
  }

  getQuestionCountForRun(gateId) {
    return 6;
  }

  shouldOfferHint(gateId) {
    const gateState = this.getGateState(gateId);
    return gateState.misses >= 1 || gateState.score < 0;
  }
}