# Guvnah Architecture

> Guvnah is a local desktop cockpit for the Governor.
> It renders intent forms, displays receipts, and mediates commits.
> It has no authority of its own.

## Non-Negotiables

1. **Guvnah is an untrusted cockpit.** Governor remains the only authority.
2. Guvnah never signs receipts.
3. Guvnah never holds long-lived secrets it can't lose safely.
4. Guvnah never instantiates core governor objects.
5. Guvnah never bypasses challenge/nonce/commit flow.

## Communication

```
┌─────────────┐     stdio (child process)      ┌──────────────────┐
│   Guvnah    │ ──────────────────────────────>│  Governor Daemon  │
│  (Electron) │ <──────────────────────────────│  (core, local)    │
└─────────────┘  Content-Length framed JSON-RPC └──────────────────┘
```

- **Transport**: `StdioTransport` spawns `governor serve --stdio` as a child process
- Content-Length framed JSON-RPC 2.0 over stdin/stdout pipes
- Same 25-method RPC contract as Maude
- Governor daemon manages all state; Guvnah is stateless between calls

### Transport Abstraction

`GovernorClient` accepts a pluggable `Transport` interface:

```typescript
export interface Transport {
  start(): void;
  stop(): void;
  get isRunning(): boolean;
  call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
}
```

`StdioTransport` (default) spawns the daemon as a child process. Future transports (TCP, Unix socket client) implement the same interface. `GovernorClient` constructor takes an optional third parameter:

```typescript
const client = new GovernorClient(governorDir, mode, customTransport);
```

`RpcTransport` is preserved as a backward-compatible alias for `StdioTransport`.

## Relationship to Other Shells

| Shell | Purpose | Authority | Transport |
|-------|---------|-----------|-----------|
| **Governor** | Core constraint system | The authority | — |
| **Maude** | TUI client | None (client) | Unix socket |
| **gov-webui** | Browser-accessible UI | None (client) | Direct import + daemon socket (chat) |
| **Guvnah** | Best local UX | None (client) | Stdio (child process) |

All shells talk to the same contract. None can change governor semantics.

## Runtime: Electron

Guvnah ships as an Electron app:
- **Main process**: Node.js — spawns daemon, handles IPC, manages `GovernorClient`
- **Renderer process**: Svelte 5 — reactive UI, communicates with main via IPC
- **Preload bridge**: Typed IPC handlers expose governor operations to the renderer

## Feature Set

1. **Session/Run Picker** — browse, create, resume governance sessions
2. **Intent Modal Renderer** — render templates from `intent.schema`, submit compilations
3. **Receipts Inspector** — browse gate receipts with evidence bundles
4. **Scars Timeline** — visualize failure provenance, hysteresis, constraint history
5. **Commit/Waive Flow** — explicit challenge preview before commit, waiver with receipt

## Desktop Integration Points

- **System tray**: governor status indicator (ok/warning/blocked)
- **Global hotkeys**: quick-open intent form, toggle cockpit
- **Native notifications**: violation alerts, receipt confirmations
- **File picker**: scope selection for tasks
- **Window management**: persistent sidebar or floating panel mode

## What Guvnah Is NOT

- Not a second brain
- Not an orchestrator
- Not a replacement for the CLI
- Not a place where decisions are made
- Not a place where authority lives

It's the desk you stand at. The turtle watches silently from the sidelines.
