<script lang="ts">
  import FormField from '../components/FormField.svelte';
  import ConfidenceBar from '../components/ConfidenceBar.svelte';
  import JsonTree from '../components/JsonTree.svelte';
  import * as intentStore from '../stores/intent';

  const templates = $derived(intentStore.getTemplates());
  const schema = $derived(intentStore.getSchema());
  const values = $derived(intentStore.getValues());
  const validation = $derived(intentStore.getValidation());
  const compilation = $derived(intentStore.getCompilation());
  const policy = $derived(intentStore.getPolicy());
  const loading = $derived(intentStore.isLoading());
  const error = $derived(intentStore.getError());

  $effect(() => {
    intentStore.fetchTemplates();
    intentStore.fetchPolicy();
  });

  async function handleTemplateSelect(name: string): Promise<void> {
    await intentStore.selectTemplate(name);
  }

  function handleFieldChange(fieldId: string, value: unknown): void {
    intentStore.setValue(fieldId, value);
  }

  async function handleValidate(): Promise<void> {
    await intentStore.validate();
  }

  async function handleCompile(): Promise<void> {
    await intentStore.compile();
  }

  function handleReset(): void {
    intentStore.reset();
  }
</script>

<div class="view">
  <header class="view-header">
    <h2>Intent</h2>
    {#if policy}
      <span class="tag">Policy: {policy.policy}</span>
      <span class="tag">Mode: {policy.mode}</span>
    {/if}
  </header>

  {#if !schema}
    <!-- Template picker -->
    <div class="template-picker">
      <p class="prompt">Select a template to begin:</p>
      {#if templates}
        <div class="template-grid">
          {#each templates.templates as tmpl}
            <button class="card template-card" onclick={() => handleTemplateSelect(tmpl.name)}>
              <span class="template-name">{tmpl.name}</span>
              <span class="template-desc">{tmpl.description}</span>
            </button>
          {/each}
        </div>
      {:else if loading}
        <div class="empty-state">Loading templates...</div>
      {/if}
    </div>
  {:else}
    <!-- Form -->
    <div class="form-panel scrollable">
      <div class="form-header">
        <h3>{schema.template_name}</h3>
        <button class="btn btn-sm" onclick={handleReset}>Back</button>
      </div>

      {#each schema.fields as field}
        <FormField {field} value={values[field.field_id]} onchange={handleFieldChange} />
      {/each}

      <!-- Branches -->
      {#if schema.branches.length > 0}
        <div class="branches">
          <span class="label">Hypothesis Branches</span>
          {#each schema.branches as branch}
            <div class="branch-row">
              <ConfidenceBar value={branch.confidence} label={branch.name} />
              <span class="branch-desc">{branch.description}</span>
            </div>
          {/each}
        </div>
      {/if}

      <div class="actions">
        <button class="btn" onclick={handleValidate} disabled={loading}>Validate</button>
        <button class="btn btn-primary" onclick={handleCompile} disabled={loading}>Compile</button>
      </div>

      {#if validation}
        <div class="result card" class:valid={validation.valid} class:invalid={!validation.valid}>
          <span class="label">{validation.valid ? 'Valid' : 'Invalid'}</span>
          {#if validation.errors.length > 0}
            <ul class="error-list">
              {#each validation.errors as err}
                <li>{err}</li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}

      {#if compilation}
        <div class="result card">
          <span class="label">Compilation Result</span>
          <div class="compilation-fields">
            {#if compilation.intent_profile}
              <div><span class="field-label">Profile:</span> {compilation.intent_profile}</div>
            {/if}
            {#if compilation.selected_branch}
              <div><span class="field-label">Branch:</span> {compilation.selected_branch}</div>
            {/if}
            {#if compilation.escape_classification}
              <div><span class="field-label">Escape:</span> {compilation.escape_classification}</div>
            {/if}
            {#if compilation.receipt_hash}
              <div><span class="field-label">Receipt:</span> <code>{compilation.receipt_hash.slice(0, 16)}...</code></div>
            {/if}
            {#if compilation.warnings.length > 0}
              <div class="warnings">
                {#each compilation.warnings as warn}
                  <div class="warn-item">{warn}</div>
                {/each}
              </div>
            {/if}
            {#if compilation.constraint_block}
              <span class="label">Constraint Block</span>
              <JsonTree data={compilation.constraint_block} />
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}

  {#if error}
    <div class="error">{error}</div>
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

  .view-header {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
  }

  .view-header h2 {
    font-size: var(--font-size-xl);
    font-weight: 600;
  }

  .tag {
    padding: 1px var(--sp-sm);
    background: var(--bg-surface);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    font-family: var(--font-mono);
  }

  .prompt {
    color: var(--text-secondary);
    margin-bottom: var(--sp-md);
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--sp-md);
  }

  .template-card {
    cursor: pointer;
    text-align: left;
  }

  .template-name {
    display: block;
    font-weight: 600;
    font-size: var(--font-size-sm);
    margin-bottom: var(--sp-xs);
  }

  .template-desc {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  .form-panel {
    display: flex;
    flex-direction: column;
    gap: var(--sp-sm);
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--sp-sm);
  }

  .form-header h3 {
    font-size: var(--font-size-lg);
  }

  .branches {
    margin-top: var(--sp-md);
  }

  .branch-row {
    margin-bottom: var(--sp-sm);
  }

  .branch-desc {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    display: block;
    margin-top: 2px;
  }

  .actions {
    display: flex;
    gap: var(--sp-sm);
    margin-top: var(--sp-md);
  }

  .result {
    margin-top: var(--sp-md);
  }

  .result.valid {
    border-color: var(--pass);
  }

  .result.invalid {
    border-color: var(--block);
  }

  .error-list {
    margin: var(--sp-sm) 0 0 var(--sp-md);
    color: var(--block);
    font-size: var(--font-size-sm);
  }

  .compilation-fields {
    font-size: var(--font-size-sm);
    display: flex;
    flex-direction: column;
    gap: var(--sp-xs);
    margin-top: var(--sp-sm);
  }

  .field-label {
    color: var(--text-secondary);
  }

  code {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    background: var(--bg-primary);
    padding: 1px 4px;
    border-radius: 2px;
  }

  .warnings {
    margin-top: var(--sp-sm);
  }

  .warn-item {
    color: var(--warn);
    font-size: var(--font-size-xs);
  }

  .error {
    color: var(--block);
    font-size: var(--font-size-sm);
    padding: var(--sp-sm);
    background: color-mix(in srgb, var(--block), transparent 90%);
    border-radius: var(--radius-sm);
  }
</style>
