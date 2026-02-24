<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { claimStatusColor, formatAge } from '$lib/format';
  import type { ClaimsStats, ClaimsWindow, ClaimDetail, ClaimVerificationSummary } from '$lib/types';
  import * as store from '../stores/integrity';

  let { stats = null, window: claimsWindow = null, detail = null, detailLoading = false }: {
    stats: ClaimsStats | null;
    window: ClaimsWindow | null;
    detail: ClaimDetail | null;
    detailLoading: boolean;
  } = $props();

  /** Status counts from window (has verified/partial/contradicted/unverified breakdown). */
  const statusCounts = $derived(claimsWindow?.counts_by_status ?? {});

  const STATUS_KEYS = ['verified', 'partial', 'contradicted', 'unverified'] as const;

  function selectClaim(claimId: string): void {
    store.fetchClaimDetail(claimId);
  }

  function closeDetail(): void {
    store.clearClaimDetail();
  }

  function roleLabel(role: string): string {
    switch (role) {
      case 'supports': return 'supports';
      case 'contradicts': return 'contradicts';
      case 'neutral': return 'neutral';
      default: return role;
    }
  }
</script>

<div class="claims-panel">
  <!-- Count pills -->
  <div class="claims-pills">
    {#each STATUS_KEYS as key}
      {@const count = statusCounts[key] ?? 0}
      <span class="status-pill" style="border-color: {claimStatusColor(key)}; color: {claimStatusColor(key)}">
        {count} {key}
      </span>
    {/each}
    {#if stats}
      <span class="claims-meta">{stats.total} total claims</span>
      <span class="claims-meta">{stats.total_links} links</span>
      {#if stats.newest_at}
        <span class="claims-meta">newest {formatAge(stats.newest_at)}</span>
      {/if}
    {/if}
  </div>

  <!-- Claims table (from window) -->
  {#if claimsWindow && claimsWindow.claims.length > 0}
    <div class="claims-list">
      {#each claimsWindow.claims as claim}
        <button class="claim-row" onclick={() => selectClaim(claim.claim_id)}>
          <span class="claim-status" style="color: {claimStatusColor(claim.status)}">
            {claim.status}
          </span>
          <span class="claim-text">{claim.claim_text}</span>
          <span class="claim-tag kind">{claim.claim_kind}</span>
          <span class="claim-tag level">{claim.claim_level}</span>
          <span class="claim-coverage">
            {claim.supporting_receipt_ids.length}S
            {claim.contradicting_receipt_ids.length}C
            {claim.neutral_receipt_ids.length}N
          </span>
          {#if !claim.receipt_chain_ok}
            <span class="chain-warn">chain broken</span>
          {/if}
          <span class="claim-age">{formatAge(claim.created_at)}</span>
        </button>
      {/each}
    </div>
  {:else if claimsWindow}
    <div class="claims-empty">No claims in window</div>
  {/if}

  <!-- Detail drawer -->
  {#if detail}
    <div class="claim-detail-drawer">
      <div class="drawer-header">
        <h4>Claim Detail</h4>
        <button class="drawer-close" onclick={closeDetail}>Close</button>
      </div>
      <div class="drawer-body">
        <div class="detail-field">
          <span class="detail-label">Status</span>
          <span class="detail-value" style="color: {claimStatusColor(detail.summary.status)}">
            {detail.summary.status}
          </span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Text</span>
          <span class="detail-value">{detail.summary.claim_text}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Kind / Level</span>
          <span class="detail-value">{detail.summary.claim_kind} / {detail.summary.claim_level}</span>
        </div>
        {#if detail.summary.unresolved_receipt_refs > 0}
          <div class="detail-field">
            <span class="detail-label">Unresolved refs</span>
            <span class="detail-value warn">{detail.summary.unresolved_receipt_refs}</span>
          </div>
        {/if}
        {#if detail.links.length > 0}
          <div class="detail-section">
            <span class="detail-label">Links ({detail.links.length})</span>
            {#each detail.links as link}
              <div class="link-row">
                <span class="link-role" style="color: {claimStatusColor(link.role === 'supports' ? 'verified' : link.role === 'contradicts' ? 'contradicted' : 'unverified')}">
                  {roleLabel(link.role)}
                </span>
                <span class="link-receipt-id">{link.receipt_id}</span>
                <span class="link-time">{formatAge(link.created_at)}</span>
              </div>
            {/each}
          </div>
        {/if}
        {#if detail.receipts.length > 0}
          <div class="detail-section">
            <span class="detail-label">Receipts ({detail.receipts.length})</span>
            {#each detail.receipts as stub}
              <div class="receipt-stub-row">
                <span class="stub-verdict" style="color: {claimStatusColor(stub.verdict === 'pass' ? 'verified' : stub.verdict === 'block' ? 'contradicted' : 'partial')}">
                  {stub.verdict}
                </span>
                <span class="stub-gate">{stub.gate}</span>
                <span class="stub-time">{formatAge(stub.timestamp)}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {:else if detailLoading}
    <div class="claim-detail-drawer">
      <div class="drawer-body">Loading claim detail...</div>
    </div>
  {/if}
</div>

<style>
  .claims-panel {
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
  }

  .claims-pills {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    flex-wrap: wrap;
  }

  .status-pill {
    font-size: var(--font-size-xs);
    font-weight: 600;
    padding: 2px 8px;
    border: 1px solid;
    border-radius: 10px;
    white-space: nowrap;
  }

  .claims-meta {
    font-size: 10px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .claims-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .claim-row {
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

  .claim-row:hover {
    background: var(--bg-hover);
  }

  .claim-status {
    font-weight: 600;
    min-width: 76px;
    text-transform: capitalize;
  }

  .claim-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .claim-tag {
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 2px;
    background: var(--bg-secondary);
    color: var(--text-muted);
    white-space: nowrap;
  }

  .claim-coverage {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .chain-warn {
    font-size: 10px;
    color: var(--block);
    white-space: nowrap;
  }

  .claim-age {
    color: var(--text-muted);
    margin-left: auto;
    white-space: nowrap;
  }

  .claims-empty {
    color: var(--text-muted);
    font-size: var(--font-size-xs);
    padding: var(--sp-sm);
  }

  .claim-detail-drawer {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: var(--sp-sm) var(--sp-md);
  }

  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--sp-sm);
  }

  .drawer-header h4 {
    font-size: var(--font-size-sm);
    font-weight: 600;
    margin: 0;
  }

  .drawer-close {
    font-size: var(--font-size-xs);
    padding: 2px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-secondary);
    cursor: pointer;
  }

  .drawer-body {
    display: flex;
    flex-direction: column;
    gap: var(--sp-xs);
  }

  .detail-field {
    display: flex;
    gap: var(--sp-sm);
    font-size: var(--font-size-xs);
  }

  .detail-label {
    color: var(--text-muted);
    min-width: 90px;
    font-weight: 500;
  }

  .detail-value {
    color: var(--text-primary);
  }

  .detail-value.warn {
    color: var(--warn);
  }

  .detail-section {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: var(--sp-xs);
  }

  .link-row, .receipt-stub-row {
    display: flex;
    gap: var(--sp-sm);
    font-size: var(--font-size-xs);
    padding: 2px var(--sp-sm);
    background: var(--bg-primary);
    border-radius: 2px;
  }

  .link-role {
    font-weight: 600;
    min-width: 70px;
  }

  .link-receipt-id, .stub-gate {
    font-family: var(--font-mono);
    color: var(--text-secondary);
  }

  .link-time, .stub-time {
    color: var(--text-muted);
    margin-left: auto;
  }

  .stub-verdict {
    font-weight: 600;
    min-width: 44px;
  }
</style>
