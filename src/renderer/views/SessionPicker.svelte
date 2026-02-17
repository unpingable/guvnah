<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { formatRelative, truncate } from '$lib/format';
  import * as sessionStore from '../stores/sessions';

  let newTitle = $state('');
  let creating = $state(false);

  const sessions = $derived(sessionStore.getSessions());
  const active = $derived(sessionStore.getActiveSession());
  const loading = $derived(sessionStore.isLoading());
  const error = $derived(sessionStore.getError());

  $effect(() => {
    sessionStore.fetchSessions();
  });

  async function handleCreate(): Promise<void> {
    const title = newTitle.trim();
    if (!title) return;
    creating = true;
    await sessionStore.createSession(title);
    newTitle = '';
    creating = false;
  }

  async function handleDelete(id: string): Promise<void> {
    await sessionStore.deleteSession(id);
  }

  async function handleSelect(id: string): Promise<void> {
    await sessionStore.selectSession(id);
  }
</script>

<div class="view">
  <header class="view-header">
    <h2>Sessions</h2>
  </header>

  <div class="create-row">
    <input
      class="input"
      type="text"
      placeholder="New session title..."
      bind:value={newTitle}
      onkeydown={(e) => e.key === 'Enter' && handleCreate()}
    />
    <button class="btn btn-primary" onclick={handleCreate} disabled={creating || !newTitle.trim()}>
      Create
    </button>
  </div>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  <div class="session-list scrollable" data-testid="sessions-list">
    {#if loading && sessions.length === 0}
      <div class="empty-state" data-testid="sessions-empty">Loading sessions...</div>
    {:else if sessions.length === 0}
      <div class="empty-state" data-testid="sessions-empty">No sessions yet. Create one above.</div>
    {:else}
      {#each sessions as session}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="session-card card"
          class:active={active?.id === session.id}
          onclick={() => handleSelect(session.id)}
          role="button"
          tabindex="0"
          data-testid="session-row"
        >
          <div class="session-header">
            <span class="session-title">{truncate(session.title, 40)}</span>
            <button
              class="btn btn-sm btn-danger delete-btn"
              onclick={(e: MouseEvent) => { e.stopPropagation(); handleDelete(session.id); }}
              title="Delete session"
            >
              &times;
            </button>
          </div>
          <div class="session-meta">
            <span>{session.message_count} messages</span>
            <span>{formatRelative(session.updated_at)}</span>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  {#if active}
    <div class="detail-panel card">
      <h3>{active.title}</h3>
      <div class="detail-meta">
        <span>ID: {active.id}</span>
        <span>Model: {active.model}</span>
        <span>{active.messages.length} messages</span>
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

  .view-header h2 {
    font-size: var(--font-size-xl);
    font-weight: 600;
  }

  .create-row {
    display: flex;
    gap: var(--sp-sm);
  }

  .create-row .input {
    flex: 1;
  }

  .error {
    color: var(--block);
    font-size: var(--font-size-sm);
    padding: var(--sp-sm);
    background: color-mix(in srgb, var(--block), transparent 90%);
    border-radius: var(--radius-sm);
  }

  .session-list {
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
  }

  .session-card {
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: border-color 0.15s;
  }

  .session-card.active {
    border-color: var(--accent);
  }

  .session-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .session-title {
    font-weight: 600;
    font-size: var(--font-size-sm);
  }

  .delete-btn {
    opacity: 0;
    transition: opacity 0.15s;
  }

  .session-card:hover .delete-btn {
    opacity: 1;
  }

  .session-meta {
    display: flex;
    gap: var(--sp-md);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-top: var(--sp-xs);
  }

  .detail-panel {
    border-color: var(--accent);
  }

  .detail-panel h3 {
    font-size: var(--font-size-md);
    margin-bottom: var(--sp-sm);
  }

  .detail-meta {
    display: flex;
    gap: var(--sp-md);
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }
</style>
