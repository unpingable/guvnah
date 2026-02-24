<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import type { KVector, CorrelatorDiagnostic } from '$lib/types';

  let { kvector = null, history = [] }: {
    kvector: KVector | null;
    history: CorrelatorDiagnostic[];
  } = $props();

  const dimensions = ['mode_preservation', 'contradiction_persistence', 'representation_shear', 'provenance_entropy'] as const;
  type Dim = typeof dimensions[number];

  const dimLabels: Record<Dim, string> = {
    mode_preservation: 'Mode Preservation',
    contradiction_persistence: 'Contradiction Persistence',
    representation_shear: 'Representation Shear',
    provenance_entropy: 'Provenance Entropy',
  };

  function dimColor(dim: Dim, value: number): string {
    // For preservation: high=good. For shear/entropy/contradiction: low=good.
    if (dim === 'mode_preservation') {
      return value >= 0.7 ? 'var(--pass)' : value >= 0.4 ? 'var(--warn)' : 'var(--block)';
    }
    // Inverse: lower is better
    return value <= 0.3 ? 'var(--pass)' : value <= 0.6 ? 'var(--warn)' : 'var(--block)';
  }

  function sparklinePoints(dim: Dim): string {
    if (history.length < 2) return '';
    const values = history.map(h => h.k_vector.fidelity[dim]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const w = 120;
    const h = 20;
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
      })
      .join(' ');
  }

  function throughputPoints(): string {
    if (history.length < 2) return '';
    const values = history.map(h => h.k_vector.throughput);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const w = 120;
    const h = 20;
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
      })
      .join(' ');
  }
</script>

<div class="fidelity-panel">
  {#if !kvector}
    <div class="panel-empty">No K-vector data available</div>
  {:else}
    <div class="dim-rows">
      {#each dimensions as dim}
        {@const value = kvector.fidelity[dim]}
        <div class="dim-row">
          <span class="dim-label">{dimLabels[dim]}</span>
          <div class="dim-bar-track">
            <div class="dim-bar-fill" style="width: {Math.round(value * 100)}%; background: {dimColor(dim, value)}"></div>
          </div>
          <span class="dim-value">{Math.round(value * 100)}%</span>
          {#if history.length >= 2}
            <svg class="sparkline" viewBox="0 0 120 20" preserveAspectRatio="none">
              <polyline points={sparklinePoints(dim)} fill="none" stroke="var(--text-muted)" stroke-width="1.5" />
            </svg>
          {/if}
        </div>
      {/each}
    </div>

    <div class="throughput-section">
      <div class="dim-row">
        <span class="dim-label">Throughput</span>
        <div class="dim-bar-track">
          <div class="dim-bar-fill" style="width: {Math.round(kvector.throughput * 100)}%; background: var(--accent)"></div>
        </div>
        <span class="dim-value">{Math.round(kvector.throughput * 100)}%</span>
        {#if history.length >= 2}
          <svg class="sparkline" viewBox="0 0 120 20" preserveAspectRatio="none">
            <polyline points={throughputPoints()} fill="none" stroke="var(--accent)" stroke-width="1.5" />
          </svg>
        {/if}
      </div>
    </div>

    <div class="meta-row">
      <span class="meta-badge" title="Authority">{kvector.authority}</span>
      <div class="cost-budget">
        <span class="meta-label">Cost budget</span>
        <div class="dim-bar-track small">
          <div class="dim-bar-fill" style="width: {Math.round(kvector.cost_budget * 100)}%; background: var(--text-secondary)"></div>
        </div>
        <span class="dim-value">{Math.round(kvector.cost_budget * 100)}%</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .fidelity-panel {
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
  }

  .panel-empty {
    color: var(--text-muted);
    font-size: var(--font-size-xs);
    padding: var(--sp-sm);
  }

  .dim-rows {
    display: flex;
    flex-direction: column;
    gap: var(--sp-xs);
  }

  .dim-row {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    font-size: var(--font-size-xs);
  }

  .dim-label {
    color: var(--text-secondary);
    min-width: 140px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dim-bar-track {
    flex: 1;
    height: 6px;
    background: var(--bg-primary);
    border-radius: 3px;
    overflow: hidden;
    min-width: 60px;
  }

  .dim-bar-track.small {
    max-width: 80px;
  }

  .dim-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .dim-value {
    color: var(--text-secondary);
    min-width: 36px;
    text-align: right;
    font-family: var(--font-mono);
  }

  .sparkline {
    width: 120px;
    height: 20px;
    flex-shrink: 0;
  }

  .throughput-section {
    border-top: 1px solid var(--border);
    padding-top: var(--sp-xs);
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: var(--sp-md);
    border-top: 1px solid var(--border);
    padding-top: var(--sp-xs);
  }

  .meta-badge {
    font-size: var(--font-size-xs);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    background: var(--bg-surface);
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }

  .cost-budget {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    font-size: var(--font-size-xs);
    flex: 1;
  }

  .meta-label {
    color: var(--text-muted);
    white-space: nowrap;
  }
</style>
