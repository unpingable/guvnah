// SPDX-License-Identifier: Apache-2.0
/** Types shared between main process and renderer. */

// --- Health ---

export interface BackendInfo {
  type: string;
  connected: boolean;
}

export interface GovernorInfo {
  context_id: string;
  mode: string;
  initialized: boolean;
}

export interface HealthResponse {
  status: string;
  backend: BackendInfo;
  governor: GovernorInfo;
}

// --- Sessions ---

export interface SessionSummary {
  id: string;
  context_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  model: string;
  message_count: number;
}

export interface SessionMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  model?: string;
  usage?: Record<string, number>;
}

export interface ChatSession extends SessionSummary {
  messages: SessionMessage[];
}

// --- Governor State ---

export interface GovernorNow {
  pill: string;
  sentence: string;
  regime?: string;
  suggested_action?: string;
}

export interface GovernorStatus {
  mode: string;
  envelope: string;
  context_id: string;
  facts_count: number;
  decisions_count: number;
  [key: string]: unknown;
}

// --- Intent Compiler ---

export interface IntentTemplateSummary {
  name: string;
  description: string;
}

export interface IntentTemplateList {
  templates: IntentTemplateSummary[];
}

export interface IntentFieldOption {
  value: string;
  label: string;
  confidence: number;
  branch_id: string;
}

export interface IntentFormField {
  field_id: string;
  widget: string;
  label: string;
  options?: IntentFieldOption[];
  default?: string | number | boolean;
  required: boolean;
  help_text: string;
}

export interface IntentBranch {
  branch_id: string;
  name: string;
  description: string;
  confidence: number;
  constraints_implied: string[];
  fields_affected: string[];
}

export interface IntentFormSchema {
  schema_id: string;
  template_name: string;
  mode: string;
  policy: string;
  fields: IntentFormField[];
  branches: IntentBranch[];
  escape_enabled: boolean;
}

export interface IntentValidationResult {
  valid: boolean;
  errors: string[];
}

export interface IntentCompilationResult {
  intent_profile: string;
  intent_scope?: string[];
  intent_deny?: string[];
  intent_timebox_minutes?: number;
  constraint_block?: Record<string, unknown>;
  selected_branch?: string;
  escape_classification?: string;
  warnings: string[];
  receipt_hash: string;
}

export interface IntentPolicy {
  mode: string;
  policy: string;
}

// --- Gate Receipts ---

export interface GateReceipt {
  receipt_id: string;
  schema_version: string;
  timestamp: string;
  gate: string;
  verdict: string;
  subject_hash: string;
  evidence_hash: string;
  policy_hash: string;
}

export interface ReceiptDetail {
  receipt: GateReceipt;
  evidence: unknown;
}

// --- Scars ---

export interface Scar {
  region: string;
  stiffness: number;
  evidence_count: number;
  first_seen: string;
  last_seen: string;
  provenance: string;
}

export interface Shield {
  region: string;
  permeability: number;
  reason: string;
}

export interface ScarStats {
  total_scars: number;
  hard_scars: number;
  total_shields: number;
  health: string;
}

export interface ScarsResponse {
  scars: Scar[];
  shields: Shield[];
  stats: ScarStats;
}

export interface FailureEvent {
  region: string;
  timestamp: string;
  category: string;
  details: string;
}

// --- Commit / Waive ---

export interface PendingViolation {
  violation_id: string;
  anchor_id: string;
  description: string;
  severity: string;
  content_preview: string;
}

export interface ResolutionResult {
  success: boolean;
  action: string;
  message: string;
}

export interface ExceptionRecord {
  id: string;
  violation_id: string;
  action: string;
  reason: string;
  timestamp: string;
  scope?: string;
  expiry?: string;
}

// --- Correlator Telemetry ---

export interface FidelityProxy {
  mode_preservation: number;
  contradiction_persistence: number;
  representation_shear: number;
  provenance_entropy: number;
}

export interface KVector {
  throughput: number;
  fidelity: FidelityProxy;
  authority: string;
  cost_budget: number;
  window_step: number;
  window_size: number;
  timestamp: string;
}

export interface IndicatorState {
  MODE_COUNT_DECREASING: number;
  ENTROPY_NONINCREASING: number;
  CONTRADICTION_SUPPRESSION: number;
  COMMITMENT_SHEAR: number;
  [key: string]: number;
}

export interface CorrelatorMetrics {
  regime: string;
  total_windows: number;
  total_signals: number;
  indicator_state: IndicatorState;
}

export interface IndicatorDetail {
  name: string;
  streak: number;
  triggered: boolean;
  authority_gated: boolean;
  throughput_gated: boolean;
  gate_met: boolean;
}

export interface CorrelatorDiagnostic {
  window_step: number;
  k_vector: KVector;
  signals: string[];
  indicators_triggered: string[];
  indicator_details: IndicatorDetail[];
  confidence: number;
  regime: string;
  gate_met: boolean;
  timestamp: string;
}

export interface CorrelatorStatus {
  metrics: CorrelatorMetrics;
  latest: CorrelatorDiagnostic | null;
}

// --- Receipts v1 ---

export interface ReceiptV1 {
  receipt_id: string;
  seq: number;
  chain_hash: string;
  prev_hash: string;
  actor: string;
  tool_id: string;
  tool_args_summary: string;
  decision_action: string;
  decision_reason: string;
  execution_status: string;
  execution_summary: string;
  execution_duration_ms: number;
  provenance: Record<string, unknown>;
  generated_at: string;
}

export interface ReceiptV1VerifyResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  count: number;
  first_seq: number;
  last_seq: number;
  gaps: number[];
}

// --- Operator Snapshot ---

export interface OperatorCheck {
  name: string;
  status: string;
  message: string;
}

export interface OperatorSnapshot {
  regime: string;
  operational_regime: string;
  checks: OperatorCheck[];
  facts_count: number;
  decisions_count: number;
  receipts_count: number;
  scars_count: number;
  suggestions: string[];
  generated_at: string;
}

// --- Trace ---

export interface TraceEvent {
  event_type: string;
  source: string;
  message: string;
  level: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface TraceResponse {
  events: TraceEvent[];
  total: number;
  truncated: boolean;
}

// --- Claims (claim↔receipt correlation) ---

export interface ClaimVerificationSummary {
  schema: string;
  claim_id: string;
  claim_kind: string;
  claim_text: string;
  claim_level: string;
  claim_fingerprint: string;
  status: string;
  supporting_receipt_ids: string[];
  contradicting_receipt_ids: string[];
  neutral_receipt_ids: string[];
  unresolved_receipt_refs: number;
  receipt_chain_ok: boolean;
  run_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceiptLink {
  link_id: string;
  claim_id: string;
  receipt_id: string;
  role: string;
  created_at: string;
}

export interface ReceiptStub {
  receipt_id: string;
  timestamp: string;
  verdict: string;
  gate: string;
}

export interface ClaimDetail {
  summary: ClaimVerificationSummary;
  links: ReceiptLink[];
  receipts: ReceiptStub[];
}

export interface ClaimsWindow {
  schema: string;
  claims: ClaimVerificationSummary[];
  receipt_stubs: ReceiptStub[];
  count: number;
  counts_by_status: Record<string, number>;
}

export interface ClaimsStats {
  total: number;
  counts_by_level: Record<string, number>;
  total_links: number;
  newest_at: string;
}

// --- Chain Composition (Phase 2C/2D) ---

export interface ChainBlockReason {
  rule_id: string;
  message: string;
  prior_step_index?: number;
  proposed_tool_id?: string;
}

export interface ChainPreflightDecision {
  decision: string;               // "allow" | "would_block" | "blocked"
  mode: string;                   // "detect_only" | "enforce_shadow" | "enforce"
  kernel_verdict: string;
  effective_verdict: string;
  composition_match: boolean;
  matched_rule_ids: string[];
  block_reasons: ChainBlockReason[];
  history_length: number;
  action_log_hash: string;
  proposed_step_hash: string;
  preflight_token: string;
  verdict_reason: string;
  correlation_id: string;
  [key: string]: unknown;         // forward compat — daemon may add fields
}

export interface ChainRecordResult {
  recorded: boolean;
  correlation_id: string;
  history_length: number;
  action_log_hash: string;
  record_id?: string;
  idempotent_replay: boolean;
  [key: string]: unknown;
}

export interface ChainStatus {
  load_status: string;            // "loaded" | "missing_policy" | "error"
  rule_count: number;
  rule_set_version: string;
  content_hash: string;
  mode: string;                   // "detect_only" | "enforce_shadow" | "enforce"
  log_exists?: boolean;
  history_length?: number;
  action_log_hash?: string;
  [key: string]: unknown;
}

// --- Preload API shape ---

export interface GovernorAPI {
  health(): Promise<HealthResponse>;
  connect(baseUrl: string): Promise<void>;
  now(): Promise<GovernorNow>;
  status(): Promise<GovernorStatus>;

  listSessions(): Promise<SessionSummary[]>;
  createSession(title: string): Promise<ChatSession>;
  deleteSession(id: string): Promise<boolean>;
  getSession(id: string): Promise<ChatSession>;

  intentTemplates(): Promise<IntentTemplateList>;
  intentSchema(templateName: string): Promise<IntentFormSchema>;
  intentValidate(schemaId: string, values: Record<string, unknown>): Promise<IntentValidationResult>;
  intentCompile(schemaId: string, values: Record<string, unknown>): Promise<IntentCompilationResult>;
  intentPolicy(): Promise<IntentPolicy>;

  listReceipts(filter?: { gate?: string; verdict?: string; limit?: number }): Promise<GateReceipt[]>;
  receiptDetail(receiptId: string): Promise<ReceiptDetail>;

  listScars(): Promise<ScarsResponse>;
  scarsHistory(limit?: number): Promise<FailureEvent[]>;

  commitPending(): Promise<PendingViolation | null>;
  commitFix(correctedText?: string): Promise<ResolutionResult>;
  commitRevise(): Promise<ResolutionResult>;
  commitProceed(reason: string): Promise<ResolutionResult>;
  commitExceptions(): Promise<ExceptionRecord[]>;

  operatorSnapshot(): Promise<OperatorSnapshot>;
  correlatorStatus(): Promise<CorrelatorStatus>;
  correlatorHistory(limit?: number): Promise<CorrelatorDiagnostic[]>;
  correlatorKvector(): Promise<KVector>;
  receiptsV1List(limit?: number): Promise<ReceiptV1[]>;
  receiptsV1Detail(receiptId: string): Promise<ReceiptV1>;
  receiptsV1Verify(): Promise<ReceiptV1VerifyResult>;
  traceTail(limit?: number): Promise<TraceResponse>;

  claimsList(opts?: { run_id?: string; since?: string; limit?: number }): Promise<ClaimVerificationSummary[]>;
  claimsDetail(claimId: string): Promise<ClaimDetail>;
  claimsForReceipt(receiptId: string): Promise<ClaimVerificationSummary[]>;
  claimsWindow(since: string, until?: string, limit?: number): Promise<ClaimsWindow>;
  claimsStats(): Promise<ClaimsStats>;

  chainPreflight(toolId: string, correlationId: string, args?: Record<string, unknown>, exceptions?: string[]): Promise<ChainPreflightDecision>;
  chainRecord(toolId: string, correlationId: string, resultStatus: string, opts?: { args?: Record<string, unknown>; preflightToken?: string; recordId?: string }): Promise<ChainRecordResult>;
  chainStatus(correlationId?: string): Promise<ChainStatus>;
}
