/**
 * Typed wrapper over window.governor IPC.
 * Renderer code imports this instead of touching window.governor directly.
 */

import type { GovernorAPI } from '../../shared/types';

declare global {
  interface Window {
    governor: GovernorAPI;
  }
}

export const api: GovernorAPI = typeof window !== 'undefined' && window.governor
  ? window.governor
  : new Proxy({} as GovernorAPI, {
      get: (_, prop) => () => {
        throw new Error(`governor.${String(prop)}() called but preload bridge is not available`);
      },
    });
