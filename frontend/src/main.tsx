import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './sos-dispatch.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'

// Global error handler for uncaught errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error });
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:2rem;background:#0f172a;color:#f8fafc;font-family:'Inter',sans-serif;text-align:center;gap:1rem">
      <div style="font-size:3rem">⚠️</div>
      <h1 style="font-size:1.5rem;font-weight:800;margin:0;color:#ef4444">Application Error</h1>
      <p style="color:#94a3b8;max-width:500px">${error?.message || 'An unexpected error occurred'}</p>
      <button onclick="location.reload()" style="padding:0.75rem 2rem;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;border:none;font-weight:700;cursor:pointer;font-size:0.9rem">Reload Page</button>
    </div>`;
  }
  return true;
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
