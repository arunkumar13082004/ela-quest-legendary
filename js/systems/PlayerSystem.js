const COSMETIC_UNLOCKS = {
  3: "Forest Cloak",
  5: "Crystal Cape",
  7: "Detective Hat",
  9: "Rune Boots",
  12: "Legend Crown"
};

const BONUS_UNLOCKS = {
  4: "Hint Spark",
  8: "XP Glow",
  11: "Star Magnet"
};

export default class PlayerSystem {
  constructor(events) {
    this.events = events;
    this.state = this.getDefaultState();
  }

  getDefaultState() {
    return {
      xp: 0,
      level: 1,
      lives: 5,
      maxLives: 5,
      stars: 0,
      achievements: [],
      cosmeticsUnlocked: ["Explorer Tunic"],
      selectedCosmetic: "Explorer Tunic",
      bonusesUnlocked: []
    };
  }

  hydrate(snapshot = {}) {
    const defaults = this.getDefaultState();
    this.state = {
      ...defaults,
      ...snapshot
    };

    if (!Array.isArray(this.state.achievements)) {
      this.state.achievements = [];
    }
    if (!Array.isArray(this.state.cosmeticsUnlocked)) {
      this.state.cosmeticsUnlocked = [...defaults.cosmeticsUnlocked];
    }
    if (!Array.isArray(this.state.bonusesUnlocked)) {
      this.state.bonusesUnlocked = [];
    }

    this.emitUpdate();
  }

  toJSON() {
    return { ...this.state };
  }

  xpForNextLevel(level = this.state.level) {
    return 160 + (level - 1) * 120;
  }

  gainXP(amount) {
    this.state.xp += amount;
    const unlocked = [];

    while (this.state.xp >= this.xpForNextLevel()) {
      this.state.xp -= this.xpForNextLevel();
      this.state.level += 1;
      unlocked.push(this.applyLevelUnlocks(this.state.level));
      this.events.emit("ui:message", `Level Up! You are now level ${this.state.level}.`);
    }

    this.emitUpdate();
    return unlocked.filter(Boolean);
  }

  applyLevelUnlocks(level) {
    const cosmetic = COSMETIC_UNLOCKS[level];
    if (cosmetic && !this.state.cosmeticsUnlocked.includes(cosmetic)) {
      this.state.cosmeticsUnlocked.push(cosmetic);
      this.state.selectedCosmetic = cosmetic;
      this.events.emit("ui:message", `New cosmetic unlocked: ${cosmetic}`);
      return cosmetic;
    }

    const bonus = BONUS_UNLOCKS[level];
    if (bonus && !this.state.bonusesUnlocked.includes(bonus)) {
      this.state.bonusesUnlocked.push(bonus);
      this.events.emit("ui:message", `Bonus unlocked: ${bonus}`);
      return bonus;
    }

    return null;
  }

  gainStars(amount) {
    this.state.stars += amount;
    this.emitUpdate();
  }

  loseLife() {
    this.state.lives = Math.max(0, this.state.lives - 1);
    this.emitUpdate();
    return this.state.lives;
  }

  restoreLife(amount = 1) {
    this.state.lives = Math.min(this.state.maxLives, this.state.lives + amount);
    this.emitUpdate();
  }

  refillLives() {
    this.state.lives = this.state.maxLives;
    this.emitUpdate();
  }

  addAchievement(id) {
    if (this.state.achievements.includes(id)) {
      return false;
    }
    this.state.achievements.push(id);
    this.emitUpdate();
    return true;
  }

  hasAchievement(id) {
    return this.state.achievements.includes(id);
  }

  emitUpdate() {
    this.events.emit("player:updated", this.getSnapshot());
  }

  getSnapshot() {
    return {
      ...this.state,
      xpToNext: this.xpForNextLevel()
    };
  }
}
