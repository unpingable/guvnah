<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import FidelityPanel from '../components/FidelityPanel.svelte';
  import CaptureIndicators from '../components/CaptureIndicators.svelte';
  import RegimeStrip from '../components/RegimeStrip.svelte';
  import ReceiptChain from '../components/ReceiptChain.svelte';
  import ClaimsPanel from '../components/ClaimsPanel.svelte';
  import { formatAge, regimeColor, regimeLabel } from '$lib/format';
  import * as store from '../stores/integrity';

  const snapshot = $derived(store.getSnapshot());
  const correlatorStatus = $derived(store.getCorrelatorStatus());
  const history = $derived(store.getCorrelatorHistory());
  const kvector = $derived(store.getKvector());
  const receiptsV1 = $derived(store.getReceiptsV1());
  const verifyResult = $derived(store.getVerifyResult());
  const traceResponse = $derived(store.getTraceResponse());
  const loading = $derived(store.isLoading());
  const lastRefreshed = $derived(store.getLastRefreshed());

  const snapshotError = $derived(store.getSnapshotError());
  const correlatorError = $derived(store.getCorrelatorError());
  const receiptsError = $derived(store.getReceiptsError());
  const traceError = $derived(store.getTraceError());

  const claimsStats = $derived(store.getClaimsStats());
  const claimsWindow = $derived(store.getClaimsWindow());
  const claimDetail = $derived(store.getSelectedClaimDetail());
  const claimsError = $derived(store.getClaimsError());
  const claimsDetailLoading = $derived(store.isClaimsDetailLoading());

  /** Latest telemetry timestamp across all daemon data sources. */
  const latestEventTimestamp = $derived.by(() => {
    const candidates: string[] = [];
    if (snapshot?.generated_at) candidates.push(snapshot.generated_at);
    if (correlatorStatus?.latest?.timestamp) candidates.push(correlatorStatus.latest.timestamp);
    if (history.length > 0) candidates.push(history[history.length - 1].timestamp);
    if (traceResponse?.events.length) {
      candidates.push(traceResponse.events[traceResponse.events.length - 1].timestamp);
    }
    if (receiptsV1.length > 0) candidates.push(receiptsV1[receiptsV1.length - 1].generated_at);
    if (candidates.length === 0) return null;
    // Pick the most recent
    return candidates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
  });

  /** True if latest telemetry is >5 minutes old. */
  const telemetryStale = $derived(
    latestEventTimestamp
      ? (Date.now() - new Date(latestEventTimestamp).getTime()) > 5 * 60 * 1000
      : false
  );

  $effect(() => {
    store.refresh();
  });
</script>

<div class="view">
  <header class="view-header">
    <h2>Execution Integrity</h2>
    <div class="header-actions">
      {#if latestEventTimestamp}
        <span class="telemetry-age" class:stale={telemetryStale}>
          latest event {formatAge(latestEventTimestamp)}
        </span>
      {/if}
      {#if lastRefreshed}
        <span class="last-refreshed">fetched {formatAge(lastRefreshed)}</span>
      {/if}
      <button class="btn" onclick={() => store.refresh()} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  </header>

  <!-- Status summary (top area grid) -->
  <div class="status-grid">
    {#if snapshotError}
      <div class="panel-error card">Snapshot: {snapshotError}</div>
    {:else if snapshot}
      <div class="status-card card">
        <div class="status-row">
          <span class="regime-pill" style="background: {regimeColor(snapshot.regime)}; color: var(--bg-primary)">
            {regimeLabel(snapshot.regime)}
          </span>
          <span class="stat-item">{snapshot.facts_count} facts</span>
          <span class="stat-item">{snapshot.decisions_count} decisions</span>
          <span class="stat-item">{snapshot.receipts_count} receipts</span>
          <span class="stat-item">{snapshot.scars_count} scars</span>
        </div>
        {#if snapshot.checks.length > 0}
          <div class="checks-row">
            {#each snapshot.checks as check}
              <span class="check-badge" class:ok={check.status === 'ok'} class:warn={check.status === 'warn'} class:error={check.status === 'error'}>
                {check.name}: {check.message}
              </span>
            {/each}
          </div>
        {/if}
        {#if snapshot.suggestions.length > 0}
          <div class="suggestions">
            {#each snapshot.suggestions as s}
              <span class="suggestion">{s}</span>
            {/each}
          </div>
        {/if}
        <span class="freshness">Generated {formatAge(snapshot.generated_at)}</span>
      </div>
    {/if}

    <!-- Claims: Claim vs Verified -->
    {#if claimsError}
      <div class="panel-error card">Claims: {claimsError}</div>
    {:else if claimsStats || claimsWindow}
      <div class="claims-card card">
        <h3>Claim vs Verified</h3>
        <ClaimsPanel
          stats={claimsStats}
          window={claimsWindow}
          detail={claimDetail}
          detailLoading={claimsDetailLoading}
        />
      </div>
    {/if}
  </div>

  <!-- Two-column: Fidelity + Capture -->
  <div class="two-col">
    <div class="panel card">
      <h3>Fidelity / Throughput</h3>
      {#if correlatorError}
        <div class="panel-error">{correlatorError}</div>
      {:else}
        <FidelityPanel {kvector} {history} />
      {/if}
    </div>
    <div class="panel card">
      <h3>Capture Indicators</h3>
      {#if correlatorError}
        <div class="panel-error">{correlatorError}</div>
      {:else}
        <CaptureIndicators status={correlatorStatus} />
      {/if}
    </div>
  </div>

  <!-- Regime Strip -->
  <div class="panel card">
    <h3>Regime Timeline</h3>
    {#if correlatorError}
      <div class="panel-error">{correlatorError}</div>
    {:else}
      <RegimeStrip
        {history}
        operationalRegime={snapshot?.operational_regime ?? ''}
        traceEvents={traceError ? [] : traceResponse?.events ?? []}
      />
    {/if}
  </div>

  <!-- Receipt Chain -->
  <div class="panel card scrollable">
    <h3>Receipt Chain (v1)</h3>
    {#if receiptsError}
      <div class="panel-error">{receiptsError}</div>
    {:else}
      <ReceiptChain
        receipts={receiptsV1}
        {verifyResult}
        onshowmore={() => store.fetchMoreReceipts()}
      />
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
    overflow-y: auto;
  }

  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  .view-header h2 {
    font-size: var(--font-size-xl);
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
  }

  .telemetry-age {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }

  .telemetry-age.stale {
    color: var(--block);
    font-weight: 600;
  }

  .last-refreshed {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .status-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--sp-sm);
    flex-shrink: 0;
  }

  .claims-card {
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
    padding: var(--sp-sm) var(--sp-md);
  }

  .claims-card h3 {
    font-size: var(--font-size-md);
    font-weight: 600;
    margin: 0;
  }

  .status-card {
    display: flex;
    flex-direction: column;
    gap: var(--sp-xs);
    padding: var(--sp-sm) var(--sp-md);
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: var(--sp-md);
    flex-wrap: wrap;
  }

  .regime-pill {
    font-size: var(--font-size-xs);
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 10px;
  }

  .stat-item {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .checks-row {
    display: flex;
    gap: var(--sp-xs);
    flex-wrap: wrap;
  }

  .check-badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 2px;
    background: var(--bg-primary);
    color: var(--text-muted);
  }

  .check-badge.ok {
    color: var(--pass);
  }

  .check-badge.warn {
    color: var(--warn);
  }

  .check-badge.error {
    color: var(--block);
  }

  .suggestions {
    display: flex;
    gap: var(--sp-sm);
    flex-wrap: wrap;
  }

  .suggestion {
    font-size: 10px;
    color: var(--text-muted);
    font-style: italic;
  }

  .freshness {
    font-size: 10px;
    color: var(--text-muted);
  }

  .two-col {
    display: flex;
    gap: var(--sp-md);
    flex-shrink: 0;
  }

  .two-col > .panel {
    flex: 1;
    min-width: 0;
  }

  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
    padding: var(--sp-sm) var(--sp-md);
    flex-shrink: 0;
  }

  .panel h3 {
    font-size: var(--font-size-md);
    font-weight: 600;
    margin: 0;
  }

  .panel-error {
    font-size: var(--font-size-xs);
    color: var(--warn);
    padding: var(--sp-xs);
  }
</style>
