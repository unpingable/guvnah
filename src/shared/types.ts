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
}
