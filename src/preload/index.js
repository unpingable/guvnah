// Preload script — capability bridge between main and renderer
//
// Exposes a minimal, typed API to the renderer via contextBridge.
// The renderer NEVER gets direct access to Node/Electron APIs.
//
// Exposed channels (IPC):
//   governor:health       → HealthResponse
//   governor:now           → GovernorNow
//   intent:templates       → IntentTemplateList
//   intent:schema          → IntentFormSchema
//   intent:validate        → IntentValidationResult
//   intent:compile         → IntentCompilationResult
//   intent:policy          → IntentPolicy
//   sessions:list          → SessionSummary[]
//   sessions:create        → ChatSession
//   receipts:list          → GateReceipt[]
//   receipts:evidence      → EvidenceBundle
//   scars:list             → Scar[]
//   scars:timeline         → ScarEvent[]
//
// This file is a placeholder. See ARCHITECTURE.md for design.
