import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';

const rootEl = document.getElementById('root') as HTMLElement;

// Wrap in try-catch so a fatal module-level error shows a visible message
// instead of leaving the black body completely empty.
try {
  // Dynamic require keeps App out of the static import graph so a module
  // error inside App doesn't propagate here and prevent this catch from running.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Root = require('./App').default;
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
} catch (err) {
  console.error('[Fatal] App failed to initialise:', err);
  const msg = err instanceof Error ? err.message : String(err);
  rootEl.innerHTML = `
    <div style="min-height:100vh;background:#0a0a0a;display:flex;align-items:center;justify-content:center;padding:2rem;text-align:center">
      <div>
        <p style="color:#d4af37;font-family:Georgia,serif;font-size:1.5rem;margin-bottom:1rem">The Auction House</p>
        <p style="color:#6b7280;font-size:0.875rem;margin-bottom:0.5rem">The app failed to start. Check the browser console for details.</p>
        <p style="color:#4b5563;font-size:0.75rem;margin-bottom:1.5rem;max-width:420px">${msg}</p>
        <button onclick="window.location.reload()" style="background:#d4af37;color:#0a0a0a;border:none;padding:0.75rem 1.5rem;cursor:pointer;font-weight:600;font-size:0.875rem;text-transform:uppercase">Reload</button>
      </div>
    </div>`;
}

reportWebVitals();
