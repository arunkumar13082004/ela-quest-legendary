import { GATE_META } from "../data/GateContent.js";

const GATE_COLORS = {
  1: { bg: 0x4caf7a, dark: 0x2d7a50, light: 0xe8f9f0, accent: 0xc2f0d8, name: 'forest'   },
  2: { bg: 0x4b8df8, dark: 0x2555c9, light: 0xe8f0ff, accent: 0xc5daff, name: 'city'      },
  3: { bg: 0xf7934c, dark: 0xc05e1a, light: 0xfff0e6, accent: 0xffd4b0, name: 'arena'     },
  4: { bg: 0xb382f8, dark: 0x7a47cc, light: 0xf3eeff, accent: 0xdecfff, name: 'kingdom'   },
  5: { bg: 0xe06262, dark: 0xa83030, light: 0xffeaea, accent: 0xffc4c4, name: 'mountain'  }
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

    // Hide the UI overlay at gate entry, so home/overview are not shown here.
    events.emit('ui:toggle', false);
    const theme = GATE_COLORS[this.gateId];
    const W = this.scale.width, H = this.scale.height;

    audio.attach(this);
    audio.playMusic('bgm_gate', 0.25);

    // ── LIGHT BACKGROUND ───────────────────────────────────────────────────────
    const bgG = this.add.graphics();
    bgG.fillGradientStyle(theme.light, theme.light, 0xffffff, 0xffffff, 1);
    bgG.fillRect(0, 0, W, H);
    this.add.tileSprite(640, 360, 1280, 720, `tile-${theme.name}`).setAlpha(0.05);
    const deco = this.add.graphics();
    deco.fillStyle(theme.bg, 0.07);
    deco.fillCircle(W + 60, -60, 280);
    deco.fillCircle(-60, H + 60, 220);

    // ── BACK BUTTON (top-left, sits over card) ────────────────────────────────
    const backG = this.add.graphics().setDepth(10);
    backG.fillStyle(0x1a4a6e, 0.95);
    backG.lineStyle(2, 0xffffff, 0.7);
    backG.fillRoundedRect(14, 14, 148, 40, 12);
    backG.strokeRoundedRect(14, 14, 148, 40, 12);
    this.add.text(28, 34, '←', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0, 0.5).setDepth(11);
    this.add.text(50, 34, 'World Map', {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '14px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(11);
    const backHit = this.add.rectangle(88, 34, 148, 40, 0, 0)
      .setDepth(12).setInteractive({ useHandCursor: true });
    backHit.on('pointerover', () => {
      backG.clear();
      backG.fillStyle(0x2a6a94, 0.95);
      backG.lineStyle(2, 0xffffff, 0.9);
      backG.fillRoundedRect(14, 14, 148, 40, 12);
      backG.strokeRoundedRect(14, 14, 148, 40, 12);
    });
    backHit.on('pointerout', () => {
      backG.clear();
      backG.fillStyle(0x1a4a6e, 0.95);
      backG.lineStyle(2, 0xffffff, 0.7);
      backG.fillRoundedRect(14, 14, 148, 40, 12);
      backG.strokeRoundedRect(14, 14, 148, 40, 12);
    });
    backHit.on('pointerdown', () => this.scene.start('WorldMapScene'));

    // ── CARD ──────────────────────────────────────────────────────────────────
    const CX   = W / 2;
    const C_T  = 70;
    const CW   = 980;
    const CH   = 540;
    const HDR  = 66;

    const cardG = this.add.graphics().setDepth(3);
    cardG.fillStyle(0xffffff, 1);
    cardG.lineStyle(2, theme.accent, 1);
    cardG.fillRoundedRect(CX - CW/2, C_T, CW, CH, 22);
    cardG.strokeRoundedRect(CX - CW/2, C_T, CW, CH, 22);

    // Header band
    const hdrG = this.add.graphics().setDepth(4);
    hdrG.fillStyle(theme.bg, 1);
    hdrG.fillRoundedRect(CX - CW/2, C_T, CW, HDR, { tl:22, tr:22, bl:0, br:0 });
    hdrG.fillStyle(0xffffff, 0.18);
    hdrG.fillRoundedRect(CX - CW/2 + 4, C_T + 4, CW - 8, HDR/2 - 4, { tl:20, tr:20, bl:0, br:0 });

    this.add.text(CX - CW/2 + 38, C_T + HDR/2,
      ['📖','🔍','🎭','📚','🧩'][this.gateId - 1],
      { fontSize: '28px' }
    ).setOrigin(0.5).setDepth(5);

    this.add.text(CX + 18, C_T + HDR/2, `Gate ${gate.id}  —  ${gate.name}`, {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '26px',
      color: '#ffffff', fontStyle: 'bold',
      stroke: '#' + theme.dark.toString(16).padStart(6,'0'), strokeThickness: 3
    }).setOrigin(0.5).setDepth(5);

    const STD_Y = C_T + HDR + 18;
    const stdBg = this.add.graphics().setDepth(4);
    stdBg.fillStyle(theme.bg, 0.13);
    stdBg.lineStyle(1, theme.bg, 0.4);
    stdBg.fillRoundedRect(CX - 190, STD_Y, 380, 32, 8);
    stdBg.strokeRoundedRect(CX - 190, STD_Y, 380, 32, 8);
    this.add.text(CX, STD_Y + 16, gate.standard, {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '13px',
      color: '#' + theme.dark.toString(16).padStart(6,'0'), fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5);

    const SUM_Y = STD_Y + 52;
    this.add.text(CX, SUM_Y, gate.summary, {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '18px',
      color: '#2a3a50', align: 'center', wordWrap: { width: CW - 80 }
    }).setOrigin(0.5, 0).setDepth(5);

    const STORY_Y = SUM_Y + 44;
    this.add.text(CX, STORY_Y, GATE_STORIES[this.gateId], {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '15px',
      color: '#4a6a88', align: 'center', fontStyle: 'italic',
      wordWrap: { width: CW - 100 }
    }).setOrigin(0.5, 0).setDepth(5);

    const skillItems = this._getGateSkills(this.gateId);
    const SKILL_Y = STORY_Y + 66;
    const tagBg = this.add.graphics().setDepth(4);
    const tagW = Math.min(210, (CW - 60) / skillItems.length - 14);
    const tagsTotal = skillItems.length * tagW + (skillItems.length - 1) * 14;
    const tagX0 = CX - tagsTotal / 2 + tagW / 2;
    skillItems.forEach((skill, i) => {
      const tx = tagX0 + i * (tagW + 14);
      tagBg.fillStyle(theme.bg, 0.11);
      tagBg.lineStyle(1.5, theme.bg, 0.4);
      tagBg.fillRoundedRect(tx - tagW/2, SKILL_Y - 16, tagW, 32, 9);
      tagBg.strokeRoundedRect(tx - tagW/2, SKILL_Y - 16, tagW, 32, 9);
      this.add.text(tx, SKILL_Y, skill, {
        fontFamily: '"Nunito", Arial, sans-serif', fontSize: '13px',
        color: '#' + theme.dark.toString(16).padStart(6,'0'), fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(5);
    });

    const RWD_Y = SKILL_Y + 38;
    const rwdG = this.add.graphics().setDepth(4);
    rwdG.fillStyle(0xfff8e8, 1);
    rwdG.lineStyle(1.5, 0xf0b840, 0.65);
    rwdG.fillRoundedRect(CX - 250, RWD_Y, 500, 32, 10);
    rwdG.strokeRoundedRect(CX - 250, RWD_Y, 500, 32, 10);
    this.add.text(CX, RWD_Y + 16, '⭐  Pass 60%+ to restore a Knowledge Crystal  💎', {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '13px', color: '#7a4800'
    }).setOrigin(0.5).setDepth(5);

    // ── START MISSION button (centred at bottom of card) ──────────────────────
    const BTN_W = 340;
    const BTN_H = 52;
    const BTN_Y = C_T + CH - 56;

    this._makeBtn(CX, BTN_Y, BTN_W, BTN_H, '🚀  Start Mission', () => {
      audio.playSfx('sfx_magic', 0.42);
      this.scene.start('MiniGameScene', { gateId: this.gateId });
    }, theme.bg, theme.dark);
  }

  _getGateSkills(gateId) {
    const skills = {
      1: ['Context Clues', 'Word Meaning', 'Sentence Inference'],
      2: ['Main Idea', 'Supporting Details', 'Summarising'],
      3: ['Simile & Metaphor', 'Idiom & Hyperbole', 'Personification'],
      4: ['Story Sequence', 'Cause & Effect', 'Story Structure'],
      5: ['Text Evidence', 'Quoting Sources', 'Claim Support']
    };
    return skills[gateId] || skills[1];
  }

  _makeBtn(x, y, width, height, label, onClick, fill, dark) {
    const ctn = this.add.container(x, y).setDepth(8);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.18);
    shadow.fillRoundedRect(-width/2, -height/2 + 4, width, height, 16);
    ctn.add(shadow);
    const bg = this.add.graphics();
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 16);
    bg.fillStyle(0xffffff, 0.22);
    bg.fillRoundedRect(-width/2 + 6, -height/2 + 6, width - 12, Math.max(18, height*0.35), { tl: 12, tr: 12, bl: 0, br: 0 });
    bg.lineStyle(3, dark, 1);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 16);
    ctn.add(bg);
    const txt = this.add.text(0, 0, label, {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '22px',
      color: fill > 0xaaaaaa ? '#1a3a58' : '#ffffff',
      fontStyle: 'bold', align: 'center', wordWrap: { width: width - 28 }
    }).setOrigin(0.5);
    ctn.add(txt);
    const hit = this.add.rectangle(0, 0, width, height, 0, 0).setInteractive({ useHandCursor: true });
    ctn.add(hit);
    hit.on('pointerover', () => {
      this.tweens.killTweensOf(ctn);
      this.tweens.add({ targets: ctn, scaleX: 1.05, scaleY: 1.05, y: y - 3, duration: 100, ease: 'Back.easeOut' });
    });
    hit.on('pointerout', () => {
      this.tweens.killTweensOf(ctn);
      this.tweens.add({ targets: ctn, scaleX: 1, scaleY: 1, y, duration: 100, ease: 'Sine.easeOut' });
    });
    hit.on('pointerdown', () => {
      this.tweens.killTweensOf(ctn);
      this.tweens.add({ targets: ctn, scaleX: 0.96, scaleY: 0.96, duration: 70, yoyo: true,
        onComplete: () => onClick() });
    });
  }
}