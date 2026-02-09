# Guvnah

**Desktop cockpit for the [Agent Governor](https://github.com/unpingable/agent_governor). See everything. Control nothing.**

Guvnah renders the governor's state — sessions, receipts, scars, violations, intent forms. It has no authority of its own. The governor daemon is the judge; Guvnah is the courtroom sketch artist.

---

## The Problem

You're running Agent Governor to constrain your AI coding tools. The governor produces receipts, tracks scars, blocks violations — but you're reading it all through CLI output and JSON dumps. You want a dashboard that shows you what the governor sees, in real time, without giving the dashboard any power to override it.

**That's Guvnah.**

## Architecture

```
┌─────────────────────────────────────┐
│          Electron (main)            │
│                                     │
│  ┌─────────┐    ┌────────────────┐  │
│  │ IPC     │◄──►│ RPC Client     │  │
│  │ Handlers│    │ (JSON-RPC 2.0) │  │
│  └────┬────┘    └───────┬────────┘  │
│       │                 │ stdin/stdout
│       │                 ▼           │
│       │         ┌──────────────┐    │
│       │         │ governor     │    │
│       │         │ serve --stdio│    │
│       │         │ (daemon)     │    │
│       │         └──────────────┘    │
├───────┼─────────────────────────────┤
│  preload (contextBridge)            │
├───────┼─────────────────────────────┤
│       ▼                             │
│  ┌─────────────────────────────┐    │
│  │     Svelte 5 Renderer       │    │
│  │  Sessions │ Intent │ Scars  │    │
│  │  Receipts │ Commit/Waive    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Transport**: JSON-RPC 2.0 with Content-Length framing over child process stdio. Same protocol as MCP servers and VS Code language servers.

**Authority model**: Guvnah is an untrusted cockpit. It never signs receipts, never holds secrets, never instantiates governor objects. The daemon is the sole authority.

---

## What's In The Box

### 5 Views

| View | What It Shows | Daemon Methods |
|------|--------------|----------------|
| **Session Picker** | Browse, create, delete governance sessions | `sessions.*` |
| **Intent Modal** | Template selection → dynamic form → deterministic compilation | `intent.*` |
| **Receipts Inspector** | Gate receipts with evidence bundles, filterable by gate/verdict | `receipts.*` |
| **Scars Timeline** | Failure history, scar stiffness, active shields | `scars.*` |
| **Commit/Waive** | Pending violations with fix/revise/proceed resolution | `commit.*` |

### Stack

- **Electron 33** — Desktop shell (Tauri migration path preserved)
- **Svelte 5** — Runes mode (`$state`, `$derived`, `$effect`)
- **Vite 5** — Renderer bundling
- **TypeScript** — Strict, everywhere
- **Governor daemon** — Python, spawned as child process

### Tests

- **77 unit tests** (vitest) — RPC client, IPC handlers, shape adapters, components, format utils, runes guard
- **2 E2E tests** (Playwright Electron) — Daemon boots + session list renders

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+ with `governor` CLI installed (`pip install -e .` in agent_gov)

### Run

```bash
npm install
npm start                # Build + launch
```

### Develop

```bash
npm run dev              # Concurrent: Vite watch + tsc watch + Electron
```

### Test

```bash
npm test                 # Unit tests (vitest)
npm run build && npm run test:e2e  # E2E smoke (Playwright)
```

### Build

```bash
npm run build            # Vite + tsc + esbuild preload bundle
npm run pack             # Electron Builder (unpacked)
npm run dist             # Electron Builder (distributable)
```

---

## File Structure

```
src/
├── main/                        # Electron main process
│   ├── index.ts                 # App lifecycle, daemon spawn, window creation
│   ├── rpc-client.ts            # JSON-RPC 2.0 transport + shape adapters
│   ├── connection.ts            # Health polling, state transitions
│   ├── ipc-handlers.ts          # IPC channel → RPC method wiring
│   └── governor-client.ts       # Legacy HTTP client (reference only)
├── preload/
│   └── index.ts                 # contextBridge — renderer↔main gateway
├── renderer/
│   ├── App.svelte               # Root layout, navigation, polling
│   ├── main.ts                  # Svelte mount point
│   ├── components/              # Reusable UI components
│   │   ├── ConnectionBadge.svelte
│   │   ├── Sidebar.svelte
│   │   ├── StatusBar.svelte
│   │   ├── ConfidenceBar.svelte
│   │   ├── StiffnessIndicator.svelte
│   │   ├── VerdictBadge.svelte
│   │   ├── FormField.svelte
│   │   └── JsonTree.svelte
│   ├── views/                   # Page-level views
│   │   ├── SessionPicker.svelte
│   │   ├── IntentModal.svelte
│   │   ├── ReceiptsInspector.svelte
│   │   ├── ScarsTimeline.svelte
│   │   └── CommitWaive.svelte
│   ├── stores/                  # Reactive state (*.svelte.ts for runes)
│   │   ├── connection.svelte.ts
│   │   ├── governor.svelte.ts
│   │   ├── sessions.svelte.ts
│   │   ├── intent.svelte.ts
│   │   ├── receipts.svelte.ts
│   │   └── scars.svelte.ts
│   ├── lib/                     # Utilities
│   │   ├── api.ts               # window.governor proxy
│   │   ├── types.ts             # Renderer-specific type aliases
│   │   └── format.ts            # Time, verdict, stiffness formatters
│   └── styles/
│       ├── tokens.css           # Design tokens
│       └── components.css       # Shared component styles
├── shared/                      # Used by all layers
│   ├── channels.ts              # IPC channel name constants
│   └── types.ts                 # TypeScript interfaces (GovernorAPI, etc.)
├── test/                        # Unit tests (vitest)
│   ├── main/
│   │   ├── rpc-client.test.ts
│   │   ├── governor-client.test.ts
│   │   └── ipc-handlers.test.ts
│   └── renderer/
│       ├── components.test.ts
│       └── stores.test.ts
└── tests/e2e/                   # Playwright Electron tests
    └── smoke.spec.ts
```

---

## How It Connects

The governor daemon (`governor serve --stdio`) is a JSON-RPC 2.0 server that exposes the full governor API:

```
Guvnah (Electron)              Governor Daemon (Python)
─────────────────              ────────────────────────
rpc-client.ts          ←stdio→  daemon.py
  ├─ governor.hello              ├─ DaemonState
  ├─ governor.now                ├─ SessionStore
  ├─ governor.status             ├─ ReceiptStore
  ├─ sessions.*                  ├─ ScarLedger
  ├─ intent.*                    ├─ ViolationResolver
  ├─ receipts.*                  └─ IntentCompiler
  ├─ scars.*
  └─ commit.*
```

21 RPC methods total. Shape adapters in `rpc-client.ts` translate daemon Python shapes to renderer TypeScript types. This is the sole compatibility seam — when shapes change, you fix it in one place.

---

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `GOVERNOR_DIR` | Governor directory path | `process.cwd()` |
| `GOVERNOR_MODE` | Governance mode | `general` |
| `GOVERNOR_BIN` | Path to `governor` binary | Auto-detected via `which governor` |
| `GUVNAH_E2E` | Enable E2E test mode (relaxed sandbox) | unset |

---

## Why "Guvnah"?

British slang for "governor." Because the cockpit should be friendlier than the authority it displays.

---

## Related Projects

| Project | What It Is |
|---------|-----------|
| [Agent Governor](https://github.com/unpingable/agent_governor) | The constraint system (Python, 10k+ tests) |
| [Governor WebUI](https://github.com/unpingable/governor_webui) | Web-based chat + governance dashboard (FastAPI) |
| [Maude](https://github.com/unpingable/maude) | Python client library for the governor API |

---

## License

Apache-2.0

---

*The governor decides. Guvnah just shows you what it decided.*
