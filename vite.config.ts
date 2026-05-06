import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Keep this config typecheck-friendly without relying on Node.js type packages.
const srcPath = new URL('./src', import.meta.url).pathname;
const devPort = 5173;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': srcPath,
    },
  },
  server: {
    host: '0.0.0.0',
    port: devPort,
    open: '/marketplace',
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: devPort,
    strictPort: true,
    open: '/marketplace',
  },
});
