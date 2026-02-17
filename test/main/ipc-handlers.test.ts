// SPDX-License-Identifier: Apache-2.0
/**
 * Tests for IPC handlers — mock client, verify forwarding.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Channels } from '../../src/shared/channels';

// Mock electron
vi.mock('electron', () => {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  return {
    ipcMain: {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
      _handlers: handlers,
    },
  };
});

// Get the mock after mocking
import { ipcMain } from 'electron';

function getHandler(channel: string): (...args: unknown[]) => unknown {
  const handlers = (ipcMain as unknown as { _handlers: Map<string, (...args: unknown[]) => unknown> })._handlers;
  const handler = handlers.get(channel);
  if (!handler) throw new Error(`No handler for ${channel}`);
  return handler;
}

// Mock GovernorClient
function createMockClient() {
  return {
    health: vi.fn().mockResolvedValue({ status: 'ok' }),
    setBaseUrl: vi.fn(),
    setGovernorDir: vi.fn(),
    now: vi.fn().mockResolvedValue({ pill: 'OK' }),
    status: vi.fn().mockResolvedValue({ mode: 'code' }),
    listSessions: vi.fn().mockResolvedValue([]),
    createSession: vi.fn().mockResolvedValue({ id: '1' }),
    deleteSession: vi.fn().mockResolvedValue(true),
    getSession: vi.fn().mockResolvedValue({ id: '1' }),
    intentTemplates: vi.fn().mockResolvedValue({ templates: [] }),
    intentSchema: vi.fn().mockResolvedValue({ schema_id: 'x' }),
    intentValidate: vi.fn().mockResolvedValue({ valid: true }),
    intentCompile: vi.fn().mockResolvedValue({ intent_profile: 'greenfield' }),
    intentPolicy: vi.fn().mockResolvedValue({ mode: 'code', policy: 'TEMPLATE_ONLY' }),
    listReceipts: vi.fn().mockResolvedValue([]),
    receiptDetail: vi.fn().mockResolvedValue({ receipt: {} }),
    listScars: vi.fn().mockResolvedValue({ scars: [] }),
    scarsHistory: vi.fn().mockResolvedValue([]),
    commitPending: vi.fn().mockResolvedValue(null),
    commitFix: vi.fn().mockResolvedValue({ success: true }),
    commitRevise: vi.fn().mockResolvedValue({ success: true }),
    commitProceed: vi.fn().mockResolvedValue({ success: true }),
    commitExceptions: vi.fn().mockResolvedValue([]),
  };
}

function createMockMonitor() {
  return {
    stop: vi.fn(),
    start: vi.fn(),
  };
}

describe('IPC Handlers', () => {
  let client: ReturnType<typeof createMockClient>;
  let monitor: ReturnType<typeof createMockMonitor>;

  beforeEach(async () => {
    client = createMockClient();
    monitor = createMockMonitor();

    // Clear any previously registered handlers
    const handlers = (ipcMain as unknown as { _handlers: Map<string, unknown> })._handlers;
    handlers.clear();

    // Dynamically import to re-register handlers
    const { registerIpcHandlers } = await import('../../src/main/ipc-handlers');
    registerIpcHandlers(client as any, monitor as any);
  });

  it('registers handlers for all channels', () => {
    const allChannels = Object.values(Channels);
    for (const channel of allChannels) {
      expect(
        (ipcMain as unknown as { _handlers: Map<string, unknown> })._handlers.has(channel),
        `Missing handler for ${channel}`
      ).toBe(true);
    }
  });

  it('health forwards to client.health()', async () => {
    const handler = getHandler(Channels.HEALTH);
    const result = await handler({});
    expect(client.health).toHaveBeenCalled();
    expect(result).toEqual({ status: 'ok' });
  });

  it('connect sets governor dir and restarts monitor', async () => {
    const handler = getHandler(Channels.CONNECT);
    await handler({}, '/path/to/project');
    expect(client.setGovernorDir).toHaveBeenCalledWith('/path/to/project');
    expect(monitor.stop).toHaveBeenCalled();
    expect(monitor.start).toHaveBeenCalled();
  });

  it('sessions:list forwards to client.listSessions()', async () => {
    const handler = getHandler(Channels.SESSIONS_LIST);
    await handler({});
    expect(client.listSessions).toHaveBeenCalled();
  });

  it('sessions:create forwards title', async () => {
    const handler = getHandler(Channels.SESSIONS_CREATE);
    await handler({}, 'My Session');
    expect(client.createSession).toHaveBeenCalledWith('My Session');
  });

  it('sessions:delete forwards id', async () => {
    const handler = getHandler(Channels.SESSIONS_DELETE);
    await handler({}, 'abc');
    expect(client.deleteSession).toHaveBeenCalledWith('abc');
  });

  it('intent:schema forwards template name', async () => {
    const handler = getHandler(Channels.INTENT_SCHEMA);
    await handler({}, 'session_start');
    expect(client.intentSchema).toHaveBeenCalledWith('session_start');
  });

  it('intent:validate forwards schema id and values', async () => {
    const handler = getHandler(Channels.INTENT_VALIDATE);
    await handler({}, 'schema-1', { mode: 'code' });
    expect(client.intentValidate).toHaveBeenCalledWith('schema-1', { mode: 'code' });
  });

  it('intent:compile forwards schema id and values', async () => {
    const handler = getHandler(Channels.INTENT_COMPILE);
    await handler({}, 'schema-1', { mode: 'code' });
    expect(client.intentCompile).toHaveBeenCalledWith('schema-1', { mode: 'code' });
  });

  it('receipts:list forwards filter', async () => {
    const handler = getHandler(Channels.RECEIPTS_LIST);
    const filter = { gate: 'evidence_gate', limit: 10 };
    await handler({}, filter);
    expect(client.listReceipts).toHaveBeenCalledWith(filter);
  });

  it('receipts:detail forwards receipt id', async () => {
    const handler = getHandler(Channels.RECEIPTS_DETAIL);
    await handler({}, 'receipt-123');
    expect(client.receiptDetail).toHaveBeenCalledWith('receipt-123');
  });

  it('commit:proceed forwards reason', async () => {
    const handler = getHandler(Channels.COMMIT_PROCEED);
    await handler({}, 'because reasons');
    expect(client.commitProceed).toHaveBeenCalledWith('because reasons');
  });
});
