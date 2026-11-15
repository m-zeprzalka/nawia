import { defineConfig } from 'vite';

// Relative base so the static build works from any folder (itch.io serves games from a subpath).
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2500,
  },
  server: { host: true },
});
