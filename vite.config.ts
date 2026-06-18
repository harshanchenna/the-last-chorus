import { defineConfig } from 'vite';

// Vite is our dev server + bundler. HMR keeps the iteration loop fast (seed §4).
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
  },
});
