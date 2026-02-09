# AGENTS.md — Working in this repo

This file is a **travel guide**, not a law.
Enforcement lives in the governor (admissibility, receipts, waivers).

If anything here conflicts with the governor's current constraints or the user's
explicit instructions, the governor and user win.

> Instruction files shape behavior; the governor determines admissibility.

---

## Quick start

```bash
npm install              # Install dependencies
npm run build            # Build renderer (Vite) + main (tsc) + preload (esbuild)
npm test                 # Run unit tests (77 tests, vitest)
npm run test:e2e         # Run Playwright E2E smoke tests (requires build first)
npm start                # Build + launch Electron app
```

## Tests

```bash
npm test                           # All unit tests (vitest)
npx vitest run test/main/          # Main process tests only
npx vitest run test/renderer/      # Renderer tests only
npm run build && npm run test:e2e  # E2E smoke tests (Playwright Electron)
```

Always run tests before proposing commits. Never claim tests pass without running them.

---

## Safety and irreversibility

### Do not do these without explicit user confirmation
- Push to remote, create/close PRs or issues
- Modify `package.json` dependencies in ways that change the lock file
- Delete or rewrite git history
- Modify Electron security settings (contextIsolation, nodeIntegration, sandbox)
- Change the preload bridge API surface (it's the security boundary)

### Preferred workflow
- Make changes in small, reviewable steps
- Run `npm test` locally before proposing commits
- For any operation that affects external state, require explicit user confirmation

---

## Repository layout

```
src/main/              Electron main process (Node.js, ESM)
  rpc-client.ts          JSON-RPC 2.0 client, daemon spawn, shape adapters
  ipc-handlers.ts        IPC channel → RPC method wiring
  connection.ts          Health polling, connection state machine
  governor-client.ts     Legacy HTTP client (reference, not wired)
  index.ts               App lifecycle, window creation

src/preload/           Security boundary (contextBridge)
  index.ts               Exposes window.governor API to renderer

src/renderer/          Svelte 5 app (Vite-bundled, no Node access)
  App.svelte             Root layout, navigation, polling setup
  components/            Reusable UI components (9 files)
  views/                 Page-level views (5 files)
  stores/                Reactive state (*.svelte.ts — runes require this extension)
  lib/                   Utilities (api proxy, formatters, type aliases)
  styles/                Design tokens + shared component styles

src/shared/            Used by all layers
  channels.ts            IPC channel name constants (single source of truth)
  types.ts               TypeScript interfaces (GovernorAPI, response shapes)

test/                  Unit tests (vitest)
tests/e2e/             Playwright Electron smoke tests
scripts/               Build scripts (preload CJS bundling)
```

The governor daemon lives in the `agent_gov` repo (`src/governor/daemon.py`).

---

## Coding conventions

- TypeScript strict mode everywhere
- Svelte 5 runes mode (`$state`, `$derived`, `$effect`, `$props`)
- **Runes only in `.svelte` or `.svelte.ts` files** — plain `.ts` files are not processed by the Svelte compiler. A guard test enforces this.
- ESM throughout (`"type": "module"` in package.json)
- Imports in `src/main/` and `src/preload/` must use `.js` extensions (Node ESM resolution)
- IPC channels defined once in `src/shared/channels.ts`
- Types defined once in `src/shared/types.ts`

---

## Architecture boundary

Guvnah is an **untrusted cockpit**. It displays state but has no authority.

- **Governor daemon** is the sole authority. It evaluates admissibility, produces receipts, enforces constraints.
- **Guvnah** renders what the daemon reports. It cannot sign receipts, hold secrets, instantiate governor objects, or bypass the commit flow.
- **Shape adapters** (`rpc-client.ts`) are the single compatibility seam between daemon Python shapes and renderer TypeScript types. When shapes diverge, fix them here — don't touch the daemon or the renderer.
- **Preload** is the security boundary. The renderer has no Node access. All system interaction goes through `window.governor.*` → IPC → main process → daemon.

### The litmus test

> Can the renderer cause an irreversible governor action without the daemon
> evaluating admissibility and producing a receipt?

If yes, that's a bug.

---

## When you're unsure

Ask for clarification rather than guessing, especially around:
- Electron security settings (sandbox, contextIsolation, CSP)
- Preload API surface changes
- Shape adapter modifications (daemon↔renderer contract)
- Anything that changes the authority boundary

---

## Agent-specific instruction files

| Agent | File | Role |
|-------|------|------|
| Claude Code | `CLAUDE.md` | Full operational context, build details, conventions |
| Codex | `AGENTS.md` (this file) | Operating context + defaults |
| Any future agent | `AGENTS.md` (this file) | Start here |

All of these are travel guides. The governor is the constitution.
