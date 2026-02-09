# CLAUDE.md — Guvnah

Local desktop cockpit for the Governor constraint system. Electron + Svelte 5 (runes mode).

## Quick Start

```bash
npm install              # Install dependencies
npm run build            # Build renderer (Vite) + main (tsc) + preload (esbuild CJS bundle)
npm start                # Build + launch Electron app
npm test                 # Run unit tests (vitest, 77 tests)
npm run test:e2e         # Run Playwright E2E smoke tests (2 tests, requires build first)
npm run dev              # Dev mode (concurrent Vite watch + tsc watch + Electron)
```

## Architecture

- **Main process** (`src/main/`): Electron shell, JSON-RPC client, IPC handlers, health polling
- **Preload** (`src/preload/`): contextBridge — the ONLY gateway between renderer and Node
- **Renderer** (`src/renderer/`): Svelte 5 app, compiled by Vite. NEVER touches Node APIs
- **Shared** (`src/shared/`): IPC channel names + TypeScript types (used by all layers)

### Transport: Governor Daemon over JSON-RPC

Guvnah spawns the governor daemon (`governor serve --stdio`) as a child process and communicates via **JSON-RPC 2.0 with Content-Length framing** over stdin/stdout. This is the same protocol as MCP servers and VS Code language servers.

- `src/main/rpc-client.ts` — Spawns daemon, Content-Length framing, request/response dispatch, shape adapters
- `src/main/governor-client.ts` — Legacy HTTP client (retained for reference, not wired)
- `src/main/connection.ts` — ConnectionMonitor (polls health, tracks state transitions)
- `src/main/ipc-handlers.ts` — Wires Electron IPC channels to RPC client methods

Shape adapters in `rpc-client.ts` are the **compatibility seam** between daemon Python shapes (to_dict()) and renderer TypeScript types. All adaptation happens here — renderer and daemon are never touched to fix shape mismatches.

### Authority Model

Guvnah is an **untrusted cockpit**. The Governor daemon is the sole authority. Guvnah:
- Never signs receipts
- Never holds long-lived secrets
- Never instantiates core governor objects
- Never bypasses challenge/nonce/commit flow

### IPC Pattern

1. Renderer calls `window.governor.someMethod()` (typed via `GovernorAPI` interface)
2. Preload forwards via `ipcRenderer.invoke(channel, ...args)`
3. Main process handler calls `GovernorClient.someMethod()` (JSON-RPC to daemon)
4. Result flows back through the same chain

Channel names are defined once in `src/shared/channels.ts`.

## Build

```bash
npm run build:renderer   # Vite build → dist/renderer/
npm run build:main       # tsc → dist/main/, dist/preload/, dist/shared/
npm run build            # Both + bundle preload as CJS
```

Main process uses ESM (`"type": "module"` in package.json, `bundler` module resolution).
Imports in `src/main/` and `src/preload/` must use `.js` extensions.

Preload is bundled to CJS via `scripts/bundle-preload.mjs` (esbuild). This is required because Playwright's Electron automation injects a `-r` flag loader that forces CJS context in sandboxed preloads.

## Test

```bash
npm test                 # vitest run (77 tests)
npm run test:watch       # vitest watch mode
npm run test:e2e         # Playwright Electron smoke (2 tests, requires npm run build first)
```

Test structure:
- `test/main/rpc-client.test.ts` — JSON-RPC transport, shape adapters, daemon spawn (26 tests)
- `test/main/governor-client.test.ts` — Mock fetch, verify URLs/headers/body (22 tests)
- `test/main/ipc-handlers.test.ts` — Mock client, verify forwarding (12 tests)
- `test/renderer/stores.test.ts` — Format utils, channel constants, runes guard (5 tests)
- `test/renderer/components.test.ts` — @testing-library/svelte (12 tests)
- `tests/e2e/smoke.spec.ts` — Playwright: daemon boots + session list renders (2 tests)

## Features

| View | Description | Daemon RPC Methods |
|------|-------------|-------------------|
| Session Picker | Browse/create/delete sessions | `sessions.list`, `sessions.create`, `sessions.delete`, `sessions.get` |
| Intent Modal | Template → form → compile | `intent.templates`, `intent.schema`, `intent.validate`, `intent.compile`, `intent.policy` |
| Receipts Inspector | Browse gate receipts + evidence | `receipts.list`, `receipts.detail` |
| Scars Timeline | Stiffness, shields, failure history | `scars.list`, `scars.history` |
| Commit/Waive | Pending violations → fix/revise/proceed | `commit.pending`, `commit.fix`, `commit.revise`, `commit.proceed`, `commit.exceptions` |

All 5 views talk to the governor daemon via JSON-RPC. The daemon exposes 21 methods total (see `src/governor/daemon.py`).

## Svelte 5 Conventions

- **Runes mode** (`compilerOptions.runes: true`): Use `$state`, `$derived`, `$effect`, `$props`
- **Runes require `.svelte.ts`**: Plain `.ts` files are NOT processed by the Svelte compiler. If you use `$state` in a `.ts` file, it silently leaks as an unresolved runtime symbol. Store files use `.svelte.ts` extension. A guard test enforces this.
- No `on:click` — use `onclick={handler}`
- No event modifiers (`|stopPropagation`) — call `e.stopPropagation()` in handler
- No `<svelte:self>` — use explicit self-import
- No nested `<button>` inside `<button>` — Svelte enforces valid HTML

## E2E Testing

Playwright Electron tests run against the **built** app (`dist/`), not dev mode.

- `GUVNAH_E2E=1` enables deterministic test mode (temp governor dir, relaxed sandbox)
- Tests create a fresh `.governor/` directory via `governor init` in a temp dir
- Only 2 assertions by design: boot + session list. Keep it brutally small.
- Uses `data-testid` attributes for stable selectors

## Tauri Migration

Renderer code is 100% reusable. Only these files are Electron-specific:
- `src/main/index.ts` — BrowserWindow, app lifecycle, daemon spawn
- `src/main/rpc-client.ts` → Rust child process / Unix socket
- `src/main/ipc-handlers.ts` → `#[tauri::command]`
- `src/preload/index.ts` → Tauri `invoke()`
