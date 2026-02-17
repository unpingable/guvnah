// SPDX-License-Identifier: Apache-2.0
/**
 * Electron main process — app lifecycle, BrowserWindow, tray.
 * All system access isolated here for Tauri migration.
 *
 * Spawns the governor daemon as a child process and talks JSON-RPC over stdio.
 */

import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GovernorClient } from './rpc-client.js';
import { ConnectionMonitor } from './connection.js';
import { registerIpcHandlers } from './ipc-handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve governor directory — default to cwd/.governor, override with GOVERNOR_DIR
const governorDir = process.env['GOVERNOR_DIR'] || process.cwd();
const governorMode = process.env['GOVERNOR_MODE'] || 'general';
const isE2E = process.env['GUVNAH_E2E'] === '1';

if (isE2E) {
  console.error(`[guvnah] E2E mode: governor_dir=${governorDir} mode=${governorMode}`);
}

const client = new GovernorClient(governorDir, governorMode);
const monitor = new ConnectionMonitor(client);

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    title: 'Guvnah',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: !isE2E, // Playwright injects a loader that breaks ESM sandbox preloads
    },
  });

  const rendererPath = path.join(__dirname, '..', 'renderer', 'index.html');
  win.loadFile(rendererPath);

  return win;
}

app.whenReady().then(() => {
  client.start();
  registerIpcHandlers(client, monitor);
  createWindow();
  monitor.start();
});

app.on('window-all-closed', () => {
  monitor.stop();
  client.stop();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
