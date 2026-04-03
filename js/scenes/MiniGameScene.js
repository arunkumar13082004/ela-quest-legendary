import { ENCOURAGING_LINES, GATE_META, GENTLE_LINES } from "../data/GateContent.js";

export default class MiniGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "MiniGameScene" });
  }

  init(data) {
    this.gateId = data.gateId || 1;
  }

  create() {
    this.systemsRef = (this.game && this.game.config && this.game.config.custom && this.game.config.custom.systems) || window.elaSystems;
    if (!this.systemsRef) {
      // eslint-disable-next-line no-console
      console.error("MiniGameScene: systems not found on game.config.custom and no global fallback available.");
      this.systemsRef = { audio: null, player: { gainXP: () => {}, gainStars: () => {}, loseLife: () => 0, refillLives: () => {}, restoreLife: () => {} }, progress: { completeGate: () => {}, getCompletedCount: () => 0 }, questions: { getQuestion: () => null, getGateQuestions: () => [] }, difficulty: { getQuestionCountForRun: () => 6, getDifficulty: () => 'medium', shouldOfferHint: () => false }, achievements: { checkCombo: () => {}, checkLevelMilestones: () => {}, checkGateCompletion: () => {}, checkCampaignComplete: () => {} }, events: new Phaser.Events.EventEmitter(), animation: new (class {})() };
    }
    this.audio = this.systemsRef.audio;
    this.player = this.systemsRef.player;
    this.progression = this.systemsRef.progress;
    this.questions = this.systemsRef.questions;
    this.difficulty = this.systemsRef.difficulty;
    this.achievements = this.systemsRef.achievements;
    this.eventsBus = this.systemsRef.events;
    this.anim = this.systemsRef.animation;

    this.audio.attach(this);
    this.audio.playMusic("bgm_gate", 0.24);
    this.eventsBus.emit("ui:toggle", true);

    this.usedIds = new Set();
    this.roundIndex = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.combo = 0;
    this.guardianHp = 100;
    this.heroHp = 100;
    this.awaitingAnswer = false;
    this.roundTarget = this.difficulty.getQuestionCountForRun(this.gateId);
    // Only award XP/stars on the FIRST attempt (not on replays of already-completed gates)
    this.isFirstAttempt = !this.progression.isGateCompleted(this.gateId);
    this.vocabCursors = this.input.keyboard.createCursorKeys();
    this.vocabWASD = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.drawEnvironment();
    this.createTopHud();
    this.createBottomHud();
    this.prepareGateState();
    this._instructionAccepted = false;
    this._leaveWarningOpen    = false;
    this._gameFinished        = false;   // set true when finishGateRun() runs
    this._xpEarnedThisRun     = 0;      // track XP to reverse on fail

    // ── Check if player has lives — if not, block play ─────────────────────
    const livesNow = this.player.getSnapshot ? this.player.getSnapshot().lives : 5;
    if (livesNow <= 0) {
      this._showNoLivesScreen();
      return;
    }

    // Signal that a game is actively in progress (used by beforeunload in main.js)
    window.elaIsPlaying = true;

    // ── Show gate instructions FIRST — game only starts after student accepts ──
    this._showGateInstructions(() => {
      this.nextRound();
    });
  }

  drawEnvironment() {
    const theme = this.getThemeKey(this.gateId);
    this.cameras.main.setBackgroundColor("#8ed9ff");
    this.add.tileSprite(640, 360, 1280, 720, `tile-${theme}`).setAlpha(0.5);

    for (let i = 0; i < 20; i += 1) {
      const cloud = this.add.image(
        Phaser.Math.Between(20, 1260),
        Phaser.Math.Between(20, 320),
        "cloud"
      ).setScale(Phaser.Math.FloatBetween(0.55, 1.25)).setAlpha(0.4);
      this.anim.float(this, cloud, Phaser.Math.Between(4, 12), Phaser.Math.Between(1300, 2500));
    }

    this._sceneObjs = [];  // replaces challengeLayer container
    this.challengeLayer = {
      add: (items) => {
        const arr = Array.isArray(items) ? items : [items];
        arr.forEach(o => { if (o && o.active !== false) this._sceneObjs.push(o); });
      },
      removeAll: (destroy) => {
        if (destroy) this._sceneObjs.forEach(o => { if (o && o.destroy) o.destroy(); });
        this._sceneObjs = [];
      }
    };
  }

  createTopHud() {
    // UIScene HUD occupies y=0–66. Our header sits just below it.
    const HEADER_Y = 103; // centre of header band (y=70 to y=136)
    this.headerPanel = this.add.rectangle(640, HEADER_Y, 1240, 66, 0xffffff, 0.92)
      .setStrokeStyle(2, 0xcfe6ff, 1);

    const gateMeta = GATE_META[this.gateId];
    // Gate title – centred in header
    this.gateTitle = this.add.text(640, HEADER_Y - 14, `${gateMeta.name}  •  ${gateMeta.standard}`, {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '18px',
      color: '#1c4d73',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Round / Score / Timer on the line below
    this.roundText = this.add.text(130, HEADER_Y + 16, 'Round 1/1', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '16px', color: '#1c4d73'
    }).setOrigin(0, 0.5);

    this.scoreText = this.add.text(360, HEADER_Y + 16, 'Score 0 correct', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '16px', color: '#1c4d73'
    }).setOrigin(0, 0.5);

    // Timer bar – right side of header
    this.timerBg   = this.add.rectangle(850, HEADER_Y + 16, 320, 14, 0x2f5278, 0.8).setOrigin(0, 0.5);
    this.timerFill = this.add.rectangle(852, HEADER_Y + 16, 316, 10, 0x74e6b3, 1).setOrigin(0, 0.5);
    this.timerText = this.add.text(1192, HEADER_Y + 16, '0s', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '14px', color: '#1c4d73'
    }).setOrigin(1, 0.5);

    // Exit button (top left, in the top bar) - pause timer and ask confirm
    this.exitButton = this.createButton(68, HEADER_Y + 10, 'Exit', () => this._confirmExit(), 0xffb3b3, 70, 32);
    this.exitButton.label.setFontSize('12px').setStyle({ color: '#7a1e1e' });
    this.exitButton.setDepth(14);
    this.exitButton.label.setDepth(15);
  }

  _confirmExit() {
    if (this._leaveWarningOpen || this._gameFinished) {
      return;
    }
    this._leaveWarningOpen = true;

    // Pause clock while confirmation is on screen
    if (this.roundTimerEvent) {
      this.roundTimerEvent.paused = true;
    }

    const W = this.scale.width;
    const H = this.scale.height;

    const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.54)
      .setDepth(95)
      .setInteractive();

    const boxW = 660; const boxH = 220;
    const boxX = W/2 - boxW/2;
    const boxY = H/2 - boxH/2;

    const boxGraphic = this.add.graphics().setDepth(96);
    boxGraphic.fillStyle(0xffffff, 1).fillRoundedRect(boxX, boxY, boxW, boxH, 16);
    boxGraphic.lineStyle(3, 0xcc4444, 0.9).strokeRoundedRect(boxX, boxY, boxW, boxH, 16);

    const msg = this.add.text(W/2, H/2 - 28,
      'Leave the game now?\nYou will lose 1 life and your current round progress.', {
        fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '19px', color: '#2c2c2c', align: 'center', wordWrap: { width: boxW - 40 }
      }).setOrigin(0.5).setDepth(97);

    const yesBtn = this.createButton(W/2 - 100, H/2 + 50, 'Yes, Exit', () => {
      this.player.loseLife();
      window.elaIsPlaying = false;
      this._disposeExitDialog();
      this.scene.start('GateScene', { gateId: this.gateId });
    }, 0xffa2a2, 160, 40);
    yesBtn.setDepth(97); yesBtn.label.setDepth(98);

    const noBtn = this.createButton(W/2 + 100, H/2 + 50, 'Continue', () => {
      this._disposeExitDialog(true);
    }, 0xa2d8ff, 160, 40);
    noBtn.setDepth(97); noBtn.label.setDepth(98);

    this._exitDialog = [overlay, boxGraphic, msg, yesBtn, yesBtn.label, noBtn, noBtn.label];
  }

  _disposeExitDialog(resumeTimer = false) {
    if (this._exitDialog) {
      this._exitDialog.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
      this._exitDialog = null;
    }
    this._leaveWarningOpen = false;
    if (resumeTimer && this.roundTimerEvent) {
      this.roundTimerEvent.paused = false;
    }
  }

  createBottomHud() {
    const PANEL_Y = 668;
    // White feedback panel
    this.feedbackPanel = this.add.rectangle(640, PANEL_Y, 1240, 78, 0xffffff, 0.95)
      .setStrokeStyle(2, 0xcae4ff, 1).setDepth(20);

    // Feedback text — full width now (no map button)
    this.feedbackText = this.add.text(28, PANEL_Y, '', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '18px', color: '#1f4f71',
      wordWrap: { width: 1200 }
    }).setOrigin(0, 0.5).setDepth(21);
  }

  prepareGateState() {
    this.modeState = {
      selectedMainIdea: null,
      mainIdeaAssignments: [null, null],
      storyAssignments: [null, null, null, null],
      climberY: 575
    };

    if (this.gateId === 3) {
      // ── Animated hero character (left) ────────────────────────────────────
      this.arenaHero = this.add.text(100, 560, '🧙', { fontSize: '64px' })
        .setOrigin(0.5).setDepth(5);
      // Idle bob
      this.tweens.add({ targets: this.arenaHero, y: 545, duration: 700,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      // Hero label
      this.add.text(100, 510, '⚔️ You', {
        fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '14px', color: '#1a4a6e'
      }).setOrigin(0.5).setDepth(5);

      // ── Animated enemy character (right) ─────────────────────────────────
      this.arenaEnemy = this.add.text(1180, 555, '👾', { fontSize: '68px' })
        .setOrigin(0.5).setDepth(5);
      // Enemy idle sway
      this.tweens.add({ targets: this.arenaEnemy, y: 540, duration: 900,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 200 });
      // Enemy rotation wobble
      this.tweens.add({ targets: this.arenaEnemy, angle: 8, duration: 1200,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      // Enemy label
      this.add.text(1180, 505, '👺 Echo Beast', {
        fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '14px', color: '#6e1a1a'
      }).setOrigin(0.5).setDepth(5);

      // ── HP bars ───────────────────────────────────────────────────────────
      this.arenaHeroBarBg  = this.add.rectangle(50,  605, 120, 14, 0x223e66).setOrigin(0, 0.5);
      this.arenaHeroBar    = this.add.rectangle(52,  605, 116, 10, 0x65db9f).setOrigin(0, 0.5);
      this.arenaEnemyBarBg = this.add.rectangle(1110, 605, 120, 14, 0x223e66).setOrigin(0, 0.5);
      this.arenaEnemyBar   = this.add.rectangle(1112, 605, 116, 10, 0xff8f8f).setOrigin(0, 0.5);

      // HP labels
      this.add.text(110, 612, '❤️ HP', {
        fontFamily: '"Nunito", Arial, sans-serif', fontSize: '11px', color: '#ffffff'
      }).setOrigin(0.5).setDepth(6);
      this.add.text(1170, 612, '💀 HP', {
        fontFamily: '"Nunito", Arial, sans-serif', fontSize: '11px', color: '#ffffff'
      }).setOrigin(0.5).setDepth(6);
    }

    if (this.gateId === 5) {
      this.add.rectangle(106, 595, 1040, 8, 0xffffff, 0.35).setOrigin(0, 0.5);
      this.climber = this.add.image(180, this.modeState.climberY, "hero").setScale(1.2).setDepth(6);
    }
  }

  nextRound() {
    if (this.roundIndex >= this.roundTarget) {
      this.finishGateRun();
      return;
    }

    this.roundIndex += 1;
    this.roundText.setText(`Round ${this.roundIndex}/${this.roundTarget}`);
    this.scoreText.setText(`Score ${this.correctCount} correct`);
    this.clearChallengeLayer();

    const desired = this.difficulty.getDifficulty(this.gateId);
    let question = this.questions.getQuestion(this.gateId, desired, this.usedIds);
    if (!question) {
      this.usedIds.clear();
      question = this.questions.getQuestion(this.gateId, desired, this.usedIds);
    }
    this.currentQuestion = question;
    this.usedIds.add(question.id);

    this.awaitingAnswer = true;
    this.renderQuestion(question);
  }

  clearChallengeLayer() {
    if (this._sceneObjs) {
      this._sceneObjs.forEach(o => { try { if (o && o.destroy) o.destroy(); } catch(e) {} });
      this._sceneObjs = [];
    }
    this.input.off("drag");
    this.input.off("drop");
    this.input.off("dragenter");
    this.input.off("dragleave");
    this.input.off("dragend");
  }

  renderQuestion(question) {
    if (this.gateId === 1) {
      this.renderVocabularyForest(question);
      this.startRoundTimer(this.getTimerForDifficulty(question.difficulty, 30));
      return;
    }

    if (this.gateId === 2) {
      this.renderMainIdeaCity(question);
      this.startRoundTimer(this.getTimerForDifficulty(question.difficulty, 60));
      return;
    }

    if (this.gateId === 3) {
      this.renderFigurativeArena(question);
      this.startRoundTimer(this.getTimerForDifficulty(question.difficulty, 18));
      return;
    }

    if (this.gateId === 4) {
      this.renderStoryBuilder(question);
      this.startRoundTimer(this.getTimerForDifficulty(question.difficulty, 36));
      return;
    }

    this.renderEvidenceMountain(question);
    this.startRoundTimer(this.getTimerForDifficulty(question.difficulty, 40));
  }

  getTimerForDifficulty(difficulty, base) {
    if (difficulty === "hard") {
      return Math.max(base - 6, 10);
    }
    if (difficulty === "easy") {
      return base + 4;
    }
    return base;
  }

  startRoundTimer(seconds) {
    if (this.roundTimerEvent) {
      this.roundTimerEvent.remove(false);
    }

    this.timerSeconds = seconds;
    this.timerMax = seconds;
    this.refreshTimer();
    this.roundTimerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timerSeconds -= 1;
        this.refreshTimer();
        if (this.timerSeconds <= 0) {
          this.roundTimerEvent.remove(false);
          this.submitAnswer(false, { timedOut: true });
        }
      }
    });
  }

  refreshTimer() {
    const ratio = Phaser.Math.Clamp(this.timerSeconds / this.timerMax, 0, 1);
    this.timerFill.width = 296 * ratio;
    this.timerText.setText(`${this.timerSeconds}s`);
    this.timerFill.setFillStyle(ratio > 0.35 ? 0x74e6b3 : 0xff9c8f);
  }

  // ── Gate instructions — shown ONCE before the first round, blocks game start ─
  _showGateInstructions(onAccepted) {
    // Theme colors matching each gate's palette
    const GATE_THEMES = {
      1: { header: 0x2d7a50, accent: 0x4caf7a, light: 0xd4f5e5, border: 0x4caf7a, text: '#1a3a22' },
      2: { header: 0x2555c9, accent: 0x4b8df8, light: 0xcfe4ff, border: 0x4b8df8, text: '#1a2a6a' },
      3: { header: 0xc05e1a, accent: 0xf7934c, light: 0xffe4cf, border: 0xf7934c, text: '#5a2800' },
      4: { header: 0x7a47cc, accent: 0xb382f8, light: 0xeaddff, border: 0xb382f8, text: '#3c1878' },
      5: { header: 0xa83030, accent: 0xe06262, light: 0xffd5d5, border: 0xe06262, text: '#6a1818' }
    };
    const theme = GATE_THEMES[this.gateId] || GATE_THEMES[1];

    const GATE_INSTRUCTIONS = {
      1: {
        title: '📖 Vocabulary Forest',
        steps: [
          '📌  Read the full sentence carefully.',
          '📌  Look for clues in the words around the highlighted word.',
          '📌  Click the answer card that best matches the meaning!',
        ]
      },
      2: {
        title: '🔍 Main Idea City',
        steps: [
          '📌  Read the passage carefully.',
          '📌  Click the button that best states the MAIN IDEA.',
          '📌  Drag 2 evidence cards into the Evidence slots.',
          '📌  Press Submit Case when done!',
        ]
      },
      3: {
        title: '🎭 Figurative Language Arena',
        steps: [
          '📌  Read the phrase shown on screen.',
          '📌  Identify: Simile · Metaphor · Idiom · Hyperbole',
          '       · Personification · Onomatopoeia · Alliteration · Literal',
          '📌  Click the correct category to strike the Echo Beast!',
        ]
      },
      4: {
        title: '📚 Story Builder Kingdom',
        steps: [
          '📌  Read all 4 story event cards.',
          '📌  Drag each card into the correct Step slot (1 → 4).',
          '📌  Click Lock Timeline once all steps are in order!',
        ]
      },
      5: {
        title: '🧩 Evidence Mountain',
        steps: [
          '📌  Read the Claim at the top.',
          '📌  Read the passage carefully.',
          '📌  Click the sentence that BEST supports the claim.',
          '📌  The right choice moves your climber higher!',
        ]
      }
    };

    const instr  = GATE_INSTRUCTIONS[this.gateId] || GATE_INSTRUCTIONS[1];
    const W = 1280, H = 720;

    const LINE_H  = 34;
    const HDR_H   = 52;
    const PAD_TOP = 18;
    const PAD_BOT = 68;
    const CARD_W  = 680;
    const CARD_H  = HDR_H + PAD_TOP + instr.steps.length * LINE_H + PAD_BOT;
    const CARD_X  = (W - CARD_W) / 2;
    const CARD_Y  = (H - CARD_H) / 2;

    // Dim overlay — clicking OUTSIDE card closes dialog
    const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.55)
      .setDepth(60).setInteractive({ useHandCursor: false });

    // Card hit area — absorbs clicks so they don't reach overlay behind
    const cardHit = this.add.rectangle(W/2, CARD_Y + CARD_H/2, CARD_W, CARD_H, 0, 0)
      .setDepth(64).setInteractive();
    cardHit.on('pointerdown', () => { /* absorbed */ });

    // Card background with light theme tint
    const cardG = this.add.graphics().setDepth(61);
    cardG.fillStyle(0xfafcff, 1);
    cardG.lineStyle(3, theme.border, 0.7);
    cardG.fillRoundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, 18);
    cardG.strokeRoundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, 18);

    // Light tint strip below header
    const tintG = this.add.graphics().setDepth(61);
    tintG.fillStyle(theme.light, 0.35);
    tintG.fillRoundedRect(CARD_X, CARD_Y + HDR_H, CARD_W, CARD_H - HDR_H, { tl:0, tr:0, bl:18, br:18 });

    // Header strip — themed color
    const headerG = this.add.graphics().setDepth(61);
    headerG.fillStyle(theme.header, 1);
    headerG.fillRoundedRect(CARD_X, CARD_Y, CARD_W, HDR_H, { tl:18, tr:18, bl:0, br:0 });
    // Accent shine on header
    headerG.fillStyle(0xffffff, 0.14);
    headerG.fillRoundedRect(CARD_X + 4, CARD_Y + 4, CARD_W - 8, HDR_H / 2 - 4, { tl:16, tr:16, bl:0, br:0 });

    // Header title
    const titleTxt = this.add.text(W/2, CARD_Y + HDR_H/2,
      `📋  How to Play — ${instr.title}`, {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '18px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(62);

    // Divider below header
    const divG = this.add.graphics().setDepth(61);
    divG.lineStyle(1.5, theme.accent, 0.3);
    divG.lineBetween(CARD_X + 24, CARD_Y + HDR_H + 1, CARD_X + CARD_W - 24, CARD_Y + HDR_H + 1);

    // Step lines — left-aligned bullet style
    const stepsTexts = instr.steps.map((step, i) =>
      this.add.text(
        CARD_X + 28,
        CARD_Y + HDR_H + PAD_TOP + i * LINE_H,
        step,
        {
          fontFamily: '"Nunito", Arial, sans-serif',
          fontSize: '15px', color: theme.text,
          wordWrap: { width: CARD_W - 50 }
        }
      ).setOrigin(0, 0).setDepth(62)
    );

    // "Got it — Let's Play!" button
    const BTN_Y  = CARD_Y + CARD_H - PAD_BOT / 2;
    const btnBg  = this.add.graphics().setDepth(62);
    // Got it button is on the right side; Cancel is on the left
    const BTN_RIGHT_X = W/2 + 90;  // centre of Got it button
    const BTN_W2 = 210;
    const drawBtn = (hover) => {
      btnBg.clear();
      const c1 = hover ? theme.header : theme.accent;
      const c2 = hover ? theme.accent : theme.header;
      btnBg.fillStyle(c1, 1);
      btnBg.lineStyle(3, c2, 1);
      btnBg.fillRoundedRect(BTN_RIGHT_X - BTN_W2/2, BTN_Y - 22, BTN_W2, 44, 14);
      btnBg.strokeRoundedRect(BTN_RIGHT_X - BTN_W2/2, BTN_Y - 22, BTN_W2, 44, 14);
      btnBg.fillStyle(0xffffff, 0.18);
      btnBg.fillRoundedRect(BTN_RIGHT_X - BTN_W2/2 + 4, BTN_Y - 19, BTN_W2 - 8, 18, { tl:12, tr:12, bl:0, br:0 });
    };
    drawBtn(false);

    const btnTxt = this.add.text(BTN_RIGHT_X, BTN_Y, "\u25B6  Got it, Let's Play!", {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '17px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(63);

    const btnHit = this.add.rectangle(BTN_RIGHT_X, BTN_Y, BTN_W2, 44, 0, 0)
      .setDepth(65).setInteractive({ useHandCursor: true });
    btnHit.on('pointerover',  () => drawBtn(true));
    btnHit.on('pointerout',   () => drawBtn(false));
    btnHit.on('pointerdown',  () => {
      this.tweens.add({ targets: btnBg, alpha: 0.7, duration: 60, yoyo: true,
        onComplete: () => {
          this._instructionAccepted = true;
          destroyAll();
          onAccepted();
        }
      });
    });

    // Cancel button — goes back to GateScene entry page
    const cancelBg = this.add.graphics().setDepth(62);
    cancelBg.fillStyle(0xeeeeee, 1);
    cancelBg.lineStyle(2, 0xaaaaaa, 1);
    const CANCEL_X = W/2 - 90;   // centre of Cancel button
    const CANCEL_W = 210;
    cancelBg.fillRoundedRect(CANCEL_X - CANCEL_W/2, BTN_Y - 22, CANCEL_W, 44, 14);
    cancelBg.strokeRoundedRect(CANCEL_X - CANCEL_W/2, BTN_Y - 22, CANCEL_W, 44, 14);
    cancelBg.fillStyle(0xffffff, 0.25);
    cancelBg.fillRoundedRect(CANCEL_X - CANCEL_W/2 + 4, BTN_Y - 19, CANCEL_W - 8, 18, { tl:12, tr:12, bl:0, br:0 });

    const cancelTxt = this.add.text(CANCEL_X, BTN_Y, 'Go back', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '16px',
      color: '#444444', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(63);

    const cancelHit = this.add.rectangle(CANCEL_X, BTN_Y, CANCEL_W, 44, 0, 0)
      .setDepth(65).setInteractive({ useHandCursor: true });
    cancelHit.on('pointerover',  () => { cancelBg.clear(); cancelBg.fillStyle(0xdddddd, 1); cancelBg.lineStyle(2, 0xaaaaaa, 1); cancelBg.fillRoundedRect(CANCEL_X-CANCEL_W/2, BTN_Y-22, CANCEL_W, 44, 14); cancelBg.strokeRoundedRect(CANCEL_X-CANCEL_W/2, BTN_Y-22, CANCEL_W, 44, 14); });
    cancelHit.on('pointerout',   () => { cancelBg.clear(); cancelBg.fillStyle(0xeeeeee, 1); cancelBg.lineStyle(2, 0xaaaaaa, 1); cancelBg.fillRoundedRect(CANCEL_X-CANCEL_W/2, BTN_Y-22, CANCEL_W, 44, 14); cancelBg.strokeRoundedRect(CANCEL_X-CANCEL_W/2, BTN_Y-22, CANCEL_W, 44, 14); });
    cancelHit.on('pointerdown',  () => {
      window.elaIsPlaying = false;
      destroyAll();
      this.scene.start('GateScene', { gateId: this.gateId });
    });

    // Reposition "Got it" button to the right of Cancel
    btnBg.x = 0; // btnBg is graphics with absolute coords — already set correctly above

    const allEls = [overlay, cardHit, cardG, tintG, headerG, divG, titleTxt,
                    ...stepsTexts, btnBg, btnTxt, btnHit, cancelBg, cancelTxt, cancelHit];
    const destroyAll = () =>
      allEls.forEach(o => { try { if (o && o.destroy) o.destroy(); } catch(e){} });

    // Overlay click intentionally does nothing — use Cancel or Got it button

    // Fade in
    const fadeTargets = allEls.filter(o => o && typeof o.setAlpha === 'function');
    fadeTargets.forEach(o => { try { o.setAlpha(0); } catch(e){} });
    this.tweens.add({ targets: fadeTargets, alpha: 1, duration: 180, ease: 'Sine.easeOut' });
  }

  renderVocabularyForest(question) {
    this.feedbackText.setText("① Read the sentence   ②  Find the meaning of the highlighted word   ③  Click the correct answer card!");
    const ui = (window.elaUI && window.elaUI.sizes) ? window.elaUI.sizes : { subtitle: 48, body: 24 };

    const prompt = this.add.text(640, 188, `Word: "${question.targetWord}"`, {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: `${ui.subtitle}px`, color: '#16516f',
      stroke: '#ffffff', strokeThickness: 8
    }).setOrigin(0.5);

    const sentence = this.add.text(640, 252, question.sentence, {
      fontFamily: '"Nunito", Arial, sans-serif',
      fontSize: `${ui.body}px`, color: '#1d4f6d',
      align: 'center', wordWrap: { width: 1080 }
    }).setOrigin(0.5);

    // All doors use the same neutral color — highlight correct after answer
    const CARD_COLOR = 0xf0f4ff;
    const CARD_BORDER = 0x8899cc;

    const DOOR_W = 280, DOOR_H = 180;
    const positions = [240, 640, 1040];
    const DOOR_Y = 460;
    this.modeState.doors = [];

    positions.forEach((x, index) => {
      // Door graphic (rounded rect like a card)
      const dg = this.add.graphics().setDepth(10);
      const drawDoor = (color, borderColor, alpha) => {
        dg.clear();
        dg.fillStyle(0x000000, 0.18);
        dg.fillRoundedRect(x - DOOR_W/2 + 4, DOOR_Y - DOOR_H/2 + 6, DOOR_W, DOOR_H, 22);
        dg.fillStyle(color, alpha || 1);
        dg.fillRoundedRect(x - DOOR_W/2, DOOR_Y - DOOR_H/2, DOOR_W, DOOR_H, 22);
        dg.fillStyle(0xffffff, 0.35);
        dg.fillRoundedRect(x - DOOR_W/2 + 8, DOOR_Y - DOOR_H/2 + 8, DOOR_W - 16, DOOR_H * 0.4, { tl:18, tr:18, bl:0, br:0 });
        dg.lineStyle(4, borderColor, 0.8);
        dg.strokeRoundedRect(x - DOOR_W/2, DOOR_Y - DOOR_H/2, DOOR_W, DOOR_H, 22);
        dg.fillStyle(0xffffff, 0.25);
        dg.fillEllipse(x, DOOR_Y - DOOR_H/2 + 14, DOOR_W * 0.55, 28);
      };
      drawDoor(CARD_COLOR, CARD_BORDER);

      // Answer text
      const label = this.add.text(x, DOOR_Y + 14, question.options[index], {
        fontFamily: '"Nunito", Arial, sans-serif',
        fontSize: '20px', color: '#1a2a3a', fontStyle: 'bold',
        align: 'center', wordWrap: { width: DOOR_W - 24 }
      }).setOrigin(0.5).setDepth(11);

      // "Option N" badge at top
      const badge = this.add.text(x, DOOR_Y - DOOR_H/2 + 22, `Option ${index + 1}`, {
        fontFamily: '"Baloo 2", Arial, sans-serif',
        fontSize: '14px', color: '#111111',
        stroke: '#00000044', strokeThickness: 2
      }).setOrigin(0.5).setDepth(11);

      // Invisible hit area
      const hit = this.add.rectangle(x, DOOR_Y, DOOR_W, DOOR_H, 0, 0)
        .setDepth(12).setInteractive({ useHandCursor: true });

      hit.on('pointerover', () => {
        if (!this.awaitingAnswer) return;
        this.tweens.add({ targets: [dg, label, badge], y: '-=6', duration: 110, ease: 'Back.easeOut' });
      });
      hit.on('pointerout', () => {
        if (!this.awaitingAnswer) return;
        this.tweens.add({ targets: [dg, label, badge], y: '+=6', duration: 110, ease: 'Sine.easeOut' });
      });
      hit.on('pointerdown', () => {
        this.tweens.add({ targets: [dg, label, badge], scaleX: 0.95, scaleY: 0.95, duration: 70, yoyo: true });
        const isCorrect = index === question.answer;
        // Highlight correct answer before proceeding
        this._highlightVocabAnswer(question.answer, isCorrect ? index : -1, drawDoor, index);
        this.submitAnswer(isCorrect, { hint: question.hint });
      });

      // Store drawDoor fn for post-answer highlighting
      this.modeState.doors.push({ x, answerIndex: index, sprite: dg, hit, drawDoor, label, badge });
      this.challengeLayer.add([dg, label, badge, hit]);
      this.anim.float(this, dg, 6, Phaser.Math.Between(1100, 1600));
      this.anim.float(this, label, 6, dg._tweens?.[0]?.duration || 1300);
    });

    this.modeState.hero = this.add.image(640, 580, "hero").setScale(1.2).setDepth(9);
    this.challengeLayer.add([prompt, sentence, this.modeState.hero]);
    this.modeState.vocabControl = true;
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  _highlightVocabAnswer(correctIndex, chosenIndex, _unused, _callerIndex) {
    // Called after any answer: highlight all doors light green (correct) or light red (wrong)
    if (!this.modeState.doors) return;
    this.modeState.doors.forEach(door => {
      const isCorrect = door.answerIndex === correctIndex;
      door.drawDoor(
        isCorrect ? 0xc8f7df : 0xffd7d9,
        isCorrect ? 0x44b073 : 0xdf5a5c,
        1
      );
      // Disable further interaction
      if (door.hit) door.hit.disableInteractive();
    });
  }

  _highlightArenaChoices(correctIndex, chosenIndex) {
    if (!this.modeState.arenaChoices) return;
    this.modeState.arenaChoices.forEach((button, idx) => {
      const isCorrect = idx === correctIndex;
      button.setFillStyle(isCorrect ? 0xc8f7df : 0xffd7d9);
      button.setStrokeStyle(3, isCorrect ? 0x44b073 : 0xdf5a5c, 0.9);
      button.disableInteractive();
      if (button.label) {
        button.label.setColor(isCorrect ? '#1b5f36' : '#8c2f30');
      }
    });
  }

  _highlightEvidenceChoices(correctIndex, chosenIndex) {
    if (!this.modeState.evidenceStones) return;
    this.modeState.evidenceStones.forEach((stone, idx) => {
      const correct = idx === correctIndex;
      stone.setFillStyle(correct ? 0xd9f8e6 : 0xffe6e8);
      stone.setStrokeStyle(3, correct ? 0x44cc88 : 0xcc5a66, 1);
      stone.disableInteractive();
      if (stone.label) {
        stone.label.setColor(correct ? '#1b5f36' : '#8c2f30');
      }
    });
  }

  renderMainIdeaCity(question) {
    this.feedbackText.setText("Read the passage, then drag 2 evidence cards that best support the main idea into the slots below.");

    // ── Layout constants (tighter, no main idea buttons row) ─────────────────
    const PASS_Y  = 185;
    const MAIN_Y  = 310;
    const CARD_Y  = 400;
    const SLOT_Y  = 498;
    const BTN_Y   = 588;

    // Passage
    const caseText = this.add.text(640, PASS_Y, question.passage, {
      fontFamily: '"Nunito", Arial, sans-serif',
      fontSize: '17px', color: '#1a2a3a',
      align: 'center', wordWrap: { width: 1100 }
    }).setOrigin(0.5);
    this.challengeLayer.add(caseText);

    this.modeState.mainIdeaAssignments = [null, null];
    this.modeState.detailCards = [];
    this.modeState.detailSlots = [];
    this.modeState.mainIdeaRects  = [];
    this.modeState.mainIdeaLabels = [];
    // Auto-select correct main idea so submit logic still works unchanged
    this.modeState.selectedMainIdea = question.mainAnswer;

    // ── Main idea display (non-interactive label) ─────────────────────────────
    const mainLabelBg = this.add.graphics();
    mainLabelBg.fillStyle(0xcfe4ff, 1);
    mainLabelBg.lineStyle(2, 0x4b8df8, 0.6);
    mainLabelBg.fillRoundedRect(120, MAIN_Y - 26, 1040, 52, 12);
    mainLabelBg.strokeRoundedRect(120, MAIN_Y - 26, 1040, 52, 12);
    this.challengeLayer.add(mainLabelBg);

    const mainLabelPre = this.add.text(140, MAIN_Y, '📌 Main Idea: ', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '15px',
      color: '#1a5abf', fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    const mainLabelText = this.add.text(270, MAIN_Y, question.mainIdeas[question.mainAnswer], {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '15px',
      color: '#1a2a4a', fontStyle: 'bold', wordWrap: { width: 880 }
    }).setOrigin(0, 0.5);
    this.challengeLayer.add([mainLabelPre, mainLabelText]);

    // ── Drop slots ────────────────────────────────────────────────────────────
    const slotW = 560, slotH = 80;
    [320, 960].forEach((sx, i) => {
      const slotBg = this.add.rectangle(sx, SLOT_Y, slotW, slotH, 0xddeeff, 1)
        .setStrokeStyle(3, 0x88aacc, 1).setDepth(5).setInteractive({ dropZone: true });
      const slotLabel = this.add.text(sx, SLOT_Y - 8, `Evidence ${i + 1}`, {
        fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '16px', color: '#5588aa', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(6);
      const dragHint = this.add.text(sx, SLOT_Y + 14, '⬇ drag card here', {
        fontFamily: '"Nunito", Arial, sans-serif', fontSize: '14px', color: '#99bbcc'
      }).setOrigin(0.5).setDepth(6);
      slotBg.setData('slotIndex', i); slotBg.setData('occupied', false); slotBg.setData('card', null);
      slotBg.setData('slotLabel', slotLabel); slotBg.setData('dragHint', dragHint);
      slotBg.setData('sx', sx); slotBg.setData('sy', SLOT_Y);
      this.modeState.detailSlots.push(slotBg);
      this.challengeLayer.add([slotBg, slotLabel, dragHint]);
    });

    // ── Draggable detail cards — single neutral color, dark text ─────────────
    const CARD_COLOR = 0xf0f4ff;  // uniform light lavender for all 4
    const nCards  = question.details.length;
    const cardW   = Math.min(260, Math.floor(1160 / nCards) - 10);
    const cardH   = 72;
    const cardGap = (1160 - nCards * cardW) / Math.max(nCards - 1, 1);

    question.details.forEach((detail, idx) => {
      const cx = 60 + cardW / 2 + idx * (cardW + cardGap);
      const shadow = this.add.rectangle(cx + 3, CARD_Y + 4, cardW, cardH, 0x000000, 0.14).setDepth(9);
      const card = this.add.rectangle(cx, CARD_Y, cardW, cardH, CARD_COLOR)
        .setStrokeStyle(2, 0x8899cc, 0.9).setDepth(10)
        .setInteractive({ draggable: true, useHandCursor: true });
      const lbl = this.add.text(cx, CARD_Y, detail, {
        fontFamily: '"Nunito", Arial, sans-serif',
        fontSize: '16px', color: '#1a1a2a', fontStyle: 'bold',
        align: 'center', wordWrap: { width: cardW - 16 }
      }).setOrigin(0.5).setDepth(11);
      card.label = lbl; card.shadow = shadow;
      card.setData('detailIndex', idx); card.setData('startX', cx); card.setData('startY', CARD_Y); card.setData('slotRef', null);
      card.on('pointerdown', () => {
        if (!this.awaitingAnswer) return;
        const open = this.modeState.detailSlots.find(s => !s.getData('occupied'));
        if (open) this._snapCardToSlot(card, open, question);
      });
      this.modeState.detailCards.push(card);
      this.challengeLayer.add([shadow, card, lbl]);
    });

    // Drag events
    this.input.on('drag', (pointer, card, dragX, dragY) => {
      if (!this.awaitingAnswer || !card.label) return;
      card.x = dragX; card.y = dragY; card.label.x = dragX; card.label.y = dragY;
      if (card.shadow) { card.shadow.x = dragX + 3; card.shadow.y = dragY + 4; }
      card.setDepth(30); card.label.setDepth(31);
    });
    this.input.on('dragenter', (p, c, zone) => zone.setFillStyle(0xa8e6c8).setStrokeStyle(4, 0x22bb66, 1));
    this.input.on('dragleave', (p, c, zone) => {
      zone.setFillStyle(zone.getData('occupied') ? 0xc8f4dc : 0xddeeff)
          .setStrokeStyle(3, zone.getData('occupied') ? 0x44cc88 : 0x88aacc, 1);
    });
    this.input.on('drop', (p, card, zone) => this._snapCardToSlot(card, zone, question));
    this.input.on('dragend', (p, card, dropped) => {
      if (!dropped) {
        card.x = card.getData('startX'); card.y = card.getData('startY');
        if (card.label) { card.label.x = card.x; card.label.y = card.y; }
        if (card.shadow) { card.shadow.x = card.x + 3; card.shadow.y = card.y + 4; }
        card.setDepth(10); if (card.label) card.label.setDepth(11);
      }
    });

    // Submit button
    const [btnRect, btnLabel] = this._makeSimpleButton(640, BTN_Y, 'Next Question →', 340, 50, 0x4b8df8, () => {
      const selected    = this.modeState.selectedMainIdea;
      const assignments = this.modeState.mainIdeaAssignments;
      if (selected === null)          { this.feedbackText.setText('⚠️ Tap a main idea first!'); return; }
      if (assignments.includes(null)) { this.feedbackText.setText('⚠️ Fill both evidence slots!'); return; }
      const sorted   = [...assignments].sort((a, b) => a - b);
      const expected = [...question.detailAnswers].sort((a, b) => a - b);
      this.submitAnswer(selected === question.mainAnswer && sorted.every((v, i) => v === expected[i]), { hint: question.hint });
    });
    this.challengeLayer.add([btnRect, btnLabel]);
  }

  _snapCardToSlot(card, slot, question) {
    if (!this.awaitingAnswer || !card || !slot) return;
    const slotIdx = slot.getData('slotIndex');

    // Remove card from its previous slot
    const prevSlot = card.getData('slotRef');
    if (prevSlot && prevSlot !== slot) {
      prevSlot.setData('occupied', false);
      prevSlot.setData('card', null);
      prevSlot.setFillStyle(0xddeeff).setStrokeStyle(3, 0x88aacc, 1);
      prevSlot.getData('slotLabel')?.setAlpha(1);
      prevSlot.getData('dragHint')?.setAlpha(1);
      this.modeState.mainIdeaAssignments[prevSlot.getData('slotIndex')] = null;
    }

    // Kick out card already in target slot
    const displaced = slot.getData('card');
    if (displaced && displaced !== card) {
      displaced.x = displaced.getData('startX'); displaced.y = displaced.getData('startY');
      if (displaced.label) { displaced.label.x = displaced.x; displaced.label.y = displaced.y; }
      if (displaced.shadow) { displaced.shadow.x = displaced.x + 3; displaced.shadow.y = displaced.y + 4; }
      displaced.setDepth(10); if (displaced.label) displaced.label.setDepth(11);
      displaced.setData('slotRef', null);
      slot.setData('occupied', false); slot.setData('card', null);
      this.modeState.mainIdeaAssignments[slotIdx] = null;
    }

    // Snap card into slot centre — card is depth 12 when placed (above slot's depth 5)
    const sx = slot.getData('sx'), sy = slot.getData('sy');
    card.x = sx; card.y = sy;
    if (card.label) { card.label.x = sx; card.label.y = sy; card.label.setDepth(13); }
    if (card.shadow) { card.shadow.x = sx + 3; card.shadow.y = sy + 4; }
    card.setDepth(12);
    card.setData('slotRef', slot);

    slot.setData('card', card);
    slot.setData('occupied', true);
    slot.setFillStyle(0xc8f4dc).setStrokeStyle(3, 0x44cc88, 1);
    slot.getData('slotLabel')?.setAlpha(0);
    slot.getData('dragHint')?.setAlpha(0);

    this.modeState.mainIdeaAssignments[slotIdx] = card.getData('detailIndex');
  }

  // Simple 2-object button (Rectangle + Text); returns [rect, label]
  _makeSimpleButton(x, y, text, w, h, color, onClick) {
    const rect = this.add.rectangle(x, y, w, h, color)
      .setStrokeStyle(3, 0xffffff, 0.7)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '22px', color: '#1a3a58', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5);
    rect.on('pointerover', () => { rect.setFillStyle(0xffe082); label.setScale(1.04); });
    rect.on('pointerout',  () => { rect.setFillStyle(color);    label.setScale(1); });
    rect.on('pointerdown', () => {
      this.tweens.add({ targets: [rect, label], scaleX: 0.96, scaleY: 0.96, duration: 70, yoyo: true });
      onClick();
    });
    return [rect, label];
  }

  _assignDetailToFirstOpenSlot(card, question) {
    const open = this.modeState.detailSlots?.find(s => !s.getData('occupied'));
    if (open) this._snapCardToSlot(card, open, question);
  }

  renderFigurativeArena(question) {
    this.feedbackText.setText("① Read the phrase   ②  Identify the figurative language type   ③  Click the correct category to strike the Echo Beast!");

    const uiArena = (window.elaUI && window.elaUI.sizes) ? window.elaUI.sizes : { subtitle: 48 };
    this.arenaPrompt = this.add.text(640, 214, question.phrase, {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: `${uiArena.subtitle}px`,
      color: "#253f53",
      align: "center",
      wordWrap: { width: 980 }
    }).setOrigin(0.5);
    this.challengeLayer.add(this.arenaPrompt);

    this.modeState.arenaChoices = [];
    question.options.forEach((option, index) => {
      const button = this.createButton(290 + index * 350, 560, option.toUpperCase(), () => {
        this._highlightArenaChoices(question.answer, index);
        this.submitAnswer(index === question.answer, { hint: question.hint, arena: true });
      }, 0xffdda3);
      this.modeState.arenaChoices.push(button);
      this.challengeLayer.add([button, button.label]);
    });
  }

  renderStoryBuilder(question) {
    this.feedbackText.setText("① Read all 4 story cards   ②  Drag each card to the correct numbered slot (1 → 4)   ③  Click Lock Timeline when all steps are in order!");

    const TITLE_Y = 168, CARD_Y = 300, SLOT_Y = 420, BTN_Y = 535;

    this.challengeLayer.add(this.add.text(640, TITLE_Y, question.title, {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '22px', color: '#214a69', fontStyle: 'bold', align: 'center', wordWrap: { width: 1100 }
    }).setOrigin(0.5));

    const shuffled = Phaser.Utils.Array.Shuffle([0, 1, 2, 3]);
    this.modeState.storyCards  = [];
    this.modeState.storySlots  = [];
    this.modeState.storyAssignments = [null, null, null, null];

    const palette = [0xffeaa7, 0xb8f0d8, 0xffd0d0, 0xd0d0ff];
    const cardW = 270, cardH = 88, gap = 12;
    const totalW = 4 * cardW + 3 * gap;
    const startX = (1280 - totalW) / 2 + cardW / 2;

    // Draggable cards
    shuffled.forEach((stepIdx, pos) => {
      const cx = startX + pos * (cardW + gap);
      const shadow = this.add.rectangle(cx + 3, CARD_Y + 4, cardW, cardH, 0x000000, 0.12).setDepth(9);
      const card = this.add.rectangle(cx, CARD_Y, cardW, cardH, palette[stepIdx % palette.length])
        .setStrokeStyle(2, 0xffffff, 0.9).setDepth(10).setInteractive({ draggable: true, useHandCursor: true });
      const label = this.add.text(cx, CARD_Y, question.steps[stepIdx], {
        fontFamily: '"Nunito", Arial, sans-serif',
        fontSize: '18px', color: '#1a2a4a', fontStyle: 'bold', align: 'center', wordWrap: { width: cardW - 16 }
      }).setOrigin(0.5).setDepth(11);
      card.label = label; card.shadow = shadow;
      card.setData('stepIndex', stepIdx);
      card.setData('startX', cx); card.setData('startY', CARD_Y);
      card.setData('slotRef', null);
      card.on('pointerdown', () => {
        if (!this.awaitingAnswer) return;
        const open = this.modeState.storySlots.find(s => !s.getData('occupied'));
        if (open) this._snapStoryCard(card, open);
      });
      this.modeState.storyCards.push(card);
      this.challengeLayer.add([shadow, card, label]);
    });

    // Slots (depth 5 — always below cards)
    for (let i = 0; i < 4; i++) {
      const sx = startX + i * (cardW + gap);
      const slotBg = this.add.rectangle(sx, SLOT_Y, cardW, cardH, 0xddeeff, 1)
        .setStrokeStyle(3, 0x88aacc, 1).setDepth(5).setInteractive({ dropZone: true });
      const numLbl = this.add.text(sx, SLOT_Y - 14, `Step ${i + 1}`, {
        fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '15px', color: '#6699bb', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(6);
      const hint = this.add.text(sx, SLOT_Y + 14, '⬇ drop here', {
        fontFamily: '"Nunito", Arial, sans-serif', fontSize: '13px', color: '#99bbcc'
      }).setOrigin(0.5).setDepth(6);
      slotBg.setData('slotIndex', i); slotBg.setData('occupied', false); slotBg.setData('card', null);
      slotBg.setData('dropHint', hint); slotBg.setData('sx', sx); slotBg.setData('sy', SLOT_Y);
      this.modeState.storySlots.push(slotBg);
      this.challengeLayer.add([slotBg, numLbl, hint]);
    }

    this.input.on('drag', (pointer, card, dragX, dragY) => {
      if (!this.awaitingAnswer || !card.label) return;
      card.x = dragX; card.y = dragY;
      card.label.x = dragX; card.label.y = dragY;
      card.shadow.x = dragX + 3; card.shadow.y = dragY + 4;
      card.setDepth(30); card.label.setDepth(31);
    });
    this.input.on('dragenter', (p, c, zone) => zone.setFillStyle(0xc8f0d8).setStrokeStyle(3, 0x44cc88, 1));
    this.input.on('dragleave', (p, c, zone) => {
      zone.setFillStyle(zone.getData('occupied') ? 0xe8fff4 : 0xdff0ff)
          .setStrokeStyle(3, zone.getData('occupied') ? 0x44cc88 : 0x88aacc, 1);
    });
    this.input.on('drop', (p, card, zone) => this._snapStoryCard(card, zone));
    this.input.on('dragend', (p, card, dropped) => {
      if (!dropped) {
        card.x = card.getData('startX'); card.y = card.getData('startY');
        card.label.x = card.x; card.label.y = card.y;
        card.shadow.x = card.x + 3; card.shadow.y = card.y + 4;
        card.setDepth(10); card.label.setDepth(11);
      }
    });

    const [btnRect, btnLabel] = this._makeSimpleButton(640, BTN_Y, 'Lock Timeline ✓', 340, 50, 0xffd36d, () => {
      if (this.modeState.storyAssignments.includes(null)) { this.feedbackText.setText('⚠️ Fill all four timeline slots first!'); return; }
      this.submitAnswer(this.modeState.storyAssignments.every((si, i) => si === i), { hint: question.hint });
    });
    this.challengeLayer.add([btnRect, btnLabel]);
  }

  _snapStoryCard(card, slot) {
    if (!this.awaitingAnswer) return;
    const slotIdx = slot.getData('slotIndex');
    const prev = card.getData('slotRef');
    if (prev && prev !== slot) {
      prev.setData('occupied', false); prev.setData('card', null);
      prev.setFillStyle(0xdff0ff).setStrokeStyle(3, 0x88aacc, 1);
      prev.getData('dropHint')?.setAlpha(1);
      this.modeState.storyAssignments[prev.getData('slotIndex')] = null;
    }
    const displaced = slot.getData('card');
    if (displaced && displaced !== card) {
      displaced.x = displaced.getData('startX'); displaced.y = displaced.getData('startY');
      displaced.label.x = displaced.x; displaced.label.y = displaced.y;
      displaced.shadow.x = displaced.x + 3; displaced.shadow.y = displaced.y + 4;
      displaced.setDepth(10); displaced.label.setDepth(11); displaced.setData('slotRef', null);
      this.modeState.storyAssignments[slotIdx] = null;
    }
    const sx = slot.getData('sx'), sy = slot.getData('sy');
    card.x = sx; card.y = sy; card.label.x = sx; card.label.y = sy;
    card.shadow.x = sx + 3; card.shadow.y = sy + 4;
    card.setDepth(10); card.label.setDepth(11); card.setData('slotRef', slot);
    slot.setData('card', card); slot.setData('occupied', true);
    slot.setFillStyle(0xe8fff4).setStrokeStyle(3, 0x44cc88, 1);
    slot.getData('dropHint')?.setAlpha(0);
    this.modeState.storyAssignments[slotIdx] = card.getData('stepIndex');
  }

  assignStoryToFirstOpenSlot(card) {
    const open = this.modeState.storySlots?.find(s => !s.getData('occupied'));
    if (open) this._snapStoryCard(card.hit || card, open);
  }
  tryPlaceStoryCard(card, slot) { this._snapStoryCard(card.hit || card, slot); }



  renderEvidenceMountain(question) {
    this.feedbackText.setText("① Read the claim and the passage   ②  Find the quote that best supports the claim   ③  Click that quote — the right choice helps the climber reach the top!");

    const uiEvidence = (window.elaUI && window.elaUI.sizes) ? window.elaUI.sizes : { body: 34, small: 24 };
    const claim = this.add.text(640, 192, `Claim: ${question.claim}`, {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: `${uiEvidence.body}px`,
      color: "#244460",
      wordWrap: { width: 1120 }
    }).setOrigin(0.5);
    const passage = this.add.text(640, 258, question.passage, {
      fontFamily: '"Nunito", Arial, sans-serif',
      fontSize: `${uiEvidence.small}px`,
      color: "#1e4663",
      align: "center",
      wordWrap: { width: 1110 }
    }).setOrigin(0.5);
    this.challengeLayer.add([claim, passage]);

    this.modeState.evidenceStones = [];
    question.options.forEach((option, index) => {
      const stone = this.createOptionCard(640, 366 + index * 92, 980, 76, option);
      stone.on("pointerdown", () => {
        this._highlightEvidenceChoices(question.answer, index);
        this.submitAnswer(index === question.answer, { hint: question.hint, mountain: true });
      });
      this.modeState.evidenceStones.push(stone);
      this.challengeLayer.add([stone, stone.label]);
    });
  }

  createOptionCard(x, y, width, height, label, canDrag = false) {
    const card = this.add.rectangle(x, y, width, height, 0xffffff, 1)
      .setStrokeStyle(3, 0x88aadd, 1)
      .setInteractive({ draggable: canDrag, useHandCursor: true });
    card.label = this.add.text(x, y, label, {
      fontFamily: '"Nunito", Arial, sans-serif',
      fontSize: '20px', color: '#1a2a4a', fontStyle: 'bold',
      align: 'center', wordWrap: { width: width - 22 }
    }).setOrigin(0.5);
    card.on('pointerover', () => { card.setFillStyle(0xe8f4ff, 1); card.setStrokeStyle(3, 0x4488ff, 1); });
    card.on('pointerout',  () => { card.setFillStyle(0xffffff, 1); card.setStrokeStyle(3, 0x88aadd, 1); });
    return card;
  }

  // Returns a Rectangle that IS the interactive button; .label holds the Text.
  // Callers do: challengeLayer.add([btn, btn.label])
  createButton(x, y, text, onClick, fill = 0xffd36d, width = 400, height = 54) {
    const btn = this.add.rectangle(x, y, width, height, fill)
      .setStrokeStyle(3, 0xffffff, 0.7)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '22px', color: '#1a3a58', fontStyle: 'bold', align: 'center',
      wordWrap: { width: width - 24 }
    }).setOrigin(0.5);
    btn.label = label;
    btn.on('pointerover', () => { btn.setFillStyle(0xffe082); label.setScale(1.04); });
    btn.on('pointerout',  () => { btn.setFillStyle(fill);    label.setScale(1); });
    btn.on('pointerdown', () => {
      this.tweens.add({ targets: [btn, label], scaleX: 0.96, scaleY: 0.96, duration: 70, yoyo: true });
      onClick();
    });
    return btn;
  }

  submitAnswer(isCorrect, extras = {}) {
    if (!this.awaitingAnswer) {
      return;
    }
    this.awaitingAnswer = false;

    if (this.roundTimerEvent) {
      this.roundTimerEvent.remove(false);
    }

    this.difficulty.recordResult(this.gateId, isCorrect);
    let feedback = "";

    if (isCorrect) {
      this.correctCount += 1;
      this.combo += 1;
      this.guardianHp = Math.max(0, this.guardianHp - 100 / this.roundTarget);
      if (this.isFirstAttempt) {
        const xpGain = this.getRoundXpReward();
        this.player.gainXP(xpGain);
        this.player.gainStars(1);
        this._xpEarnedThisRun += xpGain;
      }
      this.audio.playSfx("sfx_correct", 0.42);
      this.anim.celebrationBurst(this, 640, 360);
      feedback = Phaser.Utils.Array.GetRandom(ENCOURAGING_LINES);
      this.achievements.checkCombo(this.combo);
    } else {
      this.wrongCount += 1;
      this.combo = 0;
      this.heroHp = Math.max(0, this.heroHp - 22);
      this.audio.playSfx("sfx_wrong", 0.34);
      this.anim.wrongShake(this);

      if (extras.timedOut) {
        feedback = `⏱️ Time's up!  Hint: ${this.currentQuestion.hint}`;
      } else {
        const hint = extras.hint || this.currentQuestion?.hint || '';
        feedback = hint
          ? `❌ Incorrect.  Hint: ${hint}`
          : `❌ Incorrect — try the next one!`;
      }
    }

    if (this.gateId === 3) {
      this.updateArenaBars();
      this.playArenaHit(isCorrect);
    }

    if (this.gateId === 5 && this.climber) {
      const move = isCorrect ? -44 : 12;
      const targetY = Phaser.Math.Clamp(this.climber.y + move, 220, 585);
      this.tweens.add({
        targets: this.climber,
        y: targetY,
        duration: 260,
        ease: "Sine.easeOut"
      });
    }

    this.scoreText.setText(`Score ${this.correctCount} correct`);
    this.feedbackText.setText(feedback);
    this.achievements.checkLevelMilestones();
    this.eventsBus.emit("save:requested");

    this.time.delayedCall(1300, () => this.nextRound());
  }

  updateArenaBars() {
    if (!this.arenaEnemyBar || !this.arenaHeroBar) {
      return;
    }
    this.arenaEnemyBar.width = 166 * Phaser.Math.Clamp(this.guardianHp / 100, 0, 1);
    this.arenaHeroBar.width = 166 * Phaser.Math.Clamp(this.heroHp / 100, 0, 1);
  }

  playArenaHit(heroHit) {
    const target = heroHit ? this.arenaEnemy : this.arenaHero;
    if (!target) return;
    const dir = heroHit ? -30 : 30;
    // Knock-back + flash
    this.tweens.add({
      targets: target, x: target.x + dir,
      yoyo: true, duration: 70, repeat: 2,
      onComplete: () => { target.x = heroHit ? 1180 : 100; }
    });
    // Flash white (scale spike)
    this.tweens.add({
      targets: target, scaleX: 1.4, scaleY: 1.4,
      yoyo: true, duration: 80,
      onComplete: () => { target.scaleX = 1; target.scaleY = 1; }
    });
    // Spawn hit emoji
    const hitEmoji = this.add.text(target.x, target.y - 40,
      heroHit ? '💥' : '😓', { fontSize: '36px' }
    ).setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: hitEmoji, y: hitEmoji.y - 60, alpha: 0,
      duration: 700, ease: 'Sine.easeOut',
      onComplete: () => hitEmoji.destroy()
    });
  }

  getRoundXpReward() {
    const difficulty = this.currentQuestion.difficulty;
    if (difficulty === "hard") {
      return 72;
    }
    if (difficulty === "medium") {
      return 56;
    }
    return 42;
  }

  finishGateRun() {
    this._gameFinished = true;   // disable leave-warning from this point on
    window.elaIsPlaying = false; // no longer mid-game — tab close won't alert
    this.clearChallengeLayer();
    const total = this.correctCount + this.wrongCount;
    const accuracy = total > 0 ? this.correctCount / total : 0;
    const pass = accuracy >= 0.60;
    const pct  = Math.round(accuracy * 100);

    // Star rating: 60-74% → 1 star, 75-89% → 2 stars, 90-100% → 3 stars
    const stars = accuracy >= 0.90 ? 3 : accuracy >= 0.75 ? 2 : accuracy >= 0.60 ? 1 : 0;
    const starDisplay = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    this.feedbackText.setText(pass ? "Gate challenge cleared!" : "Practice round complete. You can retry for better mastery.");

    // Result card — fixed geometry: top=173, bottom=623, centre=(640,398)
    const RC_TOP  = 173;
    const RC_BOT  = 623;
    const RC_CX   = 640;
    const card = this.add.graphics();
    card.fillStyle(0xffffff, 1);
    card.lineStyle(3, pass ? 0x4caf7a : 0x4b8df8, 0.6);
    card.fillRoundedRect(RC_CX - 490, RC_TOP, 980, RC_BOT - RC_TOP, 22);
    card.strokeRoundedRect(RC_CX - 490, RC_TOP, 980, RC_BOT - RC_TOP, 22);

    // Coloured top stripe
    const stripeG = this.add.graphics();
    stripeG.fillStyle(pass ? 0x4caf7a : 0x4b8df8, 1);
    stripeG.fillRoundedRect(RC_CX - 490, RC_TOP, 980, 60, { tl:22, tr:22, bl:0, br:0 });
    stripeG.fillStyle(0xffffff, 0.18);
    stripeG.fillRoundedRect(RC_CX - 486, RC_TOP + 4, 972, 26, { tl:20, tr:20, bl:0, br:0 });

    const TITLE_Y = RC_TOP + 90;
    const STARS_Y = RC_TOP + 158;
    const STATS_Y = RC_TOP + 220;
    const BTNS_Y  = RC_BOT - 88;

    const title = this.add.text(RC_CX, TITLE_Y,
      pass ? "✨ Crystal Restored!" : "📚 Keep Practising", {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '52px',
      color: pass ? "#237247" : "#315d87",
      stroke: "#ffffff", strokeThickness: 6
    }).setOrigin(0.5);

    // Star rating display
    const starsText = this.add.text(RC_CX, STARS_Y, starDisplay, {
      fontSize: '44px'
    }).setOrigin(0.5);
    const starsLabel = this.add.text(RC_CX, STARS_Y + 46, `${pct}% accuracy`, {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '18px',
      color: '#5a7a9a', fontStyle: 'bold'
    }).setOrigin(0.5);

    const passLabel = pass ? '' : '\n❤️ -1 life (below 60%)';
    const stats = this.add.text(RC_CX, STATS_Y + 30, [
      `Correct: ${this.correctCount}   Incorrect: ${this.wrongCount}${passLabel}`
    ].join("\n"), {
      fontFamily: '"Nunito", Arial, sans-serif',
      fontSize: '20px', align: "center",
      color: "#244a69", lineSpacing: 8
    }).setOrigin(0.5);

    this.challengeLayer.add([card, stripeG, title, starsText, starsLabel, stats]);

    // Stripe title label
    const stripeLbl = this.add.text(RC_CX, RC_TOP + 30,
      pass ? '🏆  Mission Complete' : '📋  Round Summary', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '20px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.challengeLayer.add(stripeLbl);

    // Override BTNS_Y reference for the buttons section below
    const _BTNS_Y = BTNS_Y;

    if (pass) {
      if (this.isFirstAttempt) {
        // First clear: unlock gate progression + full rewards
        this.progression.completeGate(this.gateId, stars);
        this.player.gainXP(120);
        this.player.gainStars(4);
        this.audio.playSfx("sfx_level_up", 0.5);
        this.anim.confetti(this, 640, 350);
        this.achievements.checkGateCompletion({
          accuracy,
          completedCount: this.progression.getCompletedCount()
        });
        this.achievements.checkCampaignComplete(this.progression);
      } else {
        // Replay pass: save improved star score, small celebration
        this.progression.completeGate(this.gateId, stars);
        this.audio.playSfx("sfx_level_up", 0.4);
        this.anim.confetti(this, 640, 350);
      }
    } else {
      // Failed: reverse XP earned this run, then lose 1 life
      if (this._xpEarnedThisRun > 0) {
        this.player.reverseXP(this._xpEarnedThisRun);
      }
      this.player.loseLife();
      this.eventsBus.emit("ui:message", "❤️ -1 life. Lives refill every 5 minutes.");
    }

    this.eventsBus.emit("save:requested");

    // ── Result buttons: Next Game | World Map | Replay (on pass) — centred ──
    const nextGateId = Math.min(this.gateId + 1, 5);
    const isLastGate = this.gateId === 5;
    const BTN_W = 320;
    const BTN_Y_POS = 548;
    const GAP = 24;

    if (pass) {
      // On pass: 3 buttons (or 2 if last gate)
      if (isLastGate) {
        // Last gate pass: "World Map" (left) + "Replay" (right)
        const leftX = 640 - (BTN_W + GAP) / 2;
        const rightX = 640 + (BTN_W + GAP) / 2;

        const mapBtn = this.createButton(leftX, BTN_Y_POS, "🗺️  World Map", () => {
          this.scene.start("WorldMapScene");
        }, 0x4caf7a);
        mapBtn.label.setColor('#ffffff');

        const replayBtn = this.createButton(rightX, BTN_Y_POS, "🔄  Replay", () => {
          this.scene.restart({ gateId: this.gateId });
        }, 0xddeeff);

        this.challengeLayer.add([mapBtn, mapBtn.label, replayBtn, replayBtn.label]);
      } else {
        // Not last gate: "Next Game" (left) + "World Map" (middle) + "Replay" (right)
        const totalW = 3 * BTN_W + 2 * GAP;
        const startX = 640 - totalW / 2 + BTN_W / 2;
        const leftX = startX;
        const midX = startX + BTN_W + GAP;
        const rightX = startX + 2 * (BTN_W + GAP);

        const nextBtn = this.createButton(leftX, BTN_Y_POS, "▶  Next Game", () => {
          this.scene.start("GateScene", { gateId: nextGateId });
        }, 0x4caf7a);
        nextBtn.label.setColor('#ffffff');

        const mapBtn = this.createButton(midX, BTN_Y_POS, "🗺️  World Map", () => {
          this.scene.start("WorldMapScene");
        }, 0x6ec6d4);
        mapBtn.label.setColor('#ffffff');

        const replayBtn = this.createButton(rightX, BTN_Y_POS, "🔄  Replay", () => {
          this.scene.restart({ gateId: this.gateId });
        }, 0xddeeff);

        this.challengeLayer.add([nextBtn, nextBtn.label, mapBtn, mapBtn.label, replayBtn, replayBtn.label]);
      }
    } else {
      // On fail: "Replay" (left) + "World Map" (right)
      const leftX = 640 - (BTN_W + GAP) / 2;
      const rightX = 640 + (BTN_W + GAP) / 2;

      const replayBtn = this.createButton(leftX, BTN_Y_POS, "🔄  Replay", () => {
        this.scene.restart({ gateId: this.gateId });
      }, 0xff8c42);
      replayBtn.label.setColor('#ffffff');

      const mapBtn = this.createButton(rightX, BTN_Y_POS, "🗺️  World Map", () => {
        this.scene.start("WorldMapScene");
      }, 0xddeeff);

      this.challengeLayer.add([replayBtn, replayBtn.label, mapBtn, mapBtn.label]);
    }
  }

  // ── Leave warning dialog ──────────────────────────────────────────────────
  _showLeaveWarning() {
    // Don't double-open
    if (this._leaveWarningOpen) return;
    this._leaveWarningOpen = true;

    const W = 1280, H = 720;
    const CW = 560, CH = 240;
    const CX = W/2, CY = H/2;

    const backdrop = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.65).setDepth(80).setInteractive();
    const cardG = this.add.graphics().setDepth(81);
    cardG.fillStyle(0xfffef8, 1);
    cardG.lineStyle(3, 0xffaa44, 1);
    cardG.fillRoundedRect(CX-CW/2, CY-CH/2, CW, CH, 18);
    cardG.strokeRoundedRect(CX-CW/2, CY-CH/2, CW, CH, 18);

    const hdrG = this.add.graphics().setDepth(81);
    hdrG.fillStyle(0xff7c2a, 1);
    hdrG.fillRoundedRect(CX-CW/2, CY-CH/2, CW, 50, { tl:18, tr:18, bl:0, br:0 });

    const title = this.add.text(CX, CY-CH/2+25, '⚠️  Leave this Gate?', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '20px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(82);

    const msg = this.add.text(CX, CY-10, 'Your progress in this round will be lost.\nYou will also lose ❤️ 1 life.', {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '16px',
      color: '#3a2000', align: 'center', lineSpacing: 6
    }).setOrigin(0.5).setDepth(82);

    // Confirm leave button
    const confirmBg = this.add.graphics().setDepth(82);
    confirmBg.fillStyle(0xe05050, 1);
    confirmBg.fillRoundedRect(CX-240, CY+CH/2-70, 210, 44, 12);
    const confirmTxt = this.add.text(CX-135, CY+CH/2-48, '🚪  Leave & Lose Life', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '15px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(83);
    const confirmHit = this.add.rectangle(CX-135, CY+CH/2-48, 210, 44, 0, 0)
      .setDepth(84).setInteractive({ useHandCursor: true });
    confirmHit.on('pointerdown', () => {
      window.elaIsPlaying = false;
      this.player.loseLife();
      this.eventsBus.emit('ui:message', '❤️ -1 life. Lives refill every 5 minutes.');
      this.eventsBus.emit('save:requested');
      destroyLeave();
      this.scene.start('WorldMapScene');
    });

    // Stay button
    const stayBg = this.add.graphics().setDepth(82);
    stayBg.fillStyle(0x22aa55, 1);
    stayBg.fillRoundedRect(CX+30, CY+CH/2-70, 210, 44, 12);
    const stayTxt = this.add.text(CX+135, CY+CH/2-48, '✅  Keep Playing', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '15px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(83);
    const stayHit = this.add.rectangle(CX+135, CY+CH/2-48, 210, 44, 0, 0)
      .setDepth(84).setInteractive({ useHandCursor: true });
    stayHit.on('pointerdown', () => destroyLeave());

    const leaveEls = [backdrop, cardG, hdrG, title, msg, confirmBg, confirmTxt, confirmHit, stayBg, stayTxt, stayHit];
    const destroyLeave = () => {
      this._leaveWarningOpen = false;
      leaveEls.forEach(o => { try { o.destroy(); } catch(e){} });
    };
  }

  // ── No lives screen (shown at create if player has 0 lives) ───────────────
  _showNoLivesScreen() {
    const W = 1280, H = 720;
    const sys = this.systemsRef;

    const backdrop = this.add.rectangle(W/2, H/2, W, H, 0x0d2e4a, 0.97).setDepth(90).setInteractive();
    const cardG = this.add.graphics().setDepth(91);
    cardG.fillStyle(0xfafcff, 1);
    cardG.lineStyle(3, 0x3a9fd4, 1);
    cardG.fillRoundedRect(W/2-320, H/2-160, 640, 320, 20);
    cardG.strokeRoundedRect(W/2-320, H/2-160, 640, 320, 20);

    this.add.text(W/2, H/2-90, '💔  No Lives Left!', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '32px',
      color: '#cc2244', stroke: '#ffffff', strokeThickness: 4
    }).setOrigin(0.5).setDepth(92);

    // Compute regen
    let regenMsg = 'Your lives refill 1 every 5 minutes.';
    if (sys && sys.player && typeof sys.player.msUntilNextLife === 'function') {
      const ms = sys.player.msUntilNextLife();
      if (ms > 0) {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        regenMsg = `Next life in: ${mins}:${String(secs).padStart(2,'0')}
Lives refill 1 every 5 minutes.`;
      }
    }

    this.add.text(W/2, H/2+0, regenMsg, {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '18px',
      color: '#1a3a58', align: 'center', lineSpacing: 8
    }).setOrigin(0.5).setDepth(92);

    // Back to map button
    const btnBg = this.add.graphics().setDepth(92);
    btnBg.fillStyle(0x4b8df8, 1);
    btnBg.fillRoundedRect(W/2-120, H/2+90, 240, 48, 14);
    this.add.text(W/2, H/2+114, '🗺️  Back to World Map', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '17px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(93);
    const btnHit = this.add.rectangle(W/2, H/2+114, 240, 48, 0, 0).setDepth(94).setInteractive({ useHandCursor: true });
    btnHit.on('pointerdown', () => this.scene.start('WorldMapScene'));
  }

  getThemeKey(gateId) {
    return ["forest", "city", "arena", "kingdom", "mountain"][gateId - 1];
  }

  update() {
    if (!this.awaitingAnswer || this.gateId !== 1 || !this.modeState.vocabControl) {
      return;
    }

    const speed = 5;
    if (this.vocabCursors.left.isDown || this.vocabWASD.left.isDown) {
      this.modeState.hero.x -= speed;
    } else if (this.vocabCursors.right.isDown || this.vocabWASD.right.isDown) {
      this.modeState.hero.x += speed;
    }
    this.modeState.hero.x = Phaser.Math.Clamp(this.modeState.hero.x, 120, 1160);

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      const nearest = this.modeState.doors.reduce((best, door) => {
        const distance = Math.abs(door.x - this.modeState.hero.x);
        if (!best || distance < best.distance) {
          return { door, distance };
        }
        return best;
      }, null);

      if (nearest && nearest.distance < 180) {
        const isCorrect = nearest.door.answerIndex === this.currentQuestion.answer;
        this._highlightVocabAnswer(this.currentQuestion.answer, nearest.door.answerIndex, null, null);
        this.submitAnswer(isCorrect, {
          hint: this.currentQuestion.hint
        });
      } else {
        this.feedbackText.setText("Move closer to a door and press SPACE.");
      }
    }
  }
}