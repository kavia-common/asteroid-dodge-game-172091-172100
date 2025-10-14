import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

/**
 * Scoped handler to silence the noisy Chrome "ResizeObserver loop completed with
 * undelivered notifications" and "ResizeObserver loop limit exceeded" console errors.
 * This does not swallow other errors. It only filters the very specific ResizeObserver
 * devtools warning that can appear when observers trigger layout reads/writes in the same frame.
 *
 * Note: We still ensure proper observer cleanup and throttle elsewhere.
 */
(function installResizeObserverWarningSilencer() {
  if (typeof window === 'undefined') return;

  const isROLoopError = (message) => {
    if (!message) return false;
    const msg = String(message);
    return (
      msg.includes('ResizeObserver loop limit exceeded') ||
      msg.includes('ResizeObserver loop completed with undelivered notifications')
    );
  };

  // window.onerror filter
  const prevOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (isROLoopError(message) || isROLoopError(error?.message)) {
      // Silence only this known noisy warning
      return true;
    }
    // Call any existing handler
    if (typeof prevOnError === 'function') {
      return prevOnError.apply(this, arguments);
    }
    // Let normal error handling proceed
    return false;
  };

  // Some browsers dispatch 'error' events instead of onerror
  const handler = (e) => {
    const msg = e?.message || e?.error?.message || '';
    if (isROLoopError(msg)) {
      e.preventDefault();
      return false;
    }
    return undefined;
  };
  window.addEventListener('error', handler);

  // Optional: Silence unhandledrejection variants that wrap the same message
  const rejHandler = (e) => {
    const reason = e?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message;
    if (isROLoopError(msg)) {
      e.preventDefault();
      return false;
    }
    return undefined;
  };
  window.addEventListener('unhandledrejection', rejHandler);
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
