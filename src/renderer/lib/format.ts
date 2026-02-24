// SPDX-License-Identifier: Apache-2.0
/** Formatting utilities for dates, verdicts, stiffness levels. */

export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatRelative(iso: string): string {
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    return `${days}d ago`;
  } catch {
    return iso;
  }
}

export function verdictColor(verdict: string): string {
  switch (verdict.toLowerCase()) {
    case 'pass': return 'var(--pass)';
    case 'warn': return 'var(--warn)';
    case 'block': return 'var(--block)';
    default: return 'var(--text-secondary)';
  }
}

export function verdictClass(verdict: string): string {
  switch (verdict.toLowerCase()) {
    case 'pass': return 'pill-pass';
    case 'warn': return 'pill-warn';
    case 'block': return 'pill-block';
    default: return '';
  }
}

export function stiffnessColor(stiffness: number): string {
  if (stiffness >= 0.9) return 'var(--stiffness-hard)';
  if (stiffness >= 0.6) return 'var(--stiffness-high)';
  if (stiffness >= 0.3) return 'var(--stiffness-med)';
  return 'var(--stiffness-low)';
}

export function stiffnessLabel(stiffness: number): string {
  if (stiffness >= 0.9) return 'hard';
  if (stiffness >= 0.6) return 'stiff';
  if (stiffness >= 0.3) return 'moderate';
  return 'soft';
}

export function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
}

// --- Integrity view helpers ---

export function regimeColor(regime: string): string {
  switch (regime.toUpperCase()) {
    case 'LEVERAGE': return 'var(--pass)';
    case 'SHEAR': return 'var(--warn)';
    case 'CAPTURE': return 'var(--block)';
    default: return 'var(--text-muted)';
  }
}

export function regimeLabel(regime: string): string {
  switch (regime.toUpperCase()) {
    case 'LEVERAGE': return 'Leverage';
    case 'SHEAR': return 'Shear';
    case 'CAPTURE': return 'Capture';
    default: return regime || 'Unknown';
  }
}

export function operationalRegimeColor(regime: string): string {
  switch (regime.toUpperCase()) {
    case 'ELASTIC': return 'var(--pass)';
    case 'WARM': return 'var(--warn)';
    case 'DUCTILE': return 'var(--stiffness-high)';
    case 'UNSTABLE': return 'var(--block)';
    default: return 'var(--text-muted)';
  }
}

export function claimStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'verified': return 'var(--pass)';
    case 'partial': return 'var(--warn)';
    case 'contradicted': return 'var(--block)';
    case 'unverified': return 'var(--text-muted)';
    default: return 'var(--text-secondary)';
  }
}

export function decisionActionColor(action: string): string {
  switch (action.toLowerCase()) {
    case 'allow': return 'var(--pass)';
    case 'deny': return 'var(--block)';
    case 'transform': return 'var(--warn)';
    case 'escalate': return 'var(--accent)';
    default: return 'var(--text-secondary)';
  }
}

export function formatAge(iso: string): string {
  try {
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 0) return 'future';
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  } catch {
    return iso;
  }
}

/**
 * Normalize daemon timestamp fields. Different RPCs use different field names.
 * Returns ISO string or empty string.
 */
export function normalizeTimestamp(obj: Record<string, unknown>): string {
  const raw = (obj.generated_at ?? obj.timestamp_wall ?? obj.timestamp ?? obj.ts ?? '') as string;
  return raw;
}
