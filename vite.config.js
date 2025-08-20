// vite.config.js (ESM)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// If you use "@/..." imports, keep this:
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    sourcemap: true,
  },
});
