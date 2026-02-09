<script lang="ts">
  type ConnectionState = 'connected' | 'degraded' | 'disconnected';

  let { state = 'disconnected' }: { state: ConnectionState } = $props();

  const colors: Record<ConnectionState, string> = {
    connected: 'var(--pass)',
    degraded: 'var(--warn)',
    disconnected: 'var(--block)',
  };

  const labels: Record<ConnectionState, string> = {
    connected: 'Connected',
    degraded: 'Degraded',
    disconnected: 'Disconnected',
  };
</script>

<span class="badge" title={labels[state]} data-testid="daemon-status" data-state={state}>
  <span class="dot" style="background: {colors[state]}"></span>
  <span class="label">{labels[state]}</span>
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-xs);
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .label {
    white-space: nowrap;
  }
</style>
