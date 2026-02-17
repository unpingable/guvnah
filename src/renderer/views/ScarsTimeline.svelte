<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import StiffnessIndicator from '../components/StiffnessIndicator.svelte';
  import { formatTimestamp } from '$lib/format';
  import * as scarStore from '../stores/scars';

  const scarsData = $derived(scarStore.getScars());
  const history = $derived(scarStore.getHistory());
  const loading = $derived(scarStore.isLoading());

  $effect(() => {
    scarStore.refresh();
  });
</script>

<div class="view">
  <header class="view-header">
    <h2>Scars & Shields</h2>
    <button class="btn" onclick={() => scarStore.refresh()}>Refresh</button>
  </header>

  {#if scarsData?.stats}
    <div class="stats-row">
      <div class="stat card">
        <span class="stat-value">{scarsData.stats.total_scars}</span>
        <span class="stat-label">Scars</span>
      </div>
      <div class="stat card">
        <span class="stat-value">{scarsData.stats.hard_scars}</span>
        <span class="stat-label">Hard</span>
      </div>
      <div class="stat card">
        <span class="stat-value">{scarsData.stats.total_shields}</span>
        <span class="stat-label">Shields</span>
      </div>
      <div class="stat card">
        <span class="stat-value stat-{scarsData.stats.health}">{scarsData.stats.health}</span>
        <span class="stat-label">Health</span>
      </div>
    </div>
  {/if}

  <div class="content-area">
    <!-- Scars -->
    <div class="panel scrollable">
      <h3>Scars</h3>
      {#if loading && !scarsData}
        <div class="empty-state">Loading...</div>
      {:else if !scarsData || scarsData.scars.length === 0}
        <div class="empty-state">No scars recorded.</div>
      {:else}
        {#each scarsData.scars as scar}
          <div class="scar-row card">
            <div class="scar-header">
              <span class="region">{scar.region}</span>
              <span class="evidence-count">{scar.evidence_count} evidence</span>
            </div>
            <StiffnessIndicator stiffness={scar.stiffness} />
            <div class="scar-meta">
              <span>First: {formatTimestamp(scar.first_seen)}</span>
              <span>Last: {formatTimestamp(scar.last_seen)}</span>
              <span class="provenance">{scar.provenance}</span>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Shields -->
    <div class="panel scrollable">
      <h3>Shields</h3>
      {#if !scarsData || scarsData.shields.length === 0}
        <div class="empty-state">No shields active.</div>
      {:else}
        {#each scarsData.shields as shield}
          <div class="shield-row card">
            <div class="shield-header">
              <span class="region">{shield.region}</span>
            </div>
            <div class="permeability-row">
              <span class="perm-label">Permeability</span>
              <div class="perm-track">
                <div class="perm-fill" style="width: {Math.round(shield.permeability * 100)}%"></div>
              </div>
              <span class="perm-value">{Math.round(shield.permeability * 100)}%</span>
            </div>
            <span class="shield-reason">{shield.reason}</span>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <!-- History -->
  {#if history.length > 0}
    <div class="history-section">
      <h3>Failure History</h3>
      <div class="history-list scrollable">
        {#each history as event}
          <div class="history-row">
            <span class="timestamp">{formatTimestamp(event.timestamp)}</span>
            <span class="region">{event.region}</span>
            <span class="category pill">{event.category}</span>
            <span class="details">{event.details}</span>
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

  .stats-row {
    display: flex;
    gap: var(--sp-md);
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--sp-sm) var(--sp-md);
    min-width: 80px;
  }

  .stat-value {
    font-size: var(--font-size-xl);
    font-weight: 700;
  }

  .stat-label {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .stat-healthy { color: var(--pass); }
  .stat-degraded { color: var(--warn); }
  .stat-critical { color: var(--block); }

  .content-area {
    display: flex;
    gap: var(--sp-md);
    flex: 1;
    overflow: hidden;
  }

  .panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
  }

  .panel h3 {
    font-size: var(--font-size-md);
    margin-bottom: var(--sp-xs);
  }

  .scar-row, .shield-row {
    display: flex;
    flex-direction: column;
    gap: var(--sp-xs);
  }

  .scar-header, .shield-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .region {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    font-weight: 600;
  }

  .evidence-count {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .scar-meta {
    display: flex;
    gap: var(--sp-md);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .provenance {
    font-style: italic;
  }

  .permeability-row {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    font-size: var(--font-size-xs);
  }

  .perm-label {
    color: var(--text-secondary);
    min-width: 80px;
  }

  .perm-track {
    flex: 1;
    height: 6px;
    background: var(--bg-primary);
    border-radius: 3px;
    overflow: hidden;
  }

  .perm-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 3px;
  }

  .perm-value {
    color: var(--text-secondary);
    min-width: 36px;
    text-align: right;
  }

  .shield-reason {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .history-section {
    max-height: 200px;
  }

  .history-section h3 {
    font-size: var(--font-size-md);
    margin-bottom: var(--sp-sm);
  }

  .history-list {
    max-height: 160px;
  }

  .history-row {
    display: flex;
    gap: var(--sp-sm);
    padding: var(--sp-xs) 0;
    font-size: var(--font-size-xs);
    border-bottom: 1px solid var(--border);
    align-items: center;
  }

  .timestamp {
    color: var(--text-muted);
    min-width: 100px;
  }

  .category {
    font-size: 10px;
  }

  .details {
    color: var(--text-secondary);
    flex: 1;
  }
</style>
