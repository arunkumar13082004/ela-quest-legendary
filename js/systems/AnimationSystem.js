export default class AnimationSystem {

  float(scene, target, distance = 8, duration = 1500) {
    scene.tweens.add({
      targets: target, y: target.y - distance,
      duration, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  pulse(scene, target, scale = 1.08, duration = 420) {
    scene.tweens.add({
      targets: target, scaleX: scale, scaleY: scale,
      duration, yoyo: true, ease: 'Sine.easeInOut'
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CORRECT ANSWER — multi-stage celebration
  // ════════════════════════════════════════════════════════════════════════════
  celebrationBurst(scene, cx, cy) {
    const W = 1280, H = 720;

    // ── Stage 1 (0ms): Radial colour sweep from click point ──────────────────
    const sweep = scene.add.graphics().setDepth(88).setAlpha(0);
    sweep.fillStyle(0xffe066, 0.55);
    sweep.fillCircle(cx, cy, 20);
    scene.tweens.add({ targets: sweep, alpha: 1, scaleX: 60, scaleY: 60,
      duration: 300, ease: 'Cubic.easeOut',
      onComplete: () => scene.tweens.add({ targets: sweep, alpha: 0, duration: 200,
        onComplete: () => sweep.destroy() })
    });

    // ── Stage 2 (0ms): 3 expanding rings in sequence ─────────────────────────
    [[0xffe066, 0], [0x6ecbff, 80], [0xb2ffcc, 160]].forEach(([col, delay]) => {
      scene.time.delayedCall(delay, () => {
        const ring = scene.add.graphics().setDepth(89);
        ring.lineStyle(8, col, 1);
        ring.strokeCircle(cx, cy, 1);
        scene.tweens.add({ targets: ring, scaleX: 18, scaleY: 18, alpha: 0,
          duration: 600, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
      });
    });

    // ── Stage 3 (50ms): 16 star shards burst outward ─────────────────────────
    const palette = [0xffe066, 0xff6bbd, 0x6ecbff, 0x6effa0, 0xffa06e, 0xcc88ff, 0xff6b6b, 0xffffff];
    scene.time.delayedCall(50, () => {
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const dist  = Phaser.Math.Between(100, 240);
        const col   = palette[i % palette.length];
        const g     = scene.add.graphics().setDepth(90);
        g.fillStyle(col, 1);
        _drawStar(g, 0, 0, 5, 15, 6);
        g.x = cx; g.y = cy;
        scene.tweens.add({
          targets: g,
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          angle: Phaser.Math.Between(-180, 180),
          scaleX: 0.15, scaleY: 0.15, alpha: 0,
          duration: Phaser.Math.Between(400, 700),
          ease: 'Cubic.easeOut', onComplete: () => g.destroy()
        });
      }
    });

    // ── Stage 4 (0ms): Big "✓" stamp with bounce ─────────────────────────────
    const stamp = scene.add.text(cx, cy, '✓', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '120px', color: '#22cc66',
      stroke: '#ffffff', strokeThickness: 12
    }).setOrigin(0.5).setDepth(93).setScale(0.1).setAlpha(0);

    scene.tweens.add({ targets: stamp, scaleX: 1.3, scaleY: 1.3, alpha: 1,
      duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({ targets: stamp, scaleX: 1, scaleY: 1, duration: 120, ease: 'Back.easeIn' });
        scene.time.delayedCall(400, () => {
          scene.tweens.add({ targets: stamp, y: cy - 90, alpha: 0, scaleX: 0.5, scaleY: 0.5,
            duration: 380, ease: 'Cubic.easeIn', onComplete: () => stamp.destroy() });
        });
      }
    });

    // ── Stage 5 (220ms): "Correct!" ribbon slides in from left ───────────────
    scene.time.delayedCall(220, () => {
      const ribbon = scene.add.graphics().setDepth(92);
      ribbon.fillStyle(0x22aa55, 0.92);
      ribbon.fillRoundedRect(0, cy + 40, 0, 52, 10);

      const ribbonTxt = scene.add.text(-200, cy + 66, '✨  Correct!  ✨', {
        fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '36px',
        color: '#ffffff', fontStyle: 'bold',
        stroke: '#115533', strokeThickness: 5
      }).setOrigin(0.5).setDepth(93);

      // Slide ribbon open from centre
      let ribbonW = 0;
      const ribbonTween = scene.tweens.addCounter({
        from: 0, to: 560, duration: 250, ease: 'Back.easeOut',
        onUpdate: (t) => {
          ribbonW = t.getValue();
          ribbon.clear();
          ribbon.fillStyle(0x22aa55, 0.92);
          ribbon.fillRoundedRect(W/2 - ribbonW/2, cy + 40, ribbonW, 52, 10);
        },
        onComplete: () => {
          ribbonTxt.x = W / 2;
          scene.tweens.add({ targets: ribbonTxt, x: W/2, alpha: 1, duration: 100 });
          // Auto-dismiss
          scene.time.delayedCall(600, () => {
            scene.tweens.add({ targets: [ribbon, ribbonTxt], alpha: 0, duration: 300,
              onComplete: () => { ribbon.destroy(); ribbonTxt.destroy(); } });
          });
        }
      });
    });

    // ── Stage 6 (300ms): "+XP" and "+⭐" pop up ─────────────────────────────
    [{ t: '+XP', dx: -110, col: '#ffe066' }, { t: '+⭐ Star', dx: 110, col: '#ffe066' }]
      .forEach(({ t, dx, col }, i) => {
        scene.time.delayedCall(300 + i * 80, () => {
          const lbl = scene.add.text(cx + dx, cy + 20, t, {
            fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '30px',
            color: col, stroke: '#1a3000', strokeThickness: 6
          }).setOrigin(0.5).setDepth(94).setAlpha(0).setScale(0.5);
          scene.tweens.add({ targets: lbl, alpha: 1, scaleX: 1.1, scaleY: 1.1, y: cy - 20,
            duration: 200, ease: 'Back.easeOut' });
          scene.tweens.add({ targets: lbl, y: cy - 80, alpha: 0, duration: 500, delay: 400,
            ease: 'Cubic.easeIn', onComplete: () => lbl.destroy() });
        });
      });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // WRONG ANSWER — dramatic-but-quick fail feedback
  // ════════════════════════════════════════════════════════════════════════════
  wrongShake(scene) {
    const W = 1280, H = 720;

    // ── Red danger vignette border ────────────────────────────────────────────
    const vig = scene.add.graphics().setDepth(90);
    // Four red edge bars
    vig.fillStyle(0xff1a1a, 0.45);
    vig.fillRect(0, 0, W, 18);       // top
    vig.fillRect(0, H - 18, W, 18);  // bottom
    vig.fillRect(0, 0, 18, H);       // left
    vig.fillRect(W - 18, 0, 18, H);  // right
    scene.tweens.add({ targets: vig, alpha: 0, duration: 420, delay: 80,
      onComplete: () => vig.destroy() });

    // ── Screen tint flash ─────────────────────────────────────────────────────
    const flash = scene.add.rectangle(W/2, H/2, W, H, 0xff0000, 0.18).setDepth(89);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 280,
      onComplete: () => flash.destroy() });

    // ── Camera shake ──────────────────────────────────────────────────────────
    scene.cameras.main.shake(260, 0.014);

    // ── Broken "✗" that cracks in ─────────────────────────────────────────────
    const cross = scene.add.text(W/2, H/2 - 20, '✗', {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: '100px', color: '#ff3333',
      stroke: '#ffffff', strokeThickness: 10
    }).setOrigin(0.5).setDepth(93).setScale(2).setAlpha(0);

    scene.tweens.add({ targets: cross, scaleX: 1, scaleY: 1, alpha: 1,
      duration: 130, ease: 'Back.easeIn',
      onComplete: () => {
        // Shatter: split into two halves going left/right
        scene.tweens.add({ targets: cross,
          x: W/2 - 40, angle: -15, alpha: 0, scaleX: 0.4,
          duration: 340, ease: 'Cubic.easeOut', onComplete: () => cross.destroy() });
      }
    });

    // ── "Try again!" text flies in from bottom ────────────────────────────────
    scene.time.delayedCall(100, () => {
      const tryTxt = scene.add.text(W/2, H/2 + 100, 'Incorrect.', {
        fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '40px',
        color: '#ffffff', fontStyle: 'bold',
        stroke: '#7a0000', strokeThickness: 8
      }).setOrigin(0.5).setDepth(93).setAlpha(0);

      scene.tweens.add({ targets: tryTxt, y: H/2 + 40, alpha: 1,
        duration: 200, ease: 'Back.easeOut' });
      scene.tweens.add({ targets: tryTxt, alpha: 0, duration: 300, delay: 600,
        onComplete: () => tryTxt.destroy() });
    });

    // ── 6 small "×" particles scatter ────────────────────────────────────────
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const px = scene.add.text(W/2, H/2, '✗', {
        fontSize: '28px', color: '#ff6666'
      }).setOrigin(0.5).setDepth(92).setAlpha(0.9);
      scene.tweens.add({
        targets: px,
        x: W/2 + Math.cos(angle) * Phaser.Math.Between(60, 130),
        y: H/2 + Math.sin(angle) * Phaser.Math.Between(60, 130),
        alpha: 0, angle: Phaser.Math.Between(-90, 90),
        duration: Phaser.Math.Between(300, 500),
        ease: 'Cubic.easeOut', onComplete: () => px.destroy()
      });
    }
  }

  // ── Confetti rain (gate clear) ────────────────────────────────────────────
  confetti(scene, cx, cy) {
    const cols = [0xffe066, 0x6ecbff, 0xff6bbd, 0x6effa0, 0xffa06e, 0xcc88ff, 0xff6b6b];
    for (let i = 0; i < 40; i++) {
      scene.time.delayedCall(Phaser.Math.Between(0, 600), () => {
        const g = scene.add.graphics().setDepth(80);
        g.fillStyle(cols[i % cols.length], 1);
        i % 3 === 0 ? g.fillRect(-5, -5, 10, 10) : (i % 3 === 1 ? g.fillCircle(0, 0, 7) : _drawStar(g, 0, 0, 5, 8, 4));
        g.x = cx + Phaser.Math.Between(-520, 520); g.y = -20;
        scene.tweens.add({
          targets: g, y: 780, angle: Phaser.Math.Between(-360, 360),
          duration: Phaser.Math.Between(1000, 2000), ease: 'Linear',
          onComplete: () => g.destroy()
        });
      });
    }
  }

  // Legacy shims
  sparkBurst(scene, x, y) { this.celebrationBurst(scene, x, y); }
  popText(scene, x, y, content, color = '#ffffff') {
    const lbl = scene.add.text(x, y, content, {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '24px',
      color, stroke: '#123', strokeThickness: 4
    }).setOrigin(0.5).setDepth(91);
    scene.tweens.add({ targets: lbl, y: y - 55, alpha: 0, duration: 700,
      ease: 'Cubic.easeOut', onComplete: () => lbl.destroy() });
  }
}

function _drawStar(g, cx, cy, pts, outerR, innerR) {
  const v = [];
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
    v.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  g.beginPath();
  g.moveTo(v[0].x, v[0].y);
  v.slice(1).forEach(p => g.lineTo(p.x, p.y));
  g.closePath();
  g.fillPath();
}