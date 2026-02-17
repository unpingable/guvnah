// SPDX-License-Identifier: Apache-2.0
/**
 * Tests for GovernorClient — mock fetch, verify URLs/headers/body.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GovernorClient } from '../../src/main/governor-client';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
  } as Response;
}

describe('GovernorClient', () => {
  let client: GovernorClient;

  beforeEach(() => {
    client = new GovernorClient('http://localhost:8000');
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('health', () => {
    it('calls GET /health', async () => {
      const payload = { status: 'ok', backend: { type: 'ollama', connected: true }, governor: { context_id: 'default', mode: 'general', initialized: true } };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await client.health();
      expect(result).toEqual(payload);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/health');
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, 500));
      await expect(client.health()).rejects.toThrow('GET /health: 500');
    });
  });

  describe('sessions', () => {
    it('lists sessions via GET /sessions/', async () => {
      const sessions = [{ id: '1', title: 'test', message_count: 0 }];
      mockFetch.mockResolvedValueOnce(jsonResponse(sessions));

      const result = await client.listSessions();
      expect(result).toEqual(sessions);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/sessions/');
    });

    it('creates session via POST /sessions/', async () => {
      const session = { id: '1', title: 'new', messages: [] };
      mockFetch.mockResolvedValueOnce(jsonResponse(session));

      const result = await client.createSession('new');
      expect(result).toEqual(session);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:8000/sessions/');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ title: 'new' });
    });

    it('deletes session via DELETE /sessions/:id', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      const result = await client.deleteSession('abc');
      expect(result).toBe(true);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:8000/sessions/abc');
      expect(opts.method).toBe('DELETE');
    });

    it('gets session via GET /sessions/:id', async () => {
      const session = { id: 'abc', messages: [] };
      mockFetch.mockResolvedValueOnce(jsonResponse(session));

      const result = await client.getSession('abc');
      expect(result).toEqual(session);
    });
  });

  describe('governor state', () => {
    it('calls GET /governor/now', async () => {
      const payload = { pill: 'OK', sentence: 'All clear' };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await client.now();
      expect(result).toEqual(payload);
    });

    it('calls GET /governor/status', async () => {
      const payload = { mode: 'code', envelope: 'strict' };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await client.status();
      expect(result).toEqual(payload);
    });
  });

  describe('intent', () => {
    it('fetches templates via GET /v2/intent/templates', async () => {
      const payload = { templates: [{ name: 'session_start', description: 'Start' }] };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await client.intentTemplates();
      expect(result).toEqual(payload);
    });

    it('fetches schema via GET /v2/intent/schema/:name', async () => {
      const payload = { schema_id: 'abc', template_name: 'session_start', fields: [] };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await client.intentSchema('session_start');
      expect(result).toEqual(payload);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/v2/intent/schema/session_start');
    });

    it('validates via POST /v2/intent/validate', async () => {
      const payload = { valid: true, errors: [] };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await client.intentValidate('schema-1', { mode: 'code' });
      expect(result).toEqual(payload);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({ schema_id: 'schema-1', values: { mode: 'code' } });
    });

    it('compiles via POST /v2/intent/compile', async () => {
      const payload = { intent_profile: 'greenfield', receipt_hash: 'abc123' };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await client.intentCompile('schema-1', { mode: 'code' });
      expect(result).toEqual(payload);
    });

    it('fetches policy via GET /v2/intent/policy', async () => {
      const payload = { mode: 'code', policy: 'TEMPLATE_ONLY' };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await client.intentPolicy();
      expect(result).toEqual(payload);
    });
  });

  describe('receipts', () => {
    it('lists receipts with filters', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.listReceipts({ gate: 'evidence_gate', verdict: 'block', limit: 10 });
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('gate=evidence_gate');
      expect(url).toContain('verdict=block');
      expect(url).toContain('limit=10');
    });

    it('fetches receipt detail', async () => {
      const payload = { receipt: { receipt_id: 'abc' }, evidence: { data: 'test' } };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await client.receiptDetail('abc');
      expect(result).toEqual(payload);
      expect(mockFetch.mock.calls[0][0]).toContain('/governor/receipts/abc');
    });
  });

  describe('scars', () => {
    it('lists scars', async () => {
      const payload = { scars: [], shields: [], stats: { total_scars: 0 } };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await client.listScars();
      expect(result).toEqual(payload);
    });

    it('fetches scar history', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.scarsHistory(25);
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('limit=25');
    });
  });

  describe('commit/waive', () => {
    it('fetches pending violation', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(null));

      const result = await client.commitPending();
      expect(result).toBeNull();
    });

    it('calls fix', async () => {
      const payload = { success: true, action: 'fix', message: 'Fixed' };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await client.commitFix();
      expect(result).toEqual(payload);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({ action: 'fix' });
    });

    it('calls proceed with reason', async () => {
      const payload = { success: true, action: 'proceed', message: 'Waived' };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await client.commitProceed('YOLO');
      expect(result).toEqual(payload);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({ action: 'proceed', reason: 'YOLO' });
    });

    it('fetches exceptions via GET /governor/corrections', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await client.commitExceptions();
      expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:8000/governor/corrections');
    });
  });

  describe('setBaseUrl', () => {
    it('strips trailing slash', async () => {
      client.setBaseUrl('http://localhost:9000/');
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      await client.health();
      expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:9000/health');
    });
  });
});
