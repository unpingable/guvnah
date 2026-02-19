# Compatibility

Guvnah is an Electron + Svelte 5 desktop client for Agent Governor.

## Version coupling

Tracks Governor **major.minor**. Client 2.3.x expects governor 2.3.x.
Patch versions are independent.

## Compatible Governor versions

- Required: `>=2.3.1 <2.4.0`

## Contract versions (wire / JSON)

| Contract | Version | Used For |
|----------|---------|----------|
| RPC protocol | 1.0 | Daemon communication (child process stdio, Content-Length framing) |
| StatusRollup schema | 1 | Governor status panel |
| ViewModel schema | v2 | State display |
| Receipt schema | 2 | Receipt panel |

## Feature negotiation

Guvnah spawns the governor daemon as a child process (`governor serve --stdio`).
If the binary is not found, the app shows a setup prompt.

The RPC client (`rpc-client.ts`) handles protocol negotiation via `governor.hello`.
If a method is unrecognized, the client receives a standard JSON-RPC error and
degrades the corresponding UI panel.
