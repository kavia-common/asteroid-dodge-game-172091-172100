import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import './index.css';
import Game from './Game';
import HUD from './components/HUD';
import Controls from './components/Controls';
import Starfield from './components/Starfield';
import BackgroundGradient from './components/BackgroundGradient';

// PUBLIC_INTERFACE
function App() {
  /** Root App applies Ocean Professional theme and composes HUD, Game, and Controls. */
  const [theme] = useState('light');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleScore = (s) => setScore(s);
  const handleGameOver = () => setGameOver(true);

  // Background speed scaling derived from score/time (slowly ramps, clamped)
  // Map score (0..1000+) to a 0.8..3.0 speed range.
  const starfieldSpeed = useMemo(() => {
    const t = Math.min(1, (score || 0) / 1200); // normalize progression
    return 0.8 + t * 2.2;
  }, [score]);

  // Gradient progression 0..1 based on score
  const gradientProgression = useMemo(() => {
    return Math.min(1, (score || 0) / 1500);
  }, [score]);

  // PUBLIC_INTERFACE
  const restart = () => {
    setScore(0);
    setGameOver(false);
    if (gameRef.current) {
      gameRef.current.restart();
    }
  };

  return (
    <div className="ocean-app">
      {/* Subtle document background gradient shift */}
      <BackgroundGradient progression={gradientProgression} />

      <div className="ocean-background" />
      <header className="ocean-header">
        <div className="brand">
          <span className="brand-emoji">🚀</span>
          <h1 className="app-title">Asteroid Dodger</h1>
        </div>
        <HUD score={score} gameOver={gameOver} onRestart={restart} />
      </header>

      <main className="ocean-main">
        <section className="game-card" aria-label="Game area" style={{ position: 'relative' }}>
          {/* Starfield absolutely positioned behind game canvas */}
          <div style={{ position: 'relative' }}>
            <Starfield speed={starfieldSpeed} density={1} color="#ffffff" />
            <Game ref={gameRef} onScore={handleScore} onGameOver={handleGameOver} running={!gameOver} />
          </div>
        </section>

        <section className="controls-card" aria-label="Controls and tutorial">
          <Controls />
        </section>
      </main>

      <footer className="ocean-footer">
        <span>Theme: Ocean Professional</span>
      </footer>
    </div>
  );
}

export default App;
