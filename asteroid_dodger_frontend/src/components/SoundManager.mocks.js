/**
 * Test helper to mock SoundManager via jest.mock with a component
 * that forwards a ref exposing the imperative API we need in HUD tests.
 *
 * Not used in production build; only by tests.
 */
// PUBLIC_INTERFACE
export function createSoundManagerMock(initialMuted = false) {
  let _muted = !!initialMuted;
  const api = {
    async ensureUnlocked() { return; },
    playMove() {},
    playHit() {},
    startMusic() {},
    stopMusic() {},
    toggleMute() { _muted = !_muted; },
    setMuted(v) { _muted = !!v; },
    isMuted() { return _muted; },
    isUnlocked() { return true; },
  };
  return api;
}
