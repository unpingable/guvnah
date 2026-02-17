// SPDX-License-Identifier: Apache-2.0
/** Scars + shields store. */

import { api } from '$lib/api';
import type { ScarsResponse, FailureEvent } from '$lib/types';

let scars = $state<ScarsResponse | null>(null);
let history = $state<FailureEvent[]>([]);
let loading = $state(false);

export function getScars(): ScarsResponse | null { return scars; }
export function getHistory(): FailureEvent[] { return history; }
export function isLoading(): boolean { return loading; }

export async function fetchScars(): Promise<void> {
  loading = true;
  try {
    scars = await api.listScars();
  } catch {
    scars = null;
  } finally {
    loading = false;
  }
}

export async function fetchHistory(limit: number = 50): Promise<void> {
  try {
    history = await api.scarsHistory(limit);
  } catch {
    history = [];
  }
}

export async function refresh(): Promise<void> {
  await Promise.all([fetchScars(), fetchHistory()]);
}
