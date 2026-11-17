import { defineConfig } from 'vite';

// base './' keeps the build portable: works at a domain root (Vercel) or a sub-path (GitHub Pages).
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 700 },
  server: { host: true },
});
