<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import Sidebar from './components/Sidebar.svelte';
  import StatusBar from './components/StatusBar.svelte';
  import SessionPicker from './views/SessionPicker.svelte';
  import IntentModal from './views/IntentModal.svelte';
  import ReceiptsInspector from './views/ReceiptsInspector.svelte';
  import ScarsTimeline from './views/ScarsTimeline.svelte';
  import CommitWaive from './views/CommitWaive.svelte';
  import type { View } from '$lib/types';
  import * as connStore from './stores/connection';
  import * as govStore from './stores/governor';

  let activeView = $state<View>('sessions');
  const connectionState = $derived(connStore.getConnectionState());
  const now = $derived(govStore.getNow());
  const status = $derived(govStore.getStatus());

  $effect(() => {
    connStore.startPolling(3000);
    govStore.startPolling(3000);
    return () => {
      connStore.stopPolling();
      govStore.stopPolling();
    };
  });

  function handleNavigate(view: View): void {
    activeView = view;
  }
</script>

<div class="layout">
  <Sidebar {activeView} {connectionState} onnavigate={handleNavigate} />
  <div class="main-area">
    <div class="content">
      {#if activeView === 'sessions'}
        <SessionPicker />
      {:else if activeView === 'intent'}
        <IntentModal />
      {:else if activeView === 'receipts'}
        <ReceiptsInspector />
      {:else if activeView === 'scars'}
        <ScarsTimeline />
      {:else if activeView === 'commit'}
        <CommitWaive />
      {/if}
    </div>
    <StatusBar {now} {status} {connectionState} />
  </div>
</div>

<style>
  .layout {
    display: flex;
    height: 100%;
  }

  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .content {
    flex: 1;
    overflow: hidden;
  }
</style>
