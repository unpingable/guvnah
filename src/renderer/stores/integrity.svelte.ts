// SPDX-License-Identifier: Apache-2.0
/** Execution Integrity store — panel-level error isolation. */

import { api } from '$lib/api';
import type {
  OperatorSnapshot,
  CorrelatorStatus,
  CorrelatorDiagnostic,
  KVector,
  ReceiptV1,
  ReceiptV1VerifyResult,
  TraceResponse,
  ClaimsStats,
  ClaimsWindow,
  ClaimDetail,
  ClaimVerificationSummary,
} from '$lib/types';

// --- State ---

let snapshot = $state<OperatorSnapshot | null>(null);
let correlatorStatus = $state<CorrelatorStatus | null>(null);
let correlatorHistory = $state<CorrelatorDiagnostic[]>([]);
let kvector = $state<KVector | null>(null);
let receiptsV1 = $state<ReceiptV1[]>([]);
let verifyResult = $state<ReceiptV1VerifyResult | null>(null);
let traceResponse = $state<TraceResponse | null>(null);
let loading = $state(false);

// Per-panel error flags
let snapshotError = $state<string | null>(null);
let correlatorError = $state<string | null>(null);
let receiptsError = $state<string | null>(null);
let traceError = $state<string | null>(null);

let lastRefreshed = $state<string | null>(null);

// Claims state
let claimsStats = $state<ClaimsStats | null>(null);
let claimsWindow = $state<ClaimsWindow | null>(null);
let selectedClaimDetail = $state<ClaimDetail | null>(null);
let claimsError = $state<string | null>(null);
let claimsDetailLoading = $state(false);

// --- Getters ---

export function getSnapshot(): OperatorSnapshot | null { return snapshot; }
export function getCorrelatorStatus(): CorrelatorStatus | null { return correlatorStatus; }
export function getCorrelatorHistory(): CorrelatorDiagnostic[] { return correlatorHistory; }
export function getKvector(): KVector | null { return kvector; }
export function getReceiptsV1(): ReceiptV1[] { return receiptsV1; }
export function getVerifyResult(): ReceiptV1VerifyResult | null { return verifyResult; }
export function getTraceResponse(): TraceResponse | null { return traceResponse; }
export function isLoading(): boolean { return loading; }
export function getLastRefreshed(): string | null { return lastRefreshed; }

export function getSnapshotError(): string | null { return snapshotError; }
export function getCorrelatorError(): string | null { return correlatorError; }
export function getReceiptsError(): string | null { return receiptsError; }
export function getTraceError(): string | null { return traceError; }

export function getClaimsStats(): ClaimsStats | null { return claimsStats; }
export function getClaimsWindow(): ClaimsWindow | null { return claimsWindow; }
export function getSelectedClaimDetail(): ClaimDetail | null { return selectedClaimDetail; }
export function getClaimsError(): string | null { return claimsError; }
export function isClaimsDetailLoading(): boolean { return claimsDetailLoading; }

// --- Fetchers ---

async function fetchSnapshot(): Promise<void> {
  try {
    snapshot = await api.operatorSnapshot();
    snapshotError = null;
  } catch (e) {
    snapshotError = e instanceof Error ? e.message : 'Failed to load snapshot';
  }
}

async function fetchCorrelator(): Promise<void> {
  try {
    const [status, history, kv] = await Promise.all([
      api.correlatorStatus(),
      api.correlatorHistory(100),
      api.correlatorKvector(),
    ]);
    correlatorStatus = status;
    // Sort history by window_step ascending
    correlatorHistory = history.sort((a, b) => a.window_step - b.window_step);
    kvector = kv;
    correlatorError = null;
  } catch (e) {
    correlatorError = e instanceof Error ? e.message : 'Failed to load correlator data';
  }
}

async function fetchReceipts(): Promise<void> {
  try {
    const [list, verify] = await Promise.all([
      api.receiptsV1List(100),
      api.receiptsV1Verify(),
    ]);
    receiptsV1 = list;
    verifyResult = verify;
    receiptsError = null;
  } catch (e) {
    receiptsError = e instanceof Error ? e.message : 'Failed to load receipts';
  }
}

async function fetchTrace(): Promise<void> {
  try {
    traceResponse = await api.traceTail(200);
    traceError = null;
  } catch (e) {
    traceError = e instanceof Error ? e.message : 'Failed to load trace';
  }
}

async function fetchClaims(): Promise<void> {
  try {
    // Fetch stats and recent window in parallel.
    // Window: last 24h — gives status breakdown and recent claims for the panel.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [stats, window] = await Promise.all([
      api.claimsStats(),
      api.claimsWindow(since, undefined, 50),
    ]);
    claimsStats = stats;
    claimsWindow = window;
    claimsError = null;
  } catch (e) {
    claimsError = e instanceof Error ? e.message : 'Failed to load claims';
  }
}

/** Refresh all panels. Each settles independently — one failure doesn't block others. */
export async function refresh(): Promise<void> {
  loading = true;
  await Promise.allSettled([
    fetchSnapshot(),
    fetchCorrelator(),
    fetchReceipts(),
    fetchTrace(),
    fetchClaims(),
  ]);
  lastRefreshed = new Date().toISOString();
  loading = false;
}

/** Fetch more receipts beyond the initial limit. */
export async function fetchMoreReceipts(limit: number = 500): Promise<void> {
  try {
    receiptsV1 = await api.receiptsV1List(limit);
    receiptsError = null;
  } catch (e) {
    receiptsError = e instanceof Error ? e.message : 'Failed to load receipts';
  }
}

/** Load full detail for a single claim. */
export async function fetchClaimDetail(claimId: string): Promise<void> {
  claimsDetailLoading = true;
  try {
    selectedClaimDetail = await api.claimsDetail(claimId);
  } catch (e) {
    selectedClaimDetail = null;
  }
  claimsDetailLoading = false;
}

/** Clear the selected claim detail (close drawer). */
export function clearClaimDetail(): void {
  selectedClaimDetail = null;
}

/** Fetch claims linked to a specific receipt. */
export async function fetchClaimsForReceipt(receiptId: string): Promise<ClaimVerificationSummary[]> {
  try {
    return await api.claimsForReceipt(receiptId);
  } catch {
    return [];
  }
}
