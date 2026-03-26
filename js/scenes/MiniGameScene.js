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
    this.roundText = this.add.text(36, HEADER_Y + 16, 'Round 1/1', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '16px', color: '#1c4d73'
    }).setOrigin(0, 0.5);

    this.scoreText = this.add.text(320, HEADER_Y + 16, 'Score 0 correct', {
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
  }

  createBottomHud() {
    const PANEL_Y = 668;
    // White feedback panel
    this.feedbackPanel = this.add.rectangle(640, PANEL_Y, 1240, 78, 0xffffff, 0.95)
      .setStrokeStyle(2, 0xcae4ff, 1).setDepth(20);

    // Feedback text — leaves room for the Map button on the right
    this.feedbackText = this.add.text(28, PANEL_Y, '', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '18px', color: '#1f4f71',
      wordWrap: { width: 1050 }
    }).setOrigin(0, 0.5).setDepth(21);

    // Map button — pill on the right, fully inside the 1240px panel (panel right edge = 1260)
    const mapBg = this.add.rectangle(1168, PANEL_Y, 168, 46, 0x4b8df8)
      .setStrokeStyle(2, 0xffffff, 0.7).setDepth(21)
      .setInteractive({ useHandCursor: true });
    const mapLbl = this.add.text(1168, PANEL_Y, '🗺️  Go to Map', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '17px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);
    mapBg.on('pointerover', () => mapBg.setFillStyle(0x3a7de0));
    mapBg.on('pointerout',  () => mapBg.setFillStyle(0x4b8df8));
    mapBg.on('pointerdown', () => this.scene.start('WorldMapScene'));
    this.backButton = mapBg;
  }

  prepareGateState() {
    this.modeState = {
      selectedMainIdea: null,
      mainIdeaAssignments: [null, null],
      storyAssignments: [null, null, null, null],
      climberY: 575
    };

    if (this.gateId === 3) {
      this.arenaHero = this.add.image(170, 448, "hero").setScale(1.5).setDepth(5);
      this.arenaEnemy = this.add.image(1110, 420, "enemy").setScale(1.8).setDepth(5);
      this.arenaHeroBarBg = this.add.rectangle(88, 516, 170, 16, 0x223e66).setOrigin(0, 0.5);
      this.arenaHeroBar = this.add.rectangle(90, 516, 166, 12, 0x65db9f).setOrigin(0, 0.5);
      this.arenaEnemyBarBg = this.add.rectangle(1022, 516, 170, 16, 0x223e66).setOrigin(0, 0.5);
      this.arenaEnemyBar = this.add.rectangle(1024, 516, 166, 12, 0xff8f8f).setOrigin(0, 0.5);
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
      this.startRoundTimer(this.getTimerForDifficulty(question.difficulty, 21));
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
    const GATE_INSTRUCTIONS = {
      1: {
        title: '📖 Vocabulary Forest',
        steps: [
          '① Read the sentence carefully.',
          '② Find the meaning of the highlighted word using context clues.',
          '③ Walk your hero to the correct answer door and press SPACE — or just click the card!'
        ]
      },
      2: {
        title: '🔍 Main Idea City',
        steps: [
          '① Read the passage carefully.',
          '② Click the button that shows the MAIN IDEA of the passage.',
          '③ Drag 2 evidence cards into the Evidence slots that best support your main idea.',
          '④ Press Submit Case when you are done!'
        ]
      },
      3: {
        title: '🎭 Figurative Language Arena',
        steps: [
          '① Read the phrase shown on screen.',
          '② Decide which type of figurative language it is:',
          '   Simile · Metaphor · Idiom · Hyperbole · Personification · Onomatopoeia · Alliteration · Literal',
          '③ Click the correct category button to strike the Echo Beast!'
        ]
      },
      4: {
        title: '📚 Story Builder Kingdom',
        steps: [
          '① Read all 4 story event cards.',
          '② Drag each card into the numbered Step slot in the correct story order (1 → 4).',
          '③ Click Lock Timeline once all four steps are placed correctly!'
        ]
      },
      5: {
        title: '🧩 Evidence Mountain',
        steps: [
          '① Read the Claim at the top.',
          '② Read the passage carefully.',
          '③ Click the sentence that best SUPPORTS the claim with real evidence from the text.',
          '   The right choice moves your climber up the mountain!'
        ]
      }
    };

    const instr  = GATE_INSTRUCTIONS[this.gateId] || GATE_INSTRUCTIONS[1];
    const W = 1280, H = 720;
    const CARD_W = 860, CARD_H = 320;
    const CARD_X = (W - CARD_W) / 2;
    const CARD_Y = (H - CARD_H) / 2 - 10;

    // Dim overlay — blocks all game input underneath
    const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.6).setDepth(60).setInteractive();

    // Card background
    const cardG = this.add.graphics().setDepth(61);
    cardG.fillStyle(0xfafcff, 1);
    cardG.lineStyle(4, 0xaaccee, 1);
    cardG.fillRoundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, 18);
    cardG.strokeRoundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, 18);

    // Header strip
    const headerG = this.add.graphics().setDepth(61);
    headerG.fillStyle(0xff7c2a, 1);
    headerG.fillRoundedRect(CARD_X, CARD_Y, CARD_W, 52, { tl:18, tr:18, bl:0, br:0 });

    // Header title
    this.add.text(W/2, CARD_Y + 26, `📋  How to Play — ${instr.title}`, {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '20px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(62);

    // Step lines
    const stepY = CARD_Y + 72;
    instr.steps.forEach((step, i) => {
      this.add.text(W/2, stepY + i * 42, step, {
        fontFamily: '"Nunito", Arial, sans-serif', fontSize: '16px',
        color: '#1a2a3a', align: 'center', wordWrap: { width: CARD_W - 60 }
      }).setOrigin(0.5).setDepth(62);
    });

    // Divider line
    const divY = CARD_Y + CARD_H - 80;
    const divG = this.add.graphics().setDepth(61);
    divG.lineStyle(1, 0xdddddd, 1);
    divG.lineBetween(CARD_X + 30, divY, CARD_X + CARD_W - 30, divY);

    // Checkbox row
    const checkX = CARD_X + 80;
    const checkY = CARD_Y + CARD_H - 48;
    let checked = false;

    const checkBox = this.add.rectangle(checkX, checkY, 24, 24, 0xffffff, 1)
      .setStrokeStyle(2, 0x4477aa, 1).setDepth(62).setInteractive({ useHandCursor: true });
    const checkTick = this.add.text(checkX, checkY, '', {
      fontSize: '18px', color: '#22aa55', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(63);
    const checkLbl = this.add.text(checkX + 18, checkY, "I understand — let's play!", {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '16px',
      color: '#1a2a3a', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(62).setInteractive({ useHandCursor: true });

    // Start button (right side, grey until checked)
    const btnX = CARD_X + CARD_W - 110;
    const btnBg = this.add.rectangle(btnX, checkY, 180, 44, 0xbbbbbb, 1)
      .setStrokeStyle(2, 0xffffff, 0.5).setDepth(62).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(btnX, checkY, '▶  Start Playing!', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '16px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(63);

    const allEls = [overlay, cardG, headerG, checkBox, checkTick, checkLbl, btnBg, btnTxt, divG];
    // Also collect the text objects added via this.add.text above
    const destroyAll = () => allEls.forEach(o => { if (o && o.destroy) o.destroy(); });

    const toggle = () => {
      checked = !checked;
      checkTick.setText(checked ? '✓' : '');
      checkBox.setFillStyle(checked ? 0xd0ffd8 : 0xffffff);
      btnBg.setFillStyle(checked ? 0x22aa55 : 0xbbbbbb);
    };
    checkBox.on('pointerdown', toggle);
    checkLbl.on('pointerdown', toggle);

    const tryStart = () => {
      if (!checked) {
        checkLbl.setColor('#cc2222');
        this.time.delayedCall(900, () => checkLbl.setColor('#1a2a3a'));
        return;
      }
      this._instructionAccepted = true;
      destroyAll();
      // Destroy the header text objects too — find by depth
      this.children.list
        .filter(o => o.depth === 62 || o.depth === 63)
        .forEach(o => o.destroy());
      onAccepted();
    };
    btnBg.on('pointerdown', tryStart);
    btnTxt.on('pointerdown', tryStart);
    btnTxt.setInteractive({ useHandCursor: true });
  }

  renderVocabularyForest(question) {
    this.feedbackText.setText("① Read the sentence   ②  Find the meaning of the highlighted word   ③  Click the correct answer card — or walk up and press SPACE!");
    this.feedbackText.setText("① Read the sentence   ②  Find the meaning of the highlighted word   ③  Click the correct answer card — or walk up and press SPACE!");
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

    // Rotate through 3 different pastel sets so each question looks different
    const PALETTE_SETS = [
      [0xffe8a0, 0xa8e6cf, 0xffb3c1],   // warm: yellow / mint / rose
      [0xb8d4ff, 0xffd6a0, 0xc8f0b8],   // cool: blue / peach / lime
      [0xf0c8ff, 0xffe0a8, 0xa0e8e8],   // soft: lavender / amber / teal
      [0xffcba4, 0xb4e8ff, 0xfff0a0],   // fresh: coral / sky / lemon
      [0xd4f0a0, 0xffc8e8, 0xb0d8ff],   // spring: green / pink / periwinkle
    ];
    const paletteIdx = this.roundIndex % PALETTE_SETS.length;
    const colors = PALETTE_SETS[paletteIdx];
    const darkColors = ['#5a3800', '#1a4a30', '#6a1a2a', '#1a3a6a', '#1a3a5a'];

    const DOOR_W = 280, DOOR_H = 180;
    const positions = [240, 640, 1040];
    const DOOR_Y = 460;
    this.modeState.doors = [];

    positions.forEach((x, index) => {
      const col     = colors[index % colors.length];
      const colHex  = '#' + col.toString(16).padStart(6, '0');

      // Door graphic (rounded rect like a card)
      const dg = this.add.graphics().setDepth(10);
      // Shadow
      dg.fillStyle(0x000000, 0.18);
      dg.fillRoundedRect(x - DOOR_W/2 + 4, DOOR_Y - DOOR_H/2 + 6, DOOR_W, DOOR_H, 22);
      // Card fill
      dg.fillStyle(col, 1);
      dg.fillRoundedRect(x - DOOR_W/2, DOOR_Y - DOOR_H/2, DOOR_W, DOOR_H, 22);
      // Shine
      dg.fillStyle(0xffffff, 0.35);
      dg.fillRoundedRect(x - DOOR_W/2 + 8, DOOR_Y - DOOR_H/2 + 8, DOOR_W - 16, DOOR_H * 0.4, { tl:18, tr:18, bl:0, br:0 });
      // Border
      dg.lineStyle(4, 0xffffff, 0.8);
      dg.strokeRoundedRect(x - DOOR_W/2, DOOR_Y - DOOR_H/2, DOOR_W, DOOR_H, 22);

      // Door arch decoration at top
      dg.fillStyle(0xffffff, 0.25);
      dg.fillEllipse(x, DOOR_Y - DOOR_H/2 + 14, DOOR_W * 0.55, 28);

      // Answer text
      const label = this.add.text(x, DOOR_Y + 14, question.options[index], {
        fontFamily: '"Nunito", Arial, sans-serif',
        fontSize: '20px', color: '#1a2a3a', fontStyle: 'bold',
        align: 'center', wordWrap: { width: DOOR_W - 24 }
      }).setOrigin(0.5).setDepth(11);

      // "Option N" badge at top
      const badge = this.add.text(x, DOOR_Y - DOOR_H/2 + 22, `Option ${index + 1}`, {
        fontFamily: '"Baloo 2", Arial, sans-serif',
        fontSize: '14px', color: '#ffffff',
        stroke: '#00000044', strokeThickness: 2
      }).setOrigin(0.5).setDepth(11);

      // Invisible hit area
      const hit = this.add.rectangle(x, DOOR_Y, DOOR_W, DOOR_H, 0, 0)
        .setDepth(12).setInteractive({ useHandCursor: true });

      hit.on('pointerover', () => {
        this.tweens.add({ targets: [dg, label, badge], y: '-=6', duration: 110, ease: 'Back.easeOut' });
      });
      hit.on('pointerout', () => {
        this.tweens.add({ targets: [dg, label, badge], y: '+=6', duration: 110, ease: 'Sine.easeOut' });
      });
      hit.on('pointerdown', () => {
        this.tweens.add({ targets: [dg, label, badge], scaleX: 0.95, scaleY: 0.95, duration: 70, yoyo: true });
        this.submitAnswer(index === question.answer, { hint: question.hint });
      });

      this.modeState.doors.push({ x, answerIndex: index, sprite: dg, hit });
      this.challengeLayer.add([dg, label, badge, hit]);
      this.anim.float(this, dg, 6, Phaser.Math.Between(1100, 1600));
      this.anim.float(this, label, 6, dg._tweens?.[0]?.duration || 1300);
    });

    this.modeState.hero = this.add.image(640, 580, "hero").setScale(1.2).setDepth(9);
    this.challengeLayer.add([prompt, sentence, this.modeState.hero]);
    this.modeState.vocabControl = true;
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  renderMainIdeaCity(question) {
    this.feedbackText.setText("① Read the passage   ②  Click the MAIN IDEA button   ③  Drag 2 evidence cards into the slots — then hit Submit!");

    // ── Layout constants ──────────────────────────────────────────────────────
    const PASS_Y  = 175;
    const IDEA_Y  = 248;
    const CARD_Y  = 355;
    const SLOT_Y  = 462;
    const BTN_Y   = 558;

    // Passage
    const caseText = this.add.text(640, PASS_Y, question.passage, {
      fontFamily: '"Nunito", Arial, sans-serif',
      fontSize: '18px', color: '#111111',
      align: 'center', wordWrap: { width: 1100 }
    }).setOrigin(0.5);
    this.challengeLayer.add(caseText);

    this.modeState.selectedMainIdea = null;
    this.modeState.mainIdeaAssignments = [null, null];
    this.modeState.detailCards = [];
    this.modeState.detailSlots = [];
    this.modeState.mainIdeaRects = [];

    // ── Main idea buttons — same color for all 3, dark text ──────────────────
    const IDEA_COLOR    = 0x4b8df8;   // single uniform blue
    const IDEA_SELECTED = 0xffffff;   // white when selected
    const n      = question.mainIdeas.length;
    const ideaW  = Math.min(360, Math.floor(1160 / n) - 10);
    const ideaH  = 54;
    const ideaGap = (1160 - n * ideaW) / (n - 1);

    question.mainIdeas.forEach((idea, idx) => {
      const bx   = 60 + ideaW / 2 + idx * (ideaW + ideaGap);
      const rect = this.add.rectangle(bx, IDEA_Y, ideaW, ideaH, IDEA_COLOR)
        .setStrokeStyle(3, 0x1a5abf, 1).setInteractive({ useHandCursor: true });
      const label = this.add.text(bx, IDEA_Y, idea, {
        fontFamily: '"Nunito", Arial, sans-serif',
        fontSize: '16px', color: '#1a2a3a', fontStyle: 'bold',
        align: 'center', wordWrap: { width: ideaW - 16 }
      }).setOrigin(0.5);

      rect.on('pointerover', () => { if (this.modeState.selectedMainIdea !== idx) rect.setAlpha(0.82); });
      rect.on('pointerout',  () => { if (this.modeState.selectedMainIdea !== idx) rect.setAlpha(1); });
      rect.on('pointerdown', () => {
        this.modeState.selectedMainIdea = idx;
        // Reset all
        this.modeState.mainIdeaRects.forEach(r => {
          r.setFillStyle(IDEA_COLOR).setStrokeStyle(3, 0x1a5abf, 1).setAlpha(1);
        });
        this.modeState.mainIdeaRects.forEach((_, i) => {
          this.modeState.mainIdeaLabels[i].setColor('#1a2a3a');
        });
        // Highlight selected: white fill, colored border
        rect.setFillStyle(IDEA_SELECTED).setStrokeStyle(4, 0x1a5abf, 1);
        label.setColor('#1a5abf');
        this.feedbackText.setText("✅ Main idea selected!   ③  Now drag 2 evidence cards into the Evidence slots — then hit Submit!");
      });
      this.modeState.mainIdeaRects.push(rect);
      if (!this.modeState.mainIdeaLabels) this.modeState.mainIdeaLabels = [];
      this.modeState.mainIdeaLabels.push(label);
      this.challengeLayer.add([rect, label]);
    });

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
    const [btnRect, btnLabel] = this._makeSimpleButton(640, BTN_Y, 'Submit Case ✓', 340, 50, 0xffd36d, () => {
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

    question.options.forEach((option, index) => {
      const button = this.createButton(290 + index * 350, 560, option.toUpperCase(), () => {
        this.submitAnswer(index === question.answer, { hint: question.hint, arena: true });
      }, 0xffdda3);
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

    question.options.forEach((option, index) => {
      const stone = this.createOptionCard(640, 366 + index * 92, 980, 76, option);
      stone.on("pointerdown", () => this.submitAnswer(index === question.answer, { hint: question.hint, mountain: true }));
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
  createButton(x, y, text, onClick, fill = 0xffd36d) {
    const btn = this.add.rectangle(x, y, 400, 54, fill)
      .setStrokeStyle(3, 0xffffff, 0.7)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, text, {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '22px', color: '#1a3a58', fontStyle: 'bold', align: 'center'
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
      this.player.gainXP(this.getRoundXpReward());
      this.player.gainStars(1);
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

      feedback = Phaser.Utils.Array.GetRandom(GENTLE_LINES);
      if (extras.timedOut) {
        feedback = `Time is up. Hint: ${this.currentQuestion.hint}`;
      } else if (this.difficulty.shouldOfferHint(this.gateId)) {
        feedback = `${feedback} Hint: ${extras.hint || this.currentQuestion.hint}`;
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
    if (!target) {
      return;
    }
    this.tweens.add({
      targets: target,
      x: target.x + (heroHit ? -24 : 24),
      yoyo: true,
      duration: 70,
      repeat: 2
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
    this.clearChallengeLayer();
    const total = this.correctCount + this.wrongCount;
    const accuracy = total > 0 ? this.correctCount / total : 0;
    const pass = accuracy >= 0.65;

    this.feedbackText.setText(pass ? "Gate challenge cleared!" : "Practice round complete. You can retry for better mastery.");

    const card = this.add.image(640, 398, "panel").setDisplaySize(980, 450);
    const uiFinish = (window.elaUI && window.elaUI.sizes) ? window.elaUI.sizes : { title:86, body:34, small:24 };
    const title = this.add.text(640, 250, pass ? "Crystal Restored!" : "Keep Training", {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: `${uiFinish.title}px`,
      color: pass ? "#237247" : "#315d87",
      stroke: "#ffffff",
      strokeThickness: 8
    }).setOrigin(0.5);
    const stats = this.add.text(640, 352, [
      `Correct: ${this.correctCount}`,
      `Needs review: ${this.wrongCount}`,
      `Accuracy: ${Math.round(accuracy * 100)}%`
    ].join("\n"), {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: `${uiFinish.body}px`,
      align: "center",
      color: "#244a69",
      lineSpacing: 10
    }).setOrigin(0.5);
    this.challengeLayer.add([card, title, stats]);

    if (pass) {
      this.progression.completeGate(this.gateId);
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
      this.player.gainXP(35);
      this.player.restoreLife(1);
    }

    this.eventsBus.emit("save:requested");

    const leftButton = this.createButton(450, 548, pass ? "Return to Map" : "Retry Gate", () => {
      if (pass) {
        this.scene.start("WorldMapScene");
      } else {
        this.scene.restart({ gateId: this.gateId });
      }
    }, pass ? 0xbeecc8 : 0xffd777);
    const rightButton = this.createButton(830, 548, "Gate Briefing", () => {
      this.scene.start("GateScene", { gateId: this.gateId });
    }, 0xeaf3ff);
    this.challengeLayer.add([leftButton, leftButton.label, rightButton, rightButton.label]);
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
        this.submitAnswer(nearest.door.answerIndex === this.currentQuestion.answer, {
          hint: this.currentQuestion.hint
        });
      } else {
        this.feedbackText.setText("Move closer to a door and press SPACE.");
      }
    }
  }
}