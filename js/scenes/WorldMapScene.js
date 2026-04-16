import { GATE_META } from "../data/GateContent.js";

const WORLD_W = 2400;
const WORLD_H = 1400;

const GATE_POSITIONS = {
  1: { x: 380,  y: 920 },
  2: { x: 900,  y: 640 },
  3: { x: 1330, y: 460 },
  4: { x: 1770, y: 760 },
  5: { x: 2140, y: 360 }
};

const BOSS_POS = { x: 2260, y: 170 };
const MAP_PADDING = { left: 120, right: 80, top: 120, bottom: 140 };

const PATH_CTRL = [
  { ax: 380,  ay: 920,  cx: 620,  cy: 790,  bx: 900,  by: 640 },
  { ax: 900,  ay: 640,  cx: 1100, cy: 520,  bx: 1330, by: 460 },
  { ax: 1330, ay: 460,  cx: 1560, cy: 600,  bx: 1770, by: 760 },
  { ax: 1770, ay: 760,  cx: 1970, cy: 530,  bx: 2140, by: 360 },
  { ax: 2140, ay: 360,  cx: 2210, cy: 255,  bx: 2260, by: 170 }
];

const NODE_R    = 60;
const NODE_COLORS = {
  completed: { fill: 0xffd700, ring: 0xffaa00, text: '#3a2000' },
  unlocked:  { fill: 0xffffff, ring: 0x44ddff, text: '#1a3a58' },
  locked:    { fill: 0xb0bec5, ring: 0x78909c, text: '#445566' }
};

const GATE_THEME = [
  { main: 0x4caf7a, dark: 0x2d7a50, sky: 0x8effd0 },
  { main: 0x4b8df8, dark: 0x2555c9, sky: 0xa8c8ff },
  { main: 0xf7934c, dark: 0xc05e1a, sky: 0xffd4a0 },
  { main: 0xb382f8, dark: 0x7a47cc, sky: 0xddc8ff },
  { main: 0xe06262, dark: 0xa83030, sky: 0xffb8b8 }
];

const GATE_EMOJIS = ['📖', '🔍', '🎭', '📚', '🧩'];

export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: "WorldMapScene" });
  }

  create() {
    this.sys$ = (this.game?.config?.custom?.systems) || window.elaSystems;
    if (!this.sys$) {
      console.error("WorldMapScene: systems not found.");
      this.sys$ = { audio: { attach:()=>{}, playMusic:()=>{} }, events: new Phaser.Events.EventEmitter(), progression: { getCompletedCount:()=>0, isGateUnlocked:()=>false, isGateCompleted:()=>false, state:{bossUnlocked:false} } };
    }

    const { audio, events, progression } = this.sys$;
    audio.attach(this);
    audio.playMusic("bgm_world", 0.22);
    events.emit("ui:toggle", true);

    this._contentBounds = this._getContentBounds();
    this.physics.world.setBounds(
      this._contentBounds.x,
      this._contentBounds.y,
      this._contentBounds.width,
      this._contentBounds.height
    );
    this.cameras.main.setBounds(
      this._contentBounds.x,
      this._contentBounds.y,
      this._contentBounds.width,
      this._contentBounds.height
    );
    this.cameras.main.setBackgroundColor(0x7ecfff);
    this.cameras.main.setZoom(1);

    this._buildBackground();
    this._buildPath(progression);
    this._buildNodes(progression, events);
    this._buildDecorations();
    this._buildPlayer(progression);
    this._buildBossPortal(progression, events);

    const completed = progression.getCompletedCount();
    if (completed > 0) {
      events.emit("ui:message", `Welcome back! ${completed} crystal${completed > 1 ? 's' : ''} restored.`);
    } else {
      events.emit("ui:message", "Tap a glowing gate to enter!");
    }

    // Show instructions overlay on first visit
    if (!progression.state.shownInstructions) {
      this._showInstructions(progression);
    }

    // ── Map drag-to-scroll ────────────────────────────────────────────────────
    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      if (this._instructionsPanelOpen) return; // don't scroll while instructions are open
      const cam = this.cameras.main;
      const dx = (pointer.x - pointer.prevPosition.x) / cam.zoom;
      const dy = (pointer.y - pointer.prevPosition.y) / cam.zoom;
      cam.scrollX -= dx;
      cam.scrollY -= dy;
    });

    // Mouse-wheel / touchpad scroll
    this.input.on('wheel', (pointer, objs, deltaX, deltaY, deltaZ) => {
      if (this._instructionsPanelOpen) return;
      const cam = this.cameras.main;
      cam.scrollX += deltaX * 0.8;
      cam.scrollY += deltaY * 0.8;
    });

    // Arrow key scroll
    this._cursors = this.input.keyboard.createCursorKeys();

    this._overviewMode = false;
    this._onToggleOverview = () => this.toggleOverview();
    this._onRequestOverviewState = () => {
      events.emit('worldmap:overviewChanged', this._overviewMode);
    };
    events.on('worldmap:toggleOverview', this._onToggleOverview, this);
    events.on('worldmap:requestOverviewState', this._onRequestOverviewState, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this._cleanupWorldMapScene, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this._cleanupWorldMapScene, this);
  }

  toggleOverview() {
    this._overviewMode = !this._overviewMode;
    this.sys$.events.emit('worldmap:overviewChanged', this._overviewMode);

    if (this._overviewMode) {
      const viewportW = this.scale.width;
      const viewportH = this.scale.height - 70; // HUD height
      const bounds = this._contentBounds;
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      const zoomX = viewportW / bounds.width;
      const zoomY = viewportH / bounds.height;
      const zoom  = Math.min(zoomX, zoomY) * 0.97;

      this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
      this.cameras.main.pan(centerX, centerY, 400, 'Sine.easeInOut');
      this.cameras.main.zoomTo(zoom, 400, 'Sine.easeInOut');
    } else {
      const bounds = this._contentBounds;
      this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);

      const gateId = Math.min(this.sys$.progression?.state?.unlockedGate || 1, 5);
      const pos = { 1:{x:380,y:920},2:{x:900,y:640},3:{x:1330,y:460},4:{x:1770,y:760},5:{x:2140,y:360} };
      const p = pos[gateId] || pos[1];
      this.cameras.main.pan(p.x, p.y, 400, 'Sine.easeInOut');
      this.cameras.main.zoomTo(1, 400, 'Sine.easeInOut');
    }
  }

  _getContentBounds() {
    const points = [...Object.values(GATE_POSITIONS), BOSS_POS];
    const minX = Math.min(...points.map((p) => p.x)) - MAP_PADDING.left;
    const maxX = Math.max(...points.map((p) => p.x)) + MAP_PADDING.right;
    const minY = Math.min(...points.map((p) => p.y)) - MAP_PADDING.top;
    const maxY = Math.max(...points.map((p) => p.y)) + MAP_PADDING.bottom;

    return {
      x: Phaser.Math.Clamp(minX, 0, WORLD_W),
      y: Phaser.Math.Clamp(minY, 0, WORLD_H),
      width: Phaser.Math.Clamp(maxX, 0, WORLD_W) - Phaser.Math.Clamp(minX, 0, WORLD_W),
      height: Phaser.Math.Clamp(maxY, 0, WORLD_H) - Phaser.Math.Clamp(minY, 0, WORLD_H)
    };
  }

  _cleanupWorldMapScene() {
    if (!this.sys$?.events) return;
    const events = this.sys$.events;

    if (this._overviewMode) {
      this._overviewMode = false;
      events.emit('worldmap:overviewChanged', false);
    }

    if (this._onToggleOverview) {
      events.off('worldmap:toggleOverview', this._onToggleOverview, this);
      this._onToggleOverview = null;
    }

    if (this._onRequestOverviewState) {
      events.off('worldmap:requestOverviewState', this._onRequestOverviewState, this);
      this._onRequestOverviewState = null;
    }
  }

  update() {
    if (this._instructionsPanelOpen) return; // freeze keyboard scroll while open
    if (!this._cursors) return;
    const cam   = this.cameras.main;
    const speed = 8;
    if (this._cursors.left.isDown)  cam.scrollX -= speed;
    if (this._cursors.right.isDown) cam.scrollX += speed;
    if (this._cursors.up.isDown)    cam.scrollY -= speed;
    if (this._cursors.down.isDown)  cam.scrollY += speed;
  }

  // ── BACKGROUND ──────────────────────────────────────────────────────────────

  _buildBackground() {
    const sky = this.add.graphics().setDepth(0);
    sky.fillGradientStyle(0x87d8ff, 0x87d8ff, 0xc8f0ff, 0xc8f0ff, 1);
    sky.fillRect(0, 0, WORLD_W, 900);
    sky.fillGradientStyle(0x6bc878, 0x6bc878, 0x87d8ff, 0x87d8ff, 1);
    sky.fillRect(0, 700, WORLD_W, 200);
    sky.fillStyle(0x6bc878, 1);
    sky.fillRect(0, 900, WORLD_W, WORLD_H - 900);

    const terrain = this.add.graphics().setDepth(1);
    GATE_THEME.forEach((theme, i) => {
      const gid  = i + 1;
      const gpos = GATE_POSITIONS[gid];
      terrain.fillStyle(theme.main, 0.28);
      terrain.fillEllipse(gpos.x, gpos.y + 80, 620, 340);
      terrain.fillStyle(theme.dark, 0.14);
      terrain.fillEllipse(gpos.x, gpos.y + 140, 400, 200);
    });

    const ground = this.add.graphics().setDepth(1);
    ground.fillStyle(0x5cc870, 1);
    [200,700,1100,1500,1900,2300].forEach(x => {
      ground.fillEllipse(x, WORLD_H + 30, 700, 280);
    });
    ground.fillStyle(0x47a858, 1);
    [450,900,1300,1700,2100].forEach(x => {
      ground.fillEllipse(x, WORLD_H + 50, 500, 200);
    });
  }

  // ── PATH ────────────────────────────────────────────────────────────────────

  _buildPath(progression) {
    const unlocked = progression.state.unlockedGate || 1;
    this._pathSegments = PATH_CTRL.map((seg, i) => ({
      pts: this._sampleQuadBezier(
        {x: seg.ax, y: seg.ay},
        {x: seg.cx, y: seg.cy},
        {x: seg.bx, y: seg.by},
        40
      ),
      gateId: i + 1
    }));
    this._pathSegments.forEach(({ pts, gateId }) => {
      const isUnlocked = gateId < unlocked || (gateId === 5 && progression.state.bossUnlocked);
      this._drawPathSegment(pts, isUnlocked);
    });
  }

  _drawPathSegment(pts, isUnlocked) {
    const shadow = this.add.graphics().setDepth(4);
    shadow.lineStyle(28, 0x00000040, 0.3);
    shadow.beginPath();
    shadow.moveTo(pts[0].x + 3, pts[0].y + 5);
    pts.slice(1).forEach(p => shadow.lineTo(p.x + 3, p.y + 5));
    shadow.strokePath();

    const rope = this.add.graphics().setDepth(5);
    const ropeColor = isUnlocked ? 0xd4a04a : 0xa0a0a0;
    rope.lineStyle(22, ropeColor, 1);
    rope.beginPath();
    rope.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => rope.lineTo(p.x, p.y));
    rope.strokePath();

    const hi = this.add.graphics().setDepth(6);
    hi.lineStyle(8, isUnlocked ? 0xfcdf8a : 0xd0d0d0, 0.7);
    hi.beginPath();
    hi.moveTo(pts[0].x, pts[0].y - 4);
    pts.slice(1).forEach(p => hi.lineTo(p.x, p.y - 4));
    hi.strokePath();

    const dotG = this.add.graphics().setDepth(7);
    const dotColor = isUnlocked ? 0xfff3a0 : 0xdddddd;
    const dotPts = this._dotsAlongPath(pts, 55);
    dotPts.forEach(p => {
      dotG.fillStyle(dotColor, 0.9);
      dotG.fillCircle(p.x, p.y, 6);
      dotG.lineStyle(2, isUnlocked ? 0xd4a04a : 0x999999, 1);
      dotG.strokeCircle(p.x, p.y, 6);
    });
  }

  // ── NODES ───────────────────────────────────────────────────────────────────

  _buildNodes(progression, events) {
    this._nodeObjects = {};

    Object.values(GATE_META).forEach((gate) => {
      const pos       = GATE_POSITIONS[gate.id];
      const completed = progression.isGateCompleted(gate.id);
      const unlocked  = progression.isGateUnlocked(gate.id);
      const isCurrent = !completed && unlocked;
      const theme     = GATE_THEME[gate.id - 1];
      const emoji     = GATE_EMOJIS[gate.id - 1];

      const container = this.add.container(pos.x, pos.y).setDepth(8);

      const nodeG = this.add.graphics();
      nodeG.fillStyle(0x000000, 0.22);
      nodeG.fillCircle(4, 6, NODE_R + 6);

      if (isCurrent) {
        nodeG.fillStyle(0x44ddff, 0.5);
        nodeG.fillCircle(0, 0, NODE_R + 14);
      } else if (completed) {
        nodeG.fillStyle(0xffaa00, 0.4);
        nodeG.fillCircle(0, 0, NODE_R + 10);
      }

      const fillColor = completed ? 0xffd700 : (unlocked ? theme.main : 0x9db0bd);
      nodeG.fillStyle(fillColor, 1);
      nodeG.fillCircle(0, 0, NODE_R);
      nodeG.fillStyle(0xffffff, 0.3);
      nodeG.fillCircle(-14, -14, NODE_R * 0.45);
      const ringColor = completed ? 0xffaa00 : (unlocked ? theme.dark : 0x5f7585);
      nodeG.lineStyle(5, ringColor, 1);
      nodeG.strokeCircle(0, 0, NODE_R);
      container.add(nodeG);

      if (!unlocked) {
        const lockTxt = this.add.text(0, 0, '🔒', { fontSize: '42px' }).setOrigin(0.5).setDepth(1);
        container.add(lockTxt);
      } else {
        const emojiTxt = this.add.text(0, -10, emoji, { fontSize: '46px' }).setOrigin(0.5).setDepth(1);
        const numTxt   = this.add.text(0,  26, `${gate.id}`, {
          fontFamily: '"Baloo 2", Arial, sans-serif',
          fontSize: '30px',
          color: completed ? '#3a2000' : '#ffffff',
          stroke: completed ? '#8b5000' : '#224455',
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(1);
        container.add([emojiTxt, numTxt]);
      }

      this.add.text(pos.x, pos.y + NODE_R + 18, gate.name, {
        fontFamily: '"Baloo 2", Arial, sans-serif',
        fontSize: '30px', color: '#ffffff',
        stroke: '#1a3a58', strokeThickness: 5, align: 'center'
      }).setOrigin(0.5).setDepth(9);

      const starY = pos.y + NODE_R + 50;
      const gateStars = completed ? (progression.state.gateStars?.[gate.id] || 1) : 0;
      for (let s = 0; s < 3; s++) {
        this.add.text(pos.x + (s - 1) * 24, starY, s < gateStars ? '⭐' : '☆', {
          fontSize: s < gateStars ? '26px' : '24px'
        }).setOrigin(0.5).setDepth(9).setAlpha(s < gateStars ? 1 : 0.4);
      }

      if (isCurrent) {
        this.tweens.add({
          targets: container, scaleX: 1.07, scaleY: 1.07,
          duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
      }

      if (unlocked) {
        const hit = this.add.circle(pos.x, pos.y, NODE_R + 12, 0x000000, 0)
          .setDepth(15).setInteractive({ useHandCursor: true });

        let bobTween = null;
        hit.on('pointerover', () => {
          this.tweens.killTweensOf(container);
          bobTween = this.tweens.add({
            targets: container, scaleX: 1.08, scaleY: 1.08, y: pos.y - 6,
            duration: 140, ease: 'Back.easeOut'
          });
          events.emit('ui:message', `${gate.name} – Tap to enter!`);
        });
        hit.on('pointerout', () => {
          if (bobTween) { this.tweens.killTweensOf(container); bobTween = null; }
          this.tweens.add({
            targets: container, scaleX: 1, scaleY: 1, y: pos.y,
            duration: 130, ease: 'Sine.easeOut',
            onComplete: () => {
              if (isCurrent) {
                this.tweens.add({
                  targets: container, scaleX: 1.07, scaleY: 1.07,
                  duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
              }
            }
          });
        });
        hit.on('pointerdown', () => {
          this.tweens.add({ targets: container, scaleX: 0.92, scaleY: 0.92, duration: 80, yoyo: true });
          this._onGateTap(gate, container, events);
        });
      } else {
        const hit = this.add.circle(pos.x, pos.y, NODE_R + 12, 0x000000, 0)
          .setDepth(15).setInteractive({ useHandCursor: true });

        let lockedTooltip = null;
        hit.on('pointerover', () => {
          if (lockedTooltip) return;
          const msg = gate.id === 1 ? '🔒 Start here to begin!' : `🔒 Complete Gate ${gate.id - 1} first!`;
          const tx = pos.x, ty = pos.y - NODE_R - 20;
          const tbg = this.add.graphics().setDepth(20);
          tbg.fillStyle(0x1a3a58, 0.93);
          tbg.lineStyle(2, 0x44ddff, 0.8);
          tbg.fillRoundedRect(tx - 160, ty - 40, 320, 40, 10);
          tbg.strokeRoundedRect(tx - 160, ty - 40, 320, 40, 10);
          tbg.fillStyle(0x1a3a58, 0.93);
          tbg.fillTriangle(tx - 8, ty, tx + 8, ty, tx, ty + 10);
          const ttxt = this.add.text(tx, ty - 20, msg, {
            fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '15px',
            color: '#ffffff', align: 'center'
          }).setOrigin(0.5).setDepth(21);
          lockedTooltip = [tbg, ttxt];
        });
        hit.on('pointerout', () => {
          if (lockedTooltip) {
            lockedTooltip.forEach(o => { try { o.destroy(); } catch(e){} });
            lockedTooltip = null;
          }
        });
        hit.on('pointerdown', () => {
          events.emit('ui:message', gate.id === 1 ? '🔒 This is the first gate!' : `🔒 Complete Gate ${gate.id - 1} first!`);
          this.tweens.add({ targets: container, x: pos.x + 7, duration: 55, yoyo: true, repeat: 3,
            onComplete: () => { container.x = pos.x; } });
        });
      }

      this._nodeObjects[gate.id] = container;
    });
  }

  _onGateTap(gate, nodeG, events) {
    this.tweens.add({ targets: nodeG, scaleX: 0.9, scaleY: 0.9, duration: 80, yoyo: true });
    if (this._player) {
      const pos = GATE_POSITIONS[gate.id];
      this.tweens.add({
        targets: this._player, x: pos.x, y: pos.y - NODE_R - 30,
        duration: 420, ease: 'Sine.easeInOut',
        onComplete: () => {
          events.emit('ui:message', `Entering ${gate.name}...`);
          this.scene.start('GateScene', { gateId: gate.id });
        }
      });
    } else {
      events.emit('ui:message', `Entering ${gate.name}...`);
      this.scene.start('GateScene', { gateId: gate.id });
    }
  }

  // ── PLAYER CHARACTER ─────────────────────────────────────────────────────────

  _buildPlayer(progression) {
    const unlocked = progression.state.unlockedGate || 1;
    const gateId = Math.min(unlocked, 5);
    const pos    = GATE_POSITIONS[gateId];

    const g = this.add.graphics().setDepth(13);
    const cx = pos.x, cy = pos.y - NODE_R - 40;
    this._drawHeroGraphic(g, cx, cy);
    this._player = g;
    this._player.x = 0;
    this._player.y = 0;

    this.tweens.add({ targets: g, y: -12, duration: 750, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.cameras.main.pan(pos.x, pos.y, 800, 'Sine.easeInOut');
    this.cameras.main.setZoom(1);
  }

  _drawHeroGraphic(g, cx, cy) {
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(cx, cy + 56, 60, 18);
    g.fillStyle(0xff3a3a, 1);
    g.fillTriangle(cx - 34, cy + 8, cx + 34, cy + 8, cx, cy + 70);
    g.fillStyle(0x2e8fff, 1);
    g.fillCircle(cx, cy + 20, 36);
    g.fillStyle(0xffe0a3, 1);
    g.fillCircle(cx, cy - 20, 32);
    g.fillStyle(0xff6b00, 1);
    g.fillRoundedRect(cx - 28, cy - 55, 56, 24, 8);
    g.fillStyle(0xffaa00, 1);
    g.fillRect(cx - 22, cy - 52, 44, 6);
    g.fillStyle(0x1a2a4a, 1);
    g.fillCircle(cx - 10, cy - 24, 6);
    g.fillCircle(cx + 10, cy - 24, 6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 8, cy - 26, 2);
    g.fillCircle(cx + 12, cy - 26, 2);
    g.lineStyle(3, 0xd06020, 1);
    g.beginPath();
    g.arc(cx, cy - 12, 10, 0.2, Math.PI - 0.2);
    g.strokePath();
    g.fillStyle(0xffaaaa, 0.5);
    g.fillCircle(cx - 18, cy - 12, 7);
    g.fillCircle(cx + 18, cy - 12, 7);
    this.add.text(cx, cy + 18, '⭐', { fontSize: '28px' }).setOrigin(0.5).setDepth(14);
  }

  // ── BOSS PORTAL ──────────────────────────────────────────────────────────────

  _buildBossPortal(progression, events) {
    if (!progression.state.bossUnlocked) return;
    const g = this.add.graphics().setDepth(11);
    const cx = BOSS_POS.x, cy = BOSS_POS.y;
    g.fillStyle(0x9933ff, 0.2); g.fillCircle(cx, cy, 80);
    g.fillStyle(0xcc66ff, 0.35); g.fillCircle(cx, cy, 60);
    g.fillStyle(0x7700cc, 1); g.fillCircle(cx, cy, 46);
    g.fillStyle(0xbb44ff, 1); g.fillCircle(cx, cy, 36);
    this.add.text(cx, cy, '💀', { fontSize: '38px' }).setOrigin(0.5).setDepth(12);
    this.add.text(cx, cy + 60, 'Grammar Goblin\nLAIR', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '30px',
      color: '#fff8d0', stroke: '#550033', strokeThickness: 5, align: 'center'
    }).setOrigin(0.5).setDepth(12);
    this.tweens.add({ targets: g, scaleX: 1.12, scaleY: 1.12, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const hit = this.add.circle(cx, cy, 60, 0x000000, 0).setDepth(16).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      events.emit('ui:message', '⚡ Final battle begins!');
      this.scene.start('BossScene');
    });
  }

  // ── DECORATIONS ──────────────────────────────────────────────────────────────

  _buildDecorations() {
    for (let i = 0; i < 22; i++) {
      const cx2 = Phaser.Math.Between(50, WORLD_W - 50);
      const cy2 = Phaser.Math.Between(20, 600);
      const sc  = Phaser.Math.FloatBetween(0.8, 2.2);
      const g   = this.add.graphics().setDepth(2).setAlpha(Phaser.Math.FloatBetween(0.55, 0.88));
      g.fillStyle(0xffffff, 1);
      g.fillCircle(0, 0, 26 * sc);
      g.fillCircle(26 * sc, -7 * sc, 20 * sc);
      g.fillCircle(-26 * sc, -5 * sc, 16 * sc);
      g.fillCircle(48 * sc, 3 * sc, 14 * sc);
      g.x = cx2; g.y = cy2;
      this.tweens.add({
        targets: g, x: cx2 + Phaser.Math.Between(-60, 60),
        duration: Phaser.Math.Between(7000, 18000),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 4000)
      });
    }
    const treePositions = [
      [180,1020],[230,880],[500,1080],[560,780],
      [760,580],[820,740],[1050,400],[1100,580],
      [1180,650],[1450,400],[1500,620],[1600,840],
      [1680,680],[1900,580],[2000,650],[2050,440],
      [2200,420],[2250,550],[2350,300],[150,1200]
    ];
    treePositions.forEach(([tx, ty]) => this._drawTree(tx, ty));
    const flowerEmojis = ['🌸','🌺','🌼','🌻','🌷'];
    for (let i = 0; i < 30; i++) {
      const fx = Phaser.Math.Between(80, WORLD_W - 80);
      const fy = Phaser.Math.Between(800, WORLD_H - 60);
      this.add.text(fx, fy, flowerEmojis[i % flowerEmojis.length], {
        fontSize: `${Phaser.Math.Between(24, 34)}px`
      }).setDepth(3).setAlpha(0.85);
    }
  }

  _drawTree(cx, cy) {
    const g = this.add.graphics().setDepth(3);
    const h = Phaser.Math.Between(50, 85);
    const sc = h / 65;
    g.fillStyle(0x5a3d1e, 1); g.fillRect(cx - 7 * sc, cy, 14 * sc, h);
    g.fillStyle(0x3ab06e, 1); g.fillCircle(cx, cy - 20 * sc, 35 * sc);
    g.fillStyle(0x4fcf85, 0.6); g.fillCircle(cx - 12 * sc, cy - 30 * sc, 22 * sc);
    g.fillStyle(0x2d8b52, 0.5); g.fillCircle(cx + 10 * sc, cy - 10 * sc, 20 * sc);
  }

  // ── INSTRUCTIONS OVERLAY (fixed to screen — setScrollFactor(0) on everything) ──

  _showInstructions(progression) {
    this._instructionsPanelOpen = true;
    const W = this.scale.width, H = this.scale.height;

    // Helper: create and register with scroll factor 0 so they never move with camera
    this._instrObjs = [];
    const add = (obj) => {
      if (obj && typeof obj.setScrollFactor === 'function') obj.setScrollFactor(0);
      this._instrObjs.push(obj);
      return obj;
    };

    // Blocking backdrop
    add(this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.72)
      .setDepth(50).setInteractive());

    // ── Card ──────────────────────────────────────────────────────────────────
    const CX = W / 2, CY = H / 2;
    const CW = 780, CH = 460;
    const HDR = 58;

    const cardG = add(this.add.graphics().setDepth(52));
    cardG.fillStyle(0xfafcff, 1);
    cardG.lineStyle(3, 0x4b8df8, 0.7);
    cardG.fillRoundedRect(CX - CW/2, CY - CH/2, CW, CH, 20);
    cardG.strokeRoundedRect(CX - CW/2, CY - CH/2, CW, CH, 20);

    const hdrG = add(this.add.graphics().setDepth(53));
    hdrG.fillStyle(0x4b8df8, 1);
    hdrG.fillRoundedRect(CX - CW/2, CY - CH/2, CW, HDR, { tl:20, tr:20, bl:0, br:0 });
    hdrG.fillStyle(0xffffff, 0.18);
    hdrG.fillRoundedRect(CX - CW/2 + 4, CY - CH/2 + 4, CW - 8, HDR/2 - 4, { tl:18, tr:18, bl:0, br:0 });

    add(this.add.text(CX, CY - CH/2 + HDR/2, '🎮  How to Play ELA Quest', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(54));

    // ── Instruction rows ──────────────────────────────────────────────────────
    const ROWS = [
      { icon: '🗺️', text: 'Tap any glowing gate on the world map to enter that zone.' },
      { icon: '❓', text: 'Answer ELA questions correctly to collect Knowledge Crystals.' },
      { icon: '⭐', text: 'Score 60%+ accuracy to pass a gate and restore a crystal.' },
      { icon: '❤️', text: 'You have 5 lives. A failed gate costs 1 life (refills every 5 min).' },
      { icon: '👹', text: 'Clear all 5 gates to unlock the Grammar Goblin final battle!' },
    ];

    const ROW_START_Y = CY - CH/2 + HDR + 28;
    const ROW_GAP     = 52;
    const ICON_X      = CX - CW/2 + 42;
    const TEXT_X      = CX - CW/2 + 82;

    ROWS.forEach((row, i) => {
      const y = ROW_START_Y + i * ROW_GAP;
      if (i > 0) {
        const div = add(this.add.graphics().setDepth(53));
        div.lineStyle(1, 0xd0dff0, 0.6);
        div.lineBetween(CX - CW/2 + 20, y - ROW_GAP/2 - 2, CX + CW/2 - 20, y - ROW_GAP/2 - 2);
      }
      add(this.add.text(ICON_X, y, row.icon, { fontSize: '24px' }).setOrigin(0.5).setDepth(54));
      add(this.add.text(TEXT_X, y, row.text, {
        fontFamily: '"Nunito", Arial, sans-serif', fontSize: '16px',
        color: '#2a3a50', wordWrap: { width: CW - 110 }
      }).setOrigin(0, 0.5).setDepth(54));
    });

    // ── "Don't show again" checkbox ───────────────────────────────────────────
    const CB_Y = CY + CH/2 - 70;
    let hideAgain = false;

    const cbBg = add(this.add.graphics().setDepth(55));
    const drawCb = () => {
      cbBg.clear();
      cbBg.fillStyle(hideAgain ? 0xd4f0ff : 0xffffff, 1);
      cbBg.lineStyle(2, 0x4b8df8, 1);
      cbBg.fillRoundedRect(CX - 97, CB_Y - 12, 24, 24, 5);
      cbBg.strokeRoundedRect(CX - 97, CB_Y - 12, 24, 24, 5);
    };
    drawCb();

    const cbTick = add(this.add.text(CX - 85, CB_Y, '', {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '18px',
      color: '#1a5abf', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(56));

    add(this.add.text(CX - 60, CB_Y, "Don't show this again", {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '15px', color: '#4a5a6a'
    }).setOrigin(0, 0.5).setDepth(55));

    const cbHit = add(this.add.rectangle(CX - 60, CB_Y, 280, 30, 0, 0)
      .setDepth(56).setInteractive({ useHandCursor: true }));
    cbHit.on('pointerdown', () => {
      hideAgain = !hideAgain;
      cbTick.setText(hideAgain ? '✓' : '');
      drawCb();
    });

    // ── Got it button ─────────────────────────────────────────────────────────
    const BTN_Y = CY + CH/2 - 24;
    const btnBg = add(this.add.graphics().setDepth(55));
    const drawBtn = (hover) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0x1f7de0 : 0x4b8df8, 1);
      btnBg.lineStyle(2, hover ? 0x1565c0 : 0x2555c9, 1);
      btnBg.fillRoundedRect(CX - 120, BTN_Y - 22, 240, 44, 14);
      btnBg.strokeRoundedRect(CX - 120, BTN_Y - 22, 240, 44, 14);
      btnBg.fillStyle(0xffffff, 0.18);
      btnBg.fillRoundedRect(CX - 116, BTN_Y - 18, 232, 18, { tl:12, tr:12, bl:0, br:0 });
    };
    drawBtn(false);

    add(this.add.text(CX, BTN_Y, "✅  Got it, let's play!", {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '18px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(56));

    const btnHit = add(this.add.rectangle(CX, BTN_Y, 240, 44, 0, 0)
      .setDepth(57).setInteractive({ useHandCursor: true }));
    btnHit.on('pointerover', () => drawBtn(true));
    btnHit.on('pointerout',  () => drawBtn(false));
    btnHit.on('pointerdown', () => {
      if (hideAgain) {
        progression.state.shownInstructions = true;
        this.sys$.events.emit('save:requested');
      }
      this._closeInstructions();
    });

    // ── Fade in ───────────────────────────────────────────────────────────────
    this._instrObjs.forEach(o => { try { o.setAlpha(0); } catch(e){} });
    this.tweens.add({
      targets: this._instrObjs.filter(o => o && typeof o.setAlpha === 'function'),
      alpha: 1, duration: 220, ease: 'Sine.easeOut'
    });
  }

  _closeInstructions() {
    this._instructionsPanelOpen = false;
    if (!this._instrObjs) return;
    const objs = this._instrObjs;
    this._instrObjs = null;
    this.tweens.add({
      targets: objs.filter(o => o && typeof o.setAlpha === 'function'),
      alpha: 0, duration: 180,
      onComplete: () => objs.forEach(o => { try { o.destroy(); } catch(e){} })
    });
  }

  // ── MATH HELPERS ─────────────────────────────────────────────────────────────

  _sampleQuadBezier(p0, p1, p2, steps = 40) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      pts.push({
        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
      });
    }
    return pts;
  }

  _dotsAlongPath(pts, spacing = 55) {
    const out = [];
    let acc = 0;
    out.push(pts[0]);
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      acc += Math.sqrt(dx * dx + dy * dy);
      if (acc >= spacing) { out.push(pts[i]); acc = 0; }
    }
    return out;
  }
}
