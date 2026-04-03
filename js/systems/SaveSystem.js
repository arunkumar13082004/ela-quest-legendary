/**
 * SaveSystem — DynamoDB via index.php?action=...
 *
 * All API calls go to the same index.php file using ?action= query params.
 * StudentID comes from window.STUDENT_ID (injected by index.php from cookie).
 *
 * Actions:
 *   GET  index.php?action=load        → load saved progress
 *   POST index.php?action=save        → save progress
 *   POST index.php?action=delete      → reset / new game
 *   POST index.php?action=scores      → submit completed-game score
 *   GET  index.php?action=leaderboard → leaderboard
 */
export default class SaveSystem {
  constructor() {
    this.userId         = window.STUDENT_ID || null;
    this.username       = this.userId;
    this.sessionStartMs = Date.now();
  }

  isLoggedIn() { return Boolean(this.userId); }
  async logout() { /* no-op — portal handles auth */ }

  // ── Load progress ─────────────────────────────────────────────────────────
  async load() {
    if (!this.userId) return null;
    try {
      const res = await fetch('index.php?action=load', {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok) { console.warn('[SaveSystem] load failed:', res.status); return null; }
      return await res.json();
    } catch (err) {
      console.warn('[SaveSystem] load error:', err);
      return null;
    }
  }

  // ── Save progress ─────────────────────────────────────────────────────────
  async save(payload) {
    if (!this.userId) return false;
    try {
      const res = await fetch('index.php?action=save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player:     payload.player     || {},
          progress:   payload.progress   || {},
          difficulty: payload.difficulty || {}
        })
      });
      return res.ok;
    } catch (err) {
      console.warn('[SaveSystem] save error:', err);
      return false;
    }
  }

  // Used by beforeunload — sendBeacon is reliable on tab close
  saveSync(payload) {
    const data = JSON.stringify({
      player:     payload.player     || {},
      progress:   payload.progress   || {},
      difficulty: payload.difficulty || {}
    });
    const ok = navigator.sendBeacon
      ? navigator.sendBeacon('index.php?action=save', new Blob([data], { type: 'application/json' }))
      : false;
    if (!ok) this.save(payload).catch(() => {});
  }

  // ── Reset / new game ──────────────────────────────────────────────────────
  async resetSave() {
    if (!this.userId) return;
    try {
      await fetch('index.php?action=delete', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.warn('[SaveSystem] resetSave error:', err);
    }
  }

  // ── Submit completed-game score ───────────────────────────────────────────
  async submitScore({ gatesCompleted, totalStars, level }) {
    if (!this.userId) return;
    const timeMs = Date.now() - this.sessionStartMs;
    try {
      await fetch('index.php?action=scores', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gatesCompleted, totalStars, level, timeMs })
      });
    } catch (err) {
      console.warn('[SaveSystem] submitScore error:', err);
    }
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────
  async getLeaderboard() {
    try {
      const res = await fetch('index.php?action=leaderboard', {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.leaderboard || [];
    } catch (err) {
      console.warn('[SaveSystem] getLeaderboard error:', err);
      return [];
    }
  }
}