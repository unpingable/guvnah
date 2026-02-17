// SPDX-License-Identifier: Apache-2.0
/** Session list + active session store. */

import { api } from '$lib/api';
import type { SessionSummary, ChatSession } from '$lib/types';

let sessions = $state<SessionSummary[]>([]);
let activeSession = $state<ChatSession | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);

export function getSessions(): SessionSummary[] { return sessions; }
export function getActiveSession(): ChatSession | null { return activeSession; }
export function isLoading(): boolean { return loading; }
export function getError(): string | null { return error; }

export async function fetchSessions(): Promise<void> {
  loading = true;
  error = null;
  try {
    sessions = await api.listSessions();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  } finally {
    loading = false;
  }
}

export async function createSession(title: string): Promise<ChatSession | null> {
  try {
    const session = await api.createSession(title);
    await fetchSessions();
    activeSession = session;
    return session;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    return null;
  }
}

export async function deleteSession(id: string): Promise<boolean> {
  try {
    await api.deleteSession(id);
    if (activeSession?.id === id) activeSession = null;
    await fetchSessions();
    return true;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    return false;
  }
}

export async function selectSession(id: string): Promise<void> {
  try {
    activeSession = await api.getSession(id);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
}

export function clearActiveSession(): void {
  activeSession = null;
}
