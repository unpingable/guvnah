/**
 * Component tests using @testing-library/svelte.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ConnectionBadge from '../../src/renderer/components/ConnectionBadge.svelte';
import VerdictBadge from '../../src/renderer/components/VerdictBadge.svelte';
import ConfidenceBar from '../../src/renderer/components/ConfidenceBar.svelte';
import StiffnessIndicator from '../../src/renderer/components/StiffnessIndicator.svelte';

describe('ConnectionBadge', () => {
  it('renders connected state', () => {
    render(ConnectionBadge, { props: { state: 'connected' } });
    expect(screen.getByText('Connected')).toBeTruthy();
  });

  it('renders degraded state', () => {
    render(ConnectionBadge, { props: { state: 'degraded' } });
    expect(screen.getByText('Degraded')).toBeTruthy();
  });

  it('renders disconnected state', () => {
    render(ConnectionBadge, { props: { state: 'disconnected' } });
    expect(screen.getByText('Disconnected')).toBeTruthy();
  });
});

describe('VerdictBadge', () => {
  it('renders verdict text', () => {
    render(VerdictBadge, { props: { verdict: 'pass' } });
    expect(screen.getByText('pass')).toBeTruthy();
  });

  it('applies correct class for block', () => {
    const { container } = render(VerdictBadge, { props: { verdict: 'block' } });
    const pill = container.querySelector('.pill');
    expect(pill?.classList.contains('pill-block')).toBe(true);
  });

  it('applies correct class for warn', () => {
    const { container } = render(VerdictBadge, { props: { verdict: 'warn' } });
    const pill = container.querySelector('.pill');
    expect(pill?.classList.contains('pill-warn')).toBe(true);
  });
});

describe('ConfidenceBar', () => {
  it('renders percentage', () => {
    render(ConfidenceBar, { props: { value: 0.75 } });
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('clamps values to 0-100', () => {
    render(ConfidenceBar, { props: { value: 1.5 } });
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('renders label if provided', () => {
    render(ConfidenceBar, { props: { value: 0.5, label: 'Confidence' } });
    expect(screen.getByText('Confidence')).toBeTruthy();
  });
});

describe('StiffnessIndicator', () => {
  it('renders soft for low stiffness', () => {
    render(StiffnessIndicator, { props: { stiffness: 0.1 } });
    expect(screen.getByText('soft')).toBeTruthy();
  });

  it('renders hard for high stiffness', () => {
    render(StiffnessIndicator, { props: { stiffness: 0.95 } });
    expect(screen.getByText('hard')).toBeTruthy();
  });

  it('renders moderate for mid stiffness', () => {
    render(StiffnessIndicator, { props: { stiffness: 0.4 } });
    expect(screen.getByText('moderate')).toBeTruthy();
  });
});
