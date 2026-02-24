// SPDX-License-Identifier: Apache-2.0
/**
 * JSON-RPC 2.0 client for the Governor daemon.
 * Replaces HTTP client — speaks Content-Length framed JSON-RPC over child process stdio.
 * Same public API as GovernorClient so IPC handlers don't change.
 */

import { ChildProcess, spawn, execFileSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type {
  HealthResponse,
  SessionSummary,
  ChatSession,
  GovernorNow,
  GovernorStatus,
  IntentTemplateList,
  IntentFormSchema,
  IntentValidationResult,
  IntentCompilationResult,
  IntentPolicy,
  GateReceipt,
  ReceiptDetail,
  ScarsResponse,
  FailureEvent,
  PendingViolation,
  ResolutionResult,
  ExceptionRecord,
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
  ChainPreflightDecision,
  ChainRecordResult,
  ChainStatus,
} from '../shared/types.js';

// ---------------------------------------------------------------------------
// Content-Length framing
// ---------------------------------------------------------------------------

/** Parse Content-Length framed messages from a stream buffer. */
export class FrameParser extends EventEmitter {
  private buffer: Buffer = Buffer.alloc(0);

  feed(data: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, data]);
    this.tryParse();
  }

  private tryParse(): void {
    while (true) {
      const headerEnd = this.buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) return;

      const headerStr = this.buffer.subarray(0, headerEnd).toString('utf-8');
      const match = headerStr.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        // Skip malformed header
        this.buffer = this.buffer.subarray(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(match[1], 10);
      const bodyStart = headerEnd + 4;
      const messageEnd = bodyStart + contentLength;

      if (this.buffer.length < messageEnd) return; // Incomplete body

      const body = this.buffer.subarray(bodyStart, messageEnd).toString('utf-8');
      this.buffer = this.buffer.subarray(messageEnd);

      try {
        this.emit('message', JSON.parse(body));
      } catch {
        this.emit('error', new Error(`Failed to parse JSON: ${body.slice(0, 100)}`));
      }
    }
  }
}

/** Encode a JSON-RPC message with Content-Length framing. */
function encodeMessage(msg: object): Buffer {
  const body = Buffer.from(JSON.stringify(msg), 'utf-8');
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'utf-8');
  return Buffer.concat([header, body]);
}

// ---------------------------------------------------------------------------
// Daemon path resolution + logging
// ---------------------------------------------------------------------------

/**
 * Resolve the governor CLI binary path explicitly.
 * Prefers GOVERNOR_BIN env var, falls back to `which governor`.
 * Never relies on bare PATH lookup at spawn time.
 */
function resolveDaemonPath(): string {
  const explicit = process.env['GOVERNOR_BIN'];
  if (explicit) return explicit;

  try {
    return execFileSync('which', ['governor'], { encoding: 'utf-8' }).trim();
  } catch {
    // Fallback: bare name (will fail at spawn if not in PATH)
    return 'governor';
  }
}

/** Prefix log lines for daemon stdout/stderr. */
function daemonLog(stream: string, data: Buffer): void {
  const lines = data.toString('utf-8').split('\n').filter(Boolean);
  for (const line of lines) {
    console.error(`[daemon:${stream}] ${line}`);
  }
}

// ---------------------------------------------------------------------------
// Transport interface — the seam for future transport implementations
// ---------------------------------------------------------------------------

/** Transport abstraction for JSON-RPC communication with the governor daemon. */
export interface Transport {
  start(): void;
  stop(): void;
  get isRunning(): boolean;
  call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
}

// ---------------------------------------------------------------------------
// Stdio transport — child process implementation
// ---------------------------------------------------------------------------

interface PendingRequest {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class StdioTransport implements Transport {
  private process: ChildProcess | null = null;
  private parser = new FrameParser();
  private pending = new Map<number | string, PendingRequest>();
  private nextId = 1;
  private governorDir: string;
  private mode: string;
  private timeoutMs: number;

  constructor(governorDir: string, mode: string = 'general', timeoutMs: number = 10000) {
    this.governorDir = governorDir;
    this.mode = mode;
    this.timeoutMs = timeoutMs;
  }

  /** Spawn the daemon child process. */
  start(): void {
    if (this.process) return;

    const bin = resolveDaemonPath();
    // --root is on the parent CLI group, before the subcommand
    const args = [
      '--root', this.governorDir,
      'serve', '--stdio',
      '--mode', this.mode,
    ];

    console.error(`[daemon] spawn: ${bin} ${args.join(' ')}`);
    console.error(`[daemon] governor_dir=${this.governorDir} mode=${this.mode}`);

    this.process = spawn(bin, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Log daemon stderr (Python logging, errors, tracebacks)
    this.process.stderr?.on('data', (data: Buffer) => daemonLog('err', data));

    this.parser = new FrameParser();
    this.parser.on('message', (msg: { id?: number | string; result?: unknown; error?: { code: number; message: string } }) => {
      if (msg.id === undefined) return; // Notification, ignore
      const pending = this.pending.get(msg.id);
      if (!pending) return;
      this.pending.delete(msg.id);
      clearTimeout(pending.timer);

      if (msg.error) {
        pending.reject(new Error(`RPC ${msg.error.code}: ${msg.error.message}`));
      } else {
        pending.resolve(msg.result);
      }
    });

    this.process.stdout?.on('data', (data: Buffer) => this.parser.feed(data));
    this.process.on('exit', (code, signal) => {
      console.error(`[daemon] exited code=${code} signal=${signal}`);
      // Reject all pending requests
      for (const [, req] of this.pending) {
        clearTimeout(req.timer);
        req.reject(new Error('Daemon process exited'));
      }
      this.pending.clear();
      this.process = null;
    });
  }

  /** Stop the daemon child process. */
  stop(): void {
    if (!this.process) return;
    this.process.kill('SIGTERM');
    this.process = null;
  }

  get isRunning(): boolean {
    return this.process !== null && this.process.exitCode === null;
  }

  /** Send a JSON-RPC request and wait for the response. */
  async call<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (!this.process?.stdin?.writable) {
      throw new Error('Daemon not running');
    }

    const id = this.nextId++;
    const request = { jsonrpc: '2.0', id, method, params };

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`RPC timeout: ${method} (${this.timeoutMs}ms)`));
      }, this.timeoutMs);

      this.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
        timer,
      });

      this.process!.stdin!.write(encodeMessage(request));
    });
  }
}

/** @deprecated Use StdioTransport instead. */
export { StdioTransport as RpcTransport };

// ---------------------------------------------------------------------------
// Shape adapters — the compatibility seam.
//
// Renderer speaks the shapes originally defined for the HTTP adapter.
// Daemon speaks Python dataclass .to_dict() shapes.
// Adapters live HERE, in one place. When the renderer migrates to daemon-
// native shapes, delete this section and update the call sites below.
// ---------------------------------------------------------------------------

/** Daemon's session list entry → renderer SessionSummary. */
function adaptSessionSummary(raw: Record<string, unknown>): SessionSummary {
  return {
    id: (raw.session_id as string) ?? (raw.id as string) ?? '',
    context_id: (raw.context_id as string) ?? 'default',
    title: (raw.name as string) ?? (raw.title as string) ?? 'Untitled',
    created_at: (raw.created_at as string) ?? '',
    updated_at: (raw.last_active as string) ?? (raw.updated_at as string) ?? (raw.created_at as string) ?? '',
    model: 'daemon',
    message_count: 0, // daemon has no chat messages
  };
}

/** Daemon's Capsule.to_dict() → renderer ChatSession. */
function adaptChatSession(raw: Record<string, unknown>): ChatSession {
  const meta = (raw.metadata ?? raw) as Record<string, unknown>;
  return {
    ...adaptSessionSummary(meta),
    messages: [], // no chat — daemon is judge, not author
  };
}

/** Daemon's PendingViolation.to_dict() → renderer PendingViolation (flat, first violation). */
function adaptPendingViolation(raw: Record<string, unknown>): PendingViolation | null {
  if (!raw) return null;
  const violations = (raw.violations as Record<string, unknown>[]) ?? [];
  const first = violations[0] ?? {};
  const blocked = (raw.blocked_response as string) ?? '';
  return {
    violation_id: (raw.id as string) ?? '',
    anchor_id: (first.anchor_id as string) ?? '',
    description: (first.description as string) ?? '',
    severity: (first.severity as string) ?? 'error',
    content_preview: blocked.length > 200 ? blocked.slice(0, 200) + '…' : blocked,
  };
}

/** Daemon's ExceptionRecord.to_dict() → renderer ExceptionRecord. */
function adaptExceptionRecord(raw: Record<string, unknown>): ExceptionRecord {
  const violations = (raw.violations as Record<string, unknown>[]) ?? [];
  const first = violations[0] ?? {};
  return {
    id: (raw.id as string) ?? '',
    violation_id: (first.anchor_id as string) ?? '',
    action: 'proceed',
    reason: (raw.blocked_response_preview as string) ?? '',
    timestamp: (raw.created_at as string) ?? '',
    scope: raw.scope as string | undefined,
    expiry: raw.expiry as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// GovernorClient — same public API as HTTP version
// ---------------------------------------------------------------------------

export class GovernorClient {
  private transport: Transport;
  private governorDir: string;
  private mode: string;

  constructor(governorDir: string = '.governor', mode: string = 'general', transport?: Transport) {
    this.governorDir = governorDir;
    this.mode = mode;
    this.transport = transport ?? new StdioTransport(governorDir, mode);
  }

  /** Start the daemon process. Call this before using other methods. */
  start(): void {
    this.transport.start();
  }

  /** Stop the daemon process. */
  stop(): void {
    this.transport.stop();
  }

  get isRunning(): boolean {
    return this.transport.isRunning;
  }

  /** Stop and restart the daemon pointing at a new governor directory. */
  setGovernorDir(dir: string): void {
    this.transport.stop();
    this.governorDir = dir;
    this.transport = new StdioTransport(dir, this.mode);
    this.transport.start();
  }

  /** Provided for API compat with HTTP client — delegates to setGovernorDir. */
  setBaseUrl(urlOrDir: string): void {
    // Interpret as governor dir path (daemon doesn't use URLs)
    this.setGovernorDir(urlOrDir);
  }

  // --- Health ---

  async health(): Promise<HealthResponse> {
    try {
      const hello = await this.transport.call<{
        governor: { context_id: string; mode: string; initialized: boolean };
      }>('governor.hello');
      return {
        status: hello.governor.initialized ? 'ok' : 'degraded',
        backend: { type: 'daemon', connected: true },
        governor: hello.governor,
      };
    } catch {
      return {
        status: 'error',
        backend: { type: 'daemon', connected: false },
        governor: { context_id: '', mode: '', initialized: false },
      };
    }
  }

  // --- Governor State ---

  async now(): Promise<GovernorNow> {
    return this.transport.call('governor.now');
  }

  async status(): Promise<GovernorStatus> {
    return this.transport.call('governor.status');
  }

  // --- Sessions ---

  async listSessions(): Promise<SessionSummary[]> {
    const raw = await this.transport.call<Record<string, unknown>[]>('sessions.list');
    return raw.map(adaptSessionSummary);
  }

  async createSession(title: string): Promise<ChatSession> {
    const raw = await this.transport.call<Record<string, unknown>>('sessions.create', { title });
    return adaptChatSession(raw);
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = await this.transport.call<{ success: boolean }>('sessions.delete', { id });
    return result.success;
  }

  async getSession(id: string): Promise<ChatSession> {
    const raw = await this.transport.call<Record<string, unknown>>('sessions.get', { id });
    return adaptChatSession(raw);
  }

  // --- Intent Compiler ---

  async intentTemplates(): Promise<IntentTemplateList> {
    return this.transport.call('intent.templates');
  }

  async intentSchema(templateName: string): Promise<IntentFormSchema> {
    return this.transport.call('intent.schema', { template_name: templateName });
  }

  async intentValidate(schemaId: string, values: Record<string, unknown>): Promise<IntentValidationResult> {
    return this.transport.call('intent.validate', { schema_id: schemaId, values });
  }

  async intentCompile(schemaId: string, values: Record<string, unknown>): Promise<IntentCompilationResult> {
    return this.transport.call('intent.compile', { schema_id: schemaId, values });
  }

  async intentPolicy(): Promise<IntentPolicy> {
    return this.transport.call('intent.policy');
  }

  // --- Receipts ---

  async listReceipts(filter?: { gate?: string; verdict?: string; limit?: number }): Promise<GateReceipt[]> {
    return this.transport.call('receipts.list', filter ?? {});
  }

  async receiptDetail(receiptId: string): Promise<ReceiptDetail> {
    return this.transport.call('receipts.detail', { receipt_id: receiptId });
  }

  // --- Scars ---

  async listScars(): Promise<ScarsResponse> {
    return this.transport.call('scars.list');
  }

  async scarsHistory(limit?: number): Promise<FailureEvent[]> {
    return this.transport.call('scars.history', { limit });
  }

  // --- Commit / Waive ---

  async commitPending(): Promise<PendingViolation | null> {
    const raw = await this.transport.call<Record<string, unknown> | null>('commit.pending');
    if (!raw) return null;
    return adaptPendingViolation(raw);
  }

  async commitFix(correctedText?: string): Promise<ResolutionResult> {
    return this.transport.call('commit.fix', { corrected_text: correctedText });
  }

  async commitRevise(newAnchorText?: string): Promise<ResolutionResult> {
    return this.transport.call('commit.revise', { new_anchor_text: newAnchorText });
  }

  async commitProceed(reason: string): Promise<ResolutionResult> {
    return this.transport.call('commit.proceed', { reason });
  }

  async commitExceptions(): Promise<ExceptionRecord[]> {
    const raw = await this.transport.call<Record<string, unknown>[]>('commit.exceptions');
    return raw.map(adaptExceptionRecord);
  }

  // --- Operator ---

  async operatorSnapshot(): Promise<OperatorSnapshot> {
    return this.transport.call('operator.snapshot');
  }

  // --- Correlator Telemetry ---

  async correlatorStatus(): Promise<CorrelatorStatus> {
    return this.transport.call('correlator.status');
  }

  async correlatorHistory(limit?: number): Promise<CorrelatorDiagnostic[]> {
    return this.transport.call('correlator.history', { limit });
  }

  async correlatorKvector(): Promise<KVector> {
    return this.transport.call('correlator.kvector');
  }

  // --- Receipts v1 ---

  async receiptsV1List(limit?: number): Promise<ReceiptV1[]> {
    return this.transport.call('receipts_v1.list', { limit });
  }

  async receiptsV1Detail(receiptId: string): Promise<ReceiptV1> {
    return this.transport.call('receipts_v1.detail', { receipt_id: receiptId });
  }

  async receiptsV1Verify(): Promise<ReceiptV1VerifyResult> {
    return this.transport.call('receipts_v1.verify');
  }

  // --- Trace ---

  async traceTail(limit?: number): Promise<TraceResponse> {
    return this.transport.call('trace.tail', { limit });
  }

  // --- Claims ---

  async claimsList(opts?: { run_id?: string; since?: string; limit?: number }): Promise<ClaimVerificationSummary[]> {
    return this.transport.call('claims.list', opts ?? {});
  }

  async claimsDetail(claimId: string): Promise<ClaimDetail> {
    return this.transport.call('claims.detail', { claim_id: claimId });
  }

  async claimsForReceipt(receiptId: string): Promise<ClaimVerificationSummary[]> {
    return this.transport.call('claims.for_receipt', { receipt_id: receiptId });
  }

  async claimsWindow(since: string, until?: string, limit?: number): Promise<ClaimsWindow> {
    return this.transport.call('claims.window', { since, until, limit });
  }

  async claimsStats(): Promise<ClaimsStats> {
    return this.transport.call('claims.stats');
  }

  // --- Chain Composition ---

  async chainPreflight(
    toolId: string,
    correlationId: string,
    args?: Record<string, unknown>,
    exceptions?: string[],
  ): Promise<ChainPreflightDecision> {
    const params: Record<string, unknown> = {
      tool_id: toolId,
      correlation_id: correlationId,
    };
    if (args) params.args = args;
    if (exceptions) params.exceptions = exceptions;
    return this.transport.call('chain.preflight', params);
  }

  async chainRecord(
    toolId: string,
    correlationId: string,
    resultStatus: string,
    opts?: {
      args?: Record<string, unknown>;
      preflightToken?: string;
      recordId?: string;
    },
  ): Promise<ChainRecordResult> {
    const params: Record<string, unknown> = {
      tool_id: toolId,
      correlation_id: correlationId,
      result_status: resultStatus,
    };
    if (opts?.args) params.args = opts.args;
    if (opts?.preflightToken) params.preflight_token = opts.preflightToken;
    if (opts?.recordId) params.record_id = opts.recordId;
    return this.transport.call('chain.record', params);
  }

  async chainStatus(correlationId?: string): Promise<ChainStatus> {
    const params: Record<string, unknown> = {};
    if (correlationId) params.correlation_id = correlationId;
    return this.transport.call('chain.status', params);
  }
}
