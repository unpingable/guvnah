<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import VerdictBadge from '../components/VerdictBadge.svelte';
  import { api } from '$lib/api';
  import type { PendingViolation, ResolutionResult, ExceptionRecord } from '$lib/types';

  let pending = $state<PendingViolation | null>(null);
  let exceptions = $state<ExceptionRecord[]>([]);
  let result = $state<ResolutionResult | null>(null);
  let reason = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    refresh();
  });

  async function refresh(): Promise<void> {
    loading = true;
    error = null;
    result = null;
    try {
      pending = await api.commitPending();
      exceptions = await api.commitExceptions();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  async function handleFix(): Promise<void> {
    loading = true;
    try {
      result = await api.commitFix();
      await refresh();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  async function handleRevise(): Promise<void> {
    loading = true;
    try {
      result = await api.commitRevise();
      await refresh();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  async function handleProceed(): Promise<void> {
    if (!reason.trim()) return;
    loading = true;
    try {
      result = await api.commitProceed(reason.trim());
      reason = '';
      await refresh();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }
</script>

<div class="view">
  <header class="view-header">
    <h2>Commit / Waive</h2>
    <button class="btn" onclick={refresh} disabled={loading}>Refresh</button>
  </header>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if result}
    <div class="result card" class:success={result.success} class:failure={!result.success}>
      <span class="result-action">{result.action}</span>
      <span class="result-message">{result.message}</span>
    </div>
  {/if}

  {#if pending}
    <div class="violation card">
      <div class="violation-header">
        <VerdictBadge verdict="block" />
        <span class="violation-severity">{pending.severity}</span>
      </div>
      <h3>Pending Violation</h3>
      <p class="violation-desc">{pending.description}</p>
      <div class="violation-meta">
        <span>Anchor: <code>{pending.anchor_id}</code></span>
        <span>ID: <code>{pending.violation_id}</code></span>
      </div>
      {#if pending.content_preview}
        <div class="preview">
          <span class="label">Content Preview</span>
          <pre>{pending.content_preview}</pre>
        </div>
      {/if}

      <div class="actions">
        <button class="btn btn-primary" onclick={handleFix} disabled={loading}>
          Fix Response
        </button>
        <button class="btn" onclick={handleRevise} disabled={loading}>
          Revise Anchor
        </button>
        <div class="proceed-group">
          <input
            class="input"
            type="text"
            placeholder="Reason for proceeding..."
            bind:value={reason}
            onkeydown={(e) => e.key === 'Enter' && handleProceed()}
          />
          <button class="btn btn-danger" onclick={handleProceed} disabled={loading || !reason.trim()}>
            Proceed (Waive)
          </button>
        </div>
      </div>
    </div>
  {:else if !loading}
    <div class="no-violation card">
      <VerdictBadge verdict="pass" />
      <span>No pending violations. All clear.</span>
    </div>
  {/if}

  {#if exceptions.length > 0}
    <div class="exceptions-section">
      <h3>Exception Log</h3>
      <div class="exception-list scrollable">
        {#each exceptions as exc}
          <div class="exception-row card">
            <div class="exception-header">
              <span class="exception-action pill">{exc.action}</span>
              <span class="exception-time">{exc.timestamp}</span>
            </div>
            <p class="exception-reason">{exc.reason}</p>
            {#if exc.scope}
              <span class="exception-scope">Scope: {exc.scope}</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .view {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--sp-md);
    gap: var(--sp-md);
  }

  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .view-header h2 {
    font-size: var(--font-size-xl);
    font-weight: 600;
  }

  .error {
    color: var(--block);
    font-size: var(--font-size-sm);
    padding: var(--sp-sm);
    background: color-mix(in srgb, var(--block), transparent 90%);
    border-radius: var(--radius-sm);
  }

  .result {
    display: flex;
    gap: var(--sp-sm);
    align-items: center;
  }

  .result.success { border-color: var(--pass); }
  .result.failure { border-color: var(--block); }

  .result-action {
    font-weight: 600;
    text-transform: uppercase;
    font-size: var(--font-size-xs);
  }

  .result-message {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .violation {
    border-color: var(--block);
  }

  .violation-header {
    display: flex;
    gap: var(--sp-sm);
    align-items: center;
    margin-bottom: var(--sp-sm);
  }

  .violation-severity {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .violation h3 {
    font-size: var(--font-size-md);
    margin-bottom: var(--sp-sm);
  }

  .violation-desc {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: var(--sp-sm);
  }

  .violation-meta {
    display: flex;
    gap: var(--sp-md);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-bottom: var(--sp-md);
  }

  code {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    background: var(--bg-primary);
    padding: 1px 4px;
    border-radius: 2px;
  }

  .preview {
    margin-bottom: var(--sp-md);
  }

  pre {
    background: var(--bg-primary);
    padding: var(--sp-sm);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    overflow-x: auto;
    color: var(--text-secondary);
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
  }

  .actions > :first-child {
    display: flex;
    gap: var(--sp-sm);
  }

  .proceed-group {
    display: flex;
    gap: var(--sp-sm);
    margin-top: var(--sp-sm);
  }

  .proceed-group .input {
    flex: 1;
  }

  .no-violation {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    border-color: var(--pass);
  }

  .exceptions-section {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .exceptions-section h3 {
    font-size: var(--font-size-md);
    margin-bottom: var(--sp-sm);
  }

  .exception-list {
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
  }

  .exception-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--sp-xs);
  }

  .exception-action {
    font-size: 10px;
  }

  .exception-time {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .exception-reason {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .exception-scope {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    font-family: var(--font-mono);
  }
</style>
