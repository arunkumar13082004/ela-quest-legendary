export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
    this.toastQueue  = [];
    this.activeToast = null;
    this.visibleHud  = false;
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

    // ── Level badge ───────────────────────────────────────────────────────────
    const lvlBadge = this.add.graphics();
    lvlBadge.fillStyle(0xff6b00, 1);
    lvlBadge.fillRoundedRect(16, 10, 86, 46, 10);
    this.hudContainer.add(lvlBadge);

    this.levelText = this.add.text(59, 33, 'Lvl 1', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '19px',
      color: '#ffffff', stroke: '#7a2e00', strokeThickness: 3
    }).setOrigin(0.5);
    this.hudContainer.add(this.levelText);

    // ── XP bar (text centred inside bar) ─────────────────────────────────────
    this.xpBarBg   = this.add.rectangle(114, 33, 204, 18, 0x1a4a6e, 1).setOrigin(0, 0.5);
    this.xpBarFill = this.add.rectangle(116, 33, 0,   13, 0x5aeaaa, 1).setOrigin(0, 0.5);
    this.xpText    = this.add.text(216, 33, 'XP 0/160', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '12px',
      color: '#ffffff', stroke: '#1a4a6e', strokeThickness: 3
    }).setOrigin(0.5, 0.5);
    this.hudContainer.add([this.xpBarBg, this.xpBarFill, this.xpText]);

    // ── Quest label + progress bar ────────────────────────────────────────────
    this.hudContainer.add(this.add.text(490, 18, 'Quest', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '13px', color: '#88ccff'
    }).setOrigin(0.5, 0));
    this.progressBg   = this.add.rectangle(490, 41, 120, 13, 0x1a4a6e, 1).setOrigin(0.5);
    this.progressFill = this.add.rectangle(430, 41,   0,  9, 0xffcc00, 1).setOrigin(0, 0.5);
    this.hudContainer.add([this.progressBg, this.progressFill]);

    // ── Gates counter ─────────────────────────────────────────────────────────
    this.gateText = this.add.text(650, 33, 'Gates 0/5', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '18px',
      color: '#d4f0ff', stroke: '#0a2440', strokeThickness: 3
    }).setOrigin(0, 0.5);
    this.hudContainer.add(this.gateText);

    // ── Info button ───────────────────────────────────────────────────────────
    const infoBtn = this.add.text(1194, 33, '❓', { fontSize: '22px' }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    infoBtn.on('pointerdown', () => this._showTutorialModal());
    this.hudContainer.add(infoBtn);

    // ── Mute button (far right — no logout needed, portal handles auth) ───────
    const muteBtn = this.add.text(1244, 33, '🔊', { fontSize: '22px' }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    muteBtn.on('pointerdown', () => {
      const muted = this.sys$.audio.toggleMute();
      muteBtn.setText(muted ? '🔇' : '🔊');
    });
    this.hudContainer.add(muteBtn);

    // ── Tutorial modal (hidden; shown via info button) ─────────────────────────
    this._buildTutorialModal();

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
  }

  refreshPlayer(snapshot) {
    this.levelText.setText(`Lvl ${snapshot.level}`);
    this.xpText.setText(`XP ${snapshot.xp}/${snapshot.xpToNext}`);
    const ratio = Phaser.Math.Clamp(snapshot.xp / snapshot.xpToNext, 0, 1);
    this.xpBarFill.width = 200 * ratio;
  }

  refreshProgress(snapshot) {
    this.gateText.setText(`Gates ${snapshot.completedCount}/5`);
    this.progressFill.width = 116 * (snapshot.completedCount / 5);
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
    }
  }

  _buildTutorialModal() {
    this.tutorialModal = this.add.container(0, 0).setVisible(false).setDepth(200);

    // Dimmed overlay — clicking it closes the modal
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.65)
      .setInteractive({ useHandCursor: false });
    overlay.on('pointerdown', () => this.tutorialModal.setVisible(false));

    // Modal card
    const card = this.add.graphics();
    card.fillStyle(0x0d2e4a, 0.97);
    card.lineStyle(2, 0x3a9fd4, 1);
    card.fillRoundedRect(340, 160, 600, 390, 18);
    card.strokeRoundedRect(340, 160, 600, 390, 18);

    // Orange header banner
    const banner = this.add.graphics();
    banner.fillStyle(0xff6b00, 1);
    banner.fillRoundedRect(340, 160, 600, 52, { tl: 18, tr: 18, bl: 0, br: 0 });

    const title = this.add.text(640, 186, '❓  How to Play', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '22px',
      color: '#ffffff', stroke: '#7a2e00', strokeThickness: 3
    }).setOrigin(0.5);

    const hudItems = [
      { icon: '🟢', label: 'XP Bar',  desc: 'Earn XP by answering correctly — fill it to level up!' },
      { icon: '🗺️',  label: 'Quest',  desc: 'Shows your current mission progress across all gates.' },
      { icon: '🚪', label: 'Gates',   desc: 'Complete each gate to unlock the next world level.' },
      { icon: '🔊', label: 'Mute',    desc: 'Toggle background music and sound effects on / off.' }
    ];

    const itemObjs = [];
    hudItems.forEach((item, i) => {
      const y = 248 + i * 72;
      const iconTxt = this.add.text(374, y, item.icon, { fontSize: '26px' }).setOrigin(0, 0.5);
      const labelTxt = this.add.text(412, y - 10, item.label, {
        fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '16px',
        color: '#88ccff', stroke: '#0a2440', strokeThickness: 2
      }).setOrigin(0, 0.5);
      const descTxt = this.add.text(412, y + 14, item.desc, {
        fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '13px',
        color: '#d4f0ff', wordWrap: { width: 490 }
      }).setOrigin(0, 0.5);
      itemObjs.push(iconTxt, labelTxt, descTxt);
    });

    // Close button
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0xff6b00, 1);
    closeBg.lineStyle(2, 0x3a9fd4, 1);
    closeBg.fillRoundedRect(540, 516, 200, 44, 12);
    closeBg.strokeRoundedRect(540, 516, 200, 44, 12);
    const closeBtn = this.add.text(640, 538, 'Got it! ✔', {
      fontFamily: '"Baloo 2", Arial, sans-serif', fontSize: '18px',
      color: '#ffffff', stroke: '#7a2e00', strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.tutorialModal.setVisible(false));

    this.tutorialModal.add([overlay, card, banner, title, ...itemObjs, closeBg, closeBtn]);
  }

  _showTutorialModal() {
    this.tutorialModal.setVisible(true);
  }
}
