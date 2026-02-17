// SPDX-License-Identifier: Apache-2.0
/** IPC channel names — single source of truth for main, preload, and renderer. */

export const Channels = {
  // Connection
  HEALTH: 'governor:health',
  CONNECT: 'governor:connect',

  // Governor state
  NOW: 'governor:now',
  STATUS: 'governor:status',

  // Sessions
  SESSIONS_LIST: 'sessions:list',
  SESSIONS_CREATE: 'sessions:create',
  SESSIONS_DELETE: 'sessions:delete',
  SESSIONS_GET: 'sessions:get',

  // Intent compiler
  INTENT_TEMPLATES: 'intent:templates',
  INTENT_SCHEMA: 'intent:schema',
  INTENT_VALIDATE: 'intent:validate',
  INTENT_COMPILE: 'intent:compile',
  INTENT_POLICY: 'intent:policy',

  // Receipts
  RECEIPTS_LIST: 'receipts:list',
  RECEIPTS_DETAIL: 'receipts:detail',

  // Scars
  SCARS_LIST: 'scars:list',
  SCARS_HISTORY: 'scars:history',

  // Commit / waive
  COMMIT_PENDING: 'commit:pending',
  COMMIT_FIX: 'commit:fix',
  COMMIT_REVISE: 'commit:revise',
  COMMIT_PROCEED: 'commit:proceed',
  COMMIT_EXCEPTIONS: 'commit:exceptions',
} as const;

export type Channel = (typeof Channels)[keyof typeof Channels];
