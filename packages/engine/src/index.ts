// packages/engine/src/index.ts

export * from './entities';
export * from './relationships';
export * from './scenario';
export * from './simulation';
export * from './comparison';
export * from './demo';
export * from './ai';

// Re-export simulation types that override entities
export {
  UnknownValue,
  isUnknown,
  unknown,
  safeGetProperty,
  propagateWithUnknowns,
  createProvenanceRecord,
  mergeProvenance,
  createAssumptionRef,
} from './simulation/provenance';