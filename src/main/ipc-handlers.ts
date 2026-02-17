// SPDX-License-Identifier: Apache-2.0
/**
 * IPC handler registration — wires all channels to GovernorClient methods.
 * Each handler is a thin forwarding layer; no business logic here.
 */

import { ipcMain } from 'electron';
import { Channels } from '../shared/channels.js';
import { GovernorClient } from './rpc-client.js';
import { ConnectionMonitor } from './connection.js';

export function registerIpcHandlers(client: GovernorClient, monitor: ConnectionMonitor): void {
  // --- Connection ---

  ipcMain.handle(Channels.HEALTH, async () => {
    return client.health();
  });

  ipcMain.handle(Channels.CONNECT, async (_event, dirOrUrl: string) => {
    client.setGovernorDir(dirOrUrl);
    monitor.stop();
    monitor.start();
  });

  // --- Governor State ---

  ipcMain.handle(Channels.NOW, async () => {
    return client.now();
  });

  ipcMain.handle(Channels.STATUS, async () => {
    return client.status();
  });

  // --- Sessions ---

  ipcMain.handle(Channels.SESSIONS_LIST, async () => {
    return client.listSessions();
  });

  ipcMain.handle(Channels.SESSIONS_CREATE, async (_event, title: string) => {
    return client.createSession(title);
  });

  ipcMain.handle(Channels.SESSIONS_DELETE, async (_event, id: string) => {
    return client.deleteSession(id);
  });

  ipcMain.handle(Channels.SESSIONS_GET, async (_event, id: string) => {
    return client.getSession(id);
  });

  // --- Intent Compiler ---

  ipcMain.handle(Channels.INTENT_TEMPLATES, async () => {
    return client.intentTemplates();
  });

  ipcMain.handle(Channels.INTENT_SCHEMA, async (_event, templateName: string) => {
    return client.intentSchema(templateName);
  });

  ipcMain.handle(Channels.INTENT_VALIDATE, async (_event, schemaId: string, values: Record<string, unknown>) => {
    return client.intentValidate(schemaId, values);
  });

  ipcMain.handle(Channels.INTENT_COMPILE, async (_event, schemaId: string, values: Record<string, unknown>) => {
    return client.intentCompile(schemaId, values);
  });

  ipcMain.handle(Channels.INTENT_POLICY, async () => {
    return client.intentPolicy();
  });

  // --- Receipts ---

  ipcMain.handle(Channels.RECEIPTS_LIST, async (_event, filter?: { gate?: string; verdict?: string; limit?: number }) => {
    return client.listReceipts(filter);
  });

  ipcMain.handle(Channels.RECEIPTS_DETAIL, async (_event, receiptId: string) => {
    return client.receiptDetail(receiptId);
  });

  // --- Scars ---

  ipcMain.handle(Channels.SCARS_LIST, async () => {
    return client.listScars();
  });

  ipcMain.handle(Channels.SCARS_HISTORY, async (_event, limit?: number) => {
    return client.scarsHistory(limit);
  });

  // --- Commit / Waive ---

  ipcMain.handle(Channels.COMMIT_PENDING, async () => {
    return client.commitPending();
  });

  ipcMain.handle(Channels.COMMIT_FIX, async (_event, correctedText?: string) => {
    return client.commitFix(correctedText);
  });

  ipcMain.handle(Channels.COMMIT_REVISE, async () => {
    return client.commitRevise();
  });

  ipcMain.handle(Channels.COMMIT_PROCEED, async (_event, reason: string) => {
    return client.commitProceed(reason);
  });

  ipcMain.handle(Channels.COMMIT_EXCEPTIONS, async () => {
    return client.commitExceptions();
  });
}
