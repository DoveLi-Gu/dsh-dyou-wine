import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const localChromium = process.platform === 'win32'
  ? `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1248/chrome-win64/chrome.exe`
  : undefined;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ?? (localChromium && existsSync(localChromium) ? localChromium : undefined);

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.browser.ts',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4179',
    viewport: { width: 1600, height: 1000 },
    launchOptions: { executablePath },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 4179',
    url: 'http://127.0.0.1:4179/tests/fixture/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
