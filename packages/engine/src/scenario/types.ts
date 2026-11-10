// packages/engine/src/scenario/types.ts

import { EntityId, VersionId, ScenarioId, DecisionType, ValueSource, Criticality } from '../entities/types';

/**
 * Assumption within a scenario
 */
export interface Assumption {
  id: string;
  key: string;
  value: unknown;
  description: string;
  source: ValueSource.Assumed | ValueSource.AiHypothesis;
  confidence: number; // 0-1
  createdAt: number;
  createdBy: string;
}

/**
 * Entity override in a scenario
 */
export interface EntityOverride {
  entityId: EntityId;
  operation: 'create' | 'update' | 'delete';
  previousVersion?: VersionId;
  newData: Partial<{
    name: string;
    description: string;
    properties: Record<string, unknown>;
    state: string;
    criticality: Criticality;
    source: ValueSource;
    verificationStatus: string;
  }>;
  appliedAt: number;
  appliedBy: string;
}

/**
 * Relationship override in a scenario
 */
export interface RelationshipOverride {
  relationshipId: string;
  operation: 'create' | 'update' | 'delete';
  previousVersion?: VersionId;
  newData?: Partial<{
    type: string;
    direction: string;
    criticality: Criticality;
    dependencyStrength: string;
    redundancyInfo: any;
    confidence: number;
    properties: Record<string, unknown>;
  }>;
  appliedAt: number;
  appliedBy: string;
}

/**
 * Applied decision record
 */
export interface AppliedDecision {
  id: string;
  type: DecisionType;
  description: string;
  parameters: Record<string, unknown>;
  appliedAt: number;
  appliedBy: string;
  simulationId?: string;
}

/**
 * Scenario version history entry
 */
export interface ScenarioVersion {
  versionId: VersionId;
  timestamp: number;
  author: string;
  changeSummary: string;
  entityOverridesCount: number;
  relationshipOverridesCount: number;
}

/**
 * Scenario definition
 */
export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  parentScenarioId?: ScenarioId;
  baselineVersionId: VersionId;
  assumptions: Assumption[];
  entityOverrides: EntityOverride[];
  relationshipOverrides: RelationshipOverride[];
  appliedDecisions: AppliedDecision[];
  latestSimulationId?: string;
  versionHistory: ScenarioVersion[];
  status: 'draft' | 'active' | 'archived' | 'completed';
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  tags: string[];
}

/**
 * Resolved entity in scenario context (baseline + overrides)
 */
export interface ResolvedEntity {
  id: EntityId;
  type: string;
  name: string;
  description: string;
  properties: Record<string, unknown>;
  state: string;
  criticality: Criticality;
  source: ValueSource;
  verificationStatus: string;
  version: VersionId;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
  scenarioOverrides: EntityOverride[];
}

/**
 * Resolved relationship in scenario context
 */
export interface ResolvedRelationship {
  id: string;
  sourceId: EntityId;
  targetId: EntityId;
  type: string;
  direction: string;
  criticality: Criticality;
  dependencyStrength: string;
  redundancyInfo?: any;
  confidence: number;
  evidence: any[];
  properties: Record<string, unknown>;
  version: VersionId;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  scenarioOverrides: RelationshipOverride[];
}

/**
 * Full scenario context for simulation
 */
export interface ScenarioContext {
  scenario: Scenario;
  baselineEntities: Map<EntityId, ResolvedEntity>;
  baselineRelationships: Map<string, ResolvedRelationship>;
  resolvedEntities: Map<EntityId, ResolvedEntity>;
  resolvedRelationships: Map<string, ResolvedRelationship>;
  outboundEdges: Map<EntityId, string[]>;
  inboundEdges: Map<EntityId, string[]>;
}