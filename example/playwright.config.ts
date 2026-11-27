import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.E2E_PORT ?? 4319)

const ENGINES = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
const selected = (process.env.E2E_BROWSERS ?? 'chromium').split(',')

/**
 * Browser tests of the static web export. They press, type, and drag, and
 * they read the result from the DOM.
 *
 *   pnpm --filter example export:web   # writes dist/
 *   pnpm --filter example e2e
 *
 * `E2E_DIST` names another export folder.
 * `E2E_BROWSERS` lists the engines, for example `chromium,firefox,webkit`.
 * The default is `chromium`. CI runs all three.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // A test that passes only on the retry shows as flaky in the report.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    // The export is built for this path (`experiments.baseUrl` in app.json).
    baseURL: `http://127.0.0.1:${port}/ui/demo/`,
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    trace: 'retain-on-failure',
  },
  projects: ENGINES.filter((engine) => selected.includes(engine.name)),
  webServer: {
    command: 'node e2e/serve.mjs',
    url: `http://127.0.0.1:${port}/ui/demo/`,
    env: { E2E_PORT: String(port) },
    reuseExistingServer: false,
  },
})
