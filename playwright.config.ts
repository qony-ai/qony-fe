import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3010",
    headless: true,
    screenshot: "only-on-failure",
    trace: "off",
    video: "off",
  },
  webServer: {
    command: "sh ./scripts/playwright-dev-server.sh",
    url: "http://127.0.0.1:3010",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
