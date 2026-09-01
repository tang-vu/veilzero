import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e", fullyParallel: true, retries: process.env.CI ? 2 : 0,
  use: { baseURL: "http://127.0.0.1:3147", trace: "on-first-retry" },
  webServer: { command: "pnpm dev --port 3147", url: "http://127.0.0.1:3147", reuseExistingServer: false },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
