import { GATE_META } from "../data/GateContent.js";

export default class BossScene extends Phaser.Scene {
  constructor() {
    super({ key: "BossScene" });
  }

  create() {
    this.sys$ = (this.game?.config?.custom?.systems) || window.elaSystems;
    if (!this.sys$) {
      console.error("BossScene: systems not found.");
      this.sys$ = {
        progress: { state: { bossUnlocked: false } },
        audio: { attach:()=>{}, playMusic:()=>{}, playSfx:()=>{} },
        events: new Phaser.Events.EventEmitter(),
        questions: { getRandomBossPrompt: () => ({ gateId: 1, question: null }) },
        player: { gainXP:()=>{}, gainStars:()=>{} },
        animation: { sparkBurst:()=>{}, confetti:()=>{} },
        achievements: { unlock:()=>{} }
      };
    }
    const { progress, audio, events } = this.sys$;

    if (!progress.state.bossUnlocked) {
      events.emit('ui:message', 'Restore all five crystals first!');
      this.scene.start('WorldMapScene');
      return;
    }

    audio.attach(this);
    audio.playMusic('bgm_boss', 0.3);
    events.emit('ui:toggle', true);

    this.round        = 0;
    this.totalRounds  = 8;
    this.correct      = 0;
    this.bossHp       = 100;
    this.heroHp       = 100;
    this.awaitingAnswer = false;
    this.optionButtons  = [];

    this._drawArena();
    this.nextRound();
  }

  _drawArena() {
    const W = this.scale.width, H = this.scale.height;

    // Dark gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a38, 0x1a0a38, 0x3a0060, 0x3a0060, 1);
    bg.fillRect(0, 0, W, H);
    this.add.tileSprite(640, 360, 1280, 720, 'tile-arena').setAlpha(0.3);

    // Arena floor
    const floor = this.add.graphics();
    floor.fillStyle(0x2a0050, 1);
    floor.fillEllipse(640, 580, 900, 100);
    floor.lineStyle(3, 0x8833ff, 0.5);
    floor.strokeEllipse(640, 580, 900, 100);

    // Magic circle / arena ring
    const ring = this.add.graphics().setDepth(1);
    ring.lineStyle(4, 0x9933ff, 0.6);
    ring.strokeCircle(640, 500, 380);
    ring.lineStyle(2, 0xff44aa, 0.4);
    ring.strokeCircle(640, 500, 340);

    // Title
    this.add.text(640, 40, '⚡ Grammar Goblin – Final Battle ⚡', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '42px',
      color: '#ffe680', stroke: '#660088', strokeThickness: 8
    }).setOrigin(0.5).setDepth(5);

    // ── HERO ──────────────────────────────────────────────────────────────────
    this.heroG = this.add.graphics().setDepth(4);
    this._drawHero(this.heroG, 160, 460);

    this.add.text(160, 380, '🧑‍🦸 YOU', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '22px', color: '#80ffdd'
    }).setOrigin(0.5).setDepth(5);

    // Hero HP bar
    const heroBg = this.add.graphics().setDepth(5);
    heroBg.fillStyle(0x0d1f35, 1);
    heroBg.fillRoundedRect(60, 540, 200, 24, 8);
    heroBg.lineStyle(2, 0x44aaff, 0.7);
    heroBg.strokeRoundedRect(60, 540, 200, 24, 8);

    this.heroBar = this.add.graphics().setDepth(6);
    this._drawBar(this.heroBar, 64, 544, 192, 16, 0x55ddaa, 1);

    this.add.text(160, 555, '❤️ HP', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '16px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(7);

    // ── GOBLIN ────────────────────────────────────────────────────────────────
    this.goblinG = this.add.graphics().setDepth(4);
    this._drawGoblin(this.goblinG, 1120, 440);

    this.add.text(1120, 360, '😈 Grammar Goblin', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '22px', color: '#ff88ff'
    }).setOrigin(0.5).setDepth(5);

    // Boss HP bar
    const bossBg = this.add.graphics().setDepth(5);
    bossBg.fillStyle(0x0d1f35, 1);
    bossBg.fillRoundedRect(1020, 540, 200, 24, 8);
    bossBg.lineStyle(2, 0xff44aa, 0.7);
    bossBg.strokeRoundedRect(1020, 540, 200, 24, 8);

    this.bossBar = this.add.graphics().setDepth(6);
    this._drawBar(this.bossBar, 1024, 544, 192, 16, 0xff5577, 1);

    this.add.text(1120, 555, '💀 Boss HP', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '16px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(7);

    // ── ROUND / PROMPT / FEEDBACK ──────────────────────────────────────────────
    this.roundText = this.add.text(640, 98, '', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '24px', color: '#ddaaff'
    }).setOrigin(0.5).setDepth(5);

    this.promptBg = this.add.graphics().setDepth(4);
    this.promptText = this.add.text(640, 185, '', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '24px',
      color: '#ffffff', stroke: '#220044', strokeThickness: 5,
      align: 'center', wordWrap: { width: 860 }
    }).setOrigin(0.5).setDepth(5);

    this.feedbackPanel = this.add.graphics().setDepth(4);
    this.feedbackText = this.add.text(640, 662, 'Answer the mixed ELA challenges to defeat the Grammar Goblin!', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '24px',
      color: '#ffe8a0', align: 'center', wordWrap: { width: 1100 }
    }).setOrigin(0.5).setDepth(5);

    // Floating sparkles (background ambience)
    this.add.particles('star', {
      x: { min: 0, max: W },
      y: { min: 0, max: H },
      lifespan: { min: 3000, max: 7000 },
      speedY: { min: -15, max: -5 },
      scale: { start: 0.3, end: 0 },
      frequency: 400,
      alpha: { start: 0.8, end: 0 },
      tint: [0xdd88ff, 0xff88dd, 0x88aaff]
    }).setDepth(1);
  }

  _drawHero(g, cx, cy) {
    g.fillStyle(0x2e8fff, 1);
    g.fillCircle(cx, cy + 18, 38);
    g.fillStyle(0xffe0a3, 1);
    g.fillCircle(cx, cy - 20, 30);
    g.fillStyle(0xff6b00, 1);
    g.fillRoundedRect(cx - 26, cy - 52, 52, 22, 7);
    g.fillStyle(0x1a2a4a, 1);
    g.fillCircle(cx - 9, cy - 22, 5);
    g.fillCircle(cx + 9, cy - 22, 5);
    g.lineStyle(3, 0xd06020, 1);
    g.beginPath(); g.arc(cx, cy - 10, 9, 0.25, Math.PI - 0.25); g.strokePath();
  }

  _drawGoblin(g, cx, cy) {
    // Body
    g.fillStyle(0x44aa44, 1);
    g.fillCircle(cx, cy + 16, 42);
    // Head
    g.fillStyle(0x55cc55, 1);
    g.fillCircle(cx, cy - 22, 36);
    // Ears
    g.fillCircle(cx - 38, cy - 28, 14);
    g.fillCircle(cx + 38, cy - 28, 14);
    // Evil eyes
    g.fillStyle(0xff2200, 1);
    g.fillCircle(cx - 12, cy - 26, 8);
    g.fillCircle(cx + 12, cy - 26, 8);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 10, cy - 28, 4);
    g.fillCircle(cx + 14, cy - 28, 4);
    // Evil grin
    g.lineStyle(4, 0x003300, 1);
    g.beginPath(); g.arc(cx, cy - 6, 14, 0.1, Math.PI - 0.1); g.strokePath();
    // Teeth
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 10, cy - 8, 6, 8);
    g.fillRect(cx + 4, cy - 8, 6, 8);
    // Hat
    g.fillStyle(0x220044, 1);
    g.fillTriangle(cx, cy - 88, cx - 30, cy - 56, cx + 30, cy - 56);
    g.fillRect(cx - 34, cy - 58, 68, 8);
    // Star on hat
    this.add.text(cx, cy - 74, '⭐', { fontSize: '24px' }).setOrigin(0.5).setDepth(5);
  }

  _drawBar(g, x, y, w, h, color, ratio) {
    g.clear();
    g.fillStyle(color, 1);
    const filled = Math.max(0, w * ratio);
    if (filled > 0) {
      g.fillRoundedRect(x, y, filled, h, 4);
      // Shine
      g.fillStyle(0xffffff, 0.25);
      g.fillRoundedRect(x + 2, y + 2, filled - 4, h / 2 - 2, 2);
    }
  }

  nextRound() {
    if (this.round >= this.totalRounds || this.bossHp <= 0 || this.heroHp <= 0) {
      this.finishBattle();
      return;
    }
    this.round++;
    this.roundText.setText(`Round ${this.round} / ${this.totalRounds}  •  Correct: ${this.correct}`);
    this._clearOptions();

    const source     = this.sys$.questions.getRandomBossPrompt();
    const normalized = this._normalizeQuestion(source.gateId, source.question);
    this.current     = normalized;
    this.awaitingAnswer = true;

    // Draw prompt card
    this.promptBg.clear();
    this.promptBg.fillStyle(0x1a0035, 0.88);
    this.promptBg.fillRoundedRect(100, 118, 1080, 100, 14);
    this.promptBg.lineStyle(2, 0xaa44ff, 0.7);
    this.promptBg.strokeRoundedRect(100, 118, 1080, 100, 14);

    this.promptText.setText(`[${GATE_META[source.gateId].name}]  ${normalized.prompt}`);
    this.promptText.y = 168;

    // Draw option buttons
    normalized.options.forEach((option, idx) => {
      const btnY = 268 + idx * 70;
      const btnG = this.add.graphics().setDepth(8);
      btnG.fillStyle(0xfff4e0, 1);
      btnG.fillRoundedRect(120, btnY - 26, 1040, 52, 12);
      btnG.lineStyle(2, 0xd4a04a, 1);
      btnG.strokeRoundedRect(120, btnY - 26, 1040, 52, 12);

      const btnTxt = this.add.text(640, btnY, option, {
        fontFamily: '"Nunito", Arial, sans-serif', fontSize: '22px',
        color: '#2a3a50', align: 'center', wordWrap: { width: 990 }
      }).setOrigin(0.5).setDepth(9);

      const hit = this.add.rectangle(640, btnY, 1040, 52, 0, 0).setDepth(10).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { btnG.clear(); btnG.fillStyle(0xfff0b8, 1); btnG.fillRoundedRect(120, btnY - 26, 1040, 52, 12); btnG.lineStyle(2, 0xffaa00, 1); btnG.strokeRoundedRect(120, btnY - 26, 1040, 52, 12); });
      hit.on('pointerout',  () => { btnG.clear(); btnG.fillStyle(0xfff4e0, 1); btnG.fillRoundedRect(120, btnY - 26, 1040, 52, 12); btnG.lineStyle(2, 0xd4a04a, 1); btnG.strokeRoundedRect(120, btnY - 26, 1040, 52, 12); });
      hit.on('pointerdown', () => this._submit(idx === normalized.answer, normalized.hint));

      this.optionButtons.push(btnG, btnTxt, hit);
    });
  }

  _normalizeQuestion(gateId, q) {
    if (!q) return { prompt: 'Answer the challenge!', options: ['A','B','C'], answer: 0, hint: '' };
    if (gateId === 1) return { prompt: `${q.sentence}\nWhat does "${q.targetWord}" mean?`, options: q.options, answer: q.answer, hint: q.hint };
    if (gateId === 2) return { prompt: `${q.passage}\nChoose the best main idea.`, options: q.mainIdeas, answer: q.mainAnswer, hint: q.hint };
    if (gateId === 3) return { prompt: `Classify this: ${q.phrase}`, options: q.options, answer: q.answer, hint: q.hint };
    if (gateId === 4) {
      const first = q.steps[0];
      const shuffled = Phaser.Utils.Array.Shuffle([...q.steps]);
      return { prompt: `${q.title}: Which event comes FIRST?`, options: shuffled, answer: shuffled.indexOf(first), hint: q.hint };
    }
    return { prompt: `${q.claim}\nPick the strongest evidence.`, options: q.options, answer: q.answer, hint: q.hint };
  }

  _submit(isCorrect, hint) {
    if (!this.awaitingAnswer) return;
    this.awaitingAnswer = false;

    if (isCorrect) {
      this.correct++;
      this.bossHp = Math.max(0, this.bossHp - 14);
      this.sys$.player.gainXP(70);
      this.sys$.player.gainStars(2);
      this.sys$.audio.playSfx('sfx_correct', 0.44);
      this.sys$.animation.sparkBurst(this, 1120, 440, 0xffb4ff, 24);
      this.tweens.add({ targets: this.goblinG, x: -18, yoyo: true, repeat: 3, duration: 60 });
      this._setFeedback('✅ Direct hit! The goblin reels!', '#88ffcc');
    } else {
      this.heroHp = Math.max(0, this.heroHp - 17);
      this.sys$.audio.playSfx('sfx_wrong', 0.34);
      this.tweens.add({ targets: this.heroG, x: 18, yoyo: true, repeat: 3, duration: 60 });
      this._setFeedback(`❌ Counter spell! Hint: ${hint}`, '#ffaaaa');
    }

    this._updateBars();
    this.sys$.events.emit('save:requested');
    this.time.delayedCall(1400, () => this.nextRound());
  }

  _setFeedback(text, color) {
    this.feedbackPanel.clear();
    this.feedbackPanel.fillStyle(0x0d0022, 0.9);
    this.feedbackPanel.fillRoundedRect(160, 642, 960, 46, 10);
    this.feedbackText.setText(text).setColor(color);
  }

  _updateBars() {
    this._drawBar(this.heroBar, 64, 544, 192, 16, 0x55ddaa, Phaser.Math.Clamp(this.heroHp / 100, 0, 1));
    this._drawBar(this.bossBar, 1024, 544, 192, 16, 0xff5577, Phaser.Math.Clamp(this.bossHp / 100, 0, 1));
  }

  _clearOptions() {
    this.optionButtons.forEach(o => o.destroy());
    this.optionButtons = [];
    this.promptBg.clear();
  }

  finishBattle() {
    this._clearOptions();
    const victory = this.bossHp <= 0 || this.correct >= 5;

    // Overlay card
    const card = this.add.graphics().setDepth(20);
    card.fillStyle(victory ? 0x001a10 : 0x1a000a, 0.95);
    card.fillRoundedRect(160, 150, 960, 420, 24);
    card.lineStyle(4, victory ? 0x44ff88 : 0xaa2255, 1);
    card.strokeRoundedRect(160, 150, 960, 420, 24);

    this.add.text(640, 240, victory ? '🏆 LEXORIA SAVED! 🏆' : '💀 The Goblin Escaped...', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '42px',
      color: victory ? '#66ffaa' : '#ff6688',
      stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(21);

    this.add.text(640, 330, [
      `Hits: ${this.correct} / ${this.totalRounds}`,
      victory
        ? '🌟 You restored every crystal and banished the Grammar Goblin!'
        : '📚 Push the goblin back harder next time. Keep training!'
    ].join('\n'), {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '22px', align: 'center',
      color: '#ffffff', lineSpacing: 10, wordWrap: { width: 880 }
    }).setOrigin(0.5).setDepth(21);

    if (victory) {
      this.sys$.achievements.unlock('goblin_guardian');
      this.sys$.player.gainXP(240);
      this.sys$.player.gainStars(10);
      this.sys$.animation.confetti(this, 640, 300);
      this.sys$.audio.playSfx('sfx_level_up', 0.56);
    } else {
      this.sys$.player.gainXP(100);
    }
    this.sys$.events.emit('save:requested');

    // Return button
    const retBg = this.add.graphics().setDepth(21);
    retBg.fillStyle(victory ? 0x22cc66 : 0xcc4466, 1);
    retBg.fillRoundedRect(640 - 220, 500, 440, 56, 16);

    this.add.text(640, 528, '🗺️  Return to World Map', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '24px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(22);

    const hitR = this.add.rectangle(640, 528, 440, 56, 0, 0).setDepth(23).setInteractive({ useHandCursor: true });
    hitR.on('pointerdown', () => this.scene.start('WorldMapScene'));
    hitR.on('pointerover', () => this.tweens.add({ targets: retBg, scaleX: 1.04, scaleY: 1.04, duration: 100 }));
    hitR.on('pointerout',  () => this.tweens.add({ targets: retBg, scaleX: 1,    scaleY: 1,    duration: 100 }));
  }
}