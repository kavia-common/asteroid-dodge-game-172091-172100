import React, { forwardRef, useImperativeHandle } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HUD from './HUD';

// Mock SoundManager with a ref-exposing component
jest.mock('./SoundManager', () => {
  return forwardRef(function MockSM(_props, ref) {
    let muted = false;
    useImperativeHandle(ref, () => ({
      async ensureUnlocked() { return; },
      toggleMute() { muted = !muted; },
      isMuted() { return muted; },
    }));
    return <div data-testid="mock-sound-manager" />;
  });
});

describe('HUD mute toggle', () => {
  test('click toggles label between Sound and Mute', () => {
    render(<HUD score={0} gameOver={false} onRestart={() => {}} />);
    // Initial label should be Sound (unmuted)
    expect(screen.getByRole('button', { name: /Mute audio/i })).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Mute audio/i });
    fireEvent.click(btn);
    // After click, aria-label becomes "Unmute audio"
    expect(screen.getByRole('button', { name: /Unmute audio/i })).toBeInTheDocument();
  });
});
