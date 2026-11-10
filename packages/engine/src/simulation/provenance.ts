// packages/engine/src/simulation/provenance.ts

import { ProvenanceRecord, AssumptionRef, EntityId, ValueSource } from '../engine/types';

/**
 * Create a provenance record for a calculation
 */
export function createProvenanceRecord(
  calculationType: string,
  entityId: EntityId,
  details: {
    formula: string;
    assumptions: AssumptionRef[];
    deterministic: boolean;
    triggeringDecision: string;
    dependencyPath: any[];
  }
): ProvenanceRecord {
  return {
    triggeringDecision: details.triggeringDecision,
    affectedEntity: entityId,
    dependencyPath: details.dependencyPath,
    formula: details.formula,
    assumptions: details.assumptions,
    deterministic: details.deterministic,
    estimated: !details.deterministic,
    confidence: details.deterministic ? 1.0 : 0.7,
    calculatedAt: Date.now(),
  };
}

/**
 * Merge multiple provenance records
 */
export function mergeProvenance(records: ProvenanceRecord[]): ProvenanceRecord {
  if (records.length === 0) {
    throw new Error('Cannot merge empty provenance records');
  }
  if (records.length === 1) return records[0];

  return {
    triggeringDecision: records[0].triggeringDecision,
    affectedEntity: records[0].affectedEntity,
    dependencyPath: records.flatMap(r => r.dependencyPath),
    formula: records.map(r => r.formula).join('; '),
    assumptions: records.flatMap(r => r.assumptions),
    deterministic: records.every(r => r.deterministic),
    estimated: records.some(r => r.estimated),
    confidence: Math.min(...records.map(r => r.confidence)),
    calculatedAt: Date.now(),
  };
}

/**
 * Create assumption reference
 */
export function createAssumptionRef(
  assumptionId: string,
  key: string,
  value: unknown,
  source: ValueSource
): any {
  return { assumptionId, key, value, source };
}

/**
 * Unknown value handling
 */
export type UnknownValue<T> = T | 'unknown';

export function unknown<T>(reason?: string): UnknownValue<T> {
  return 'unknown';
}

export function isUnknown<T>(val: UnknownValue<T>): val is 'unknown' {
  return val === 'unknown';
}

export function safeGetProperty<T>(obj: Record<string, unknown>, key: string): any {
  if (!(key in obj)) {
    return unknown(`Property '${key}' not found`);
  }
  return obj[key] as T;
}

export function propagateWithUnknowns<T>(values: any[], combiner: (vals: T[]) => T): any {
  const resolved: T[] = [];
  for (const val of values) {
    if (val === 'unknown') {
      return 'unknown';
    }
    resolved.push(val);
  }
  return combiner(resolved);
}