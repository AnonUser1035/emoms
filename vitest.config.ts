import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Bridges jsdom's localStorage past Node's experimental global stub —
    // the active-run snapshot (src/timer/activeRun.ts) depends on it.
    setupFiles: ['./vitest.setup.ts'],
  },
});
