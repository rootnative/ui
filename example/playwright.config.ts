import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.E2E_PORT ?? 4319)

/**
 * Browser tests of the static web export. They press, type, and drag, and
 * they read the result from the DOM.
 *
 *   pnpm --filter example export:web   # writes dist/
 *   pnpm --filter example e2e
 *
 * `E2E_DIST` names another export folder.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    // The export is built for this path (`experiments.baseUrl` in app.json).
    baseURL: `http://127.0.0.1:${port}/ui/demo/`,
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node e2e/serve.mjs',
    url: `http://127.0.0.1:${port}/ui/demo/`,
    env: { E2E_PORT: String(port) },
    reuseExistingServer: false,
  },
})
