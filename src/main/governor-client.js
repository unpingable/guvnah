// Governor client — talks to the governor daemon
//
// Uses the same endpoints as Maude:
//   GET  /health
//   GET  /v2/intent/templates
//   GET  /v2/intent/schema/{template}
//   POST /v2/intent/validate
//   POST /v2/intent/compile
//   GET  /v2/intent/policy
//   GET  /sessions/
//   GET  /v2/runs
//   GET  /v2/dashboard/summary
//   GET  /governor/now
//   GET  /governor/status
//
// Transport: UDS (preferred) or loopback HTTP with bearer token
//
// This file is a placeholder. See ARCHITECTURE.md for design.
