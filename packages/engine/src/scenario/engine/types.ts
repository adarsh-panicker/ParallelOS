// packages/engine/src/scenario/engine/types.ts

import {
  Entity,
  EntityId,
  Relationship,
  RelationshipId,
  VersionId,
  ScenarioId,
  ValueSource,
  Criticality,
  EntityState,
  VerificationStatus,
  DecisionType,
} from '../../entities/types';
import { Assumption, EntityOverride, RelationshipOverride, AppliedDecision, ScenarioVersion, Scenario } from '../schemas';

/**
 * Resolved entity in scenario context (baseline + overrides applied)
 */
export interface ResolvedEntity extends Entity {
  scenarioOverrides: EntityOverride[];
}

/**
 * Resolved relationship in scenario context
 */
export interface ResolvedRelationship extends Relationship {
  scenarioOverrides: RelationshipOverride[];
}

/**
 * Full scenario context for simulation
 */
export interface ScenarioContext {
  scenario: Scenario;
  baselineEntities: Map<EntityId, ResolvedEntity>;
  baselineRelationships: Map<RelationshipId, ResolvedRelationship>;
  resolvedEntities: Map<EntityId, ResolvedEntity>;
  resolvedRelationships: Map<RelationshipId, ResolvedRelationship>;
  outboundEdges: Map<EntityId, RelationshipId[]>;
  inboundEdges: Map<EntityId, RelationshipId[]>;
}

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