# ELA QUEST - LEGENDARY ADVENTURE

Phaser-based browser game for Grade 5 ELA aligned with U.S. Common Core.

## Features

- Story-driven adventure in Lexoria with five knowledge gates.
- Scrollable world map with movement, camera follow, and sequential gate unlocks.
- Five distinct mini-game mechanics:
  - Vocabulary Forest (movement + magic doors)
  - Main Idea City (detective drag-and-drop board)
  - Figurative Language Arena (spell battle)
  - Story Builder Kingdom (timeline drag puzzle)
  - Evidence Mountain (climbing by evidence choices)
- Final boss battle: Grammar Goblin.
- Adaptive difficulty, XP, levels, stars, lives, achievements.
- Particle effects, sound effects, looping background music.
- Local save system using `localStorage`.
- Responsive scaling for desktop/tablet/mobile.

## Run

1. Open `index.html` in a modern browser.
2. Recommended: serve with a local web server for best audio behavior.

Example (if Python is installed):

```bash
python -m http.server 5500
```

Then open:

`http://localhost:5500`

## Project Structure

```
ela-quest-legendary
  index.html
  assets/
  css/
    style.css
  js/
    main.js
    data/
      GateContent.js
    scenes/
      BootScene.js
      IntroScene.js
      WorldMapScene.js
      GateScene.js
      MiniGameScene.js
      BossScene.js
      UIScene.js
    systems/
      PlayerSystem.js
      ProgressionSystem.js
      SaveSystem.js
      AudioSystem.js
      AnimationSystem.js
      QuestionEngine.js
      DifficultyEngine.js
      AchievementSystem.js
```
