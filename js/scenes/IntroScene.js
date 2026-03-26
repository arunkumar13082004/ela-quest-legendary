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
    systems.audio.playMusic("bgm_world", 0.22);
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

    // ── SUBJECT BADGES ────────────────────────────────────────────────────────
    const subjects = [
      { label: '📖 Vocab',       color: 0x4caf7a },
      { label: '🔍 Main Idea',   color: 0x4b8df8 },
      { label: '🎭 Figurative',  color: 0xf7934c },
      { label: '📚 Story Order', color: 0x9b72f0 },
      { label: '🧩 Evidence',    color: 0xe06262 }
    ];
    const BW = 218, BH = 46;
    const bStartX = W / 2 - (BW * 5) / 2 + BW / 2;
    subjects.forEach((s, i) => {
      const bx = bStartX + i * BW;
      const bg2 = this.add.graphics().setDepth(8);
      bg2.fillStyle(s.color, 1);
      bg2.lineStyle(2, 0xffffff, 0.8);
      bg2.fillRoundedRect(bx - BW/2 + 5, BADGE_Y, BW - 10, BH, 22);
      bg2.strokeRoundedRect(bx - BW/2 + 5, BADGE_Y, BW - 10, BH, 22);
      this.add.text(bx, BADGE_Y + BH/2, s.label, {
        fontFamily: '"Nunito", Arial, sans-serif',
        fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(9);
      this.time.addEvent({ delay: i * 120, callback: () => {
        this.tweens.add({ targets: bg2, y: -5, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }});
    });

    // Figurative sub-type strip
    this.add.text(W/2, BADGE_Y + BH + 10,
      'Simile · Metaphor · Idiom · Hyperbole · Personification · Onomatopoeia · Alliteration', {
      fontFamily: '"Nunito", Arial, sans-serif',
      fontSize: '12px', color: '#5a6a7a', align: 'center'
    }).setOrigin(0.5).setDepth(9);

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
}
