# Execution Integrity View

The 6th Guvnah view. Makes runtime failure geometry and claim verification visible.

## RPCs Used

| RPC Method | Panel | What It Provides |
|---|---|---|
| `operator.snapshot` | Status summary | Regime, checks, counts, suggestions |
| `correlator.status` | Capture Indicators | Regime, indicator streaks, gate state |
| `correlator.history` | Fidelity sparklines + Regime Strip | Per-window diagnostics over time |
| `correlator.kvector` | Fidelity Panel | Current K-vector (4 fidelity dims + throughput) |
| `receipts_v1.list` | Receipt Chain | Sequential receipt timeline |
| `receipts_v1.verify` | Receipt Chain header | Chain integrity: valid/invalid, gaps, errors |
| `trace.tail` | Regime Strip (markers) | Trace events overlaid on regime timeline |
| `claims.stats` | Claim vs Verified (counts) | Total claims, counts by level, total links, newest_at |
| `claims.window` | Claim vs Verified (table) | Claims in time window with status breakdown + receipt stubs |
| `claims.detail` | Claim detail drawer | Single claim summary + links + receipt stubs |
| `claims.for_receipt` | Receipt cross-link (store) | Which claims link to a receipt |

`receipts_v1.detail` is wired but not used in v1 — available for future receipt drawer.

## Panels

**Status Summary** — Operator snapshot rollup. Regime pill, check badges, counts, suggestions. Shows `generated_at` freshness.

**Claim vs Verified** — Top-level claim verification panel. Status count pills (verified / partial / contradicted / unverified) from `claims.window.counts_by_status`. Recent claims table from `claims.window` with status, text, kind/level tags, coverage counts (S/C/N = supporting/contradicting/neutral), chain integrity indicator. Click a row to expand detail drawer showing full summary, receipt links with roles, and receipt stubs with verdicts. Note: `claims.stats` provides structural counts (by level, total links) but **not** status breakdowns — those come from `claims.window.counts_by_status`.

**Fidelity / Throughput** — 4 K-vector fidelity dimension bars (mode_preservation, contradiction_persistence, representation_shear, provenance_entropy) + throughput. SVG sparklines from correlator history show temporal divergence.

**Capture Indicators** — 4 binding indicators with streak counts and triggered/clear status. Gate flags (authority-gated, throughput-gated, gate-met) come from the daemon, not UI-invented thresholds. Overall confidence and gate status.

**Regime Strip** — Dual-band horizontal timeline. Correlator band: LEVERAGE/SHEAR/CAPTURE. Operational band: ELASTIC/WARM/DUCTILE/UNSTABLE. Trace event markers overlaid as vertical ticks.

**Receipt Chain** — Verify summary header (valid/invalid, count, seq range, gaps). Sequential receipt blocks with action badges (allow/deny/transform/escalate). Gap indicators between blocks. Click to expand receipt detail.

## Design Decisions

- **No K-vector scalarization**: 4 separate dimensions always. Never collapse to a single score.
- **No UI-invented thresholds**: Daemon defines trigger semantics for capture indicators.
- **Panel-level error isolation**: `Promise.allSettled` — one RPC failure shows "unavailable" on that panel only.
- **Graceful degradation**: Older daemons missing `claims.*` RPCs get panel-level error messages, rest of screen still works.
- **Telemetry freshness**: Header shows age of latest daemon event, with stale warning at >5min. Prevents the "stable dashboard with stale data" operator trap.
- **No charting library**: Pure CSS bars + inline SVG sparklines.
- **No synthetic scores**: Claim statuses are derived mechanically by the daemon from linked receipt verdicts. No heuristics or editorialization in the UI.
- **Dry language**: "Claim", "Verified", "Contradicted", "Partial", "Unverified". No moral language, no trust scores.

## Daemon Payload Shapes (from `claim_correlation.py`)

### `claims.stats`
```json
{ "total": int, "counts_by_level": {"hard": int, "soft": int}, "total_links": int, "newest_at": str }
```

### `claims.window`
```json
{ "schema": "claims_window.v1", "claims": [ClaimVerificationSummary...], "receipt_stubs": [ReceiptStub...], "count": int, "counts_by_status": {"verified": int, ...} }
```

### `claims.detail`
```json
{ "summary": ClaimVerificationSummary, "links": [ReceiptLink...], "receipts": [ReceiptStub...] }
```

### `ClaimVerificationSummary`
14 fields: `schema`, `claim_id`, `claim_kind`, `claim_text`, `claim_level`, `claim_fingerprint`, `status` (verified|partial|contradicted|unverified), `supporting_receipt_ids`, `contradicting_receipt_ids`, `neutral_receipt_ids`, `unresolved_receipt_refs`, `receipt_chain_ok`, `run_id`, `created_at`, `updated_at`.
