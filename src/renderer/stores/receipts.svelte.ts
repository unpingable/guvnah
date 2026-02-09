/** Gate receipts store. */

import { api } from '$lib/api';
import type { GateReceipt, ReceiptDetail } from '$lib/types';

let receipts = $state<GateReceipt[]>([]);
let selectedDetail = $state<ReceiptDetail | null>(null);
let filterGate = $state<string>('');
let filterVerdict = $state<string>('');
let loading = $state(false);

export function getReceipts(): GateReceipt[] { return receipts; }
export function getSelectedDetail(): ReceiptDetail | null { return selectedDetail; }
export function getFilterGate(): string { return filterGate; }
export function getFilterVerdict(): string { return filterVerdict; }
export function isLoading(): boolean { return loading; }

export function setFilterGate(gate: string): void { filterGate = gate; }
export function setFilterVerdict(verdict: string): void { filterVerdict = verdict; }

export async function fetchReceipts(): Promise<void> {
  loading = true;
  try {
    const filter: { gate?: string; verdict?: string; limit?: number } = { limit: 50 };
    if (filterGate) filter.gate = filterGate;
    if (filterVerdict) filter.verdict = filterVerdict;
    receipts = await api.listReceipts(filter);
  } catch {
    receipts = [];
  } finally {
    loading = false;
  }
}

export async function selectReceipt(receiptId: string): Promise<void> {
  try {
    selectedDetail = await api.receiptDetail(receiptId);
  } catch {
    selectedDetail = null;
  }
}

export function clearSelection(): void {
  selectedDetail = null;
}
