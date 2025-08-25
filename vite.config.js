// vite.config.js (ESM)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// If you use "@/..." imports, keep this:
import path from 'node:path';

// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true   // 👈 add this
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }
});
