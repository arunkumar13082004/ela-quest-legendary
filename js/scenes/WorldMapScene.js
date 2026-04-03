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

// Bezier control points between each pair of stops
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
  { main: 0x4caf7a, dark: 0x2d7a50, sky: 0x8effd0 },  // 1 - forest
  { main: 0x4b8df8, dark: 0x2555c9, sky: 0xa8c8ff },  // 2 - city
  { main: 0xf7934c, dark: 0xc05e1a, sky: 0xffd4a0 },  // 3 - arena
  { main: 0xb382f8, dark: 0x7a47cc, sky: 0xddc8ff },  // 4 - kingdom
  { main: 0xe06262, dark: 0xa83030, sky: 0xffb8b8 }   // 5 - mountain
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

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
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

    // ── Map drag-to-scroll ────────────────────────────────────────────────────
    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      const cam = this.cameras.main;
      const dx = (pointer.x - pointer.prevPosition.x) / cam.zoom;
      const dy = (pointer.y - pointer.prevPosition.y) / cam.zoom;
      // Direct mapping: drag direction should match camera pan direction.
      cam.scrollX -= dx;
      cam.scrollY -= dy;
    });

    // Mouse-wheel / touchpad scroll — support both axes with natural mapping
    this.input.on('wheel', (pointer, objs, deltaX, deltaY, deltaZ) => {
      const cam = this.cameras.main;
      cam.scrollX += deltaX * 0.8;
      cam.scrollY += deltaY * 0.8;
    });

    // Arrow key scroll
    this._cursors = this.input.keyboard.createCursorKeys();

    this._overviewMode = false;
    events.on('worldmap:toggleOverview', () => this.toggleOverview(), this);

    // request handles from UIScene to keep text in sync
    events.on('worldmap:requestOverviewState', () => {
      events.emit('worldmap:overviewChanged', this._overviewMode);
    }, this);
  }

  toggleOverview() {
    this._overviewMode = !this._overviewMode;
    this.sys$.events.emit('worldmap:overviewChanged', this._overviewMode);

    if (this._overviewMode) {
      const viewportW = this.scale.width;
      const viewportH = this.scale.height - 72; // account for HUD bar height
      const zoomX = viewportW / WORLD_W;
      const zoomY = viewportH / WORLD_H;
      const zoom  = Math.min(zoomX, zoomY);
      this.cameras.main.pan(WORLD_W / 2, WORLD_H / 2, 400, 'Sine.easeInOut');
      this.cameras.main.zoomTo(zoom, 400, 'Sine.easeInOut');
    } else {
      const gateId = Math.min(this.sys$.progression?.state?.unlockedGate || 1, 5);
      const pos = { 1:{x:380,y:920},2:{x:900,y:640},3:{x:1330,y:460},4:{x:1770,y:760},5:{x:2140,y:360} };
      const p = pos[gateId] || pos[1];
      this.cameras.main.pan(p.x, p.y, 400, 'Sine.easeInOut');
      this.cameras.main.zoomTo(1, 400, 'Sine.easeInOut');
    }
  }

  // ── BACKGROUND ──────────────────────────────────────────────────────────────

  update() {
    if (!this._cursors) return;
    const cam   = this.cameras.main;
    const speed = 8;
    if (this._cursors.left.isDown)  cam.scrollX -= speed;
    if (this._cursors.right.isDown) cam.scrollX += speed;
    if (this._cursors.up.isDown)    cam.scrollY -= speed;
    if (this._cursors.down.isDown)  cam.scrollY += speed;
  }

  _buildBackground() {
    // Sky gradient
    const sky = this.add.graphics().setDepth(0);
    sky.fillGradientStyle(0x87d8ff, 0x87d8ff, 0xc8f0ff, 0xc8f0ff, 1);
    sky.fillRect(0, 0, WORLD_W, 900);
    sky.fillGradientStyle(0x6bc878, 0x6bc878, 0x87d8ff, 0x87d8ff, 1);
    sky.fillRect(0, 700, WORLD_W, 200);
    sky.fillStyle(0x6bc878, 1);
    sky.fillRect(0, 900, WORLD_W, WORLD_H - 900);

    // Zone terrain blobs (coloured patches under each gate)
    const terrain = this.add.graphics().setDepth(1);
    GATE_THEME.forEach((theme, i) => {
      const gid  = i + 1;
      const gpos = GATE_POSITIONS[gid];
      terrain.fillStyle(theme.main, 0.28);
      terrain.fillEllipse(gpos.x, gpos.y + 80, 620, 340);
      terrain.fillStyle(theme.dark, 0.14);
      terrain.fillEllipse(gpos.x, gpos.y + 140, 400, 200);
    });

    // Ground hills at world bottom
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

    // Compute all bezier sample points for each segment
    this._pathSegments = PATH_CTRL.map((seg, i) => ({
      pts: this._sampleQuadBezier(
        {x: seg.ax, y: seg.ay},
        {x: seg.cx, y: seg.cy},
        {x: seg.bx, y: seg.by},
        40
      ),
      gateId: i + 1  // segment i connects gate i+1 → gate i+2 (last connects g5 → boss)
    }));

    // Draw each segment (locked vs unlocked)
    this._pathSegments.forEach(({ pts, gateId }) => {
      const isUnlocked = gateId < unlocked || (gateId === 5 && progression.state.bossUnlocked);
      this._drawPathSegment(pts, isUnlocked);
    });
  }

  _drawPathSegment(pts, isUnlocked) {
    // Shadow
    const shadow = this.add.graphics().setDepth(4);
    shadow.lineStyle(28, 0x00000040, 0.3);
    shadow.beginPath();
    shadow.moveTo(pts[0].x + 3, pts[0].y + 5);
    pts.slice(1).forEach(p => shadow.lineTo(p.x + 3, p.y + 5));
    shadow.strokePath();

    // Main rope body
    const rope = this.add.graphics().setDepth(5);
    const ropeColor = isUnlocked ? 0xd4a04a : 0xa0a0a0;
    rope.lineStyle(22, ropeColor, 1);
    rope.beginPath();
    rope.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => rope.lineTo(p.x, p.y));
    rope.strokePath();

    // Rope highlight
    const hi = this.add.graphics().setDepth(6);
    hi.lineStyle(8, isUnlocked ? 0xfcdf8a : 0xd0d0d0, 0.7);
    hi.beginPath();
    hi.moveTo(pts[0].x, pts[0].y - 4);
    pts.slice(1).forEach(p => hi.lineTo(p.x, p.y - 4));
    hi.strokePath();

    // Dots along path
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
      const pos        = GATE_POSITIONS[gate.id];
      const completed  = progression.isGateCompleted(gate.id);
      const unlocked   = progression.isGateUnlocked(gate.id);
      const isCurrent  = !completed && unlocked;
      const theme      = GATE_THEME[gate.id - 1];
      const emoji      = GATE_EMOJIS[gate.id - 1];

      // ── Use a Container centred on pos so scale pivots correctly ─────────
      const container = this.add.container(pos.x, pos.y).setDepth(8);

      const nodeG = this.add.graphics();
      // All drawing is relative to (0,0) = node centre

      // Drop shadow
      nodeG.fillStyle(0x000000, 0.22);
      nodeG.fillCircle(4, 6, NODE_R + 6);

      // Outer ring (glow for unlocked/current)
      if (isCurrent) {
        nodeG.fillStyle(0x44ddff, 0.5);
        nodeG.fillCircle(0, 0, NODE_R + 14);
      } else if (completed) {
        nodeG.fillStyle(0xffaa00, 0.4);
        nodeG.fillCircle(0, 0, NODE_R + 10);
      }

      // Main circle fill
      const fillColor = completed ? 0xffd700 : (unlocked ? theme.main : 0x9db0bd);
      nodeG.fillStyle(fillColor, 1);
      nodeG.fillCircle(0, 0, NODE_R);

      // Inner highlight
      nodeG.fillStyle(0xffffff, 0.3);
      nodeG.fillCircle(-14, -14, NODE_R * 0.45);

      // Ring border
      const ringColor = completed ? 0xffaa00 : (unlocked ? theme.dark : 0x5f7585);
      nodeG.lineStyle(5, ringColor, 1);
      nodeG.strokeCircle(0, 0, NODE_R);

      container.add(nodeG);

      // Lock icon / emoji + number (relative to 0,0)
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

      // Gate name label — placed OUTSIDE container so it doesn't scale with node
      this.add.text(pos.x, pos.y + NODE_R + 18, gate.name, {
        fontFamily: '"Baloo 2", Arial, sans-serif',
        fontSize: '30px', color: '#ffffff',
        stroke: '#1a3a58', strokeThickness: 5, align: 'center'
      }).setOrigin(0.5).setDepth(9);

      // Stars below label — show earned stars (1, 2, or 3) if completed
      const starY = pos.y + NODE_R + 50;
      const gateStars = completed ? (progression.state.gateStars?.[gate.id] || 1) : 0;
      for (let s = 0; s < 3; s++) {
        this.add.text(pos.x + (s - 1) * 24, starY, s < gateStars ? '⭐' : '☆', {
          fontSize: s < gateStars ? '26px' : '24px'
        }).setOrigin(0.5).setDepth(9).setAlpha(s < gateStars ? 1 : 0.4);
      }

      // ── Idle animation: gentle "small→big→small" breathe ─────────────────
      if (isCurrent) {
        this.tweens.add({
          targets: container, scaleX: 1.07, scaleY: 1.07,
          duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
      }

      // ── Hover: tiny bob up (no scale so no drift) ─────────────────────────
      if (unlocked) {
        const hit = this.add.circle(pos.x, pos.y, NODE_R + 12, 0x000000, 0)
          .setDepth(15).setInteractive({ useHandCursor: true });

        let bobTween = null;
        hit.on('pointerover', () => {
          this.tweens.killTweensOf(container);
          bobTween = this.tweens.add({
            targets: container,
            scaleX: 1.08, scaleY: 1.08,
            y: pos.y - 6,
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
              // Restart breathe pulse for current gate
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

        // Locked hover tooltip
        let lockedTooltip = null;
        hit.on('pointerover', () => {
          if (lockedTooltip) return;
          const msg = gate.id === 1 ? '🔒 Start here to begin!' : `🔒 Complete Gate ${gate.id - 1} first!`;
          // Tooltip bubble above the node
          const tx = pos.x, ty = pos.y - NODE_R - 20;
          const tbg = this.add.graphics().setDepth(20);
          tbg.fillStyle(0x1a3a58, 0.93);
          tbg.lineStyle(2, 0x44ddff, 0.8);
          tbg.fillRoundedRect(tx - 160, ty - 40, 320, 40, 10);
          tbg.strokeRoundedRect(tx - 160, ty - 40, 320, 40, 10);
          // Arrow pointing down
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
          // Locked: tiny shake, no scale drift
          this.tweens.add({ targets: container, x: pos.x + 7, duration: 55, yoyo: true, repeat: 3,
            onComplete: () => { container.x = pos.x; } });
        });
      }

      this._nodeObjects[gate.id] = container;
    });
  }

  _onGateTap(gate, nodeG, events) {
    // Quick flash effect
    this.tweens.add({ targets: nodeG, scaleX: 0.9, scaleY: 0.9, duration: 80, yoyo: true });
    // Walk player to gate, then launch GateScene
    if (this._player) {
      const pos = GATE_POSITIONS[gate.id];
      this.tweens.add({
        targets: this._player,
        x: pos.x, y: pos.y - NODE_R - 30,
        duration: 420,
        ease: 'Sine.easeInOut',
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
    const unlocked   = progression.state.unlockedGate || 1;
    const lastCompleted = Object.keys(progression.state.completedGates || {}).length;
    // Player sits just above the current gate node
    const gateId = Math.min(unlocked, 5);
    const pos    = GATE_POSITIONS[gateId];

    const g = this.add.graphics().setDepth(13);
    const cx = pos.x, cy = pos.y - NODE_R - 40;

    this._drawHeroGraphic(g, cx, cy);
    this._player = g;
    this._player.x = 0;
    this._player.y = 0;

    // Bounce animation
    this.tweens.add({
      targets: g,
      y: -12,
      duration: 750,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Camera pan to player's current gate
    this.cameras.main.pan(pos.x, pos.y, 800, 'Sine.easeInOut');
    this.cameras.main.setZoom(1);
  }

  _drawHeroGraphic(g, cx, cy) {
    // Shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(cx, cy + 56, 60, 18);

    // Cape
    g.fillStyle(0xff3a3a, 1);
    g.fillTriangle(cx - 34, cy + 8, cx + 34, cy + 8, cx, cy + 70);

    // Body
    g.fillStyle(0x2e8fff, 1);
    g.fillCircle(cx, cy + 20, 36);

    // Head
    g.fillStyle(0xffe0a3, 1);
    g.fillCircle(cx, cy - 20, 32);

    // Helmet
    g.fillStyle(0xff6b00, 1);
    g.fillRoundedRect(cx - 28, cy - 55, 56, 24, 8);
    g.fillStyle(0xffaa00, 1);
    g.fillRect(cx - 22, cy - 52, 44, 6);

    // Eyes
    g.fillStyle(0x1a2a4a, 1);
    g.fillCircle(cx - 10, cy - 24, 6);
    g.fillCircle(cx + 10, cy - 24, 6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 8, cy - 26, 2);
    g.fillCircle(cx + 12, cy - 26, 2);

    // Smile
    g.lineStyle(3, 0xd06020, 1);
    g.beginPath();
    g.arc(cx, cy - 12, 10, 0.2, Math.PI - 0.2);
    g.strokePath();

    // Cheeks
    g.fillStyle(0xffaaaa, 0.5);
    g.fillCircle(cx - 18, cy - 12, 7);
    g.fillCircle(cx + 18, cy - 12, 7);

    // Star on body
    this.add.text(cx, cy + 18, '⭐', { fontSize: '28px' }).setOrigin(0.5).setDepth(14);
  }

  // ── BOSS PORTAL ──────────────────────────────────────────────────────────────

  _buildBossPortal(progression, events) {
    if (!progression.state.bossUnlocked) return;

    const g = this.add.graphics().setDepth(11);
    const cx = BOSS_POS.x, cy = BOSS_POS.y;

    // Portal glow rings
    g.fillStyle(0x9933ff, 0.2);
    g.fillCircle(cx, cy, 80);
    g.fillStyle(0xcc66ff, 0.35);
    g.fillCircle(cx, cy, 60);
    g.fillStyle(0x7700cc, 1);
    g.fillCircle(cx, cy, 46);
    g.fillStyle(0xbb44ff, 1);
    g.fillCircle(cx, cy, 36);

    this.add.text(cx, cy, '💀', { fontSize: '38px' }).setOrigin(0.5).setDepth(12);
    this.add.text(cx, cy + 60, 'Grammar Goblin\nLAIR', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '30px',
      color: '#fff8d0',
      stroke: '#550033',
      strokeThickness: 5,
      align: 'center'
    }).setOrigin(0.5).setDepth(12);

    // Pulse
    this.tweens.add({ targets: g, scaleX: 1.12, scaleY: 1.12, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const hit = this.add.circle(cx, cy, 60, 0x000000, 0).setDepth(16).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      events.emit('ui:message', '⚡ Final battle begins!');
      this.scene.start('BossScene');
    });
  }

  // ── DECORATIONS ──────────────────────────────────────────────────────────────

  _buildDecorations() {
    // Clouds (top half of world)
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
        targets: g,
        x: cx2 + Phaser.Math.Between(-60, 60),
        duration: Phaser.Math.Between(7000, 18000),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 4000)
      });
    }

    // Trees scattered across the map
    const treePositions = [
      [180,1020],[230,880],[500,1080],[560,780],
      [760,580],[820,740],[1050,400],[1100,580],
      [1180,650],[1450,400],[1500,620],[1600,840],
      [1680,680],[1900,580],[2000,650],[2050,440],
      [2200,420],[2250,550],[2350,300],[150,1200]
    ];
    treePositions.forEach(([tx, ty]) => this._drawTree(tx, ty));

    // Flowers
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
    g.fillStyle(0x5a3d1e, 1);
    g.fillRect(cx - 7 * sc, cy, 14 * sc, h);
    g.fillStyle(0x3ab06e, 1);
    g.fillCircle(cx, cy - 20 * sc, 35 * sc);
    g.fillStyle(0x4fcf85, 0.6);
    g.fillCircle(cx - 12 * sc, cy - 30 * sc, 22 * sc);
    g.fillStyle(0x2d8b52, 0.5);
    g.fillCircle(cx + 10 * sc, cy - 10 * sc, 20 * sc);
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