import { render, screen } from '@testing-library/react';
import HUD from './HUD';

describe('HUD best score display', () => {
  beforeEach(() => {
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

  test('shows Best badge with non-zero when provided', () => {
    render(<HUD score={12} gameOver={false} onRestart={() => {}} bestScore={88} />);
    expect(screen.getByText(/Best/i)).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();
  });
});
