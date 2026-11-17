// packages/engine/src/scenario/engine/types.ts

import {
  EntityId,
  RelationshipId,
  VersionId,
  ScenarioId,
  ValueSource,
  Criticality,
  EntityState,
  VerificationStatus,
  DecisionType,
} from '../../entities/types';
import { Entity } from '../../entities';
import { Relationship } from '../../relationships';
import { Assumption, EntityOverride, RelationshipOverride, AppliedDecision, ScenarioVersion, Scenario } from '../types';

export * from '../types';

/**
 * Scenario creation input
 */
export interface CreateScenarioInput {
  name: string;
  description?: string;
  baselineVersionId: VersionId;
  parentScenarioId?: ScenarioId;
  assumptions?: Assumption[];
  tags?: string[];
}

/**
 * Scenario engine result
 */
export interface ScenarioEngineResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Override application result
 */
export interface OverrideResult {
  success: boolean;
  overrideId?: string;
  error?: string;
}

/**
 * Version creation result
 */
export interface VersionResult {
  success: boolean;
  versionId?: VersionId;
  error?: string;
}