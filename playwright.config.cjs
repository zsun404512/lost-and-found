// Playwright configuration for full-stack end-to-end tests
// Runs the existing backend and frontend via the root `npm run dev` script

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './playwright-tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: true,
  },
});
