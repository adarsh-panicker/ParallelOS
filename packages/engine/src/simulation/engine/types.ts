// packages/engine/src/simulation/engine/types.ts

import {
  Entity,
  EntityId,
  Relationship,
  RelationshipId,
  EntityType,
  ValueSource,
  Criticality,
  DecisionType,
  ScenarioId,
  VersionId,
} from '../../entities/types';
import { ScenarioContext } from '../../scenario/engine/types';

/**
 * Simulation decision - represents a user action that triggers simulation
 */
export interface SimulationDecision {
  id: string;
  type: DecisionType;
  targetEntityIds: EntityId[];
  parameters: Record<string, unknown>;
  description: string;
  timestamp: number;
}

/**
 * Result of a simulation run
 */
export interface SimulationResult {
  id: string;
  scenarioId: ScenarioId;
  decisions: SimulationDecision[];
  affectedEntities: AffectedEntity[];
  projectImpacts: ProjectImpact[];
  budgetDeltas: BudgetDelta[];
  resourceShortages: ResourceShortage[];
  processDisruptions: ProcessDisruption[];
  unresolvedDependencies: UnresolvedDependency[];
  executedAt: number;
  executionTimeMs: number;
  deterministic: boolean;
  warnings: string[];
}

/**
 * Entity affected by simulation
 */
export interface AffectedEntity {
  entityId: EntityId;
  entityType: string;
  entityName: string;
  impactType: 'direct' | 'indirect';
  impactSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  dependencyPath: DependencyPathStep[];
  triggeringDecisionId: string;
  provenance: ProvenanceRecord;
}

/**
 * Step in dependency propagation path
 */
export interface DependencyPathStep {
  relationshipId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  propagationFactor: number;
  redundancyMitigated: boolean;
}

/**
 * Provenance record for traceability
 */
export interface ProvenanceRecord {
  triggeringDecision: string;
  affectedEntity: string;
  dependencyPath: DependencyPathStep[];
  formula: string;
  assumptions: string[];
  deterministic: boolean;
  estimated: boolean;
  confidence: number;
  calculatedAt: number;
}

/**
 * Project impact from simulation
 */
export interface ProjectImpact {
  projectId: EntityId;
  projectName: string;
  delayRisk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  estimatedDelayDays: number | 'unknown';
  budgetImpact: number;
  resourceGaps: ResourceGap[];
  affectedMilestones: string[];
  provenance: ProvenanceRecord;
}

export interface ResourceGap {
  resourceType: string;
  required: number;
  available: number;
  shortfall: number;
  criticality: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Resource shortage from simulation
 */
export interface ResourceShortage {
  resourceId: EntityId;
  resourceName: string;
  resourceType: string;
  currentUtilization: number;
  projectedUtilization: number;
  shortfall: number;
  affectedEntities: EntityId[];
  provenance: ProvenanceRecord;
}

/**
 * Budget delta from simulation
 */
export interface BudgetDelta {
  budgetId: EntityId;
  budgetName: string;
  baselineAmount: number;
  projectedAmount: number;
  delta: number;
  deltaPercent: number;
  breakdown: BudgetDeltaItem[];
  provenance: ProvenanceRecord;
}

export interface BudgetDeltaItem {
  category: string;
  baselineAmount: number;
  projectedAmount: number;
  delta: number;
  assumptionRefs: string[];
}

/**
 * Process disruption from simulation
 */
export interface ProcessDisruption {
  processId: EntityId;
  processName: string;
  disruptionLevel: 'none' | 'minor' | 'major' | 'critical' | 'halted';
  affectedSystems: EntityId[];
  estimatedRecoveryTimeMs: number | 'unknown';
  workaroundAvailable: boolean;
  provenance: ProvenanceRecord;
}

/**
 * Unresolved dependency from simulation
 */
export interface UnresolvedDependency {
  sourceEntityId: EntityId;
  targetEntityId: EntityId;
  relationshipType: string;
  reason: 'missing_entity' | 'circular_dependency' | 'insufficient_data' | 'conflicting_overrides';
  impact: 'unknown' | 'blocked' | 'degraded';
}

/**
 * Simulation execution context
 */
export interface SimulationExecutionContext {
  context: ScenarioContext;
  decisions: SimulationDecision[];
  affectedEntities: Map<EntityId, AffectedEntity>;
  provenanceRecords: Map<string, ProvenanceRecord>;
  maxPropagationDepth: number;
  maxIterations: number;
  cycleDetectionEnabled: boolean;
  unknownValueHandling: 'propagate' | 'stop';
}