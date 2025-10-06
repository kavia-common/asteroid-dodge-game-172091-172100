import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './index.css';
import Game from './Game';
import HUD from './components/HUD';
import Controls from './components/Controls';

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
      <div className="ocean-background" />
      <header className="ocean-header">
        <div className="brand">
          <span className="brand-emoji">🚀</span>
          <h1>Asteroid Dodger</h1>
        </div>
        <HUD score={score} gameOver={gameOver} onRestart={restart} />
      </header>

      <main className="ocean-main">
        <section className="game-card" aria-label="Game area">
          <Game ref={gameRef} onScore={handleScore} onGameOver={handleGameOver} running={!gameOver} />
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
