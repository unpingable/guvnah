<script lang="ts">
  import { stiffnessColor, stiffnessLabel } from '$lib/format';

  let { stiffness = 0 }: { stiffness: number } = $props();

  const pct = $derived(Math.round(Math.max(0, Math.min(1, stiffness)) * 100));
</script>

<div class="stiffness">
  <div class="track">
    <div class="fill" style="width: {pct}%; background: {stiffnessColor(stiffness)}"></div>
  </div>
  <span class="label" style="color: {stiffnessColor(stiffness)}">{stiffnessLabel(stiffness)}</span>
</div>

<style>
  .stiffness {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
  }

  .track {
    flex: 1;
    height: 8px;
    background: var(--bg-primary);
    border-radius: 4px;
    overflow: hidden;
    min-width: 60px;
  }

  .fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .label {
    font-size: var(--font-size-xs);
    font-weight: 600;
    min-width: 56px;
    text-align: right;
  }
</style>
