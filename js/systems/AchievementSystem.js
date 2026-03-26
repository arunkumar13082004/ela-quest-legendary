const DEFINITIONS = {
  first_crystal: { title: "First Crystal Restored", message: "You restored your first knowledge crystal." },
  gate_master: { title: "Gate Specialist", message: "You cleared a gate with 80% accuracy or better." },
  combo_hero: { title: "Combo Hero", message: "You answered 4 challenges correctly in a row." },
  level_five: { title: "Level 5 Reached", message: "Your hero reached level 5." },
  all_crystals: { title: "Crystal Restorer", message: "All five knowledge crystals are back." },
  goblin_guardian: { title: "Goblin Guardian", message: "You defeated the Grammar Goblin." }
};

export default class AchievementSystem {
  constructor(events, playerSystem) {
    this.events = events;
    this.playerSystem = playerSystem;
  }

  unlock(id) {
    const definition = DEFINITIONS[id];
    if (!definition) {
      return false;
    }

    const wasAdded = this.playerSystem.addAchievement(id);
    if (!wasAdded) {
      return false;
    }

    this.events.emit("achievement:unlocked", {
      id,
      ...definition
    });
    return true;
  }

  checkLevelMilestones() {
    if (this.playerSystem.state.level >= 5) {
      this.unlock("level_five");
    }
  }

  checkGateCompletion(result) {
    if (result.completedCount >= 1) {
      this.unlock("first_crystal");
    }
    if (result.accuracy >= 0.8) {
      this.unlock("gate_master");
    }
  }

  checkCombo(streak) {
    if (streak >= 4) {
      this.unlock("combo_hero");
    }
  }

  checkCampaignComplete(progressSystem) {
    if (progressSystem.state.bossUnlocked) {
      this.unlock("all_crystals");
    }
  }
}
