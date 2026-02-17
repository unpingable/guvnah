<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  let { value = 0, label = '' }: { value: number; label?: string } = $props();

  const pct = $derived(Math.round(Math.max(0, Math.min(1, value)) * 100));
</script>

<div class="bar-container">
  {#if label}
    <span class="bar-label">{label}</span>
  {/if}
  <div class="bar-track">
    <div class="bar-fill" style="width: {pct}%"></div>
  </div>
  <span class="bar-value">{pct}%</span>
</div>

<style>
  .bar-container {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    font-size: var(--font-size-xs);
  }

  .bar-label {
    color: var(--text-secondary);
    min-width: 80px;
  }

  .bar-track {
    flex: 1;
    height: 6px;
    background: var(--bg-primary);
    border-radius: 3px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .bar-value {
    color: var(--text-secondary);
    min-width: 36px;
    text-align: right;
  }
</style>
