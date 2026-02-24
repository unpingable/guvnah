// SPDX-License-Identifier: Apache-2.0
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

  operatorSnapshot: () => ipcRenderer.invoke(Channels.OPERATOR_SNAPSHOT),
  correlatorStatus: () => ipcRenderer.invoke(Channels.CORRELATOR_STATUS),
  correlatorHistory: (limit?: number) => ipcRenderer.invoke(Channels.CORRELATOR_HISTORY, limit),
  correlatorKvector: () => ipcRenderer.invoke(Channels.CORRELATOR_KVECTOR),
  receiptsV1List: (limit?: number) => ipcRenderer.invoke(Channels.RECEIPTS_V1_LIST, limit),
  receiptsV1Detail: (receiptId: string) => ipcRenderer.invoke(Channels.RECEIPTS_V1_DETAIL, receiptId),
  receiptsV1Verify: () => ipcRenderer.invoke(Channels.RECEIPTS_V1_VERIFY),
  traceTail: (limit?: number) => ipcRenderer.invoke(Channels.TRACE_TAIL, limit),

  claimsList: (opts?) => ipcRenderer.invoke(Channels.CLAIMS_LIST, opts),
  claimsDetail: (claimId: string) => ipcRenderer.invoke(Channels.CLAIMS_DETAIL, claimId),
  claimsForReceipt: (receiptId: string) => ipcRenderer.invoke(Channels.CLAIMS_FOR_RECEIPT, receiptId),
  claimsWindow: (since: string, until?: string, limit?: number) => ipcRenderer.invoke(Channels.CLAIMS_WINDOW, since, until, limit),
  claimsStats: () => ipcRenderer.invoke(Channels.CLAIMS_STATS),

  chainPreflight: (toolId: string, correlationId: string, args?: Record<string, unknown>, exceptions?: string[]) =>
    ipcRenderer.invoke(Channels.CHAIN_PREFLIGHT, toolId, correlationId, args, exceptions),
  chainRecord: (toolId: string, correlationId: string, resultStatus: string, opts?: { args?: Record<string, unknown>; preflightToken?: string; recordId?: string }) =>
    ipcRenderer.invoke(Channels.CHAIN_RECORD, toolId, correlationId, resultStatus, opts),
  chainStatus: (correlationId?: string) =>
    ipcRenderer.invoke(Channels.CHAIN_STATUS, correlationId),
};

contextBridge.exposeInMainWorld('governor', api);
