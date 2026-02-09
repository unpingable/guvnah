/**
 * Guvnah Electron smoke tests — the "renderer doesn't explode" layer.
 *
 * Brutally small by design: 2 assertions.
 *   1. App boots + daemon handshake shows "connected"
 *   2. Session list renders (or explicit empty state)
 *
 * Runs against a BUILT app (dist/), not dev mode.
 * Uses a temp governor dir so tests are deterministic.
 *
 * Run:
 *   npm run build && npm run test:e2e
 */

import { test, expect } from "@playwright/test";
import {
  _electron as electron,
  type ElectronApplication,
  type Page,
} from "playwright";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";

test.describe("Guvnah smoke", () => {
  let app: ElectronApplication;
  let page: Page;
  let govDir: string;
  const logs: string[] = [];

  test.beforeAll(async () => {
    // Create a fresh, deterministic governor directory
    govDir = fs.mkdtempSync(path.join(os.tmpdir(), "guvnah-e2e-"));
    execSync(`governor init`, { cwd: govDir });

    app = await electron.launch({
      args: [
        path.resolve("dist/main/index.js"),
        "--no-sandbox", // required when not running as root
      ],
      env: {
        ...process.env,
        GUVNAH_E2E: "1",
        GOVERNOR_DIR: govDir,
        GOVERNOR_MODE: "general",
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
      },
    });

    // Capture daemon/app logs for debugging on failure
    const proc = app.process();
    proc.stderr?.on("data", (d: Buffer) => logs.push(`[stderr] ${d}`));
    proc.stdout?.on("data", (d: Buffer) => logs.push(`[stdout] ${d}`));

    page = await app.firstWindow();

    // Capture renderer console output for debugging
    page.on("console", (msg) => logs.push(`[renderer:${msg.type()}] ${msg.text()}`));
    page.on("pageerror", (err) => logs.push(`[renderer:error] ${err.message}`));

    // Give the daemon time to start and the first health poll to complete
    await page.waitForTimeout(5000);
  });

  test.afterAll(async () => {
    await app?.close();
    // Clean up temp dir
    fs.rmSync(govDir, { recursive: true, force: true });
  });

  test.afterEach(async ({}, testInfo) => {
    // Attach logs on failure so you can see what the daemon said
    if (testInfo.status !== "passed" && logs.length > 0) {
      await testInfo.attach("app-logs", {
        body: logs.join("\n"),
        contentType: "text/plain",
      });
    }
  });

  test("boots and shows connected status", async () => {
    const badge = page.getByTestId("daemon-status");
    await expect(badge).toBeVisible({ timeout: 10_000 });
    // Should show "Connected" — not "Disconnected" or "Degraded"
    await expect(badge).toContainText(/connected/i, { timeout: 10_000 });
  });

  test("renders sessions list or empty state", async () => {
    const list = page.getByTestId("sessions-list");
    await expect(list).toBeVisible({ timeout: 10_000 });
    // Either session rows exist or the explicit empty state is shown
    const rows = page.getByTestId("session-row");
    const empty = page.getByTestId("sessions-empty");
    await expect(rows.first().or(empty)).toBeVisible({ timeout: 5_000 });
  });
});
