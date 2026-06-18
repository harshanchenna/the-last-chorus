import { defineConfig } from 'vitest/config';

// Vitest drives the pure logic specs + the headless boot-contract smoke test
// (seed §4 / §5). Phaser itself is exercised by `npm run build` + `npm run dev`,
// not unit tests — booting WebGL under jsdom is flaky and adds nothing.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Determinism matters — smoke tests must be stable (seed §5).
    pool: 'threads',
  },
});
