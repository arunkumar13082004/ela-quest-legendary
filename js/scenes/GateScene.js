import { GATE_META } from "../data/GateContent.js";

const GATE_COLORS = {
  1: { bg: 0x4caf7a, dark: 0x2d7a50, accent: 0x7de8a8, name: 'forest' },
  2: { bg: 0x4b8df8, dark: 0x2555c9, accent: 0x88b8ff, name: 'city'   },
  3: { bg: 0xf7934c, dark: 0xc05e1a, accent: 0xffbe88, name: 'arena'  },
  4: { bg: 0xb382f8, dark: 0x7a47cc, accent: 0xd8b4ff, name: 'kingdom'},
  5: { bg: 0xe06262, dark: 0xa83030, accent: 0xff9696, name: 'mountain'}
};

const GATE_STORIES = {
  1: 'A mist-covered forest where words hide in ancient trees. Use context clues to reveal their power!',
  2: 'A busy city full of mysteries. Find the main idea hidden among all the details!',
  3: 'An epic coliseum where language battles! Identify similes, metaphors, and idioms to win!',
  4: 'A grand kingdom where stories come to life. Arrange events to unlock the kingdom\'s power!',
  5: 'A towering mountain of evidence. Quote the right proof to climb to the top!'
};

export default class GateScene extends Phaser.Scene {
  constructor() {
    super({ key: "GateScene" });
  }

  init(data) {
    this.gateId = data.gateId || 1;
  }

  create() {
    this.sys$ = (this.game?.config?.custom?.systems) || window.elaSystems;
    if (!this.sys$) {
      console.error("GateScene: systems not found.");
      this.sys$ = { audio: { attach:()=>{}, playMusic:()=>{}, playSfx:()=>{} }, animation: { float:()=>{}, pulse:()=>{}, sparkBurst:()=>{} }, events: new Phaser.Events.EventEmitter() };
    }

    const { audio, animation, events } = this.sys$;
    const gate  = GATE_META[this.gateId];
    const theme = GATE_COLORS[this.gateId];
    const W = this.scale.width, H = this.scale.height;

    audio.attach(this);
    audio.playMusic('bgm_gate', 0.25);

    // ── BACKGROUND ─────────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(theme.accent, theme.accent, 0xffffff, 0xffffff, 0.6);
    bg.fillRect(0, 0, W, H);
    this.add.tileSprite(640, 360, 1280, 720, `tile-${theme.name}`).setAlpha(0.3);

    // Decorative circles in corners
    const deco = this.add.graphics();
    deco.fillStyle(theme.bg, 0.18);
    deco.fillCircle(0, 0, 220);
    deco.fillCircle(W, H, 220);
    deco.fillStyle(theme.bg, 0.1);
    deco.fillCircle(W, 0, 160);
    deco.fillCircle(0, H, 160);

    // ── MAIN CARD ──────────────────────────────────────────────────────────────
    const cardG = this.add.graphics().setDepth(3);
    cardG.fillStyle(0xfffdf5, 1);
    cardG.lineStyle(5, theme.bg, 1);
    cardG.fillRoundedRect(W / 2 - 510, 100, 1020, 500, 28);
    cardG.strokeRoundedRect(W / 2 - 510, 100, 1020, 500, 28);

    // Colored header band
    const headerG = this.add.graphics().setDepth(4);
    headerG.fillStyle(theme.bg, 1);
    headerG.fillRoundedRect(W / 2 - 510, 100, 1020, 76, { tl: 28, tr: 28, bl: 0, br: 0 });

    // Gate icon circle
    headerG.fillStyle(0xffffff, 0.25);
    headerG.fillCircle(W / 2 - 420, 138, 30);
    this.add.text(W / 2 - 420, 138, ['📖','🔍','🎭','📚','🧩'][this.gateId - 1], { fontSize: '28px' }).setOrigin(0.5).setDepth(5);

    // Gate title in header
    this.add.text(W / 2 + 10, 138, `Gate ${gate.id}: ${gate.name}`, {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '32px',
      color: '#ffffff', stroke: theme.dark, strokeThickness: 4
    }).setOrigin(0.5).setDepth(5);

    // Standard badge
    const badgeG = this.add.graphics().setDepth(4);
    badgeG.fillStyle(theme.dark, 0.9);
    badgeG.fillRoundedRect(W / 2 - 200, 192, 400, 28, 8);
    this.add.text(W / 2, 206, gate.standard, {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(5);

    // Summary
    this.add.text(W / 2, 258, gate.summary, {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '22px',
      color: '#1a3a58', align: 'center', wordWrap: { width: 900 }
    }).setOrigin(0.5).setDepth(5);

    // Story
    this.add.text(W / 2, 326, GATE_STORIES[this.gateId], {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '22px',
      color: '#2a4a6a', align: 'center',
      wordWrap: { width: 880 }, lineSpacing: 4
    }).setOrigin(0.5).setDepth(5);

    // Guardian info
    const guardG = this.add.graphics().setDepth(4);
    guardG.fillStyle(theme.bg, 0.15);
    guardG.fillRoundedRect(W / 2 - 320, 390, 640, 42, 12);
    this.add.text(W / 2, 411, `⚔️  Guardian: ${gate.guardian}`, {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '22px',
      color: theme.dark > 0x555555 ? '#2a1a00' : '#1a2a5a'
    }).setOrigin(0.5).setDepth(5);

    // Gate sprite
    const gateSprite = this.add.image(W / 2, 518, 'gate-open').setScale(1.2).setTint(theme.bg).setDepth(4);
    animation.float(this, gateSprite, 10, 1200);
    animation.pulse(this, gateSprite, 1.3, 600);

    this.time.delayedCall(300, () => {
      audio.playSfx('sfx_gate_open', 0.45);
      animation.sparkBurst(this, W / 2, 518, theme.bg, 24);
    });

    // ── BUTTONS ────────────────────────────────────────────────────────────────
    this._makeBtn(W / 2 - 240, 648, '🚀  Start Mission', () => {
      audio.playSfx('sfx_magic', 0.42);
      this.scene.start('MiniGameScene', { gateId: this.gateId });
    }, theme.bg, theme.dark);

    this._makeBtn(W / 2 + 240, 648, '🗺️  World Map', () => {
      events.emit('ui:message', 'Back to Lexoria!');
      this.scene.start('WorldMapScene');
    }, 0xddeeff, 0x5599cc);
  }

  _makeBtn(x, y, label, onClick, fill, dark) {
    // Container centred on (x,y) — scale always pivots from centre
    const ctn = this.add.container(x, y).setDepth(8);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.18);
    shadow.fillRoundedRect(-222, -30 + 5, 444, 60, 18);
    ctn.add(shadow);

    const bg = this.add.graphics();
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-222, -30, 444, 60, 18);
    // Shine strip
    bg.fillStyle(0xffffff, 0.22);
    bg.fillRoundedRect(-218, -26, 436, 24, { tl: 16, tr: 16, bl: 0, br: 0 });
    bg.lineStyle(3, dark, 1);
    bg.strokeRoundedRect(-222, -30, 444, 60, 18);
    ctn.add(bg);

    const txt = this.add.text(0, 0, label, {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '26px',
      color: fill > 0xaaaaaa ? '#1a3a58' : '#ffffff',
      fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5);
    ctn.add(txt);

    // Invisible hit rect
    const hit = this.add.rectangle(0, 0, 444, 60, 0, 0).setInteractive({ useHandCursor: true });
    ctn.add(hit);

    hit.on('pointerover', () => {
      this.tweens.killTweensOf(ctn);
      this.tweens.add({ targets: ctn, scaleX: 1.05, scaleY: 1.05, y: y - 4, duration: 110, ease: 'Back.easeOut' });
    });
    hit.on('pointerout', () => {
      this.tweens.killTweensOf(ctn);
      this.tweens.add({ targets: ctn, scaleX: 1, scaleY: 1, y, duration: 110, ease: 'Sine.easeOut' });
    });
    hit.on('pointerdown', () => {
      this.tweens.killTweensOf(ctn);
      this.tweens.add({ targets: ctn, scaleX: 0.95, scaleY: 0.95, duration: 70, yoyo: true,
        onComplete: () => onClick() });
    });
  }
}
