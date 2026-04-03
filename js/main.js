import BootScene        from "./scenes/BootScene.js";
import IntroScene       from "./scenes/IntroScene.js";
import WorldMapScene    from "./scenes/WorldMapScene.js";
import GateScene        from "./scenes/GateScene.js";
import MiniGameScene    from "./scenes/MiniGameScene.js";
import BossScene        from "./scenes/BossScene.js";
import UIScene          from "./scenes/UIScene.js";

import SaveSystem        from "./systems/SaveSystem.js";
import PlayerSystem      from "./systems/PlayerSystem.js";
import ProgressionSystem from "./systems/ProgressionSystem.js";
import AudioSystem       from "./systems/AudioSystem.js";
import AnimationSystem   from "./systems/AnimationSystem.js";
import QuestionEngine    from "./systems/QuestionEngine.js";
import DifficultyEngine  from "./systems/DifficultyEngine.js";
import AchievementSystem from "./systems/AchievementSystem.js";

// ── Global font sizes ─────────────────────────────────────────────────────────
window.elaUI = {
  sizes: { title: 64, subtitle: 36, body: 24, small: 20, micro: 16, button: 30, paragraph: 20 }
};

// ── Guard: StudentID must be present (set by index.php from portal cookie) ────
if (!window.STUDENT_ID) {
  document.body.innerHTML = `
    <div style="font-family:sans-serif;text-align:center;padding:80px;color:#c00">
      <h2>⚠️ Session not found</h2>
      <p>Please return to the Lumos Learning portal to launch ELA Quest.</p>
    </div>`;
  throw new Error('window.STUDENT_ID is not set');
}

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  const save = new SaveSystem();

  // Load existing progress from DynamoDB
  const loaded = await save.load();

  // Hydrate systems from saved state (or defaults for first-time players)
  const events     = new Phaser.Events.EventEmitter();
  const player     = new PlayerSystem(events);
  const progress   = new ProgressionSystem(events);
  const difficulty = new DifficultyEngine();

  if (loaded?.player) {
    player.hydrate(loaded.player);
    progress.hydrate(loaded.progress);
    difficulty.hydrate(loaded.difficulty);
  } else {
    player.hydrate();
    progress.hydrate();
    difficulty.hydrate();
  }

  const systems = {
    events, save, player, progress, progression: progress,
    difficulty,
    audio:     new AudioSystem(events),
    animation: new AnimationSystem(),
    questions: new QuestionEngine()
  };
  systems.achievements = new AchievementSystem(events, player);
  window.elaSystems = systems;

  // ── Auto-save to DynamoDB on game events ───────────────────────────────────
  const snapshot = () => ({
    player:     player.toJSON(),
    progress:   progress.toJSON(),
    difficulty: difficulty.toJSON()
  });

  let saveTimer = null;
  const scheduleSave = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => save.save(snapshot()), 300);
  };

  events.on('save:requested',   () => save.save(snapshot()));
  events.on('player:updated',   scheduleSave);
  events.on('progress:updated', scheduleSave);

  // Best-effort save on tab/window close
  // Only show browser alert if student is actively mid-game (not on map/intro)
  window.addEventListener('beforeunload', (e) => {
    save.saveSync(snapshot());
    if (window.elaIsPlaying) {
      e.preventDefault();
      e.returnValue = '';   // triggers the browser's native "Leave site?" dialog
    }
  });

  // ── Submit score when all 5 gates completed ────────────────────────────────
  events.on('progress:updated', s => {
    if (s.completedCount === 5 && !systems._scoreSent) {
      systems._scoreSent = true;
      save.submitScore({
        gatesCompleted: s.completedCount,
        totalStars:     player.getSnapshot().stars,
        level:          player.getSnapshot().level
      });
    }
  });

  // Initial save (establishes the record in DynamoDB)
  save.save(snapshot());

  // ── Launch Phaser ─────────────────────────────────────────────────────────
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'phaser-root',
    width: 1280, height: 720,
    backgroundColor: '#7ecfff',
    scene: [BootScene, IntroScene, WorldMapScene, GateScene, MiniGameScene, BossScene, UIScene],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    fps: { target: 60, forceSetTimeOut: true },
    custom: { systems }
  });
})();