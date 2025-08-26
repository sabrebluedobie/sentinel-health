import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '@/components/debug/ErrorBoundary.jsx';
import { AuthProvider } from '@/providers/AuthProvider.jsx';
import App from '@/pages/App.jsx';
import '@/index.css';

window.addEventListener('error', (e)=>console.error('[window.error]', e.error || e.message));
window.addEventListener('unhandledrejection', (e)=>console.error('[unhandledrejection]', e.reason));

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);