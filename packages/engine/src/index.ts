// packages/engine/src/index.ts

export * from './entities';
export * from './relationships';
export * from './scenario';
export * from './simulation';
export * from './comparison';
export * from './demo';
export * from './ai';
export * from './services';
export {
  ParallelOSError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  SimulationError,
  isParallelOSError,
  formatError,
} from './errors';

// Re-export simulation types that override entities
export type { UnknownValue } from './simulation/provenance';
export {
  isUnknown,
  unknown,
  safeGetProperty,
  propagateWithUnknowns,
  createProvenanceRecord,
  mergeProvenance,
  createAssumptionRef,
} from './simulation/provenance';