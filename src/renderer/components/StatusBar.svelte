<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import type { GovernorNow, GovernorStatus } from '$lib/types';

  let { now = null, status = null, connectionState = 'disconnected' }: {
    now?: GovernorNow | null;
    status?: GovernorStatus | null;
    connectionState?: 'connected' | 'degraded' | 'disconnected';
  } = $props();
</script>

<footer class="statusbar">
  <div class="left">
    {#if connectionState === 'connected' && now}
      <span class="pill pill-{now.pill?.toLowerCase() || 'pass'}">{now.pill || 'OK'}</span>
      <span class="sentence">{now.sentence || ''}</span>
    {:else if connectionState === 'degraded'}
      <span class="pill pill-warn">DEGRADED</span>
      <span class="sentence">Backend not responding</span>
    {:else}
      <span class="pill pill-block">OFFLINE</span>
      <span class="sentence">Not connected to Governor</span>
    {/if}
  </div>
  <div class="right">
    {#if status}
      <span class="tag">{status.mode}</span>
      <span class="tag">{status.envelope}</span>
      {#if now?.regime}
        <span class="tag">{now.regime}</span>
      {/if}
    {/if}
  </div>
</footer>

<style>
  .statusbar {
    height: var(--statusbar-height);
    background: var(--bg-secondary);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--sp-md);
    font-size: var(--font-size-xs);
    flex-shrink: 0;
  }

  .left, .right {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
  }

  .sentence {
    color: var(--text-secondary);
  }

  .tag {
    padding: 1px var(--sp-sm);
    background: var(--bg-surface);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }
</style>
