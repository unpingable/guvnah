/**
 * Tests for RPC client — Content-Length framing + JSON-RPC transport.
 * Tests the protocol layer (FrameParser, encodeMessage) and the GovernorClient API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FrameParser } from '../../src/main/rpc-client';

// ---------------------------------------------------------------------------
// FrameParser tests
// ---------------------------------------------------------------------------

describe('FrameParser', () => {
  let parser: FrameParser;
  let messages: unknown[];

  beforeEach(() => {
    parser = new FrameParser();
    messages = [];
    parser.on('message', (msg: unknown) => messages.push(msg));
  });

  function frame(obj: object): Buffer {
    const body = Buffer.from(JSON.stringify(obj), 'utf-8');
    const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'utf-8');
    return Buffer.concat([header, body]);
  }

  it('parses a single complete message', () => {
    const msg = { jsonrpc: '2.0', id: 1, result: { ok: true } };
    parser.feed(frame(msg));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(msg);
  });

  it('parses two messages in one chunk', () => {
    const m1 = { jsonrpc: '2.0', id: 1, result: 'a' };
    const m2 = { jsonrpc: '2.0', id: 2, result: 'b' };
    parser.feed(Buffer.concat([frame(m1), frame(m2)]));
    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual(m1);
    expect(messages[1]).toEqual(m2);
  });

  it('handles split messages across feeds', () => {
    const msg = { jsonrpc: '2.0', id: 1, result: { data: 'hello' } };
    const data = frame(msg);
    const mid = Math.floor(data.length / 2);

    parser.feed(data.subarray(0, mid));
    expect(messages).toHaveLength(0);

    parser.feed(data.subarray(mid));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(msg);
  });

  it('handles header split across feeds', () => {
    const msg = { test: true };
    const body = Buffer.from(JSON.stringify(msg), 'utf-8');
    const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'utf-8');

    // Split in the middle of the header
    parser.feed(header.subarray(0, 10));
    expect(messages).toHaveLength(0);

    parser.feed(Buffer.concat([header.subarray(10), body]));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(msg);
  });

  it('handles unicode content', () => {
    const msg = { text: 'café ☕' };
    parser.feed(frame(msg));
    expect(messages).toHaveLength(1);
    expect((messages[0] as { text: string }).text).toBe('café ☕');
  });

  it('emits error on malformed JSON', () => {
    const errors: Error[] = [];
    parser.on('error', (e: Error) => errors.push(e));

    const badBody = Buffer.from('not json', 'utf-8');
    const header = Buffer.from(`Content-Length: ${badBody.length}\r\n\r\n`, 'utf-8');
    parser.feed(Buffer.concat([header, badBody]));

    expect(messages).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it('recovers after malformed header', () => {
    // Malformed header (no Content-Length) followed by valid message
    const junk = Buffer.from('X-Bad: stuff\r\n\r\n');
    const msg = { ok: true };
    parser.feed(Buffer.concat([junk, frame(msg)]));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(msg);
  });

  it('handles empty body correctly', () => {
    const msg = {};
    parser.feed(frame(msg));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual({});
  });

  it('handles large messages', () => {
    const msg = { data: 'x'.repeat(100000) };
    parser.feed(frame(msg));
    expect(messages).toHaveLength(1);
    expect((messages[0] as { data: string }).data.length).toBe(100000);
  });
});

// ---------------------------------------------------------------------------
// GovernorClient API shape tests (verify method signatures)
// ---------------------------------------------------------------------------

describe('GovernorClient API', () => {
  // These test that the client class has the right methods with right signatures.
  // We can't easily mock child_process.spawn + stdin/stdout in vitest,
  // so we test the shape and the transport separately.

  it('exports GovernorClient class', async () => {
    const { GovernorClient } = await import('../../src/main/rpc-client');
    expect(GovernorClient).toBeDefined();
  });

  it('GovernorClient has all expected methods', async () => {
    const { GovernorClient } = await import('../../src/main/rpc-client');
    const client = new GovernorClient();

    const expectedMethods = [
      'health', 'now', 'status',
      'listSessions', 'createSession', 'deleteSession', 'getSession',
      'intentTemplates', 'intentSchema', 'intentValidate', 'intentCompile', 'intentPolicy',
      'listReceipts', 'receiptDetail',
      'listScars', 'scarsHistory',
      'commitPending', 'commitFix', 'commitRevise', 'commitProceed', 'commitExceptions',
      'start', 'stop', 'setBaseUrl', 'setGovernorDir',
    ];

    for (const method of expectedMethods) {
      expect(typeof (client as Record<string, unknown>)[method]).toBe('function');
    }
  });

  it('GovernorClient has isRunning getter', async () => {
    const { GovernorClient } = await import('../../src/main/rpc-client');
    const client = new GovernorClient();
    expect(client.isRunning).toBe(false);
  });

  it('setBaseUrl delegates to setGovernorDir (for API compat)', async () => {
    const { GovernorClient } = await import('../../src/main/rpc-client');
    const client = new GovernorClient();
    // Should not throw — creates new transport and starts it
    expect(() => client.setBaseUrl('/some/path')).not.toThrow();
    // Clean up spawned process
    client.stop();
  });

  it('setGovernorDir creates new transport and starts it', async () => {
    const { GovernorClient } = await import('../../src/main/rpc-client');
    const client = new GovernorClient('/first');
    expect(() => client.setGovernorDir('/second')).not.toThrow();
    // Clean up spawned process
    client.stop();
  });
});

// ---------------------------------------------------------------------------
// RpcTransport tests (transport layer)
// ---------------------------------------------------------------------------

describe('RpcTransport', () => {
  it('exports RpcTransport class', async () => {
    const { RpcTransport } = await import('../../src/main/rpc-client');
    expect(RpcTransport).toBeDefined();
  });

  it('isRunning returns false when not started', async () => {
    const { RpcTransport } = await import('../../src/main/rpc-client');
    const transport = new RpcTransport('.governor');
    expect(transport.isRunning).toBe(false);
  });

  it('call rejects when not running', async () => {
    const { RpcTransport } = await import('../../src/main/rpc-client');
    const transport = new RpcTransport('.governor');
    await expect(transport.call('governor.hello')).rejects.toThrow('not running');
  });
});

// ---------------------------------------------------------------------------
// Shape adapter tests — daemon → renderer format conversions
// ---------------------------------------------------------------------------

describe('Shape adapters (via GovernorClient internals)', () => {
  // We test the adapters indirectly by importing the module and calling the
  // non-exported functions through a mock transport that returns daemon shapes.
  // Since the adapters are module-private, we verify by constructing a client
  // with a mock transport and checking the output shapes.

  // Helper: build a GovernorClient and replace its transport with a mock
  async function clientWithMock() {
    const mod = await import('../../src/main/rpc-client');
    const client = new mod.GovernorClient('/tmp/test');

    // Replace transport with a mock that returns canned responses
    const responses = new Map<string, unknown>();
    const mockTransport = {
      get isRunning() { return true; },
      start() {},
      stop() {},
      async call<T>(method: string, _params?: Record<string, unknown>): Promise<T> {
        if (!responses.has(method)) throw new Error(`No mock for ${method}`);
        return responses.get(method) as T;
      },
    };

    // Replace private transport field
    (client as unknown as { transport: unknown }).transport = mockTransport;
    return { client, responses };
  }

  it('listSessions adapts session_id → id, name → title', async () => {
    const { client, responses } = await clientWithMock();
    responses.set('sessions.list', [
      {
        session_id: 'sess_abc',
        name: 'My Session',
        mode: 'fiction',
        created_at: '2025-01-01T00:00:00Z',
        parent_id: null,
        is_mainline: true,
      },
    ]);

    const result = await client.listSessions();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('sess_abc');
    expect(result[0].title).toBe('My Session');
    expect(result[0].context_id).toBe('default');
    expect(result[0].model).toBe('daemon');
    expect(result[0].message_count).toBe(0);
    expect(result[0].updated_at).toBe('2025-01-01T00:00:00Z'); // fallback to created_at
  });

  it('listSessions uses last_active for updated_at when available', async () => {
    const { client, responses } = await clientWithMock();
    responses.set('sessions.list', [
      {
        session_id: 'sess_xyz',
        name: 'Active',
        mode: 'code',
        created_at: '2025-01-01T00:00:00Z',
        last_active: '2025-06-15T12:00:00Z',
        parent_id: null,
        is_mainline: true,
      },
    ]);

    const result = await client.listSessions();
    expect(result[0].updated_at).toBe('2025-06-15T12:00:00Z');
  });

  it('createSession adapts Capsule → ChatSession', async () => {
    const { client, responses } = await clientWithMock();
    responses.set('sessions.create', {
      metadata: {
        session_id: 'sess_new',
        name: 'New Session',
        mode: 'general',
        created_at: '2025-01-01T00:00:00Z',
        last_active: '2025-01-01T00:00:00Z',
        state: 'active',
        parent_id: null,
        is_mainline: true,
      },
      ledger: { anchors: [], decisions: [] },
      workspace: {},
    });

    const result = await client.createSession('New Session');
    expect(result.id).toBe('sess_new');
    expect(result.title).toBe('New Session');
    expect(result.messages).toEqual([]);
    expect(result.model).toBe('daemon');
  });

  it('getSession adapts Capsule → ChatSession', async () => {
    const { client, responses } = await clientWithMock();
    responses.set('sessions.get', {
      metadata: {
        session_id: 'sess_get',
        name: 'Got It',
        mode: 'fiction',
        created_at: '2025-02-01T00:00:00Z',
        last_active: '2025-02-01T01:00:00Z',
        state: 'active',
        parent_id: null,
        is_mainline: true,
      },
      ledger: {},
      workspace: {},
    });

    const result = await client.getSession('sess_get');
    expect(result.id).toBe('sess_get');
    expect(result.title).toBe('Got It');
    expect(result.updated_at).toBe('2025-02-01T01:00:00Z');
    expect(result.messages).toEqual([]);
  });

  it('commitPending adapts violations list → flat PendingViolation', async () => {
    const { client, responses } = await clientWithMock();
    responses.set('commit.pending', {
      id: 'v_hash',
      context_id: 'default',
      run_id: 'run_1',
      violations: [
        { anchor_id: 'a1', description: 'Tone violation', severity: 'error' },
        { anchor_id: 'a2', description: 'Second issue', severity: 'warning' },
      ],
      blocked_response: 'The blocked text that was too long',
      timestamp: '2025-01-01T00:00:00Z',
      mode: 'fiction',
      status: 'pending',
    });

    const result = await client.commitPending();
    expect(result).not.toBeNull();
    expect(result!.violation_id).toBe('v_hash');
    expect(result!.anchor_id).toBe('a1'); // first violation
    expect(result!.description).toBe('Tone violation');
    expect(result!.severity).toBe('error');
    expect(result!.content_preview).toBe('The blocked text that was too long');
  });

  it('commitPending returns null when no pending violation', async () => {
    const { client, responses } = await clientWithMock();
    responses.set('commit.pending', null);

    const result = await client.commitPending();
    expect(result).toBeNull();
  });

  it('commitPending truncates long content_preview', async () => {
    const { client, responses } = await clientWithMock();
    const longText = 'x'.repeat(300);
    responses.set('commit.pending', {
      id: 'v_long',
      context_id: 'default',
      run_id: 'run_1',
      violations: [{ anchor_id: 'a1', description: 'Violation', severity: 'error' }],
      blocked_response: longText,
      timestamp: '2025-01-01T00:00:00Z',
      mode: 'code',
      status: 'pending',
    });

    const result = await client.commitPending();
    expect(result!.content_preview.length).toBeLessThanOrEqual(201); // 200 + ellipsis char
  });

  it('commitExceptions adapts daemon ExceptionRecord → renderer ExceptionRecord', async () => {
    const { client, responses } = await clientWithMock();
    responses.set('commit.exceptions', [
      {
        id: 'exc_1',
        violations: [{ anchor_id: 'a1', description: 'Tone', severity: 'error' }],
        blocked_response_preview: 'First 200 chars of response',
        scope: 'session',
        expiry: '2025-12-31T00:00:00Z',
        created_at: '2025-06-01T00:00:00Z',
        mode: 'fiction',
      },
    ]);

    const result = await client.commitExceptions();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('exc_1');
    expect(result[0].violation_id).toBe('a1');
    expect(result[0].action).toBe('proceed');
    expect(result[0].reason).toBe('First 200 chars of response');
    expect(result[0].timestamp).toBe('2025-06-01T00:00:00Z');
    expect(result[0].scope).toBe('session');
    expect(result[0].expiry).toBe('2025-12-31T00:00:00Z');
  });

  it('commitExceptions handles empty violations list gracefully', async () => {
    const { client, responses } = await clientWithMock();
    responses.set('commit.exceptions', [
      {
        id: 'exc_2',
        violations: [],
        blocked_response_preview: 'Something',
        scope: 'single_instance',
        expiry: null,
        created_at: '2025-06-01T00:00:00Z',
        mode: 'code',
      },
    ]);

    const result = await client.commitExceptions();
    expect(result[0].violation_id).toBe('');
    expect(result[0].action).toBe('proceed');
  });
});
