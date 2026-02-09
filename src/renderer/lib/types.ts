/**
 * Re-export shared types for renderer convenience.
 * Also defines renderer-only types (view state, UI models).
 */

export type {
  HealthResponse,
  SessionSummary,
  ChatSession,
  GovernorNow,
  GovernorStatus,
  IntentTemplateList,
  IntentFormSchema,
  IntentFormField,
  IntentFieldOption,
  IntentBranch,
  IntentValidationResult,
  IntentCompilationResult,
  IntentPolicy,
  GateReceipt,
  ReceiptDetail,
  Scar,
  Shield,
  ScarStats,
  ScarsResponse,
  FailureEvent,
  PendingViolation,
  ResolutionResult,
  ExceptionRecord,
} from '../../shared/types';

/** Active view in the main content area */
export type View = 'sessions' | 'intent' | 'receipts' | 'scars' | 'commit';
