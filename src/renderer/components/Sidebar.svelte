<script lang="ts">
  import ConnectionBadge from './ConnectionBadge.svelte';
  import type { View } from '$lib/types';

  let { activeView = 'sessions', connectionState = 'disconnected', onnavigate }: {
    activeView: View;
    connectionState: 'connected' | 'degraded' | 'disconnected';
    onnavigate: (view: View) => void;
  } = $props();

  const navItems: { view: View; label: string; icon: string }[] = [
    { view: 'sessions', label: 'Sessions', icon: '\u{1F4CB}' },
    { view: 'intent', label: 'Intent', icon: '\u{1F3AF}' },
    { view: 'receipts', label: 'Receipts', icon: '\u{1F9FE}' },
    { view: 'scars', label: 'Scars', icon: '\u{1FA79}' },
    { view: 'commit', label: 'Commit', icon: '\u{2714}' },
  ];
</script>

<nav class="sidebar">
  <div class="brand">
    <span class="brand-text">Guvnah</span>
    <span class="brand-sub">Governor Cockpit</span>
  </div>

  <div class="nav-items">
    {#each navItems as item}
      <button
        class="nav-item"
        class:active={activeView === item.view}
        onclick={() => onnavigate(item.view)}
      >
        <span class="nav-icon">{item.icon}</span>
        <span class="nav-label">{item.label}</span>
      </button>
    {/each}
  </div>

  <div class="sidebar-footer">
    <ConnectionBadge state={connectionState} />
  </div>
</nav>

<style>
  .sidebar {
    width: var(--sidebar-width);
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .brand {
    padding: var(--sp-md);
    border-bottom: 1px solid var(--border);
  }

  .brand-text {
    display: block;
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--text-primary);
  }

  .brand-sub {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .nav-items {
    flex: 1;
    padding: var(--sp-sm) 0;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    width: 100%;
    padding: var(--sp-sm) var(--sp-md);
    border: none;
    background: none;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    text-align: left;
  }

  .nav-item:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .nav-item.active {
    background: var(--bg-surface);
    color: var(--accent);
    border-right: 2px solid var(--accent);
  }

  .nav-icon {
    font-size: var(--font-size-md);
    width: 24px;
    text-align: center;
  }

  .sidebar-footer {
    padding: var(--sp-md);
    border-top: 1px solid var(--border);
  }
</style>
