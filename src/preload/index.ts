/**
 * Preload script — contextBridge exposes typed API to renderer.
 * Renderer NEVER touches Node APIs. All system access through this bridge.
 * 100% reusable renderer code — only this file changes for Tauri migration.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { Channels } from '../shared/channels.js';
import type { GovernorAPI } from '../shared/types.js';

const api: GovernorAPI = {
  health: () => ipcRenderer.invoke(Channels.HEALTH),
  connect: (baseUrl: string) => ipcRenderer.invoke(Channels.CONNECT, baseUrl),
  now: () => ipcRenderer.invoke(Channels.NOW),
  status: () => ipcRenderer.invoke(Channels.STATUS),

  listSessions: () => ipcRenderer.invoke(Channels.SESSIONS_LIST),
  createSession: (title: string) => ipcRenderer.invoke(Channels.SESSIONS_CREATE, title),
  deleteSession: (id: string) => ipcRenderer.invoke(Channels.SESSIONS_DELETE, id),
  getSession: (id: string) => ipcRenderer.invoke(Channels.SESSIONS_GET, id),

  intentTemplates: () => ipcRenderer.invoke(Channels.INTENT_TEMPLATES),
  intentSchema: (name: string) => ipcRenderer.invoke(Channels.INTENT_SCHEMA, name),
  intentValidate: (schemaId: string, values: Record<string, unknown>) =>
    ipcRenderer.invoke(Channels.INTENT_VALIDATE, schemaId, values),
  intentCompile: (schemaId: string, values: Record<string, unknown>) =>
    ipcRenderer.invoke(Channels.INTENT_COMPILE, schemaId, values),
  intentPolicy: () => ipcRenderer.invoke(Channels.INTENT_POLICY),

  listReceipts: (filter?) => ipcRenderer.invoke(Channels.RECEIPTS_LIST, filter),
  receiptDetail: (id: string) => ipcRenderer.invoke(Channels.RECEIPTS_DETAIL, id),

  listScars: () => ipcRenderer.invoke(Channels.SCARS_LIST),
  scarsHistory: (limit?: number) => ipcRenderer.invoke(Channels.SCARS_HISTORY, limit),

  commitPending: () => ipcRenderer.invoke(Channels.COMMIT_PENDING),
  commitFix: (correctedText?: string) => ipcRenderer.invoke(Channels.COMMIT_FIX, correctedText),
  commitRevise: () => ipcRenderer.invoke(Channels.COMMIT_REVISE),
  commitProceed: (reason: string) => ipcRenderer.invoke(Channels.COMMIT_PROCEED, reason),
  commitExceptions: () => ipcRenderer.invoke(Channels.COMMIT_EXCEPTIONS),
};

contextBridge.exposeInMainWorld('governor', api);
