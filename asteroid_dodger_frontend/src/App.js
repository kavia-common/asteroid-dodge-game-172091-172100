import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import './index.css';
import Game from './Game';
import HUD from './components/HUD';
import Controls from './components/Controls';
import Starfield from './components/Starfield';
import BackgroundGradient from './components/BackgroundGradient';
import AuthPage from './components/AuthPage';
import Leaderboard from './components/Leaderboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { submitBestScore } from './services/scoreService';
import { ensureScoresTableExists } from './lib/supabaseClient';
import { loadLocalBestScore, updateLocalBestIfNeeded } from './services/bestScore';

// PUBLIC_INTERFACE
function AppShell() {
  /** Root shell applies theme, header, routes, and session-based nav. */
  const [theme] = useState('light');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [bestScore, setBestScore] = useState(() => loadLocalBestScore());

  const { user, signOut } = useAuth();

  // track latest score in ref to avoid stale closures when gameOver triggers
  const latestScoreRef = useRef(score);
  useEffect(() => { latestScoreRef.current = score; }, [score]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleScore = (s) => setScore(s);

  const handleGameOver = async () => {
    // mark over first to stop gameplay loop; then compute final score from ref
    setGameOver(true);
    const finalScore = latestScoreRef.current;

    // Update local best score deterministically
    const { best } = updateLocalBestIfNeeded(finalScore);
    setBestScore(best);

    // Optional Supabase upsert if logged in. Do not fail if unavailable.
    if (user) {
      await ensureScoresTableExists();
      try {
        await submitBestScore(user.id, user.email, finalScore);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to submit score. Ensure Supabase schema exists.', e?.message || e);
      }
    }

    // Runtime log to aid unit-level verification
    try {
      // eslint-disable-next-line no-console
      console.log('[GameOver] final:', finalScore, 'best:', best);
    } catch {}
  };

  // Background speed scaling derived from score/time (slowly ramps, clamped)
  const starfieldSpeed = useMemo(() => {
    const t = Math.min(1, (score || 0) / 1200);
    return 0.8 + t * 2.2;
  }, [score]);

  // Gradient progression 0..1 based on score
  const gradientProgression = useMemo(() => Math.min(1, (score || 0) / 1500), [score]);

  return (
    <div className="ocean-app">
      <BackgroundGradient progression={gradientProgression} />
      <div className="ocean-background" />
      <header className="ocean-header">
        <div className="brand">
          <span className="brand-emoji">🚀</span>
          <h1 className="app-title" style={{ color: 'var(--title-color)' }}>Asteroid Dodger</h1>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/" className="btn">Play</Link>
          <Link to="/leaderboard" className="btn">Leaderboard</Link>
          {user ? (
            <>
              {/* Move email presentation into the HUD with accessible colors */}
              <button className="btn" onClick={() => signOut()}>Logout</button>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary">Sign In</Link>
          )}
          <HUD
            score={score}
            gameOver={gameOver}
            onRestart={() => {
              // Clear gameOver flag; GameRoute owns invoking gameRef.restart()
              setGameOver(false);
            }}
            bestScore={bestScore}
          />
        </div>
      </header>

      <main className="ocean-main">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <GameRoute
                  score={score}
                  setScore={setScore}
                  gameOver={gameOver}
                  setGameOver={setGameOver}
                  onScore={handleScore}
                  onGameOver={handleGameOver}
                  starfieldSpeed={starfieldSpeed}
                />
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="ocean-footer">
        <span>Theme: Ocean Professional</span>
      </footer>
    </div>
  );
}

function GameRoute({ score, setScore, gameOver, setGameOver, onScore, onGameOver, starfieldSpeed }) {
  const gameRef = useRef(null);

  // PUBLIC_INTERFACE
  const restart = () => {
    setScore(0);
    setGameOver(false);
    if (gameRef.current) {
      gameRef.current.restart();
    }
  };

  return (
    <>
      <section className="game-card" aria-label="Game area" style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Starfield speed={starfieldSpeed} density={1} color="#ffffff" />
          <Game ref={gameRef} onScore={onScore} onGameOver={onGameOver} running={!gameOver} />
        </div>
      </section>

      <section className="controls-card" aria-label="Controls and tutorial">
        <Controls />
        {gameOver && (
          <div style={{ marginTop: 10 }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setGameOver(false);
                restart();
              }}
            >
              ↻ Restart
            </button>
          </div>
        )}
      </section>
    </>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Wrap with AuthProvider and BrowserRouter to enable auth + routing. */
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
