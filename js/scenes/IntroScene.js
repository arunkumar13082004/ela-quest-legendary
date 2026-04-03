import { GATE_META } from "../data/GateContent.js";

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: "IntroScene" });
  }

  create() {
    const systems =
      (this.game?.config?.custom?.systems) || window.elaSystems;
    if (!systems) { console.error("IntroScene: systems not found."); return; }
    systems.audio.attach(this);
    systems.audio.stopMusic();
    systems.events.emit("ui:toggle", false);

    const W = this.scale.width;   // 1280
    const H = this.scale.height;  // 720

    // ── Layout constants ───────────────────────────────────────────────────────
    const CARD_X   = W / 2 - 480;
    const CARD_Y   = 185;
    const CARD_W   = 960;
    const CARD_H   = 490;
    const BANNER_H = 54;
    const STORY_Y0 = 268;
    const STORY_GAP= 44;
    const BTN1_Y   = 490;
    const BTN2_Y   = 580;
    const BTN_W    = 840;
    const BTN_H    = 70;
    const BADGE_Y  = H - 48;

    // ── BACKGROUND — light pastel sky ─────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xd0eeff, 0xd0eeff, 0xf0f8ff, 0xf0f8ff, 1);
    bg.fillRect(0, 0, W, H);

    // Light green hills
    const hills = this.add.graphics();
    hills.fillStyle(0x8ed48a, 1);
    hills.fillEllipse(200, H + 28, 560, 180);
    hills.fillEllipse(660, H + 18, 680, 200);
    hills.fillEllipse(1100, H + 38, 520, 175);
    hills.fillStyle(0x74c470, 1);
    hills.fillEllipse(420, H + 50, 480, 160);
    hills.fillEllipse(900, H + 32, 580, 175);

    // ── CLOUDS (white, soft) ───────────────────────────────────────────────────
    this._spawnClouds(W, H);

    // ── 5 gentle stars floating above card ────────────────────────────────────
    ['⭐','✨','⭐','✨','🌟'].forEach((em, i) => {
      const ex = 100 + i * 270 + Phaser.Math.Between(-30, 30);
      const ey = Phaser.Math.Between(20, 155);
      const t  = this.add.text(ex, ey, em, {
        fontSize: `${Phaser.Math.Between(18, 26)}px`
      }).setAlpha(Phaser.Math.FloatBetween(0.35, 0.6)).setDepth(1);
      this.tweens.add({ targets: t, y: t.y - 10, duration: 2800 + i * 400,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 350 });
    });

    // ── HERO MASCOT ───────────────────────────────────────────────────────────
    this._drawMascot(108, CARD_Y + CARD_H / 2 - 20);

    // ── TITLE — dark navy, white stroke, readable ─────────────────────────────
    const title = this.add.text(W / 2, 44, 'ELA QUEST', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '70px', color: '#1a3a6e',
      stroke: '#ffffff', strokeThickness: 8, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: title, y: 49, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // ── SUBTITLE — orange, readable ────────────────────────────────────────────
    this.add.text(W / 2, 124, '⚔️  Legendary Adventure  ⚔️', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '30px', color: '#7a5a30',
      stroke: '#ffffff', strokeThickness: 4
    }).setOrigin(0.5).setDepth(10);

    // ── CARD — clean white/cream ──────────────────────────────────────────────
    const cardG = this.add.graphics().setDepth(4);
    cardG.fillStyle(0xffffff, 1);
    cardG.lineStyle(4, 0xe8d0a0, 1);
    cardG.fillRoundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, 28);
    cardG.strokeRoundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, 28);

    // Orange header banner
    const bannerG = this.add.graphics().setDepth(5);
    bannerG.fillStyle(0xf4a44a, 1);
    bannerG.fillRoundedRect(CARD_X, CARD_Y, CARD_W, BANNER_H, { tl:28, tr:28, bl:0, br:0 });

    this.add.text(W / 2, CARD_Y + BANNER_H / 2, '🏰  YOUR QUEST AWAITS!  🏰', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '22px', color: '#ffffff', stroke: '#b06010', strokeThickness: 2
    }).setOrigin(0.5).setDepth(6);

    // ── STORY LINES ───────────────────────────────────────────────────────────
    const lines = [
      { text: '😈  The Grammar Goblin stole the',             big: false },
      { text: '✨  FIVE KNOWLEDGE CRYSTALS!  ✨',             big: true  },
      { text: '🗺️   Journey through 5 magical worlds & solve puzzles!', big: false },
      { text: '🏆  Restore the power of language!',           big: false }
    ];
    lines.forEach((line, i) => {
      this.add.text(W / 2, STORY_Y0 + i * STORY_GAP, line.text, {
        fontFamily: line.big ? '"Baloo 2", Arial, sans-serif' : '"Nunito", Arial, sans-serif',
        fontSize:   line.big ? '28px' : '22px',
        color:      line.big ? '#d44000' : '#222222',
        stroke:     line.big ? '#ffe0a0' : undefined,
        strokeThickness: line.big ? 2 : 0,
        fontStyle:  line.big ? 'bold' : 'normal',
        align: 'center'
      }).setOrigin(0.5).setDepth(6);
    });

    // ── BUTTONS ───────────────────────────────────────────────────────────────
    const hasProgress = systems.progress.getCompletedCount() > 0 || systems.player.state.level > 1;

    this._makeButton(W/2, BTN1_Y,
      hasProgress ? '🚀  Continue Adventure' : '🚀  Begin Adventure!',
      BTN_W, BTN_H, 0x7bbfa0, 0x5a9e82, '#1a3a2a',
      () => {
        this._burst(W/2, BTN1_Y);
        systems.events.emit('ui:toggle', true);
        this.scene.start('WorldMapScene');
      }
    );

    this._makeButton(W/2, BTN2_Y, '🔄  New Game',
      BTN_W, BTN_H, 0x7aaccc, 0x4e8aaa, '#1a2e3a',
      () => {
        this._burst(W/2, BTN2_Y);
        systems.progress.resetCampaign();
        systems.player.hydrate();
        systems.difficulty.hydrate();
        systems.events.emit('save:requested');
        systems.events.emit('ui:toggle', true);
        this.scene.start('WorldMapScene');
      }
    );

    // ── SUBJECT BADGES — clickable, open study notes ──────────────────────────
    const subjects = [
      { label: '📖 Vocab',       fill: 0xd4f5e5, border: 0x4caf7a, text: '#1a5c38' },
      { label: '🔍 Main Idea',   fill: 0xcfe4ff, border: 0x4b8df8, text: '#1a3a78' },
      { label: '🎭 Figurative',  fill: 0xffe4cf, border: 0xf7934c, text: '#7a3810' },
      { label: '📚 Story Order', fill: 0xeaddff, border: 0x9b72f0, text: '#3c1878' },
      { label: '🧩 Evidence',    fill: 0xffd5d5, border: 0xe06262, text: '#7a1818' }
    ];
    const BW = 218, BH = 46;
    const bStartX = W / 2 - (BW * 5) / 2 + BW / 2;

    subjects.forEach((s, i) => {
      const bx  = bStartX + i * BW;
      const ctn = this.add.container(bx, BADGE_Y + BH / 2).setDepth(8);

      const bg2 = this.add.graphics();
      bg2.fillStyle(s.fill, 1);
      bg2.lineStyle(2.5, s.border, 1);
      bg2.fillRoundedRect(-BW/2 + 5, -BH/2, BW - 10, BH, 22);
      bg2.strokeRoundedRect(-BW/2 + 5, -BH/2, BW - 10, BH, 22);
      ctn.add(bg2);

      const lbl = this.add.text(0, 1, s.label, {
        fontFamily: '"Nunito", Arial, sans-serif',
        fontSize: '17px', color: s.text, fontStyle: 'bold'
      }).setOrigin(0.5);
      ctn.add(lbl);

      const hint = this.add.text(0, BH / 2 + 11, '📋 tap for notes', {
        fontFamily: '"Nunito", Arial, sans-serif',
        fontSize: '11px', color: s.text
      }).setOrigin(0.5).setAlpha(0);
      ctn.add(hint);

      const hit = this.add.rectangle(0, 0, BW - 10, BH, 0, 0)
        .setInteractive({ useHandCursor: true });
      ctn.add(hit);

      hit.on('pointerover', () => {
        this.tweens.add({ targets: ctn, scaleX: 1.08, scaleY: 1.08, duration: 110, ease: 'Back.easeOut' });
        this.tweens.add({ targets: hint, alpha: 1, duration: 140 });
        bg2.clear();
        bg2.fillStyle(s.fill, 1);
        bg2.lineStyle(3, s.border, 1);
        bg2.fillRoundedRect(-BW/2 + 5, -BH/2, BW - 10, BH, 22);
        bg2.strokeRoundedRect(-BW/2 + 5, -BH/2, BW - 10, BH, 22);
        bg2.fillStyle(s.border, 0.10);
        bg2.fillRoundedRect(-BW/2 + 5, -BH/2, BW - 10, BH, 22);
      });
      hit.on('pointerout', () => {
        this.tweens.add({ targets: ctn, scaleX: 1, scaleY: 1, duration: 110 });
        this.tweens.add({ targets: hint, alpha: 0, duration: 140 });
        bg2.clear();
        bg2.fillStyle(s.fill, 1);
        bg2.lineStyle(2.5, s.border, 1);
        bg2.fillRoundedRect(-BW/2 + 5, -BH/2, BW - 10, BH, 22);
        bg2.strokeRoundedRect(-BW/2 + 5, -BH/2, BW - 10, BH, 22);
      });
      hit.on('pointerdown', () => {
        this.tweens.add({ targets: ctn, scaleX: 0.93, scaleY: 0.93, duration: 70, yoyo: true,
          onComplete: () => this._showNotes(i) });
      });

      this.time.addEvent({ delay: i * 120, callback: () => {
        this.tweens.add({ targets: ctn, y: BADGE_Y + BH / 2 - 6,
          duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }});
    });

    // Figurative sub-type strip
    this.add.text(W/2, BADGE_Y + BH + 22,
      'Simile · Metaphor · Idiom · Hyperbole · Personification · Onomatopoeia · Alliteration', {
      fontFamily: '"Nunito", Arial, sans-serif',
      fontSize: '12px', color: '#5a6a7a', align: 'center'
    }).setOrigin(0.5).setDepth(9);

    // ── Quick Notes tip line ──────────────────────────────────────────────────
    const tipBg = this.add.graphics().setDepth(9);
    tipBg.fillStyle(0xfffbe8, 1);
    tipBg.lineStyle(1.5, 0xf4c060, 0.8);
    tipBg.fillRoundedRect(W/2 - 380, BADGE_Y + BH + 42, 760, 28, 8);
    tipBg.strokeRoundedRect(W/2 - 380, BADGE_Y + BH + 42, 760, 28, 8);
    this.add.text(W/2, BADGE_Y + BH + 56,
      '📋 Tap any subject badge above to open Quick Notes and score better in that game!', {
      fontFamily: '"Nunito", Arial, sans-serif',
      fontSize: '13px', color: '#7a4c00', align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);

    // ── SOFT SPARKLES (Phaser 3.60+ particle API) ─────────────────────────────
    try {
      this.sparkEmitter = this.add.particles(W / 2, H * 0.2, 'star', {
        x: { min: -(W / 2 - 60), max: (W / 2 - 60) },
        y: { min: -H * 0.2, max: H * 0.15 },
        lifespan: { min: 6000, max: 11000 },
        speedY: { min: 5, max: 15 },
        speedX: { min: -6, max: 6 },
        scale: { start: 0.28, end: 0.02 },
        frequency: 700,
        alpha: { start: 0.65, end: 0 },
        tint: [0xffd080, 0xa8e0ff, 0xb0ffc0, 0xffccdd]
      }).setDepth(11);
    } catch (e) {
      // Particle texture not loaded or unsupported — silently skip
      this.sparkEmitter = null;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _spawnClouds(W, H) {
    for (let i = 0; i < 9; i++) {
      const cx = Phaser.Math.Between(60, W - 60);
      const cy = Phaser.Math.Between(8, 170);
      const sc = Phaser.Math.FloatBetween(0.9, 2.0);
      const g  = this.add.graphics().setDepth(2).setAlpha(Phaser.Math.FloatBetween(0.55, 0.85));
      g.fillStyle(0xffffff, 1);
      g.fillCircle(0, 0, 26 * sc);
      g.fillCircle(26 * sc, -7 * sc, 20 * sc);
      g.fillCircle(-26 * sc, -5 * sc, 16 * sc);
      g.fillCircle(48 * sc, 3 * sc, 14 * sc);
      g.x = cx; g.y = cy;
      this.tweens.add({ targets: g, x: cx + Phaser.Math.Between(-50, 50),
        duration: Phaser.Math.Between(7000, 16000),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 3000) });
    }
  }

  _drawMascot(cx, cy) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0xee3030, 1);
    g.fillTriangle(cx - 42, cy + 5, cx + 42, cy + 5, cx, cy + 82);
    g.fillStyle(0x3a8fff, 1);
    g.fillCircle(cx, cy + 26, 46);
    g.fillStyle(0xffd8a0, 1);
    g.fillCircle(cx, cy - 28, 40);
    g.fillStyle(0xff6b00, 1);
    g.fillRoundedRect(cx - 34, cy - 72, 68, 28, 9);
    g.fillStyle(0xffaa00, 1);
    g.fillRect(cx - 28, cy - 68, 56, 7);
    g.fillStyle(0x1a2a40, 1);
    g.fillCircle(cx - 13, cy - 31, 7);
    g.fillCircle(cx + 13, cy - 31, 7);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 11, cy - 33, 2.5);
    g.fillCircle(cx + 15, cy - 33, 2.5);
    g.lineStyle(3, 0xcc5010, 1);
    g.beginPath();
    g.arc(cx, cy - 18, 13, 0.25, Math.PI - 0.25);
    g.strokePath();
    g.fillStyle(0xffaaaa, 0.45);
    g.fillCircle(cx - 25, cy - 18, 8);
    g.fillCircle(cx + 25, cy - 18, 8);
    this.add.text(cx, cy + 24, '⭐', { fontSize: '30px' }).setOrigin(0.5).setDepth(4);
    this.tweens.add({ targets: g, y: -10, duration: 880, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  _makeButton(x, y, label, bw, bh, fill, glow, textColor, onClick) {
    const shadow = this.add.graphics().setDepth(9);
    shadow.fillStyle(0x000000, 0.12);
    shadow.fillRoundedRect(x - bw/2 + 4, y - bh/2 + 5, bw, bh, 26);

    const bg = this.add.graphics().setDepth(10);
    const draw = (sc = 1) => {
      bg.clear();
      const w = bw * sc, h = bh * sc;
      bg.fillStyle(fill, 1);
      bg.fillRoundedRect(x - w/2, y - h/2, w, h, 26 * sc);
      bg.fillStyle(0xffffff, 0.18);
      bg.fillRoundedRect(x - w/2 + 5, y - h/2 + 4, w - 10, h/2 - 4, { tl: 20*sc, tr: 20*sc, bl:0, br:0 });
      bg.lineStyle(3, glow, 1);
      bg.strokeRoundedRect(x - w/2, y - h/2, w, h, 26 * sc);
    };
    draw();

    const txt = this.add.text(x, y, label, {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '28px', color: textColor, fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5).setDepth(11);

    const hit = this.add.rectangle(x, y, bw, bh, 0, 0)
      .setDepth(12).setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => { draw(1.03); this.tweens.add({ targets: txt, scale: 1.04, duration: 90 }); });
    hit.on('pointerout',  () => { draw(1.0);  this.tweens.add({ targets: txt, scale: 1.0,  duration: 90 }); });
    hit.on('pointerdown', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 0.96, scaleY: 0.96, duration: 75, yoyo: true });
      onClick();
    });
  }

  _burst(x, y) {
    if (this.sparkEmitter) {
      try { this.sparkEmitter.emitParticleAt(x, y, 20); } catch(e) {}
    }
  }
  // ── STUDY NOTES PANEL ──────────────────────────────────────────────────────

  _showNotes(idx) {
    this._closeNotes();
    const W = this.scale.width, H = this.scale.height;
    const note = this._getNoteContent(idx);
    this._notesLayer = [];
    const store = (obj) => { this._notesLayer.push(obj); return obj; };

    // Dark backdrop — click outside to close
    const backdrop = store(this.add.graphics().setDepth(30));
    backdrop.fillStyle(0x000000, 0.72);
    backdrop.fillRect(0, 0, W, H);
    const backdropHit = store(this.add.rectangle(W/2, H/2, W, H, 0, 0).setDepth(31).setInteractive());
    backdropHit.on('pointerdown', () => this._closeNotes());

    // Card dimensions
    const CX = W / 2, CY = H / 2;
    const CW = 980,   CH = 520;
    const HDR = 62;

    // Card body
    const cardG = store(this.add.graphics().setDepth(32));
    cardG.fillStyle(0xfffef8, 1);
    cardG.lineStyle(4, note.border, 1);
    cardG.fillRoundedRect(CX-CW/2, CY-CH/2, CW, CH, 24);
    cardG.strokeRoundedRect(CX-CW/2, CY-CH/2, CW, CH, 24);

    // Coloured header band
    const headerG = store(this.add.graphics().setDepth(33));
    headerG.fillStyle(note.border, 1);
    headerG.fillRoundedRect(CX-CW/2, CY-CH/2, CW, HDR, { tl:24, tr:24, bl:0, br:0 });

    // Title
    store(this.add.text(CX - 60, CY - CH/2 + HDR/2, note.title, {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '26px', color: '#ffffff',
      stroke: '#00000033', strokeThickness: 3
    }).setOrigin(0.5).setDepth(34));

    // Standard badge (top-right of header)
    const tagG = store(this.add.graphics().setDepth(33));
    tagG.fillStyle(0xffffff, 0.22);
    tagG.fillRoundedRect(CX + CW/2 - 290, CY - CH/2 + 14, 272, 34, 10);
    store(this.add.text(CX + CW/2 - 154, CY - CH/2 + 31, note.standard, {
      fontFamily: '"Nunito", Arial, sans-serif',
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(34));

    // Vertical divider between columns
    const divG = store(this.add.graphics().setDepth(33));
    divG.lineStyle(1.5, note.border, 0.28);
    divG.beginPath();
    divG.moveTo(CX + 4, CY - CH/2 + HDR + 10);
    divG.lineTo(CX + 4, CY + CH/2 - 14);
    divG.strokePath();

    // Text layout constants
    const COL1_X = CX - CW/2 + 46;
    const COL2_X = CX + 18;
    const ROW_Y0  = CY - CH/2 + HDR + 18;
    const ROW_GAP = 28;
    const COL_W   = CW/2 - 58;

    const renderCol = (lines, startX) => {
      lines.forEach((line, i) => {
        if (!line) return; // skip truly empty strings (gap)
        const isHeader = line.startsWith('◉');
        const isTip    = line.startsWith('💡');
        store(this.add.text(startX, ROW_Y0 + i * ROW_GAP, line, {
          fontFamily: isHeader || isTip ? '"Baloo 2", Arial, sans-serif' : '"Nunito", Arial, sans-serif',
          fontSize: isHeader ? '16px' : isTip ? '15px' : '14.5px',
          color: isHeader ? '#1e2060' : isTip ? '#7a3a00' : '#3a3a3a',
          fontStyle: isHeader ? 'bold' : 'normal',
          wordWrap: { width: COL_W }
        }).setDepth(35));
      });
    };

    renderCol(note.col1, COL1_X);
    renderCol(note.col2, COL2_X);

    // ── Close button ─────────────────────────────────────────────────────────
    const closeBg = store(this.add.graphics().setDepth(36));
    const closeX = CX + CW/2 - 24, closeY = CY - CH/2 + 24;
    const drawClose = (color) => {
      closeBg.clear();
      closeBg.fillStyle(color, 1);
      closeBg.fillCircle(closeX, closeY, 20);
    };
    drawClose(0xee4444);

    store(this.add.text(closeX, closeY, '✕', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '19px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(37));

    const closeHit = store(this.add.circle(closeX, closeY, 22, 0, 0).setDepth(38).setInteractive({ useHandCursor: true }));
    closeHit.on('pointerover',  () => drawClose(0xcc2222));
    closeHit.on('pointerout',   () => drawClose(0xee4444));
    closeHit.on('pointerdown',  () => this._closeNotes());

    // Keyboard ESC to close
    if (!this._escKey) {
      this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }
    this._escKey.once('down', () => this._closeNotes());

    // Entry fade-in
    const fadeObjs = this._notesLayer.filter(o => o && typeof o.setAlpha === 'function');
    fadeObjs.forEach(o => { try { o.setAlpha(0); } catch(e){} });
    this.tweens.add({ targets: fadeObjs, alpha: 1, duration: 200, ease: 'Sine.easeOut' });
  }

  _closeNotes() {
    if (!this._notesLayer || !this._notesLayer.length) return;
    const layer = this._notesLayer;
    this._notesLayer = [];
    const fadeObjs = layer.filter(o => o && typeof o.setAlpha === 'function');
    this.tweens.add({
      targets: fadeObjs, alpha: 0, duration: 150,
      onComplete: () => layer.forEach(o => { try { o.destroy(); } catch(e){} })
    });
  }

  _getNoteContent(idx) {
    const NOTES = [
      // ── 0  VOCABULARY ────────────────────────────────────────────────────────
      {
        title: '📖  Vocabulary — Context Clues',
        standard: 'CCSS.ELA-LITERACY.L.5.4',
        border: 0x4caf7a,
        col1: [
          '◉ What Are Context Clues?',
          '  Words near an unknown word that',
          '  hint at its meaning.',
          '',
          '◉ 4 Types of Context Clues',
          '  📌 Definition — meaning stated nearby',
          '  📌 Example — examples show the word',
          '  📌 Contrast — an opposite gives a hint',
          '  📌 Inference — combine clues to guess',
          '',
          '◉ 3-Step Strategy',
          '  1️⃣  Read the whole sentence',
          '  2️⃣  Spot the unknown word',
          '  3️⃣  Look for hints around it',
          '💡 Ask: "What does the sentence tell',
          '   me about this word?"',
        ],
        col2: [
          '◉ Word Bank from the Quest',
          '  exhausted — very tired',
          '  delicate — easy to break',
          '  murmured — spoke quietly',
          '  hesitated — paused in uncertainty',
          '  meticulous — very careful',
          '  reluctant — unwilling to do it',
          '  punctual — arriving on time',
          '  vivid — clear and bright',
          '  persist — continue despite difficulty',
          '  illuminate — to light up',
          '  efficient — working well, no waste',
          '  navigate — to find one\'s way',
          '  verify — to check for truth',
          '  justify — to give a good reason for',
        ]
      },

      // ── 1  MAIN IDEA ─────────────────────────────────────────────────────────
      {
        title: '🔍  Main Idea & Supporting Details',
        standard: 'CCSS.ELA-LITERACY.RI.5.2',
        border: 0x4b8df8,
        col1: [
          '◉ Main Idea',
          '  The BIGGEST point a passage makes.',
          '  Ask: "What is this mostly about?"',
          '',
          '◉ Supporting Details',
          '  Facts, examples, or reasons that',
          '  PROVE the main idea.',
          '',
          '◉ How to Find It',
          '  📌 Often in the first or last sentence',
          '  📌 Ask: "Do all details connect to it?"',
          '  📌 Details are too specific to be it',
          '',
          '◉ Signal Words',
          '  "mostly" · "mainly" · "above all"',
          '💡 "The most important" = main idea clue',
        ],
        col2: [
          '◉ The Umbrella Rule ☂️',
          '  Main idea = the umbrella',
          '  Details = everything sheltering under it',
          '',
          '◉ Topic vs. Main Idea',
          '  Topic = one word: "dolphins"',
          '  Main Idea = a full sentence:',
          '  "Dolphins use echolocation to hunt."',
          '',
          '◉ Common Traps',
          '  📌 Repeated detail ≠ main idea',
          '  📌 First sentence ≠ always main idea',
          '  📌 Check ALL details support your pick',
          '',
          '💡 If a detail feels too small',
          '   or specific → supporting detail!',
        ]
      },

      // ── 2  FIGURATIVE LANGUAGE ───────────────────────────────────────────────
      {
        title: '🎭  Figurative Language',
        standard: 'CCSS.ELA-LITERACY.L.5.5',
        border: 0xf7934c,
        col1: [
          '◉ Simile',
          '  Compares using "like" or "as"',
          '  → "fast AS lightning"',
          '',
          '◉ Metaphor',
          '  Direct comparison — no like/as',
          '  → "She IS a shining star"',
          '',
          '◉ Idiom',
          '  Phrase with a non-literal meaning',
          '  → "raining cats and dogs"',
          '',
          '◉ Hyperbole',
          '  Wild exaggeration for effect',
          '  → "I\'ve told you a million times!"',
        ],
        col2: [
          '◉ Personification',
          '  Human traits given to non-human',
          '  → "The wind whispered secrets"',
          '',
          '◉ Onomatopoeia',
          '  Word sounds like its meaning',
          '  → buzz · crash · sizzle · hiss',
          '',
          '◉ Alliteration',
          '  Repeated first consonant sounds',
          '  → "Peter Piper picked peppers"',
          '',
          '◉ Quick Test',
          '  📌 Literally true? → NO → Figurative!',
          '  📌 Uses like/as? → Simile!',
          '💡 Ask: "Could this really happen?"',
        ]
      },

      // ── 3  STORY ORDER ───────────────────────────────────────────────────────
      {
        title: '📚  Story Order & Sequence',
        standard: 'CCSS.ELA-LITERACY.RL.5.3',
        border: 0x9b72f0,
        col1: [
          '◉ What Is Sequence?',
          '  The ORDER events happen in a story.',
          '  Beginning → Middle → End',
          '',
          '◉ Signal Words',
          '  📌 First · Next · Then · After that',
          '  📌 Meanwhile · Later · Finally',
          '  📌 Before · During · Soon',
          '',
          '◉ Story Structure',
          '  Beginning — setting & the problem',
          '  Middle — events BUILD the problem',
          '  End — how the problem is SOLVED',
          '',
          '◉ Ordering Tip',
          '💡 Number events 1st, 2nd, 3rd...',
        ],
        col2: [
          '◉ Cause & Effect in Sequence',
          '  One event often CAUSES the next.',
          '  → "Rain fell → the river rose"',
          '',
          '◉ Watch for Flashbacks!',
          '  Stories can tell events OUT of order.',
          '  Look for: "Earlier that day..."',
          '',
          '◉ Story Elements to Track',
          '  📌 Characters — who is in the story',
          '  📌 Setting — when and where',
          '  📌 Problem — the main challenge',
          '  📌 Resolution — how it\'s solved',
          '',
          '💡 Ask: "What happened BECAUSE',
          '   of this event?"',
        ]
      },

      // ── 4  EVIDENCE ──────────────────────────────────────────────────────────
      {
        title: '🧩  Text Evidence',
        standard: 'CCSS.ELA-LITERACY.RI.5.1',
        border: 0xe06262,
        col1: [
          '◉ What Is Evidence?',
          '  Specific details or quotes from the',
          '  text that PROVE your answer.',
          '',
          '◉ Strong Evidence ✅',
          '  📌 Directly answers the question',
          '  📌 Comes straight from the text',
          '  📌 Uses the author\'s own words',
          '',
          '◉ Weak Evidence ❌',
          '  📌 Vague or off-topic',
          '  📌 Based on personal opinion',
          '',
          '◉ How to Cite',
          '  "According to the text..."',
          '  "The passage states..."',
        ],
        col2: [
          '◉ 4-Step Strategy',
          '  1️⃣  Read the question carefully',
          '  2️⃣  Find the KEY word in it',
          '  3️⃣  Search the text for that word',
          '  4️⃣  Pick evidence CLOSEST to it',
          '',
          '◉ Evidence vs. Opinion',
          '  Evidence — from the text ✅',
          '  Opinion — from your head ❌',
          '',
          '◉ Explaining Evidence',
          '  Don\'t just quote — EXPLAIN it!',
          '  Quote: "The ice was thin."',
          '  Explain: "This shows danger..."',
          '',
          '💡 Best = specific + relevant',
          '   + directly from the text',
        ]
      }
    ];
    return NOTES[Math.min(idx, NOTES.length - 1)];
  }

}