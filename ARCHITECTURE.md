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
┌─────────────┐     UDS or loopback+token     ┌──────────────────┐
│   Guvnah    │ ──────────────────────────────>│  Governor Daemon  │
│  (desktop)  │ <──────────────────────────────│  (core, local)    │
└─────────────┘    same contract as Maude      └──────────────────┘
```

- **Preferred**: Unix Domain Socket (no CORS, no auth nonsense)
- **Fallback**: loopback HTTP with bearer token
- Uses the same endpoints Maude uses — no special "desktop" API
- Governor runs as a local daemon; Guvnah connects on launch

## Relationship to Other Shells

| Shell | Purpose | Authority |
|-------|---------|-----------|
| **Governor** | Core constraint system | The authority |
| **Maude** | CLI + automation client | None (client) |
| **gov-webui** | Browser-accessible UI (remote-capable) | None (client) |
| **Guvnah** | Best local UX, least browser pain | None (client) |

All shells talk to the same contract. None can change governor semantics.

## First Slice Feature Set

The minimum viable cockpit that proves it's worth existing:

1. **Session/Run Picker** — browse, create, resume governance sessions
2. **Intent Modal Renderer** — render templates from `/v2/intent/schema`, submit compilations
3. **Receipts Inspector** — browse gate receipts with evidence bundles (proof-of-verification)
4. **Scars Timeline** — visualize failure provenance, hysteresis, constraint history
5. **Commit/Waive Flow** — explicit challenge preview before commit, waiver with receipt

## Desktop Integration Points

- **System tray**: governor status indicator (ok/warning/blocked)
- **Global hotkeys**: quick-open intent form, toggle cockpit
- **Native notifications**: violation alerts, receipt confirmations
- **File picker**: scope selection for tasks
- **Window management**: persistent sidebar or floating panel mode

## Runtime Decision: Electron vs Tauri

Not yet decided. Trade-offs:

| | Electron | Tauri |
|---|----------|-------|
| **Ship speed** | Faster (mature, predictable) | Slower (platform quirks) |
| **Bundle size** | Large (Chromium + Node) | Small (native webview) |
| **Attack surface** | Larger | Smaller |
| **Capability model** | Looser (full Node) | Tighter (Rust backend) |
| **Linux** | Predictable | WebKitGTK dependency |

Current lean: **Electron for v1** (ship the cockpit), reevaluate later. The governor boundary work makes switching possible without rewriting the core contract.

## What Guvnah Is NOT

- Not a second brain
- Not an orchestrator
- Not a replacement for the CLI
- Not a place where decisions are made
- Not a place where authority lives

It's the desk you stand at. The turtle watches silently from the sidelines.
