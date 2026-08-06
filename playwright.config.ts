import { defineConfig, devices } from '@playwright/test';
require("dotenv").config({ path: "./.env" });
import path from 'path';

export const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    // Write the JSON report to MCODE_DIR. On Windows, Node resolves the path
    // from the MCODE_DIR env var. Use path.resolve to normalise separators.
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_FILE ?? 'playwright-results.json' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // Use 127.0.0.1 instead of localhost: the Identity server (5223) and WebApp
    // are configured to bind on 127.0.0.1. Using localhost can cause OIDC redirect
    // failures because the Authorization Server's redirect_uri whitelist expects
    // the 127.0.0.1 host.
    baseURL: process.env.APP_BASE_URL ?? 'http://127.0.0.1:5045',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: '**/*.setup.ts',
    },
    {
      name: 'e2e tests logged in',
      testMatch: ['**/AddItemTest.spec.ts', '**/RemoveItemTest.spec.ts'],
      dependencies: ['setup'],
      use: {
        storageState: STORAGE_STATE,
      },
    },
    {
      name: 'e2e tests without logged in',
      testMatch: ['**/BrowseItemTest.spec.ts', '**/milestone1.spec.ts'],
    }
    // {
    //   name: 'chromium',
    //   use: { ...devices['Desktop Chrome'] },
    // },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'dotnet run --project src/eShop.AppHost/eShop.AppHost.csproj',
    url: 'http://127.0.0.1:5045',
    // Always reuse existing server — in this sandbox the standalone services
    // (WebApp, Catalog API, Identity API) are started externally before the
    // test run. Setting reuseExistingServer: true prevents Playwright from
    // spawning a second server process.
    reuseExistingServer: true,
    stderr: 'pipe',
    stdout: 'pipe',
    timeout: process.env.CI ? (5 * 60_000) : 60_000,
  },
});
