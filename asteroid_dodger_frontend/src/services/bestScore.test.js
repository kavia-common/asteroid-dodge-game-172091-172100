import { loadLocalBestScore, saveLocalBestScore, updateLocalBestIfNeeded } from './bestScore';

describe('bestScore service', () => {
  beforeEach(() => {
    // reset storage
    const store = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((k) => store[k] ?? null),
        setItem: jest.fn((k, v) => { store[k] = String(v); }),
        removeItem: jest.fn((k) => { delete store[k]; }),
      },
      configurable: true
    });
  });

  test('loads 0 if missing', () => {
    expect(loadLocalBestScore()).toBe(0);
  });

  test('saves and loads integer best score', () => {
    saveLocalBestScore(42.9);
    expect(loadLocalBestScore()).toBe(42);
  });

  test('updateLocalBestIfNeeded updates when current > best', () => {
    saveLocalBestScore(10);
    const res = updateLocalBestIfNeeded(25);
    expect(res.updated).toBe(true);
    expect(res.best).toBe(25);
    expect(loadLocalBestScore()).toBe(25);
  });

  test('updateLocalBestIfNeeded does not update when current <= best', () => {
    saveLocalBestScore(30);
    const res = updateLocalBestIfNeeded(18);
    expect(res.updated).toBe(false);
    expect(res.best).toBe(30);
    expect(loadLocalBestScore()).toBe(30);
  });
});
