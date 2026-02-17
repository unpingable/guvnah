// SPDX-License-Identifier: Apache-2.0
/** Governor now/status/regime store. */

import { api } from '$lib/api';
import type { GovernorNow, GovernorStatus } from '$lib/types';

let now = $state<GovernorNow | null>(null);
let status = $state<GovernorStatus | null>(null);
let pollHandle: ReturnType<typeof setInterval> | null = null;

export function getNow(): GovernorNow | null { return now; }
export function getStatus(): GovernorStatus | null { return status; }

export async function fetchNow(): Promise<void> {
  try {
    now = await api.now();
  } catch {
    now = null;
  }
}

export async function fetchStatus(): Promise<void> {
  try {
    status = await api.status();
  } catch {
    status = null;
  }
}

export async function refresh(): Promise<void> {
  await Promise.all([fetchNow(), fetchStatus()]);
}

export function startPolling(ms: number = 3000): void {
  if (pollHandle) return;
  refresh();
  pollHandle = setInterval(refresh, ms);
}

export function stopPolling(): void {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
}
