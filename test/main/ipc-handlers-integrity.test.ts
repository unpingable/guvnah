// SPDX-License-Identifier: Apache-2.0
/**
 * Tests for integrity IPC handlers — forwarding tests for 8 new channels.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Channels } from '../../src/shared/channels';
import {
  sampleOperatorSnapshot,
  sampleCorrelatorStatus,
  sampleDiagnosticHistory,
  sampleKVector,
  sampleReceiptsV1,
  sampleVerifyResult,
  sampleTraceResponse,
  sampleClaimsStats,
  sampleClaimsWindow,
  sampleClaimDetail,
  sampleClaimSummary1,
  sampleClaimSummary2,
} from '../fixtures/integrity-payloads';

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

import { ipcMain } from 'electron';

function getHandler(channel: string): (...args: unknown[]) => unknown {
  const handlers = (ipcMain as unknown as { _handlers: Map<string, (...args: unknown[]) => unknown> })._handlers;
  const handler = handlers.get(channel);
  if (!handler) throw new Error(`No handler for ${channel}`);
  return handler;
}

function createMockClient() {
  return {
    health: vi.fn(),
    setBaseUrl: vi.fn(),
    setGovernorDir: vi.fn(),
    now: vi.fn(),
    status: vi.fn(),
    listSessions: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn(),
    getSession: vi.fn(),
    intentTemplates: vi.fn(),
    intentSchema: vi.fn(),
    intentValidate: vi.fn(),
    intentCompile: vi.fn(),
    intentPolicy: vi.fn(),
    listReceipts: vi.fn(),
    receiptDetail: vi.fn(),
    listScars: vi.fn(),
    scarsHistory: vi.fn(),
    commitPending: vi.fn(),
    commitFix: vi.fn(),
    commitRevise: vi.fn(),
    commitProceed: vi.fn(),
    commitExceptions: vi.fn(),
    operatorSnapshot: vi.fn().mockResolvedValue(sampleOperatorSnapshot),
    correlatorStatus: vi.fn().mockResolvedValue(sampleCorrelatorStatus),
    correlatorHistory: vi.fn().mockResolvedValue(sampleDiagnosticHistory),
    correlatorKvector: vi.fn().mockResolvedValue(sampleKVector),
    receiptsV1List: vi.fn().mockResolvedValue(sampleReceiptsV1),
    receiptsV1Detail: vi.fn().mockResolvedValue(sampleReceiptsV1[0]),
    receiptsV1Verify: vi.fn().mockResolvedValue(sampleVerifyResult),
    traceTail: vi.fn().mockResolvedValue(sampleTraceResponse),
    claimsList: vi.fn().mockResolvedValue([sampleClaimSummary1, sampleClaimSummary2]),
    claimsDetail: vi.fn().mockResolvedValue(sampleClaimDetail),
    claimsForReceipt: vi.fn().mockResolvedValue([sampleClaimSummary1]),
    claimsWindow: vi.fn().mockResolvedValue(sampleClaimsWindow),
    claimsStats: vi.fn().mockResolvedValue(sampleClaimsStats),
    chainPreflight: vi.fn().mockResolvedValue({ decision: 'allow', mode: 'detect_only' }),
    chainRecord: vi.fn().mockResolvedValue({ recorded: true, correlation_id: 'task-1', history_length: 1 }),
    chainStatus: vi.fn().mockResolvedValue({ load_status: 'loaded', rule_count: 3, mode: 'detect_only' }),
    chainEvaluate: vi.fn().mockResolvedValue({ kernel_verdict: 'allow', effective_verdict: 'allow', mode: 'detect_only', composition_match: false, matched_rule_ids: [], history_length: 1, action_log_hash: 'abc', verdict_reason: 'allow', deprecated: true }),
    chainRules: vi.fn().mockResolvedValue({ load_status: 'loaded', rule_set_version: 'v1', rule_count: 2, rules: [{ rule_id: 'r1', description: 'test', effect: 'deny', prior_sensitivity_gte: null, prior_capability: null, prior_trust_domain: null, proposed_capability: null, proposed_trust_domain: null, unless_condition: null }] }),
    chainReset: vi.fn().mockResolvedValue({ reset: true, correlation_id: 'task-1', previous_history_length: 3, log_existed: true }),
  };
}

function createMockMonitor() {
  return { stop: vi.fn(), start: vi.fn() };
}

describe('IPC Handlers — Integrity channels', () => {
  let client: ReturnType<typeof createMockClient>;
  let monitor: ReturnType<typeof createMockMonitor>;

  beforeEach(async () => {
    client = createMockClient();
    monitor = createMockMonitor();
    const handlers = (ipcMain as unknown as { _handlers: Map<string, unknown> })._handlers;
    handlers.clear();
    const { registerIpcHandlers } = await import('../../src/main/ipc-handlers');
    registerIpcHandlers(client as any, monitor as any);
  });

  it('registers handlers for all integrity channels', () => {
    const integrityChannels = [
      Channels.OPERATOR_SNAPSHOT,
      Channels.CORRELATOR_STATUS,
      Channels.CORRELATOR_HISTORY,
      Channels.CORRELATOR_KVECTOR,
      Channels.RECEIPTS_V1_LIST,
      Channels.RECEIPTS_V1_DETAIL,
      Channels.RECEIPTS_V1_VERIFY,
      Channels.TRACE_TAIL,
      Channels.CLAIMS_LIST,
      Channels.CLAIMS_DETAIL,
      Channels.CLAIMS_FOR_RECEIPT,
      Channels.CLAIMS_WINDOW,
      Channels.CLAIMS_STATS,
      Channels.CHAIN_EVALUATE,
      Channels.CHAIN_RULES,
      Channels.CHAIN_RESET,
    ];
    const handlers = (ipcMain as unknown as { _handlers: Map<string, unknown> })._handlers;
    for (const channel of integrityChannels) {
      expect(handlers.has(channel), `Missing handler for ${channel}`).toBe(true);
    }
  });

  it('operator:snapshot forwards to client.operatorSnapshot()', async () => {
    const handler = getHandler(Channels.OPERATOR_SNAPSHOT);
    const result = await handler({});
    expect(client.operatorSnapshot).toHaveBeenCalled();
    expect(result).toEqual(sampleOperatorSnapshot);
  });

  it('correlator:status forwards to client.correlatorStatus()', async () => {
    const handler = getHandler(Channels.CORRELATOR_STATUS);
    const result = await handler({});
    expect(client.correlatorStatus).toHaveBeenCalled();
    expect(result).toEqual(sampleCorrelatorStatus);
  });

  it('correlator:history forwards limit', async () => {
    const handler = getHandler(Channels.CORRELATOR_HISTORY);
    await handler({}, 50);
    expect(client.correlatorHistory).toHaveBeenCalledWith(50);
  });

  it('correlator:kvector forwards to client.correlatorKvector()', async () => {
    const handler = getHandler(Channels.CORRELATOR_KVECTOR);
    const result = await handler({});
    expect(client.correlatorKvector).toHaveBeenCalled();
    expect(result).toEqual(sampleKVector);
  });

  it('receipts_v1:list forwards limit', async () => {
    const handler = getHandler(Channels.RECEIPTS_V1_LIST);
    await handler({}, 100);
    expect(client.receiptsV1List).toHaveBeenCalledWith(100);
  });

  it('receipts_v1:detail forwards receipt id', async () => {
    const handler = getHandler(Channels.RECEIPTS_V1_DETAIL);
    await handler({}, 'r-001');
    expect(client.receiptsV1Detail).toHaveBeenCalledWith('r-001');
  });

  it('receipts_v1:verify forwards to client.receiptsV1Verify()', async () => {
    const handler = getHandler(Channels.RECEIPTS_V1_VERIFY);
    const result = await handler({});
    expect(client.receiptsV1Verify).toHaveBeenCalled();
    expect(result).toEqual(sampleVerifyResult);
  });

  it('trace:tail forwards limit', async () => {
    const handler = getHandler(Channels.TRACE_TAIL);
    await handler({}, 200);
    expect(client.traceTail).toHaveBeenCalledWith(200);
  });

  // --- Claims ---

  it('claims:list forwards opts', async () => {
    const handler = getHandler(Channels.CLAIMS_LIST);
    const opts = { limit: 10 };
    await handler({}, opts);
    expect(client.claimsList).toHaveBeenCalledWith(opts);
  });

  it('claims:detail forwards claim_id', async () => {
    const handler = getHandler(Channels.CLAIMS_DETAIL);
    await handler({}, 'c-001');
    expect(client.claimsDetail).toHaveBeenCalledWith('c-001');
  });

  it('claims:for_receipt forwards receipt_id', async () => {
    const handler = getHandler(Channels.CLAIMS_FOR_RECEIPT);
    await handler({}, 'r-001');
    expect(client.claimsForReceipt).toHaveBeenCalledWith('r-001');
  });

  it('claims:window forwards since/until/limit', async () => {
    const handler = getHandler(Channels.CLAIMS_WINDOW);
    await handler({}, '2026-02-20T00:00:00Z', undefined, 50);
    expect(client.claimsWindow).toHaveBeenCalledWith('2026-02-20T00:00:00Z', undefined, 50);
  });

  it('claims:stats forwards to client.claimsStats()', async () => {
    const handler = getHandler(Channels.CLAIMS_STATS);
    const result = await handler({});
    expect(client.claimsStats).toHaveBeenCalled();
    expect(result).toEqual(sampleClaimsStats);
  });

  // --- Chain Composition ---

  it('chain:preflight forwards toolId, correlationId, args, exceptions', async () => {
    const handler = getHandler(Channels.CHAIN_PREFLIGHT);
    await handler({}, 'read_file', 'task-1', { path: '/etc/passwd' }, ['rule-1']);
    expect(client.chainPreflight).toHaveBeenCalledWith('read_file', 'task-1', { path: '/etc/passwd' }, ['rule-1']);
  });

  it('chain:record forwards toolId, correlationId, resultStatus, opts', async () => {
    const handler = getHandler(Channels.CHAIN_RECORD);
    const opts = { preflightToken: 'tok', recordId: 'rid-1' };
    await handler({}, 'write_file', 'task-2', 'ok', opts);
    expect(client.chainRecord).toHaveBeenCalledWith('write_file', 'task-2', 'ok', opts);
  });

  it('chain:status forwards correlationId', async () => {
    const handler = getHandler(Channels.CHAIN_STATUS);
    await handler({}, 'task-3');
    expect(client.chainStatus).toHaveBeenCalledWith('task-3');
  });

  it('chain:evaluate forwards all params', async () => {
    const handler = getHandler(Channels.CHAIN_EVALUATE);
    await handler({}, 'read_file', 'task-4', { path: '/tmp' }, 'ok', ['rule-1']);
    expect(client.chainEvaluate).toHaveBeenCalledWith('read_file', 'task-4', { path: '/tmp' }, 'ok', ['rule-1']);
  });

  it('chain:rules forwards to client.chainRules()', async () => {
    const handler = getHandler(Channels.CHAIN_RULES);
    const result = await handler({});
    expect(client.chainRules).toHaveBeenCalled();
    expect(result.rule_count).toBe(2);
  });

  it('chain:reset forwards correlationId', async () => {
    const handler = getHandler(Channels.CHAIN_RESET);
    const result = await handler({}, 'task-1');
    expect(client.chainReset).toHaveBeenCalledWith('task-1');
    expect(result).toEqual({ reset: true, correlation_id: 'task-1', previous_history_length: 3, log_existed: true });
  });
});
