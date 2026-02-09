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
