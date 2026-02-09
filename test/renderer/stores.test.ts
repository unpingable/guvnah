/**
 * Tests for renderer stores — mock window.governor, verify state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api module before importing stores
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
  };
  return { api: mockApi };
});

import { api } from '../../src/renderer/lib/api';
const mockApi = api as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('format utilities', () => {
  it('formats timestamps', async () => {
    const { formatRelative, verdictColor, stiffnessLabel } = await import('../../src/renderer/lib/format');

    // Test relative time formatting
    const now = new Date().toISOString();
    expect(formatRelative(now)).toBe('just now');

    // Test verdict colors
    expect(verdictColor('pass')).toBe('var(--pass)');
    expect(verdictColor('warn')).toBe('var(--warn)');
    expect(verdictColor('block')).toBe('var(--block)');
    expect(verdictColor('unknown')).toBe('var(--text-secondary)');

    // Test stiffness labels
    expect(stiffnessLabel(0.95)).toBe('hard');
    expect(stiffnessLabel(0.7)).toBe('stiff');
    expect(stiffnessLabel(0.4)).toBe('moderate');
    expect(stiffnessLabel(0.1)).toBe('soft');
  });

  it('truncates strings', async () => {
    const { truncate } = await import('../../src/renderer/lib/format');

    expect(truncate('short', 10)).toBe('short');
    expect(truncate('this is a long string', 10)).toBe('this is a\u2026');
  });
});

describe('svelte runes compilation guard', () => {
  it('no raw $state() calls in plain .ts files (must use .svelte.ts)', async () => {
    // Svelte 5 runes are compile-time macros. A .ts file using $state() will
    // silently produce a runtime landmine — the symbol leaks into the bundle
    // as an unresolved reference. Only .svelte and .svelte.ts files are processed
    // by the Svelte compiler's rune pipeline.
    const fs = await import('fs');
    const path = await import('path');
    const glob = await import('fs');

    const srcDir = path.resolve(__dirname, '../../src/renderer');
    const violations: string[] = [];

    function walk(dir: string): void {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.svelte.ts')) {
          const content = fs.readFileSync(full, 'utf-8');
          if (/\$state\s*[<(]/.test(content) || /\$derived\s*[<(]/.test(content) || /\$effect\s*\(/.test(content)) {
            violations.push(path.relative(srcDir, full));
          }
        }
      }
    }

    walk(srcDir);
    expect(violations, `These .ts files use runes — rename to .svelte.ts:\n  ${violations.join('\n  ')}`).toEqual([]);
  });
});

describe('shared types', () => {
  it('exports Channel type constants', async () => {
    const { Channels } = await import('../../src/shared/channels');

    expect(Channels.HEALTH).toBe('governor:health');
    expect(Channels.SESSIONS_LIST).toBe('sessions:list');
    expect(Channels.INTENT_TEMPLATES).toBe('intent:templates');
    expect(Channels.RECEIPTS_LIST).toBe('receipts:list');
    expect(Channels.SCARS_LIST).toBe('scars:list');
    expect(Channels.COMMIT_PENDING).toBe('commit:pending');
  });

  it('all channels are unique', async () => {
    const { Channels } = await import('../../src/shared/channels');
    const values = Object.values(Channels);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
