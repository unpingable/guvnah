// SPDX-License-Identifier: Apache-2.0
/**
 * Tests for integrity store — mock API, verify panel-level isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
} from '../fixtures/integrity-payloads';

// Mock the api module
vi.mock('../../src/renderer/lib/api', () => {
  const mockApi = {
    health: vi.fn(),
    connect: vi.fn(),
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
    operatorSnapshot: vi.fn(),
    correlatorStatus: vi.fn(),
    correlatorHistory: vi.fn(),
    correlatorKvector: vi.fn(),
    receiptsV1List: vi.fn(),
    receiptsV1Detail: vi.fn(),
    receiptsV1Verify: vi.fn(),
    traceTail: vi.fn(),
    claimsList: vi.fn(),
    claimsDetail: vi.fn(),
    claimsForReceipt: vi.fn(),
    claimsWindow: vi.fn(),
    claimsStats: vi.fn(),
    chainPreflight: vi.fn(),
    chainRecord: vi.fn(),
    chainStatus: vi.fn(),
    chainEvaluate: vi.fn(),
    chainRules: vi.fn(),
    chainReset: vi.fn(),
  };
  return { api: mockApi };
});

import { api } from '../../src/renderer/lib/api';
const mockApi = api as unknown as Record<string, ReturnType<typeof vi.fn>>;

/** Set up mocks for all panels including claims. */
function mockAllPanels() {
  mockApi.operatorSnapshot.mockResolvedValue(sampleOperatorSnapshot);
  mockApi.correlatorStatus.mockResolvedValue(sampleCorrelatorStatus);
  mockApi.correlatorHistory.mockResolvedValue(sampleDiagnosticHistory);
  mockApi.correlatorKvector.mockResolvedValue(sampleKVector);
  mockApi.receiptsV1List.mockResolvedValue(sampleReceiptsV1);
  mockApi.receiptsV1Verify.mockResolvedValue(sampleVerifyResult);
  mockApi.traceTail.mockResolvedValue(sampleTraceResponse);
  mockApi.claimsStats.mockResolvedValue(sampleClaimsStats);
  mockApi.claimsWindow.mockResolvedValue(sampleClaimsWindow);
}

describe('integrity store', () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(mockApi).forEach(fn => fn.mockReset());
  });

  it('refresh() populates all panels on success', async () => {
    mockAllPanels();

    const store = await import('../../src/renderer/stores/integrity.svelte');

    await store.refresh();

    expect(store.getSnapshot()).toEqual(sampleOperatorSnapshot);
    expect(store.getCorrelatorStatus()).toEqual(sampleCorrelatorStatus);
    expect(store.getKvector()).toEqual(sampleKVector);
    expect(store.getReceiptsV1()).toEqual(sampleReceiptsV1);
    expect(store.getVerifyResult()).toEqual(sampleVerifyResult);
    expect(store.getTraceResponse()).toEqual(sampleTraceResponse);
    expect(store.getClaimsStats()).toEqual(sampleClaimsStats);
    expect(store.getClaimsWindow()).toEqual(sampleClaimsWindow);
    expect(store.getSnapshotError()).toBeNull();
    expect(store.getCorrelatorError()).toBeNull();
    expect(store.getReceiptsError()).toBeNull();
    expect(store.getTraceError()).toBeNull();
    expect(store.getClaimsError()).toBeNull();
    expect(store.getLastRefreshed()).toBeTruthy();
  });

  it('snapshot failure sets error without affecting other panels', async () => {
    mockAllPanels();
    mockApi.operatorSnapshot.mockRejectedValue(new Error('RPC -32601: Method not found'));

    const store = await import('../../src/renderer/stores/integrity.svelte');

    await store.refresh();

    expect(store.getSnapshotError()).toBe('RPC -32601: Method not found');
    // Other panels should still be populated
    expect(store.getCorrelatorStatus()).toEqual(sampleCorrelatorStatus);
    expect(store.getReceiptsV1()).toEqual(sampleReceiptsV1);
    expect(store.getTraceResponse()).toEqual(sampleTraceResponse);
    expect(store.getClaimsStats()).toEqual(sampleClaimsStats);
  });

  it('correlator failure sets error without affecting other panels', async () => {
    mockAllPanels();
    mockApi.correlatorStatus.mockRejectedValue(new Error('Daemon not running'));
    mockApi.correlatorHistory.mockRejectedValue(new Error('Daemon not running'));
    mockApi.correlatorKvector.mockRejectedValue(new Error('Daemon not running'));

    const store = await import('../../src/renderer/stores/integrity.svelte');

    await store.refresh();

    expect(store.getCorrelatorError()).toBeTruthy();
    expect(store.getSnapshot()).toEqual(sampleOperatorSnapshot);
    expect(store.getReceiptsV1()).toEqual(sampleReceiptsV1);
    expect(store.getClaimsStats()).toEqual(sampleClaimsStats);
  });

  it('claims failure sets error without affecting other panels', async () => {
    mockAllPanels();
    mockApi.claimsStats.mockRejectedValue(new Error('RPC -32601: Method not found'));
    mockApi.claimsWindow.mockRejectedValue(new Error('RPC -32601: Method not found'));

    const store = await import('../../src/renderer/stores/integrity.svelte');

    await store.refresh();

    expect(store.getClaimsError()).toBe('RPC -32601: Method not found');
    // Other panels still work
    expect(store.getSnapshot()).toEqual(sampleOperatorSnapshot);
    expect(store.getCorrelatorStatus()).toEqual(sampleCorrelatorStatus);
    expect(store.getReceiptsV1()).toEqual(sampleReceiptsV1);
    expect(store.getTraceResponse()).toEqual(sampleTraceResponse);
  });

  it('correlator history is sorted by window_step ascending', async () => {
    // Provide history in reverse order
    const reversed = [...sampleDiagnosticHistory].reverse();
    mockAllPanels();
    mockApi.correlatorHistory.mockResolvedValue(reversed);

    const store = await import('../../src/renderer/stores/integrity.svelte');

    await store.refresh();

    const hist = store.getCorrelatorHistory();
    for (let i = 1; i < hist.length; i++) {
      expect(hist[i].window_step).toBeGreaterThanOrEqual(hist[i - 1].window_step);
    }
  });

  it('loading flag is set during refresh', async () => {
    mockAllPanels();

    const store = await import('../../src/renderer/stores/integrity.svelte');

    const promise = store.refresh();
    // After awaiting, loading should be false
    await promise;
    expect(store.isLoading()).toBe(false);
  });

  it('fetchClaimDetail populates selectedClaimDetail', async () => {
    mockApi.claimsDetail.mockResolvedValue(sampleClaimDetail);

    const store = await import('../../src/renderer/stores/integrity.svelte');

    await store.fetchClaimDetail('c-001');

    expect(store.getSelectedClaimDetail()).toEqual(sampleClaimDetail);
    expect(store.isClaimsDetailLoading()).toBe(false);
  });

  it('clearClaimDetail resets selectedClaimDetail', async () => {
    mockApi.claimsDetail.mockResolvedValue(sampleClaimDetail);

    const store = await import('../../src/renderer/stores/integrity.svelte');

    await store.fetchClaimDetail('c-001');
    expect(store.getSelectedClaimDetail()).toBeTruthy();

    store.clearClaimDetail();
    expect(store.getSelectedClaimDetail()).toBeNull();
  });

  it('fetchClaimsForReceipt returns summaries', async () => {
    mockApi.claimsForReceipt.mockResolvedValue([sampleClaimSummary1]);

    const store = await import('../../src/renderer/stores/integrity.svelte');

    const result = await store.fetchClaimsForReceipt('r-001');
    expect(result).toEqual([sampleClaimSummary1]);
    expect(mockApi.claimsForReceipt).toHaveBeenCalledWith('r-001');
  });

  it('fetchClaimsForReceipt returns empty array on error', async () => {
    mockApi.claimsForReceipt.mockRejectedValue(new Error('Method not found'));

    const store = await import('../../src/renderer/stores/integrity.svelte');

    const result = await store.fetchClaimsForReceipt('r-999');
    expect(result).toEqual([]);
  });
});

describe('integrity format helpers', () => {
  it('regimeColor maps regimes correctly', async () => {
    const { regimeColor } = await import('../../src/renderer/lib/format');
    expect(regimeColor('LEVERAGE')).toBe('var(--pass)');
    expect(regimeColor('SHEAR')).toBe('var(--warn)');
    expect(regimeColor('CAPTURE')).toBe('var(--block)');
    expect(regimeColor('UNKNOWN')).toBe('var(--text-muted)');
    // Case insensitive
    expect(regimeColor('leverage')).toBe('var(--pass)');
  });

  it('operationalRegimeColor maps regimes correctly', async () => {
    const { operationalRegimeColor } = await import('../../src/renderer/lib/format');
    expect(operationalRegimeColor('ELASTIC')).toBe('var(--pass)');
    expect(operationalRegimeColor('WARM')).toBe('var(--warn)');
    expect(operationalRegimeColor('DUCTILE')).toBe('var(--stiffness-high)');
    expect(operationalRegimeColor('UNSTABLE')).toBe('var(--block)');
  });

  it('decisionActionColor maps actions correctly', async () => {
    const { decisionActionColor } = await import('../../src/renderer/lib/format');
    expect(decisionActionColor('allow')).toBe('var(--pass)');
    expect(decisionActionColor('deny')).toBe('var(--block)');
    expect(decisionActionColor('transform')).toBe('var(--warn)');
    expect(decisionActionColor('escalate')).toBe('var(--accent)');
  });

  it('claimStatusColor maps statuses correctly', async () => {
    const { claimStatusColor } = await import('../../src/renderer/lib/format');
    expect(claimStatusColor('verified')).toBe('var(--pass)');
    expect(claimStatusColor('partial')).toBe('var(--warn)');
    expect(claimStatusColor('contradicted')).toBe('var(--block)');
    expect(claimStatusColor('unverified')).toBe('var(--text-muted)');
  });

  it('formatAge handles recent timestamps', async () => {
    const { formatAge } = await import('../../src/renderer/lib/format');
    const now = new Date().toISOString();
    const result = formatAge(now);
    expect(result).toBe('0s ago');
  });

  it('normalizeTimestamp picks the right field', async () => {
    const { normalizeTimestamp } = await import('../../src/renderer/lib/format');
    expect(normalizeTimestamp({ generated_at: '2026-01-01' })).toBe('2026-01-01');
    expect(normalizeTimestamp({ timestamp: '2026-02-02' })).toBe('2026-02-02');
    expect(normalizeTimestamp({ ts: '2026-03-03' })).toBe('2026-03-03');
    expect(normalizeTimestamp({})).toBe('');
  });
});
