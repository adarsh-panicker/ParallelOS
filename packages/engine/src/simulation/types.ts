// packages/engine/src/simulation/types.ts

import { EntityId, SimulationId, DecisionType, Criticality, ValueSource, VersionId, EntityType, RelationshipId } from '../entities/types';
import { DependencyPathStep, Relationship } from '../relationships/types';

/**
 * Simplified entity interface for simulation context
 */
export interface SimEntity {
  id: EntityId;
  type: EntityType;
  name: string;
  properties: Record<string, unknown>;
}

/**
 * Re-export for convenience
 */
export type { DependencyPathStep, Relationship };

/**
 * Simulation decision
 */
export interface SimulationDecision {
  id: string;
  type: DecisionType;
  description: string;
  parameters: Record<string, unknown>;
  targetEntityIds: EntityId[];
  timestamp: number;
}

/**
 * Provenance record for simulation results
 */
export interface ProvenanceRecord {
  triggeringDecision: string;
  affectedEntity: EntityId;
  dependencyPath: DependencyPathStep[];
  formula: string;
  assumptions: AssumptionRef[];
  deterministic: boolean;
  estimated: boolean;
  confidence: number;
  calculatedAt: number;
}

/**
 * Assumption reference in provenance
 */
export interface AssumptionRef {
  assumptionId: string;
  key: string;
  value: unknown;
  source: ValueSource;
}

/**
 * Affected entity in simulation
 */
export interface AffectedEntity {
  entityId: EntityId;
  entityType: string;
  entityName: string;
  impactType: 'direct' | 'indirect';
  impactSeverity: Criticality;
  dependencyPath: DependencyPathStep[];
  triggeringDecisionId: string;
  provenance: ProvenanceRecord;
}

/**
 * Project impact
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
  criticality: Criticality;
}

/**
 * Resource shortage
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
 * Budget delta
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
 * Process disruption
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
 * Mitigation effect
 */
export interface MitigationEffect {
  mitigationId: string;
  description: string;
  targetEntityIds: EntityId[];
  effectiveness: number;
  cost: number;
  provenance: ProvenanceRecord;
}

/**
 * Unresolved dependency
 */
export interface UnresolvedDependency {
  sourceEntityId: EntityId;
  targetEntityId: EntityId;
  relationshipType: string;
  reason: 'missing_entity' | 'circular_dependency' | 'insufficient_data' | 'conflicting_overrides';
  impact: 'unknown' | 'blocked' | 'degraded';
}

/**
 * Simulation result
 */
export interface SimulationResult {
  id: SimulationId;
  scenarioId: string;
  decisions: SimulationDecision[];
  baselineVersionId: VersionId;
  affectedEntities: AffectedEntity[];
  projectImpacts: ProjectImpact[];
  resourceShortages: ResourceShortage[];
  budgetDeltas: BudgetDelta[];
  processDisruptions: ProcessDisruption[];
  mitigationEffects: MitigationEffect[];
  unresolvedDependencies: UnresolvedDependency[];
  executedAt: number;
  executionTimeMs: number;
  deterministic: boolean;
  warnings: string[];
}

/**
 * Simulation context for engine
 */
export interface SimulationContext {
  entities: Map<EntityId, SimEntity>;
  relationships: Map<string, any>;
  outboundEdges: Map<EntityId, string[]>;
  inboundEdges: Map<EntityId, string[]>;
  decisions: SimulationDecision[];
  affectedEntities: Map<EntityId, AffectedEntity>;
  provenanceRecords: Map<string, ProvenanceRecord>;
  maxPropagationDepth: number;
  maxIterations: number;
  cycleDetectionEnabled: boolean;
  unknownValueHandling: 'propagate' | 'stop';
}

/**
 * Frontier item for propagation
 */
export interface FrontierItem {
  entityId: EntityId;
  impact: AffectedEntity;
  path: DependencyPathStep[];
  depth: number;
}