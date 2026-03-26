export default class ProgressionSystem {
  constructor(events) {
    this.events = events;
    this.state = this.getDefaultState();
  }

  getDefaultState() {
    return {
      unlockedGate: 1,
      completedGates: {},
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

  completeGate(gateId) {
    if (!this.state.completedGates[gateId]) {
      this.state.completedGates[gateId] = true;
      this.state.restoredCrystals += 1;
    }

    this.state.unlockedGate = Math.max(this.state.unlockedGate, Math.min(5, gateId + 1));
    this.refreshBossUnlock();
    this.emitUpdate();
  }

  refreshBossUnlock() {
    this.state.bossUnlocked = this.getCompletedCount() >= 5;
  }

  getCompletedCount() {
    return Object.keys(this.state.completedGates).length;
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
