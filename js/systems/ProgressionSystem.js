export default class ProgressionSystem {
  constructor(events) {
    this.events = events;
    this.state = this.getDefaultState();
  }

  getDefaultState() {
    return {
      unlockedGate: 1,
      completedGates: {},
      gateStars: {},
      restoredCrystals: 0,
      bossUnlocked: false
    };
  }

  hydrate(snapshot = {}) {
    const defaults = this.getDefaultState();
    this.state = {
      ...defaults,
      ...snapshot
    };
    if (!this.state.completedGates || typeof this.state.completedGates !== "object") {
      this.state.completedGates = {};
    }
    if (!this.state.gateStars || typeof this.state.gateStars !== "object") {
      this.state.gateStars = {};
    }
    this.refreshBossUnlock();
    this.emitUpdate();
  }

  toJSON() {
    return { ...this.state };
  }

  isGateUnlocked(gateId) {
    return gateId <= this.state.unlockedGate;
  }

  isGateCompleted(gateId) {
    return Boolean(this.state.completedGates[gateId]);
  }

  completeGate(gateId, stars = 1) {
    if (!this.state.completedGates[gateId]) {
      this.state.completedGates[gateId] = true;
      this.state.restoredCrystals += 1;
    }
    // Always update stars if new score is better
    const prevStars = this.state.gateStars[gateId] || 0;
    if (stars > prevStars) {
      this.state.gateStars[gateId] = stars;
    }

    this.state.unlockedGate = Math.max(this.state.unlockedGate, Math.min(5, gateId + 1));
    this.refreshBossUnlock();
    this.emitUpdate();
  }

  refreshBossUnlock() {
    this.state.bossUnlocked = this.getCompletedCount() >= 5;
  }

  getCompletedCount() {
    return Math.min(5, Object.keys(this.state.completedGates).length);
  }

  getCompletionPercent() {
    return Math.round((this.getCompletedCount() / 5) * 100);
  }

  resetCampaign() {
    this.state = this.getDefaultState();
    this.emitUpdate();
  }

  emitUpdate() {
    this.events.emit("progress:updated", this.getSnapshot());
  }

  getSnapshot() {
    return {
      ...this.state,
      completedCount: this.getCompletedCount(),
      completionPercent: this.getCompletionPercent()
    };
  }
}