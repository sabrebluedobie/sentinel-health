import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { ErrorBoundary } from '@/components/debug/ErrorBoundary.jsx';
import { AuthProvider } from '@/providers/AuthProvider.jsx';
import App from '@/pages/App.jsx';

import '@/index.css';

const el = document.getElementById('root');

createRoot(el).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);