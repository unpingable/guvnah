<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import type { CorrelatorStatus } from '$lib/types';

  let { status = null }: { status: CorrelatorStatus | null } = $props();

  const indicatorLabels: Record<string, string> = {
    MODE_COUNT_DECREASING: 'Mode Count Decreasing',
    ENTROPY_NONINCREASING: 'Entropy Non-Increasing',
    CONTRADICTION_SUPPRESSION: 'Contradiction Suppression',
    COMMITMENT_SHEAR: 'Commitment Shear',
  };

  const indicatorKeys = ['MODE_COUNT_DECREASING', 'ENTROPY_NONINCREASING', 'CONTRADICTION_SUPPRESSION', 'COMMITMENT_SHEAR'];
</script>

<div class="capture-panel">
  {#if !status}
    <div class="panel-empty">No correlator data available</div>
  {:else}
    <div class="confidence-row">
      <span class="conf-label">Confidence</span>
      <span class="conf-value">{status.latest ? Math.round(status.latest.confidence * 100) : '—'}%</span>
      <span class="regime-badge" style="color: var(--text-primary)">{status.metrics.regime}</span>
    </div>

    <div class="indicator-list">
      {#each indicatorKeys as key}
        {@const streak = status.metrics.indicator_state[key] ?? 0}
        {@const triggered = status.latest?.indicators_triggered.includes(key) ?? false}
        {@const detail = status.latest?.indicator_details.find(d => d.name === key)}
        <div class="indicator-row" class:triggered>
          <span class="ind-name">{indicatorLabels[key] ?? key}</span>
          <span class="ind-streak" class:active={streak > 0}>streak: {streak}</span>
          <span class="ind-status">{triggered ? 'TRIGGERED' : 'clear'}</span>
          {#if detail}
            <div class="gate-flags">
              {#if detail.authority_gated}<span class="gate-flag">auth-gated</span>{/if}
              {#if detail.throughput_gated}<span class="gate-flag">tp-gated</span>{/if}
              {#if detail.gate_met}<span class="gate-flag met">gate met</span>{/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    {#if status.latest}
      <div class="gate-summary">
        <span class="gate-label">Overall gate:</span>
        <span class="gate-value" class:met={status.latest.gate_met}>
          {status.latest.gate_met ? 'MET' : 'not met'}
        </span>
      </div>
    {/if}
  {/if}
</div>

<style>
  .capture-panel {
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
  }

  .panel-empty {
    color: var(--text-muted);
    font-size: var(--font-size-xs);
    padding: var(--sp-sm);
  }

  .confidence-row {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    font-size: var(--font-size-sm);
  }

  .conf-label {
    color: var(--text-muted);
  }

  .conf-value {
    font-family: var(--font-mono);
    font-weight: 600;
  }

  .regime-badge {
    font-size: var(--font-size-xs);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    background: var(--bg-surface);
    font-family: var(--font-mono);
  }

  .indicator-list {
    display: flex;
    flex-direction: column;
    gap: var(--sp-xs);
  }

  .indicator-row {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    padding: var(--sp-xs) var(--sp-sm);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    font-size: var(--font-size-xs);
  }

  .indicator-row.triggered {
    background: color-mix(in srgb, var(--block) 15%, var(--bg-primary));
  }

  .ind-name {
    color: var(--text-secondary);
    min-width: 160px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ind-streak {
    font-family: var(--font-mono);
    color: var(--text-muted);
    min-width: 64px;
  }

  .ind-streak.active {
    color: var(--warn);
  }

  .ind-status {
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--text-muted);
    min-width: 72px;
  }

  .indicator-row.triggered .ind-status {
    color: var(--block);
  }

  .gate-flags {
    display: flex;
    gap: var(--sp-xs);
  }

  .gate-flag {
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 2px;
    background: var(--bg-secondary);
    color: var(--text-muted);
  }

  .gate-flag.met {
    background: color-mix(in srgb, var(--block) 20%, var(--bg-secondary));
    color: var(--block);
  }

  .gate-summary {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    padding-top: var(--sp-xs);
    border-top: 1px solid var(--border);
    font-size: var(--font-size-xs);
  }

  .gate-label {
    color: var(--text-muted);
  }

  .gate-value {
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--pass);
  }

  .gate-value.met {
    color: var(--block);
  }
</style>
