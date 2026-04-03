export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
    this.toastQueue  = [];
    this.activeToast = null;
    this.visibleHud  = false;
    this._tooltip    = null;
  }

  create() {
    this.sys$ = (this.game?.config?.custom?.systems) || window.elaSystems;
    if (!this.sys$) {
      console.error("UIScene: systems not found.");
      this.sys$ = { events: new Phaser.Events.EventEmitter(), player: null, progress: null };
    }
    const { events, player, progress } = this.sys$;

    // ── HUD BAR ───────────────────────────────────────────────────────────────
    this.hudContainer = this.add.container(0, 0);

    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x0d2e4a, 0.92);
    hudBg.fillRoundedRect(10, 6, 1260, 60, 14);
    hudBg.lineStyle(2, 0x3a9fd4, 0.6);
    hudBg.strokeRoundedRect(10, 6, 1260, 60, 14);
    this.hudContainer.add(hudBg);

    // ── Home button (world map only) ──────────────────────────────────────────
    this._homeBtnBg = this.add.graphics();
    this._homeBtnBg.fillStyle(0x1a4a6e, 1);
    this._homeBtnBg.lineStyle(2, 0x5aadd4, 0.9);
    this._homeBtnBg.fillRoundedRect(14, 10, 130, 46, 10);
    this._homeBtnBg.strokeRoundedRect(14, 10, 130, 46, 10);
    this.hudContainer.add(this._homeBtnBg);

    this._homeIco = this.add.text(35, 33, '🏠', { fontSize: '18px' }).setOrigin(0.5);
    this._homeTxt = this.add.text(100, 33, 'Home', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '16px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.hudContainer.add([this._homeIco, this._homeTxt]);

    this._homeHit = this.add.rectangle(79, 33, 130, 46, 0, 0).setInteractive({ useHandCursor: true });
    this._homeHit.on('pointerover', () => {
      this._homeBtnBg.clear();
      this._homeBtnBg.fillStyle(0x2a6a9e, 1);
      this._homeBtnBg.fillRoundedRect(14, 10, 130, 46, 10);
    });
    this._homeHit.on('pointerout', () => {
      this._homeBtnBg.clear();
      this._homeBtnBg.fillStyle(0x1a4a6e, 1);
      this._homeBtnBg.fillRoundedRect(14, 10, 130, 46, 10);
    });
    this._homeHit.on('pointerdown', () => {
      const gameScene = this.scene.manager.scenes.find(s =>
        s.scene.key !== 'UIScene' && s.scene.isActive()
      );
      if (gameScene) gameScene.scene.start('IntroScene');
    });
    this.hudContainer.add(this._homeHit);

    // ── Quest section (centre) ────────────────────────────────────────────────
    const questLabel = this.add.text(640, 12, 'QUEST PROGRESS', {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '10px', color: '#88ccff'
    }).setOrigin(0.5, 0);
    this.progressBg   = this.add.rectangle(640, 38, 120, 13, 0x1a4a6e, 1).setOrigin(0.5);
    this.progressFill = this.add.rectangle(580, 38,   0,  9, 0xffcc00, 1).setOrigin(0, 0.5);
    this.progressPct  = this.add.text(708, 38, '0%', {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '11px', color: '#ffdd44', fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.hudContainer.add([questLabel, this.progressBg, this.progressFill, this.progressPct]);

    const questHit = this.add.rectangle(640, 36, 130, 52, 0, 0).setInteractive({ useHandCursor: false });
    questHit.on('pointerover', () => this._showTooltip(640, 72, '🗺️ Your overall campaign progress.\n    Complete all 5 gates to win!'));
    questHit.on('pointerout',  () => this._hideTooltip());
    this.hudContainer.add(questHit);

    // ── Gates counter ─────────────────────────────────────────────────────────
    this.gateText = this.add.text(970, 29, 'Gates 0/5', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '18px',
      color: '#d4f0ff', stroke: '#0a2440', strokeThickness: 3
    }).setOrigin(0, 0.5);
    const gateSubLabel = this.add.text(970, 47, 'GATES CLEARED', {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '10px', color: '#7ab8d4'
    }).setOrigin(0, 0.5);
    this.hudContainer.add([this.gateText, gateSubLabel]);

    const gateHit = this.add.rectangle(1040, 36, 160, 52, 0, 0).setInteractive({ useHandCursor: false });
    gateHit.on('pointerover', () => this._showTooltip(1040, 72, '🏰 Each gate is a different ELA topic.\n    Clear all 5 to face the Grammar Goblin!'));
    gateHit.on('pointerout',  () => this._hideTooltip());
    this.hudContainer.add(gateHit);

    // ── Lives (hearts) display ────────────────────────────────────────────────
    const heartsLabel = this.add.text(790, 12, "LIVES", {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: "10px", color: "#ff9999"
    }).setOrigin(0, 0);
    this.hudContainer.add(heartsLabel);
    this._heartObjs = [];
    for (let h = 0; h < 5; h++) {
      const hTxt = this.add.text(790 + h * 26, 38, "❤️", { fontSize: "16px" }).setOrigin(0, 0.5);
      this._heartObjs.push(hTxt);
      this.hudContainer.add(hTxt);
    }
    this.regenText = this.add.text(793, 52, "", {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: "10px", color: "#ffaaaa"
    }).setOrigin(0, 0.5);
    this.hudContainer.add(this.regenText);

    // ── Mute button ───────────────────────────────────────────────────────────
    const muteBtn = this.add.text(1244, 33, '🔊', { fontSize: '22px' }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    muteBtn.on('pointerdown', () => {
      const muted = this.sys$.audio.toggleMute();
      muteBtn.setText(muted ? '🔇' : '🔊');
    });
    this.hudContainer.add(muteBtn);

    // ── Overview button (world map only) — use graphics + plain Rectangle hit ─
    this._overviewBtnBg = this.add.graphics();
    this._overviewTxt   = this.add.text(1154, 33, 'Overview', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '14px',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    const drawOverviewBg = (hover) => {
      this._overviewBtnBg.clear();
      this._overviewBtnBg.fillStyle(hover ? 0x277248 : 0x1f5d36, 0.94);
      this._overviewBtnBg.fillRoundedRect(1094, 13, 120, 40, 10);
      this._overviewBtnBg.lineStyle(2, 0xffffff, 0.4);
      this._overviewBtnBg.strokeRoundedRect(1094, 13, 120, 40, 10);
    };
    drawOverviewBg(false);

    // Plain Rectangle hit area — same pattern used everywhere else in the codebase
    this._overviewHit = this.add.rectangle(1154, 33, 120, 40, 0, 0)
      .setDepth(30)
      .setInteractive({ useHandCursor: true });
    this._overviewHit.on('pointerover',  () => drawOverviewBg(true));
    this._overviewHit.on('pointerout',   () => drawOverviewBg(false));
    this._overviewHit.on('pointerdown',  () => this.sys$.events.emit('worldmap:toggleOverview'));

    this.hudContainer.add([this._overviewBtnBg, this._overviewTxt, this._overviewHit]);
    this.overviewLabel = this._overviewTxt;

    // map viewport frame
    const frame = this.add.graphics().setDepth(29);
    frame.lineStyle(3, 0x1a4a6e, 0.95);
    frame.strokeRect(4, 4, this.scale.width - 8, this.scale.height - 8);

    events.on('worldmap:overviewChanged', (on) => {
      this.overviewLabel.setText(on ? 'Close' : 'Overview');
    });

    events.emit('worldmap:requestOverviewState');

    // ── Tooltip container ─────────────────────────────────────────────────────
    this.tooltipGroup = this.add.container(0, 0).setDepth(100);

    // ── TOAST ─────────────────────────────────────────────────────────────────
    this.toastPanel = this.add.graphics().setVisible(false);
    this.toastText  = this.add.text(640, 96, '', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '20px', color: '#3a2000',
      stroke: '#ffe08a', strokeThickness: 2
    }).setOrigin(0.5).setVisible(false);

    events.on('player:updated',       this.refreshPlayer,   this);
    events.on('progress:updated',     this.refreshProgress, this);
    events.on('achievement:unlocked', this.onAchievement,   this);
    events.on('ui:message',           this.enqueueToast,    this);
    events.on('ui:toggle',            this.toggleHud,       this);

    this.refreshPlayer(player.getSnapshot());
    this.refreshProgress(progress.getSnapshot());
    this.toggleHud(false);

    // Tick regen countdown every second
    this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        if (!this.visibleHud || !this.sys$ || !this.sys$.player) return;
        this.sys$.player._applyLifeRegen && this.sys$.player._applyLifeRegen();
        this._refreshHearts(this.sys$.player.getSnapshot());
      }
    });
  }

  // ── Show/hide Home + Overview depending on whether WorldMapScene is active ──
  _updateWorldMapButtons() {
    const activeScenes = this.scene.manager.scenes.filter(s =>
      s.scene.key !== 'UIScene' && s.scene.isActive()
    );
    const onWorldMap = activeScenes.some(s => s.scene.key === 'WorldMapScene');

    // Visibility — setVisible works on all Phaser game objects
    [this._homeBtnBg, this._homeIco, this._homeTxt, this._homeHit,
     this._overviewBtnBg, this._overviewTxt, this._overviewHit].forEach(o => {
      if (o) o.setVisible(onWorldMap);
    });
  }

  _showTooltip(x, y, text) {
    this._hideTooltip();
    const lines = text.split('\n');
    const maxLen = Math.max(...lines.map(l => l.length));
    const tw = Math.min(520, maxLen * 10 + 40);
    const th = lines.length * 22 + 18;

    const bg = this.add.graphics().setDepth(101);
    bg.fillStyle(0x0d2e4a, 0.96);
    bg.lineStyle(2, 0x3a9fd4, 0.9);
    bg.fillRoundedRect(x - tw/2, y, tw, th, 8);
    bg.strokeRoundedRect(x - tw/2, y, tw, th, 8);
    bg.fillStyle(0x0d2e4a, 0.96);
    bg.fillTriangle(x - 7, y, x + 7, y, x, y - 8);

    const txt = this.add.text(x, y + th/2, text, {
      fontFamily: '"Nunito", Arial, sans-serif', fontSize: '13px',
      color: '#d4f0ff', align: 'center', lineSpacing: 4
    }).setOrigin(0.5).setDepth(102);

    this.tooltipGroup.add([bg, txt]);
    this._tooltip = [bg, txt];
  }

  _hideTooltip() {
    if (this._tooltip) {
      this._tooltip.forEach(o => { try { o.destroy(); } catch(e){} });
      this._tooltip = null;
    }
  }

  refreshPlayer(snapshot) {
    this._refreshHearts(snapshot);
  }

  _refreshHearts(snapshot) {
    if (!this._heartObjs) return;
    const lives = snapshot.lives ?? 5;
    this._heartObjs.forEach((h, i) => {
      h.setText(i < lives ? '❤️' : '🖤');
      h.setAlpha(i < lives ? 1 : 0.5);
    });
    if (!this.regenText) return;
    if (lives >= 5) { this.regenText.setText(''); return; }
    const sys = this.sys$;
    if (sys && sys.player && typeof sys.player.msUntilNextLife === 'function') {
      const ms = sys.player.msUntilNextLife();
      if (ms > 0) {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        this.regenText.setText(`+1 in ${mins}:${String(secs).padStart(2,'0')}`);
      } else {
        this.regenText.setText('');
      }
    }
  }

  refreshProgress(snapshot) {
    this.gateText.setText(`Gates ${snapshot.completedCount}/5`);
    const pct = Math.round((snapshot.completedCount / 5) * 100);
    this.progressFill.width = 116 * (snapshot.completedCount / 5);
    if (this.progressPct) this.progressPct.setText(`${pct}%`);
  }

  onAchievement(payload) {
    this.enqueueToast(`🏆 ${payload.title}: ${payload.message}`);
  }

  enqueueToast(text) {
    if (!text) return;
    this.toastQueue.push(text);
    this.showNextToast();
  }

  showNextToast() {
    if (this.activeToast || !this.toastQueue.length) return;
    this.activeToast = this.toastQueue.shift();

    this.toastPanel.clear();
    const tw = Math.min(900, this.activeToast.length * 14 + 60);
    this.toastPanel.fillStyle(0xfff8d8, 0.97);
    this.toastPanel.lineStyle(3, 0xffcc44, 1);
    this.toastPanel.fillRoundedRect(640 - tw / 2, 80, tw, 44, 12);
    this.toastPanel.strokeRoundedRect(640 - tw / 2, 80, tw, 44, 12);

    this.toastText.setText(this.activeToast);
    this.toastPanel.setVisible(true).setAlpha(0);
    this.toastText.setVisible(true).setAlpha(0);

    this.tweens.add({
      targets: [this.toastPanel, this.toastText], alpha: 1, duration: 160,
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          this.tweens.add({
            targets: [this.toastPanel, this.toastText], alpha: 0, duration: 200,
            onComplete: () => {
              this.toastPanel.setVisible(false);
              this.toastText.setVisible(false);
              this.activeToast = null;
              this.showNextToast();
            }
          });
        });
      }
    });
  }

  toggleHud(show) {
    this.visibleHud = show;
    this.hudContainer.setVisible(show);
    if (!show) {
      this.toastPanel.setVisible(false);
      this.toastText.setVisible(false);
      this._hideTooltip();
    }
    if (show) {
      // Small delay lets the scene manager settle before we check which scene is active
      this.time.delayedCall(60, () => this._updateWorldMapButtons());
    }
  }
}