<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { regimeColor, regimeLabel, operationalRegimeColor } from '$lib/format';
  import type { CorrelatorDiagnostic, TraceEvent } from '$lib/types';

  let { history = [], operationalRegime = '', traceEvents = [] }: {
    history: CorrelatorDiagnostic[];
    operationalRegime: string;
    traceEvents: TraceEvent[];
  } = $props();

  interface Segment {
    regime: string;
    start: number;
    end: number;
    count: number;
  }

  /** Collapse consecutive same-regime windows into segments. */
  function buildSegments(diagnostics: CorrelatorDiagnostic[]): Segment[] {
    if (diagnostics.length === 0) return [];
    const segments: Segment[] = [];
    let current: Segment = {
      regime: diagnostics[0].regime,
      start: diagnostics[0].window_step,
      end: diagnostics[0].window_step,
      count: 1,
    };
    for (let i = 1; i < diagnostics.length; i++) {
      const d = diagnostics[i];
      if (d.regime === current.regime) {
        current.end = d.window_step;
        current.count++;
      } else {
        segments.push(current);
        current = { regime: d.regime, start: d.window_step, end: d.window_step, count: 1 };
      }
    }
    segments.push(current);
    return segments;
  }

  const segments = $derived(buildSegments(history));
  const totalSteps = $derived(
    history.length > 0 ? history[history.length - 1].window_step - history[0].window_step + 1 : 1
  );
  const firstStep = $derived(history.length > 0 ? history[0].window_step : 0);

  /** Map trace events to window positions (approximate). */
  const traceMarkers = $derived(
    traceEvents
      .filter(e => e.event_type === 'regime_transition')
      .map(e => {
        const step = (e.metadata?.window_step as number) ?? -1;
        if (step < firstStep) return null;
        return { step, label: e.message };
      })
      .filter(Boolean) as { step: number; label: string }[]
  );
</script>

<div class="regime-strip">
  {#if history.length === 0}
    <div class="strip-empty">No correlator history</div>
  {:else}
    <div class="strip-band">
      <span class="band-label">Correlator</span>
      <div class="band-track">
        {#each segments as seg}
          {@const width = ((seg.end - seg.start + 1) / totalSteps) * 100}
          <div
            class="band-segment"
            style="width: {width}%; background: {regimeColor(seg.regime)}"
            title="{regimeLabel(seg.regime)} (steps {seg.start}–{seg.end})"
          >
            {#if width > 15}
              <span class="seg-label">{regimeLabel(seg.regime)}</span>
            {/if}
          </div>
        {/each}
        {#each traceMarkers as marker}
          {@const offset = ((marker.step - firstStep) / totalSteps) * 100}
          <div class="trace-marker" style="left: {offset}%" title={marker.label}></div>
        {/each}
      </div>
    </div>

    {#if operationalRegime}
      <div class="strip-band">
        <span class="band-label">Operational</span>
        <div class="band-track">
          <div
            class="band-segment"
            style="width: 100%; background: {operationalRegimeColor(operationalRegime)}"
          >
            <span class="seg-label">{operationalRegime}</span>
          </div>
        </div>
      </div>
    {/if}

    <div class="strip-meta">
      <span class="meta-text">Windows {firstStep}–{history[history.length - 1].window_step}</span>
      <span class="meta-text">{history.length} samples</span>
    </div>
  {/if}
</div>

<style>
  .regime-strip {
    display: flex;
    flex-direction: column;
    gap: var(--sp-xs);
  }

  .strip-empty {
    color: var(--text-muted);
    font-size: var(--font-size-xs);
    padding: var(--sp-sm);
  }

  .strip-band {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
  }

  .band-label {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    min-width: 72px;
    text-align: right;
  }

  .band-track {
    flex: 1;
    height: 24px;
    display: flex;
    border-radius: var(--radius-sm);
    overflow: hidden;
    position: relative;
  }

  .band-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2px;
    transition: width 0.3s ease;
  }

  .seg-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--bg-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 4px;
  }

  .trace-marker {
    position: absolute;
    top: 0;
    width: 2px;
    height: 100%;
    background: var(--text-primary);
    opacity: 0.6;
  }

  .strip-meta {
    display: flex;
    gap: var(--sp-md);
    padding-left: 80px;
  }

  .meta-text {
    font-size: 10px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }
</style>
