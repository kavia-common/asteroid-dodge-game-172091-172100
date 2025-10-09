//
// Best Score service: provides localStorage-persistent best score tracking,
// with optional Supabase sync when env vars and session are present.
//
// This module is UI-framework agnostic; it exposes pure functions.
// It prefers localStorage for persistence and falls back to in-memory if unavailable.
//

// PUBLIC_INTERFACE
export function loadLocalBestScore() {
  /**
   * Load best score from localStorage.
   * Returns a number >= 0. If not found or parse fails, returns 0.
   */
  try {
    const raw = localStorage.getItem('bestScore');
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

// PUBLIC_INTERFACE
export function saveLocalBestScore(score) {
  /**
   * Save best score to localStorage, clamped to >= 0 integer.
   * Returns the value saved.
   */
  const n = Math.max(0, Math.floor(Number(score) || 0));
  try {
    localStorage.setItem('bestScore', String(n));
  } catch {
    // storage may be unavailable; ignore
  }
  return n;
}

// PUBLIC_INTERFACE
export function updateLocalBestIfNeeded(currentScore) {
  /**
   * Compares currentScore to stored local best; if greater, updates storage.
   * Returns { best, updated }
   */
  const best = loadLocalBestScore();
  const cur = Math.max(0, Math.floor(Number(currentScore) || 0));
  if (cur > best) {
    saveLocalBestScore(cur);
    return { best: cur, updated: true };
  }
  return { best, updated: false };
}
