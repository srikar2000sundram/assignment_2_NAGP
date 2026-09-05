import { defineVitestConfig } from '@stencil/vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    projects: [
      // Unit tests - stencil environment (mock-doc) for components with no
      // real-browser dependency: no timers, no layout, no user gestures.
      // `setupFiles` is required here, not optional — it runs
      // defineCustomElements(), and without it render() hangs on an element
      // that was never registered.
      {
        test: {
          name: 'unit',
          include: ['src/**/*.unit.test.{ts,tsx}'],
          environment: 'stencil',
          setupFiles: ['./vitest-setup.ts'],
        },
      },
      // Component browser tests - real browser via Playwright
      {
        test: {
          name: 'browser',
          include: ['src/**/*.cmp.test.{ts,tsx}'],
          setupFiles: ['./vitest-setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
