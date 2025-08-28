import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/pages/App.jsx';
import ErrorBoundary from '@/components/debug/ErrorBoundary.jsx';
import '@/styles/theme.css';
import '@/styles/globals.css';
import logo from '@/assets/logo.png';
import { AuthProvider } from "./components/AuthContext";
// ...
<AuthProvider>
  <App />
</AuthProvider>


const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Missing #root element');
}
createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
