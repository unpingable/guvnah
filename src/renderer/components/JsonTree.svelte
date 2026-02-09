<script lang="ts">
  import JsonTree from './JsonTree.svelte';

  let { data, depth = 0 }: { data: unknown; depth?: number } = $props();

  let expanded = $state(false);

  // Initialize expansion based on depth (shallow nodes start expanded)
  $effect(() => {
    expanded = depth < 2;
  });

  function toggle(): void {
    expanded = !expanded;
  }

  function isObject(v: unknown): v is Record<string, unknown> {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  function isArray(v: unknown): v is unknown[] {
    return Array.isArray(v);
  }

  function entries(v: unknown): [string, unknown][] {
    if (isObject(v)) return Object.entries(v);
    if (isArray(v)) return v.map((item, i) => [String(i), item]);
    return [];
  }

  function isExpandable(v: unknown): boolean {
    return isObject(v) || isArray(v);
  }

  function formatPrimitive(v: unknown): string {
    if (v === null) return 'null';
    if (typeof v === 'string') return `"${v}"`;
    return String(v);
  }
</script>

{#if isExpandable(data)}
  <div class="node" style="padding-left: {depth * 16}px">
    <button class="toggle" onclick={toggle}>
      {expanded ? '\u25BC' : '\u25B6'}
      {isArray(data) ? `[${(data as unknown[]).length}]` : `{${Object.keys(data as Record<string, unknown>).length}}`}
    </button>
    {#if expanded}
      {#each entries(data) as [key, value]}
        <div class="entry">
          <span class="key">{key}:</span>
          {#if isExpandable(value)}
            <JsonTree data={value} depth={depth + 1} />
          {:else}
            <span class="value" class:string={typeof value === 'string'} class:number={typeof value === 'number'} class:null={value === null} class:bool={typeof value === 'boolean'}>
              {formatPrimitive(value)}
            </span>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
{:else}
  <span class="value" class:string={typeof data === 'string'} class:number={typeof data === 'number'} class:null={data === null} class:bool={typeof data === 'boolean'}>
    {formatPrimitive(data)}
  </span>
{/if}

<style>
  .node {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
  }

  .toggle {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 2px 4px;
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
  }

  .toggle:hover {
    color: var(--text-primary);
  }

  .entry {
    padding-left: 16px;
  }

  .key {
    color: var(--accent);
  }

  .value {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
  }

  .value.string { color: var(--pass); }
  .value.number { color: var(--warn); }
  .value.null { color: var(--text-muted); font-style: italic; }
  .value.bool { color: #c678dd; }
</style>
