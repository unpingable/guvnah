# Guvnah

**Desktop cockpit for the [Agent Governor](https://github.com/unpingable/agent_governor). See everything. Control nothing.**

Guvnah renders the governor's state — sessions, receipts, scars, violations, intent forms, execution integrity, claim verification. It has no authority of its own. The governor daemon is the judge; Guvnah is the courtroom sketch artist.

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
│  │  Execution Integrity        │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Transport**: JSON-RPC 2.0 with Content-Length framing over child process stdio. Same protocol as MCP servers and VS Code language servers.

**Authority model**: Guvnah is an untrusted cockpit. It never signs receipts, never holds secrets, never instantiates governor objects. The daemon is the sole authority.

---

## What's In The Box

### 6 Views

| View | What It Shows | Daemon Methods |
|------|--------------|----------------|
| **Session Picker** | Browse, create, delete governance sessions | `sessions.*` |
| **Intent Modal** | Template selection → dynamic form → deterministic compilation | `intent.*` |
| **Receipts Inspector** | Gate receipts with evidence bundles, filterable by gate/verdict | `receipts.*` |
| **Scars Timeline** | Failure history, scar stiffness, active shields | `scars.*` |
| **Commit/Waive** | Pending violations with fix/revise/proceed resolution | `commit.*` |
| **Execution Integrity** | K-vector fidelity, capture indicators, regime timeline, receipt chain, claim verification | `operator.*`, `correlator.*`, `receipts_v1.*`, `trace.*`, `claims.*` |

### Execution Integrity

The sixth view. Makes runtime failure geometry and claim verification visible in real time.

- **Status summary** — Regime pill, operator checks, counts, suggestions
- **Claim vs Verified** — Agent said X, receipts show Y. Status pills (verified / partial / contradicted / unverified), recent claims table, click-to-expand detail with linked receipts and roles
- **Fidelity / Throughput** — 4 K-vector dimensions with SVG sparklines. No scalarization — all 4 dimensions always visible
- **Capture Indicators** — Binding indicator streaks and gate flags. Thresholds come from the daemon, not the UI
- **Regime Strip** — Dual-band timeline (correlator + operational regimes) with trace event markers
- **Receipt Chain** — Hash-chained v1 receipts with gap detection and verification status

Panel-level error isolation: one RPC failure shows "unavailable" on that panel. The rest of the screen keeps working. Older daemons missing newer RPCs degrade gracefully.

### Stack

- **Electron 33** — Desktop shell (Tauri migration path preserved)
- **Svelte 5** — Runes mode (`$state`, `$derived`, `$effect`)
- **Vite 5** — Renderer bundling
- **TypeScript** — Strict, everywhere
- **Governor daemon** — Python, spawned as child process

### Tests

- **123 unit tests** (vitest) — RPC client, IPC handlers, shape adapters, components, format utils, integrity stores, claims, chain composition, runes guard
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

## How It Connects

The governor daemon (`governor serve --stdio`) is a JSON-RPC 2.0 server. Guvnah spawns it as a child process and talks Content-Length framed JSON-RPC over stdin/stdout.

```
Guvnah (Electron)              Governor Daemon (Python)
─────────────────              ────────────────────────
rpc-client.ts          ←stdio→  daemon.py
  ├─ governor.hello              ├─ DaemonState
  ├─ governor.now/status         ├─ SessionStore
  ├─ sessions.*                  ├─ ReceiptStore
  ├─ intent.*                    ├─ ScarLedger
  ├─ receipts.* / receipts_v1.* ├─ ViolationResolver
  ├─ scars.*                     ├─ IntentCompiler
  ├─ commit.*                    ├─ CorrelatorTelemetry
  ├─ operator.snapshot           ├─ ClaimCorrelation
  ├─ correlator.*                ├─ ChainGate
  ├─ trace.tail                  ├─ ScopeGovernor
  ├─ claims.*                    ├─ SemanticStability
  └─ chain.*                     └─ PolicyEngine
```

34 daemon RPC methods wired. Shape adapters in `rpc-client.ts` translate daemon Python shapes to renderer TypeScript types. This is the sole compatibility seam — when shapes change, you fix it in one place.

### Not Yet Wired

The daemon exposes additional subsystems that Guvnah doesn't render yet:

| Namespace | Methods | What It Would Show |
|-----------|---------|-------------------|
| `governor.selfcheck` | 1 | Deployment health checks |
| `scope.*` | 4 | Locality policy: grants, contracts, escalation history |
| `stability.*` | 4 | Semantic stability: perturbation audits, stiffness, anisotropy |
| `policy.*` | 3 | Policy evaluation and capabilities |
| `lanes.*` | 3 | Routing: complexity → model tier → capability contract |
| `chat.*` | 3 | Chat generation (intentionally omitted — Guvnah observes, doesn't generate) |

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
│   │   ├── JsonTree.svelte
│   │   ├── CaptureIndicators.svelte  # Binding indicators + gate flags
│   │   ├── ClaimsPanel.svelte        # Claim vs Verified panel + detail drawer
│   │   ├── FidelityPanel.svelte      # K-vector bars + sparklines
│   │   ├── ReceiptChain.svelte       # Hash-chained receipt timeline
│   │   └── RegimeStrip.svelte        # Dual-band regime timeline
│   ├── views/                   # Page-level views
│   │   ├── SessionPicker.svelte
│   │   ├── IntentModal.svelte
│   │   ├── ReceiptsInspector.svelte
│   │   ├── ScarsTimeline.svelte
│   │   ├── CommitWaive.svelte
│   │   └── ExecutionIntegrity.svelte # 6th view: integrity dashboard
│   ├── stores/                  # Reactive state (*.svelte.ts for runes)
│   │   ├── connection.svelte.ts
│   │   ├── governor.svelte.ts
│   │   ├── sessions.svelte.ts
│   │   ├── intent.svelte.ts
│   │   ├── receipts.svelte.ts
│   │   ├── scars.svelte.ts
│   │   └── integrity.svelte.ts  # Execution Integrity + claims
│   ├── lib/                     # Utilities
│   │   ├── api.ts               # window.governor proxy
│   │   ├── types.ts             # Renderer-specific type aliases
│   │   └── format.ts            # Time, verdict, stiffness, regime, claim formatters
│   └── styles/
│       ├── tokens.css           # Design tokens
│       └── components.css       # Shared component styles
├── shared/                      # Used by all layers
│   ├── channels.ts              # IPC channel name constants
│   └── types.ts                 # TypeScript interfaces (GovernorAPI, etc.)
├── test/                        # Unit tests (vitest)
│   ├── fixtures/
│   │   └── integrity-payloads.ts    # Daemon-shaped test fixtures
│   ├── main/
│   │   ├── rpc-client.test.ts
│   │   ├── governor-client.test.ts
│   │   ├── ipc-handlers.test.ts
│   │   └── ipc-handlers-integrity.test.ts
│   └── renderer/
│       ├── components.test.ts
│       ├── stores.test.ts
│       └── integrity-stores.test.ts
└── tests/e2e/                   # Playwright Electron tests
    └── smoke.spec.ts
```

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
| [Agent Governor](https://github.com/unpingable/agent_governor) | The constraint system (Python, 11k+ tests) |
| [Governor WebUI](https://github.com/unpingable/governor_webui) | Web-based chat + governance dashboard (FastAPI) |
| [VS Code Extension](https://github.com/unpingable/vscode-governor) | IDE integration — preflight, correlator, file checking |
| [Maude](https://github.com/unpingable/maude) | TUI client for the governor daemon (Textual) |

---

## License

Apache-2.0

---

*The governor decides. Guvnah just shows you what it decided.*
