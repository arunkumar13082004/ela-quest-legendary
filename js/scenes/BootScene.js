export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Safely access systems attached to the game config; log helpful error if missing
    const systems = (this.game && this.game.config && this.game.config.custom && this.game.config.custom.systems) || window.elaSystems;
    if (!systems) {
      // eslint-disable-next-line no-console
      console.error("ELA Quest: systems are not available on game.config.custom and no global fallback found.", this.game && this.game.config);
    } else if (systems.audio && typeof systems.audio.preload === 'function') {
      systems.audio.preload(this);
    }

    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(width / 2, height / 2, 560, 24, 0xffffff, 0.35).setStrokeStyle(2, 0xffffff, 0.8);
    const bar = this.add.rectangle(width / 2 - 278, height / 2, 0, 18, 0x66d7ff, 1).setOrigin(0, 0.5);
    const ui = (window.elaUI && window.elaUI.sizes) ? window.elaUI.sizes : { body: 34 };
    const label = this.add.text(width / 2, height / 2 - 42, "Loading Lexoria...", {
      fontFamily: '"Baloo 2", Arial, sans-serif',
      fontSize: `${ui.body}px`,
      color: "#ffffff",
      stroke: "#1a3a58",
      strokeThickness: 8
    }).setOrigin(0.5);

    this.load.on("progress", (value) => {
      bar.width = 556 * value;
      label.setText(`Loading Lexoria... ${Math.round(value * 100)}%`);
    });
  }

  create() {
    this.createTextures();
    this.scene.launch("UIScene");
    this.scene.start("IntroScene");
  }

  createTextures() {
    this.makeCircleTexture("particle", 8, 0xffffff);
    this.makeCircleTexture("hero", 24, 0x2e8fff);
    this.makeCircleTexture("enemy", 28, 0xf46969);
    this.makeCircleTexture("crystal", 18, 0x9dfcff);
    this.makeCircleTexture("cloud", 22, 0xffffff);
    this.makeCircleTexture("coin", 12, 0xffcc4d);
    this.makeCircleTexture("star", 12, 0xffef85);
    this.makeCircleTexture("heart", 11, 0xff6f8f);
    this.makeRoundedRectTexture("gate-open", 72, 96, 14, 0x65c99c, 0xffffff);
    this.makeRoundedRectTexture("gate-locked", 72, 96, 14, 0x7d8aa6, 0xd5d8e5);
    this.makeRoundedRectTexture("portal", 84, 84, 20, 0xffc45f, 0xffffff);
    this.makeRoundedRectTexture("panel", 500, 250, 24, 0xffffff, 0xd7ecff);
    this.makeRoundedRectTexture("button", 220, 64, 20, 0xffd36d, 0xfab24a);
    this.makeRoundedRectTexture("door", 140, 180, 24, 0xa47dff, 0xd7cbff);
    this.makeRoundedRectTexture("card", 280, 84, 16, 0xffffff, 0xcde5ff);
    this.makeRoundedRectTexture("stone", 290, 76, 14, 0xecf0ff, 0xb9c8ef);
    this.makeRoundedRectTexture("platform", 220, 34, 12, 0x7aa6ff, 0xb8d0ff);
    this.makeTileTexture("tile-forest", 0x8ad4a1, 0x60b781);
    this.makeTileTexture("tile-city", 0x91b8ff, 0x668de8);
    this.makeTileTexture("tile-arena", 0xffbf80, 0xf19b4f);
    this.makeTileTexture("tile-kingdom", 0xc7a5ff, 0xa97cf0);
    this.makeTileTexture("tile-mountain", 0xff9ea1, 0xdc656e);
  }

  makeCircleTexture(key, radius, color) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillCircle(radius, radius, radius);
    g.generateTexture(key, radius * 2, radius * 2);
    g.destroy();
  }

  makeRoundedRectTexture(key, width, height, radius, fillColor, strokeColor) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(fillColor, 1);
    g.lineStyle(4, strokeColor, 1);
    g.fillRoundedRect(0, 0, width, height, radius);
    g.strokeRoundedRect(0, 0, width, height, radius);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  makeTileTexture(key, mainColor, accentColor) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(mainColor, 1);
    g.fillRect(0, 0, 320, 200);
    g.fillStyle(accentColor, 0.45);
    for (let i = 0; i < 14; i += 1) {
      g.fillCircle(Phaser.Math.Between(10, 310), Phaser.Math.Between(10, 190), Phaser.Math.Between(8, 24));
    }
    g.generateTexture(key, 320, 200);
    g.destroy();
  }
}