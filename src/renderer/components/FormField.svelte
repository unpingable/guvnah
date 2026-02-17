<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import type { IntentFormField } from '$lib/types';

  let { field, value = undefined, onchange }: {
    field: IntentFormField;
    value?: unknown;
    onchange: (fieldId: string, value: unknown) => void;
  } = $props();

  function handleInput(e: Event): void {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    let val: unknown = target.value;
    if (target.type === 'checkbox') val = (target as HTMLInputElement).checked;
    if (target.type === 'range') val = Number(target.value);
    onchange(field.field_id, val);
  }
</script>

<div class="form-field">
  <label class="label" for={field.field_id}>
    {field.label}
    {#if field.required}<span class="required">*</span>{/if}
  </label>

  {#if field.widget === 'SELECT_ONE' && field.options}
    <select class="input" id={field.field_id} value={value ?? field.default ?? ''} onchange={handleInput}>
      <option value="" disabled>Select...</option>
      {#each field.options as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  {:else if field.widget === 'SLIDER'}
    <div class="slider-row">
      <input
        type="range"
        id={field.field_id}
        min="0"
        max="100"
        value={value ?? field.default ?? 50}
        oninput={handleInput}
      />
      <span class="slider-value">{value ?? field.default ?? 50}</span>
    </div>
  {:else if field.widget === 'CONFIRMATION'}
    <label class="checkbox-row">
      <input
        type="checkbox"
        id={field.field_id}
        checked={value ?? field.default ?? false}
        onchange={handleInput}
      />
      <span>{field.help_text || 'Confirm'}</span>
    </label>
  {:else if field.widget === 'TEXTAREA'}
    <textarea
      class="input textarea"
      id={field.field_id}
      value={value ?? field.default ?? ''}
      oninput={handleInput}
      rows="3"
    ></textarea>
  {:else}
    <!-- TEXT, NUMBER, etc. -->
    <input
      class="input"
      type={field.widget === 'NUMBER' ? 'number' : 'text'}
      id={field.field_id}
      value={value ?? field.default ?? ''}
      oninput={handleInput}
      placeholder={field.help_text || ''}
    />
  {/if}

  {#if field.help_text && field.widget !== 'CONFIRMATION'}
    <span class="help">{field.help_text}</span>
  {/if}
</div>

<style>
  .form-field {
    margin-bottom: var(--sp-md);
  }

  .required {
    color: var(--block);
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
  }

  .slider-row input[type="range"] {
    flex: 1;
    accent-color: var(--accent);
  }

  .slider-value {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    min-width: 32px;
    text-align: right;
  }

  .checkbox-row {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    font-size: var(--font-size-sm);
    cursor: pointer;
  }

  .checkbox-row input[type="checkbox"] {
    accent-color: var(--accent);
  }

  .textarea {
    resize: vertical;
    min-height: 60px;
  }

  .help {
    display: block;
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-top: var(--sp-xs);
  }
</style>
