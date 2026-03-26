export const AUDIO_LIBRARY = {
  bgm_world: "assets/audio/bgm_world.mp3",
  bgm_gate:  "assets/audio/bgm_gate.mp3",
  bgm_boss:  "assets/audio/bgm_boss.mp3",
  sfx_correct:   "assets/audio/sfx_correct.mp3",
  sfx_wrong:     "assets/audio/sfx_wrong.mp3",
  sfx_magic:     "assets/audio/sfx_magic.mp3",
  sfx_gate_open: "assets/audio/sfx_gate_open.mp3",
  sfx_level_up:  "assets/audio/sfx_level_up.mp3"
};

// ── Procedural music engine ────────────────────────────────────────────────
// All music is generated via WebAudio API — 100% copyright-free.
// Three tracks: world map (calm), gate (upbeat), boss (tense).

class ProceduralMusic {
  constructor(ctx) {
    this.ctx   = ctx;
    this.nodes = [];       // all live audio nodes
    this.timers= [];       // setInterval handles
    this._masterGain = ctx.createGain();
    this._masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this._masterGain.connect(ctx.destination);
    this.isPlaying = false;
    this.key = '';
  }

  // Fade master volume in/out
  _fadeIn(vol = 0.28, dur = 1.2) {
    this._masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, this.ctx.currentTime);
    this._masterGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + dur);
  }
  _fadeOut(dur = 0.8, onDone) {
    this._masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, this.ctx.currentTime);
    this._masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    setTimeout(onDone, dur * 1000 + 50);
  }

  // Create an oscillator node connected to master
  _osc(freq, type, gainVal, startAt, stopAt) {
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(gainVal, startAt + 0.015);
    gain.gain.setValueAtTime(gainVal, stopAt - 0.04);
    gain.gain.linearRampToValueAtTime(0.0001, stopAt);
    osc.connect(gain);
    gain.connect(this._masterGain);
    osc.start(startAt);
    osc.stop(stopAt);
    this.nodes.push(osc, gain);
    return osc;
  }

  // ── WORLD MAP: calm pentatonic arpeggios + pad chords ────────────────────
  startWorld() {
    this.key = 'bgm_world';
    this.isPlaying = true;
    // C major pentatonic: C4 D4 E4 G4 A4 C5
    const penta = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const pad   = [261.63, 329.63, 392.00]; // C maj chord
    const bpm   = 76;
    const beat  = 60 / bpm;

    let step = 0;
    const arp = () => {
      const now  = this.ctx.currentTime;
      const freq = penta[step % penta.length];
      this._osc(freq, 'sine', 0.18, now, now + beat * 0.85);
      // soft octave below
      this._osc(freq / 2, 'sine', 0.06, now, now + beat * 0.7);
      step++;
    };

    // Pad chord every 4 beats
    let padStep = 0;
    const padChords = [
      [261.63, 329.63, 392.00],  // C maj
      [293.66, 369.99, 440.00],  // D min
      [349.23, 440.00, 523.25],  // F maj
      [392.00, 493.88, 587.33],  // G maj
    ];
    const playPad = () => {
      const now  = this.ctx.currentTime;
      const chord = padChords[padStep % padChords.length];
      chord.forEach(f => {
        this._osc(f, 'triangle', 0.06, now, now + beat * 4 * 0.9);
        this._osc(f / 2, 'sine',     0.03, now, now + beat * 4 * 0.9);
      });
      padStep++;
    };

    // Bass note every 2 beats
    const bassRoots = [130.81, 146.83, 174.61, 196.00];
    let bassStep = 0;
    const playBass = () => {
      const now = this.ctx.currentTime;
      const f   = bassRoots[bassStep % bassRoots.length];
      this._osc(f, 'sine', 0.22, now, now + beat * 1.8);
      bassStep++;
    };

    playPad(); playBass(); arp();
    const t1 = setInterval(arp,     beat * 1000);
    const t2 = setInterval(playPad, beat * 4000);
    const t3 = setInterval(playBass,beat * 2000);
    this.timers.push(t1, t2, t3);
    this._fadeIn(0.30);
  }

  // ── GATE: upbeat major scale melody + bouncy bass ────────────────────────
  startGate() {
    this.key = 'bgm_gate';
    this.isPlaying = true;
    const bpm  = 110;
    const beat = 60 / bpm;

    // G major scale: G4 A4 B4 C5 D5 E5 F#5 G5
    const melody = [392.00, 440.00, 493.88, 523.25, 587.33, 659.26, 739.99, 783.99];
    // Simple happy melody pattern (indices into scale)
    const pattern = [0,2,4,5, 4,2,0,2, 3,5,7,5, 4,2,0,0];
    let mStep = 0;

    const playMelody = () => {
      const now  = this.ctx.currentTime;
      const freq = melody[pattern[mStep % pattern.length]];
      this._osc(freq, 'square', 0.08, now, now + beat * 0.78);
      this._osc(freq, 'sine',   0.10, now, now + beat * 0.78);
      mStep++;
    };

    // Chord pad: G maj / C maj / D maj / Em
    const chords = [
      [196.00, 246.94, 293.66], // G2 B2 D3
      [130.81, 164.81, 196.00], // C2 E2 G2
      [146.83, 185.00, 220.00], // D2 F#2 A2
      [164.81, 196.00, 246.94], // E2 G2 B2
    ];
    let cStep = 0;
    const playChord = () => {
      const now = this.ctx.currentTime;
      const ch  = chords[cStep % chords.length];
      ch.forEach(f => this._osc(f, 'triangle', 0.07, now, now + beat * 2 * 0.9));
      cStep++;
    };

    // Bouncy bass: root on beat 1, fifth on beat 3
    const roots  = [98.00, 65.41, 73.42, 82.41]; // G1 C1 D1 E1
    const fifths = [146.83, 98.00, 110.00, 123.47];
    let bStep = 0;
    let bToggle = false;
    const playBass = () => {
      const now = this.ctx.currentTime;
      const f   = bToggle ? fifths[bStep % roots.length] : roots[bStep % roots.length];
      this._osc(f, 'sine', 0.28, now, now + beat * 0.85);
      if (!bToggle) bStep++;
      bToggle = !bToggle;
    };

    // Hi-hat tick (triangle click every beat)
    const playHat = () => {
      const now = this.ctx.currentTime;
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src  = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      src.buffer = buf;
      gain.gain.setValueAtTime(0.04, now);
      src.connect(gain); gain.connect(this._masterGain);
      src.start(now);
      this.nodes.push(src, gain);
    };

    playChord(); playBass(); playMelody(); playHat();
    const t1 = setInterval(playMelody, beat * 1000);
    const t2 = setInterval(playChord,  beat * 2000);
    const t3 = setInterval(playBass,   beat * 1000);
    const t4 = setInterval(playHat,    beat * 500);
    this.timers.push(t1, t2, t3, t4);
    this._fadeIn(0.32);
  }

  // ── BOSS: tense minor + driving pulse ─────────────────────────────────────
  startBoss() {
    this.key = 'bgm_boss';
    this.isPlaying = true;
    const bpm  = 130;
    const beat = 60 / bpm;

    // A minor: A3 B3 C4 D4 E4 F4 G4 A4
    const amin = [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00];
    const pat  = [0, 0, 2, 3, 4, 3, 2, 0, 5, 5, 4, 3, 2, 3, 4, 0];
    let mStep  = 0;
    const playMelody = () => {
      const now  = this.ctx.currentTime;
      const freq = amin[pat[mStep % pat.length]];
      this._osc(freq, 'sawtooth', 0.06, now, now + beat * 0.7);
      this._osc(freq, 'sine',     0.07, now, now + beat * 0.7);
      mStep++;
    };

    // Driving pulse bass (8th notes on root/fifth)
    const bassFreqs = [55.00, 82.41, 55.00, 82.41, 65.41, 73.42, 65.41, 73.42];
    let bStep = 0;
    const playBass = () => {
      const now = this.ctx.currentTime;
      const f   = bassFreqs[bStep % bassFreqs.length];
      this._osc(f, 'sine', 0.30, now, now + beat * 0.5);
      bStep++;
    };

    // Snare-like noise on beats 2 & 4
    let snareCount = 0;
    const playSnare = () => {
      snareCount++;
      if (snareCount % 2 !== 0) return;
      const now = this.ctx.currentTime;
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.12, this.ctx.sampleRate);
      const d   = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.3));
      const src  = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      src.buffer = buf;
      gain.gain.setValueAtTime(0.09, now);
      src.connect(gain); gain.connect(this._masterGain);
      src.start(now);
      this.nodes.push(src, gain);
    };

    playBass(); playMelody(); playSnare();
    const t1 = setInterval(playMelody, beat * 1000);
    const t2 = setInterval(playBass,   beat * 500);
    const t3 = setInterval(playSnare,  beat * 1000);
    this.timers.push(t1, t2, t3);
    this._fadeIn(0.28);
  }

  stop(onDone) {
    this._fadeOut(0.7, () => {
      this.timers.forEach(t => clearInterval(t));
      this.timers = [];
      // Let oscillators finish naturally (they auto-stop via osc.stop())
      this.nodes = [];
      this.isPlaying = false;
      if (onDone) onDone();
    });
  }

  destroy() {
    this.timers.forEach(t => clearInterval(t));
    this.timers = [];
    try { this._masterGain.disconnect(); } catch(e) {}
    this.isPlaying = false;
  }
}

// ── SFX synthesiser ────────────────────────────────────────────────────────
function _playSfx(ctx, masterGain, key, vol = 0.4) {
  const now = ctx.currentTime;

  const mkOsc = (freq, type, gainVal, dur) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gainVal * vol, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(now); osc.stop(now + dur + 0.02);
  };

  if (key === 'sfx_correct') {
    // Happy ascending chime: C5 E5 G5
    mkOsc(523.25, 'sine', 0.5, 0.18);
    setTimeout(() => mkOsc(659.26, 'sine', 0.5, 0.18), 90);
    setTimeout(() => mkOsc(783.99, 'sine', 0.6, 0.30), 180);
    setTimeout(() => mkOsc(1046.5, 'sine', 0.4, 0.35), 270);

  } else if (key === 'sfx_wrong') {
    // Descending buzz
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.35);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.28 * vol, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.connect(g); g.connect(masterGain);
    osc.start(now); osc.stop(now + 0.37);

  } else if (key === 'sfx_magic') {
    // Sparkle sweep
    for (let i = 0; i < 6; i++) {
      setTimeout(() => mkOsc(800 + i * 220, 'sine', 0.25, 0.22), i * 55);
    }
  } else if (key === 'sfx_gate_open') {
    // Triumphant fanfare
    [392, 523.25, 659.26, 783.99].forEach((f, i) => {
      setTimeout(() => mkOsc(f, 'sine', 0.5, 0.3), i * 90);
    });
  } else if (key === 'sfx_level_up') {
    // Level-up jingle
    [523.25, 659.26, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      setTimeout(() => mkOsc(f, 'sine', 0.4, 0.28), i * 80);
    });
  } else {
    mkOsc(440, 'sine', 0.3, 0.15);
  }
}

// ── Main AudioSystem export ────────────────────────────────────────────────
export default class AudioSystem {
  constructor(events) {
    this.events = events;
    this.scene  = null;
    this.muted  = false;
    this._music = null;  // ProceduralMusic instance
    this._ctx   = null;  // shared AudioContext
    this._sfxGain = null;
  }

  attach(scene) { this.scene = scene; }

  _getCtx() {
    if (this._ctx && this._ctx.state !== 'closed') return this._ctx;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._sfxGain = this._ctx.createGain();
      this._sfxGain.gain.setValueAtTime(1, this._ctx.currentTime);
      this._sfxGain.connect(this._ctx.destination);
    } catch(e) { console.warn('AudioSystem: no WebAudio', e); }
    return this._ctx;
  }

  preload(scene) {
    // MP3 files are optional — we generate everything procedurally.
    // Silently attempt to load; errors are caught.
    Object.entries(AUDIO_LIBRARY).forEach(([key, url]) => {
      try { scene.load.audio(key, url); } catch(e) {}
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    const ctx = this._getCtx();
    if (ctx && this._music) {
      this._music._masterGain.gain.setValueAtTime(this.muted ? 0.0001 : 0.28, ctx.currentTime);
    }
    if (this._sfxGain) {
      this._sfxGain.gain.setValueAtTime(this.muted ? 0 : 1, ctx.currentTime);
    }
    return this.muted;
  }

  playMusic(trackKey, _vol) {
    if (this.muted) return;
    const ctx = this._getCtx();
    if (!ctx) return;

    // Resume suspended context (autoplay policy)
    const doPlay = () => {
      if (this._music && this._music.key === trackKey && this._music.isPlaying) return;
      if (this._music) {
        this._music.stop(() => this._startTrack(ctx, trackKey));
      } else {
        this._startTrack(ctx, trackKey);
      }
    };

    if (ctx.state === 'suspended') {
      const resume = () => ctx.resume().then(doPlay).catch(() => {});
      if (this.scene?.input) this.scene.input.once('pointerdown', resume);
    } else {
      doPlay();
    }
  }

  _startTrack(ctx, key) {
    const m = new ProceduralMusic(ctx);
    this._music = m;
    if (key === 'bgm_world') m.startWorld();
    else if (key === 'bgm_gate')  m.startGate();
    else if (key === 'bgm_boss')  m.startBoss();
    else m.startWorld(); // fallback
  }

  stopMusic() {
    if (this._music) { this._music.destroy(); this._music = null; }
  }

  playSfx(key, vol = 0.4) {
    if (this.muted) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => _playSfx(ctx, this._sfxGain || ctx.destination, key, vol));
    } else {
      _playSfx(ctx, this._sfxGain || ctx.destination, key, vol);
    }
  }
}
