<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { decisionActionColor, formatTimestamp } from '$lib/format';
  import type { ReceiptV1, ReceiptV1VerifyResult } from '$lib/types';

  let { receipts = [], verifyResult = null, onshowmore }: {
    receipts: ReceiptV1[];
    verifyResult: ReceiptV1VerifyResult | null;
    onshowmore?: () => void;
  } = $props();

  let expandedId = $state<string | null>(null);

  function toggle(id: string): void {
    expandedId = expandedId === id ? null : id;
  }

  /** Check if there's a gap before this receipt (compared to previous). */
  function hasGapBefore(index: number): boolean {
    if (index === 0 || !verifyResult) return false;
    const prev = receipts[index - 1];
    const curr = receipts[index];
    return curr.seq - prev.seq > 1;
  }

  function gapRange(index: number): string {
    if (index === 0) return '';
    const prev = receipts[index - 1];
    const curr = receipts[index];
    const start = prev.seq + 1;
    const end = curr.seq - 1;
    return start === end ? `seq ${start}` : `seq ${start}–${end}`;
  }
</script>

<div class="receipt-chain">
  {#if verifyResult}
    <div class="chain-header">
      <span class="verify-badge" class:valid={verifyResult.valid} class:invalid={!verifyResult.valid}>
        {verifyResult.valid ? 'Valid' : 'Invalid'}
      </span>
      <span class="chain-stat">{verifyResult.count} receipts</span>
      {#if verifyResult.count > 0}
        <span class="chain-stat">seq {verifyResult.first_seq}–{verifyResult.last_seq}</span>
      {/if}
      {#if verifyResult.gaps.length > 0}
        <span class="chain-stat gap-warn">{verifyResult.gaps.length} gap{verifyResult.gaps.length !== 1 ? 's' : ''}</span>
      {/if}
      {#if verifyResult.errors.length > 0}
        <span class="chain-stat error-warn">{verifyResult.errors.length} error{verifyResult.errors.length !== 1 ? 's' : ''}</span>
      {/if}
    </div>

    {#if verifyResult.warnings.length > 0}
      <div class="chain-warnings">
        {#each verifyResult.warnings as warning}
          <span class="warning-text">{warning}</span>
        {/each}
      </div>
    {/if}
  {/if}

  {#if receipts.length === 0}
    <div class="chain-empty">No v1 receipts</div>
  {:else}
    <div class="receipt-list">
      {#each receipts as receipt, i}
        {#if hasGapBefore(i)}
          <div class="gap-indicator">
            <span class="gap-line"></span>
            <span class="gap-label">missing {gapRange(i)}</span>
            <span class="gap-line"></span>
          </div>
        {/if}
        <button class="receipt-block" onclick={() => toggle(receipt.receipt_id)}>
          <span class="receipt-seq">#{receipt.seq}</span>
          <span class="receipt-tool">{receipt.tool_id}</span>
          <span class="receipt-action" style="color: {decisionActionColor(receipt.decision_action)}">
            {receipt.decision_action}
          </span>
          <span class="receipt-exec">{receipt.execution_status}</span>
          <span class="receipt-time">{formatTimestamp(receipt.generated_at)}</span>
        </button>
        {#if expandedId === receipt.receipt_id}
          <div class="receipt-detail">
            <div class="detail-row"><span class="detail-key">Actor</span><span>{receipt.actor}</span></div>
            <div class="detail-row"><span class="detail-key">Tool args</span><span class="mono">{receipt.tool_args_summary}</span></div>
            <div class="detail-row"><span class="detail-key">Decision</span><span>{receipt.decision_reason}</span></div>
            <div class="detail-row"><span class="detail-key">Execution</span><span>{receipt.execution_summary}</span></div>
            {#if receipt.execution_duration_ms > 0}
              <div class="detail-row"><span class="detail-key">Duration</span><span>{receipt.execution_duration_ms}ms</span></div>
            {/if}
            <div class="detail-row">
              <span class="detail-key">Chain</span>
              <span class="mono">{receipt.chain_hash.slice(0, 12)}… ← {receipt.prev_hash.slice(0, 12)}…</span>
            </div>
          </div>
        {/if}
      {/each}
    </div>

    {#if onshowmore && receipts.length >= 100}
      <button class="btn-show-more" onclick={onshowmore}>Show more receipts</button>
    {/if}
  {/if}
</div>

<style>
  .receipt-chain {
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
  }

  .chain-header {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    flex-wrap: wrap;
  }

  .verify-badge {
    font-size: var(--font-size-xs);
    font-weight: 600;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
  }

  .verify-badge.valid {
    background: color-mix(in srgb, var(--pass) 20%, var(--bg-primary));
    color: var(--pass);
  }

  .verify-badge.invalid {
    background: color-mix(in srgb, var(--block) 20%, var(--bg-primary));
    color: var(--block);
  }

  .chain-stat {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .gap-warn {
    color: var(--warn);
  }

  .error-warn {
    color: var(--block);
  }

  .chain-warnings {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .warning-text {
    font-size: 10px;
    color: var(--warn);
  }

  .chain-empty {
    color: var(--text-muted);
    font-size: var(--font-size-xs);
    padding: var(--sp-sm);
  }

  .receipt-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .gap-indicator {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    padding: var(--sp-xs) 0;
  }

  .gap-line {
    flex: 1;
    height: 1px;
    background: var(--warn);
    opacity: 0.5;
  }

  .gap-label {
    font-size: 10px;
    color: var(--warn);
    white-space: nowrap;
  }

  .receipt-block {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    padding: var(--sp-xs) var(--sp-sm);
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: var(--font-size-xs);
    text-align: left;
    width: 100%;
    color: var(--text-secondary);
    transition: background 0.15s;
  }

  .receipt-block:hover {
    background: var(--bg-hover);
  }

  .receipt-seq {
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--text-primary);
    min-width: 32px;
  }

  .receipt-tool {
    font-family: var(--font-mono);
    min-width: 80px;
  }

  .receipt-action {
    font-weight: 600;
    min-width: 60px;
  }

  .receipt-exec {
    color: var(--text-muted);
    min-width: 56px;
  }

  .receipt-time {
    color: var(--text-muted);
    margin-left: auto;
    white-space: nowrap;
  }

  .receipt-detail {
    padding: var(--sp-sm) var(--sp-md);
    background: var(--bg-secondary);
    border-radius: 0 0 var(--radius-sm) var(--radius-sm);
    border: 1px solid var(--border);
    border-top: none;
    display: flex;
    flex-direction: column;
    gap: var(--sp-xs);
    margin-top: -2px;
  }

  .detail-row {
    display: flex;
    gap: var(--sp-sm);
    font-size: var(--font-size-xs);
  }

  .detail-key {
    color: var(--text-muted);
    min-width: 72px;
  }

  .mono {
    font-family: var(--font-mono);
  }

  .btn-show-more {
    align-self: center;
    font-size: var(--font-size-xs);
    padding: var(--sp-xs) var(--sp-md);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    cursor: pointer;
  }

  .btn-show-more:hover {
    background: var(--bg-hover);
  }
</style>
