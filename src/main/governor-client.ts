// SPDX-License-Identifier: Apache-2.0
/**
 * HTTP client for the Governor daemon (gov-webui).
 * Same endpoints + shapes as the governor HTTP adapter.
 * Single file, clean interface — isolates all HTTP for Tauri migration.
 */

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
} from '../shared/types.js';

export class GovernorClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8000') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  private async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`GET ${path}: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(new URL(path, this.baseUrl).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`POST ${path}: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
  }

  private async del<T>(path: string): Promise<T> {
    const res = await fetch(new URL(path, this.baseUrl).toString(), { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE ${path}: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
  }

  // --- Health ---

  async health(): Promise<HealthResponse> {
    return this.get('/health');
  }

  // --- Governor State ---

  async now(): Promise<GovernorNow> {
    return this.get('/governor/now');
  }

  async status(): Promise<GovernorStatus> {
    return this.get('/governor/status');
  }

  // --- Sessions ---

  async listSessions(): Promise<SessionSummary[]> {
    return this.get('/sessions/');
  }

  async createSession(title: string): Promise<ChatSession> {
    return this.post('/sessions/', { title });
  }

  async deleteSession(id: string): Promise<boolean> {
    await this.del(`/sessions/${id}`);
    return true;
  }

  async getSession(id: string): Promise<ChatSession> {
    return this.get(`/sessions/${id}`);
  }

  // --- Intent Compiler ---

  async intentTemplates(): Promise<IntentTemplateList> {
    return this.get('/v2/intent/templates');
  }

  async intentSchema(templateName: string): Promise<IntentFormSchema> {
    return this.get(`/v2/intent/schema/${templateName}`);
  }

  async intentValidate(schemaId: string, values: Record<string, unknown>): Promise<IntentValidationResult> {
    return this.post('/v2/intent/validate', { schema_id: schemaId, values });
  }

  async intentCompile(schemaId: string, values: Record<string, unknown>): Promise<IntentCompilationResult> {
    return this.post('/v2/intent/compile', { schema_id: schemaId, values });
  }

  async intentPolicy(): Promise<IntentPolicy> {
    return this.get('/v2/intent/policy');
  }

  // --- Receipts ---

  async listReceipts(filter?: { gate?: string; verdict?: string; limit?: number }): Promise<GateReceipt[]> {
    return this.get('/governor/receipts', filter);
  }

  async receiptDetail(receiptId: string): Promise<ReceiptDetail> {
    return this.get(`/governor/receipts/${receiptId}`, { evidence: 'true' });
  }

  // --- Scars ---

  async listScars(): Promise<ScarsResponse> {
    return this.get('/governor/scars');
  }

  async scarsHistory(limit?: number): Promise<FailureEvent[]> {
    return this.get('/governor/scars/history', { limit });
  }

  // --- Commit / Waive ---

  async commitPending(): Promise<PendingViolation | null> {
    return this.get('/governor/pending');
  }

  async commitFix(): Promise<ResolutionResult> {
    return this.post('/governor/resolve', { action: 'fix' });
  }

  async commitRevise(): Promise<ResolutionResult> {
    return this.post('/governor/resolve', { action: 'revise' });
  }

  async commitProceed(reason: string): Promise<ResolutionResult> {
    return this.post('/governor/resolve', { action: 'proceed', reason });
  }

  async commitExceptions(): Promise<ExceptionRecord[]> {
    return this.get('/governor/corrections');
  }
}
