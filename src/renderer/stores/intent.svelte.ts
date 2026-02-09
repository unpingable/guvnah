/** Intent form state store. */

import { api } from '$lib/api';
import type {
  IntentTemplateList,
  IntentFormSchema,
  IntentValidationResult,
  IntentCompilationResult,
  IntentPolicy,
} from '$lib/types';

let templates = $state<IntentTemplateList | null>(null);
let schema = $state<IntentFormSchema | null>(null);
let values = $state<Record<string, unknown>>({});
let validation = $state<IntentValidationResult | null>(null);
let compilation = $state<IntentCompilationResult | null>(null);
let policy = $state<IntentPolicy | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);

export function getTemplates(): IntentTemplateList | null { return templates; }
export function getSchema(): IntentFormSchema | null { return schema; }
export function getValues(): Record<string, unknown> { return values; }
export function getValidation(): IntentValidationResult | null { return validation; }
export function getCompilation(): IntentCompilationResult | null { return compilation; }
export function getPolicy(): IntentPolicy | null { return policy; }
export function isLoading(): boolean { return loading; }
export function getError(): string | null { return error; }

export function setValue(fieldId: string, value: unknown): void {
  values = { ...values, [fieldId]: value };
  validation = null;
  compilation = null;
}

export async function fetchTemplates(): Promise<void> {
  loading = true;
  try {
    templates = await api.intentTemplates();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  } finally {
    loading = false;
  }
}

export async function selectTemplate(name: string): Promise<void> {
  loading = true;
  error = null;
  values = {};
  validation = null;
  compilation = null;
  try {
    schema = await api.intentSchema(name);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    schema = null;
  } finally {
    loading = false;
  }
}

export async function validate(): Promise<IntentValidationResult | null> {
  if (!schema) return null;
  try {
    validation = await api.intentValidate(schema.schema_id, values);
    return validation;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    return null;
  }
}

export async function compile(): Promise<IntentCompilationResult | null> {
  if (!schema) return null;
  loading = true;
  try {
    compilation = await api.intentCompile(schema.schema_id, values);
    return compilation;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    return null;
  } finally {
    loading = false;
  }
}

export async function fetchPolicy(): Promise<void> {
  try {
    policy = await api.intentPolicy();
  } catch {
    policy = null;
  }
}

export function reset(): void {
  schema = null;
  values = {};
  validation = null;
  compilation = null;
  error = null;
}
