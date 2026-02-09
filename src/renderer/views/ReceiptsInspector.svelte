<script lang="ts">
  import VerdictBadge from '../components/VerdictBadge.svelte';
  import JsonTree from '../components/JsonTree.svelte';
  import { formatTimestamp, truncate } from '$lib/format';
  import * as receiptStore from '../stores/receipts';

  const receipts = $derived(receiptStore.getReceipts());
  const detail = $derived(receiptStore.getSelectedDetail());
  const filterGate = $derived(receiptStore.getFilterGate());
  const filterVerdict = $derived(receiptStore.getFilterVerdict());
  const loading = $derived(receiptStore.isLoading());

  $effect(() => {
    receiptStore.fetchReceipts();
  });

  function handleGateFilter(e: Event): void {
    receiptStore.setFilterGate((e.target as HTMLInputElement).value);
    receiptStore.fetchReceipts();
  }

  function handleVerdictFilter(e: Event): void {
    receiptStore.setFilterVerdict((e.target as HTMLSelectElement).value);
    receiptStore.fetchReceipts();
  }

  async function handleSelect(id: string): Promise<void> {
    await receiptStore.selectReceipt(id);
  }

  function handleClose(): void {
    receiptStore.clearSelection();
  }
</script>

<div class="view">
  <header class="view-header">
    <h2>Receipts</h2>
  </header>

  <div class="filters">
    <input
      class="input"
      type="text"
      placeholder="Filter by gate..."
      value={filterGate}
      oninput={handleGateFilter}
    />
    <select class="input" value={filterVerdict} onchange={handleVerdictFilter}>
      <option value="">All verdicts</option>
      <option value="pass">Pass</option>
      <option value="warn">Warn</option>
      <option value="block">Block</option>
    </select>
    <button class="btn" onclick={() => receiptStore.fetchReceipts()}>Refresh</button>
  </div>

  <div class="content-area">
    <div class="receipt-list scrollable">
      {#if loading && receipts.length === 0}
        <div class="empty-state">Loading receipts...</div>
      {:else if receipts.length === 0}
        <div class="empty-state">No receipts found.</div>
      {:else}
        {#each receipts as receipt}
          <button
            class="receipt-row card"
            class:selected={detail?.receipt.receipt_id === receipt.receipt_id}
            onclick={() => handleSelect(receipt.receipt_id)}
          >
            <div class="receipt-header">
              <VerdictBadge verdict={receipt.verdict} />
              <span class="gate">{receipt.gate}</span>
              <span class="timestamp">{formatTimestamp(receipt.timestamp)}</span>
            </div>
            <div class="receipt-hash">
              <code>{truncate(receipt.receipt_id, 32)}</code>
            </div>
          </button>
        {/each}
      {/if}
    </div>

    {#if detail}
      <div class="detail-panel card">
        <div class="detail-header">
          <h3>Receipt Detail</h3>
          <button class="btn btn-sm" onclick={handleClose}>&times;</button>
        </div>
        <div class="detail-fields">
          <div><span class="field-label">ID:</span> <code>{detail.receipt.receipt_id}</code></div>
          <div><span class="field-label">Gate:</span> {detail.receipt.gate}</div>
          <div><span class="field-label">Verdict:</span> <VerdictBadge verdict={detail.receipt.verdict} /></div>
          <div><span class="field-label">Schema:</span> {detail.receipt.schema_version}</div>
          <div><span class="field-label">Time:</span> {formatTimestamp(detail.receipt.timestamp)}</div>
          <div><span class="field-label">Subject:</span> <code>{truncate(detail.receipt.subject_hash, 24)}</code></div>
          <div><span class="field-label">Evidence:</span> <code>{truncate(detail.receipt.evidence_hash, 24)}</code></div>
          <div><span class="field-label">Policy:</span> <code>{truncate(detail.receipt.policy_hash, 24)}</code></div>
        </div>
        {#if detail.evidence}
          <div class="evidence-section">
            <span class="label">Evidence Bundle</span>
            <JsonTree data={detail.evidence} />
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .view {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--sp-md);
    gap: var(--sp-md);
  }

  .view-header h2 {
    font-size: var(--font-size-xl);
    font-weight: 600;
  }

  .filters {
    display: flex;
    gap: var(--sp-sm);
  }

  .filters .input {
    max-width: 200px;
  }

  .content-area {
    display: flex;
    gap: var(--sp-md);
    flex: 1;
    overflow: hidden;
  }

  .receipt-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
  }

  .receipt-row {
    cursor: pointer;
    text-align: left;
    width: 100%;
  }

  .receipt-row.selected {
    border-color: var(--accent);
  }

  .receipt-header {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
  }

  .gate {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  .timestamp {
    margin-left: auto;
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .receipt-hash {
    margin-top: var(--sp-xs);
  }

  code {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .detail-panel {
    width: 400px;
    flex-shrink: 0;
    overflow-y: auto;
    border-color: var(--accent);
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--sp-md);
  }

  .detail-header h3 {
    font-size: var(--font-size-md);
  }

  .detail-fields {
    display: flex;
    flex-direction: column;
    gap: var(--sp-xs);
    font-size: var(--font-size-sm);
  }

  .field-label {
    color: var(--text-secondary);
  }

  .evidence-section {
    margin-top: var(--sp-md);
    padding-top: var(--sp-md);
    border-top: 1px solid var(--border);
  }
</style>
