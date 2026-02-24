// SPDX-License-Identifier: Apache-2.0
/** Sample daemon payloads for integrity view tests. Based on actual daemon shapes. */

import type {
  OperatorSnapshot,
  CorrelatorStatus,
  CorrelatorDiagnostic,
  KVector,
  ReceiptV1,
  ReceiptV1VerifyResult,
  TraceResponse,
  ClaimVerificationSummary,
  ClaimDetail,
  ClaimsWindow,
  ClaimsStats,
  ReceiptLink,
} from '../../src/shared/types';

export const sampleKVector: KVector = {
  throughput: 0.82,
  fidelity: {
    mode_preservation: 0.91,
    contradiction_persistence: 0.15,
    representation_shear: 0.08,
    provenance_entropy: 0.22,
  },
  authority: 'blocking',
  cost_budget: 0.65,
  window_step: 12,
  window_size: 10,
  timestamp: '2026-02-21T10:30:00Z',
};

export const sampleDiagnostic: CorrelatorDiagnostic = {
  window_step: 12,
  k_vector: sampleKVector,
  signals: ['fidelity_drop', 'throughput_stable'],
  indicators_triggered: ['ENTROPY_NONINCREASING'],
  indicator_details: [
    { name: 'MODE_COUNT_DECREASING', streak: 0, triggered: false, authority_gated: false, throughput_gated: false, gate_met: false },
    { name: 'ENTROPY_NONINCREASING', streak: 3, triggered: true, authority_gated: false, throughput_gated: false, gate_met: true },
    { name: 'CONTRADICTION_SUPPRESSION', streak: 0, triggered: false, authority_gated: false, throughput_gated: false, gate_met: false },
    { name: 'COMMITMENT_SHEAR', streak: 1, triggered: false, authority_gated: true, throughput_gated: false, gate_met: false },
  ],
  confidence: 0.78,
  regime: 'LEVERAGE',
  gate_met: false,
  timestamp: '2026-02-21T10:30:00Z',
};

export const sampleDiagnosticHistory: CorrelatorDiagnostic[] = [
  { ...sampleDiagnostic, window_step: 10, regime: 'LEVERAGE', confidence: 0.85, timestamp: '2026-02-21T10:10:00Z' },
  { ...sampleDiagnostic, window_step: 11, regime: 'LEVERAGE', confidence: 0.80, timestamp: '2026-02-21T10:20:00Z' },
  { ...sampleDiagnostic, window_step: 12, regime: 'SHEAR', confidence: 0.78, timestamp: '2026-02-21T10:30:00Z' },
];

export const sampleCorrelatorStatus: CorrelatorStatus = {
  metrics: {
    regime: 'LEVERAGE',
    total_windows: 12,
    total_signals: 34,
    indicator_state: {
      MODE_COUNT_DECREASING: 0,
      ENTROPY_NONINCREASING: 3,
      CONTRADICTION_SUPPRESSION: 0,
      COMMITMENT_SHEAR: 1,
    },
  },
  latest: sampleDiagnostic,
};

export const sampleOperatorSnapshot: OperatorSnapshot = {
  regime: 'LEVERAGE',
  operational_regime: 'ELASTIC',
  checks: [
    { name: 'intent_loaded', status: 'ok', message: 'Intent profile active' },
    { name: 'correlator_healthy', status: 'ok', message: 'Correlator running' },
    { name: 'receipt_chain_valid', status: 'warn', message: '2 gaps detected' },
  ],
  facts_count: 48,
  decisions_count: 22,
  receipts_count: 20,
  scars_count: 3,
  suggestions: ['Review receipt chain gaps', 'Monitor entropy trend'],
  generated_at: '2026-02-21T10:30:05Z',
};

export const sampleReceiptsV1: ReceiptV1[] = [
  {
    receipt_id: 'r-001',
    seq: 1,
    chain_hash: 'abc123',
    prev_hash: '000000',
    actor: 'agent-1',
    tool_id: 'file_write',
    tool_args_summary: 'path=/src/main.ts',
    decision_action: 'allow',
    decision_reason: 'Within scope',
    execution_status: 'success',
    execution_summary: 'File written',
    execution_duration_ms: 45,
    provenance: {},
    generated_at: '2026-02-21T10:00:00Z',
  },
  {
    receipt_id: 'r-002',
    seq: 2,
    chain_hash: 'def456',
    prev_hash: 'abc123',
    actor: 'agent-1',
    tool_id: 'shell_exec',
    tool_args_summary: 'cmd=npm test',
    decision_action: 'allow',
    decision_reason: 'Test execution permitted',
    execution_status: 'success',
    execution_summary: 'Tests passed',
    execution_duration_ms: 3200,
    provenance: {},
    generated_at: '2026-02-21T10:05:00Z',
  },
  {
    receipt_id: 'r-003',
    seq: 4, // gap: seq 3 missing
    chain_hash: 'ghi789',
    prev_hash: 'xxx000',
    actor: 'agent-1',
    tool_id: 'file_delete',
    tool_args_summary: 'path=/tmp/cache',
    decision_action: 'deny',
    decision_reason: 'Outside permitted scope',
    execution_status: 'blocked',
    execution_summary: 'Action denied by policy',
    execution_duration_ms: 0,
    provenance: {},
    generated_at: '2026-02-21T10:15:00Z',
  },
];

export const sampleVerifyResult: ReceiptV1VerifyResult = {
  valid: false,
  errors: ['Chain hash mismatch at seq 4'],
  warnings: ['Gap detected: seq 3 missing'],
  count: 3,
  first_seq: 1,
  last_seq: 4,
  gaps: [3],
};

export const sampleTraceResponse: TraceResponse = {
  events: [
    {
      event_type: 'gate_decision',
      source: 'correlator',
      message: 'Gate decision: allow file_write',
      level: 'info',
      timestamp: '2026-02-21T10:00:00Z',
      metadata: { tool_id: 'file_write' },
    },
    {
      event_type: 'regime_transition',
      source: 'correlator',
      message: 'Regime transition: LEVERAGE -> SHEAR',
      level: 'warn',
      timestamp: '2026-02-21T10:30:00Z',
      metadata: { from: 'LEVERAGE', to: 'SHEAR' },
    },
  ],
  total: 2,
  truncated: false,
};

// --- Claims fixtures (from daemon claim_correlation.py shapes) ---

export const sampleClaimSummary1: ClaimVerificationSummary = {
  schema: 'claim_verification_summary.v1',
  claim_id: 'c-001',
  claim_kind: 'evidence_gate',
  claim_text: 'File src/main.ts exists and is writable',
  claim_level: 'hard',
  claim_fingerprint: 'fp-abc123',
  status: 'verified',
  supporting_receipt_ids: ['r-001'],
  contradicting_receipt_ids: [],
  neutral_receipt_ids: [],
  unresolved_receipt_refs: 0,
  receipt_chain_ok: true,
  run_id: 'run-1',
  created_at: '2026-02-21T10:00:00Z',
  updated_at: '2026-02-21T10:00:05Z',
};

export const sampleClaimSummary2: ClaimVerificationSummary = {
  schema: 'claim_verification_summary.v1',
  claim_id: 'c-002',
  claim_kind: 'evidence_gate',
  claim_text: 'npm test passes without errors',
  claim_level: 'hard',
  claim_fingerprint: 'fp-def456',
  status: 'verified',
  supporting_receipt_ids: ['r-002'],
  contradicting_receipt_ids: [],
  neutral_receipt_ids: [],
  unresolved_receipt_refs: 0,
  receipt_chain_ok: true,
  run_id: 'run-1',
  created_at: '2026-02-21T10:05:00Z',
  updated_at: '2026-02-21T10:05:10Z',
};

export const sampleClaimSummary3: ClaimVerificationSummary = {
  schema: 'claim_verification_summary.v1',
  claim_id: 'c-003',
  claim_kind: 'chat_assertion',
  claim_text: 'Cache directory is safe to remove',
  claim_level: 'soft',
  claim_fingerprint: 'fp-ghi789',
  status: 'contradicted',
  supporting_receipt_ids: [],
  contradicting_receipt_ids: ['r-003'],
  neutral_receipt_ids: [],
  unresolved_receipt_refs: 0,
  receipt_chain_ok: true,
  run_id: 'run-1',
  created_at: '2026-02-21T10:14:00Z',
  updated_at: '2026-02-21T10:15:00Z',
};

export const sampleClaimSummary4: ClaimVerificationSummary = {
  schema: 'claim_verification_summary.v1',
  claim_id: 'c-004',
  claim_kind: 'chat_assertion',
  claim_text: 'Refactor will not break existing tests',
  claim_level: 'soft',
  claim_fingerprint: 'fp-jkl012',
  status: 'unverified',
  supporting_receipt_ids: [],
  contradicting_receipt_ids: [],
  neutral_receipt_ids: [],
  unresolved_receipt_refs: 0,
  receipt_chain_ok: true,
  run_id: 'run-1',
  created_at: '2026-02-21T10:20:00Z',
  updated_at: '2026-02-21T10:20:00Z',
};

export const sampleClaimsStats: ClaimsStats = {
  total: 4,
  counts_by_level: { hard: 2, soft: 2 },
  total_links: 3,
  newest_at: '2026-02-21T10:20:00Z',
};

export const sampleClaimsWindow: ClaimsWindow = {
  schema: 'claims_window.v1',
  claims: [sampleClaimSummary4, sampleClaimSummary3, sampleClaimSummary2, sampleClaimSummary1],
  receipt_stubs: [
    { receipt_id: 'r-001', timestamp: '2026-02-21T10:00:00Z', verdict: 'pass', gate: 'evidence_gate' },
    { receipt_id: 'r-002', timestamp: '2026-02-21T10:05:00Z', verdict: 'pass', gate: 'evidence_gate' },
    { receipt_id: 'r-003', timestamp: '2026-02-21T10:15:00Z', verdict: 'block', gate: 'evidence_gate' },
  ],
  count: 4,
  counts_by_status: { verified: 2, contradicted: 1, unverified: 1 },
};

export const sampleClaimLinks: ReceiptLink[] = [
  { link_id: 'l-001', claim_id: 'c-001', receipt_id: 'r-001', role: 'supports', created_at: '2026-02-21T10:00:05Z' },
];

export const sampleClaimDetail: ClaimDetail = {
  summary: sampleClaimSummary1,
  links: sampleClaimLinks,
  receipts: [
    { receipt_id: 'r-001', timestamp: '2026-02-21T10:00:00Z', verdict: 'pass', gate: 'evidence_gate' },
  ],
};
