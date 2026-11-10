# ParallelOS — Simulation Engine Design

**Version:** 1.0  
**Date:** 2026-11-10  
**Status:** Phase 1 — Architecture & Foundation

---

## 1. Design Principles

1. **Deterministic:** Same inputs → identical outputs. No randomness, no LLM in calculation path.
2. **Provenance-First:** Every result traces to decision, entity, path, formula, assumptions.
3. **Redundancy-Aware:** Dependency propagation respects failover, redundancy, graceful degradation.
4. **Cycle-Safe:** Graph traversal handles cycles with iteration limits and convergence detection.
5. **Unknown over Invented:** Missing data → explicit "unknown" with reason, never fabricated numbers.
6. **Composable:** Calculators for budget, resources, projects, processes are independent and testable.
7. **Auditable:** Full decision → result chain stored for replay and explanation.

---

## 2. Simulation Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIMULATION ENGINE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input: ScenarioOverlay + Decision[]                           │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. CONTEXT CONSTRUCTION                                 │   │
│  │    - Load baseline entities + relationships             │   │
│  │    - Apply scenario overrides (copy-on-write)           │   │
│  │    - Build typed entity maps & adjacency lists          │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 2. DECISION EXPANSION                                   │   │
│  │    - Parse each decision into primitive operations      │   │
│  │    - Identify directly affected entities                │   │
│  │    - Create initial impact frontier                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 3. DEPENDENCY PROPAGATION (Core Algorithm)              │   │
│  │    - BFS/DFS from frontier through relationship graph   │   │
│  │    - Apply propagation rules per relationship type      │   │
│  │    - Respect redundancy, failover, dependency strength  │   │
│  │    - Track visited nodes, detect cycles, limit depth    │   │
│  │    - Accumulate provenance at each step                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 4. DOMAIN CALCULATORS (Parallel, Independent)           │   │
│  │    ├── BudgetCalculator      → BudgetDelta[]            │   │
│  │    ├── ResourceCalculator    → ResourceShortage[]       │   │
│  │    ├── ProjectCalculator     → ProjectImpact[]          │   │
│  │    ├── ProcessCalculator     → ProcessDisruption[]      │   │
│  │    └── MitigationCalculator  → MitigationEffect[]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 5. RESULT AGGREGATION & PROVENANCE FINALIZATION         │   │
│  │    - Merge calculator outputs                           │   │
│  │    - Identify unresolved dependencies                   │   │
│  │    - Validate provenance completeness                   │   │
│  │    - Mark deterministic vs. estimated                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  Output: SimulationResult                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Data Structures

### 3.1 Simulation Context

```typescript
// packages/engine/src/simulation/types.ts

interface SimulationContext {
  // Resolved entity maps (baseline + scenario overrides)
  entities: Map<EntityId, ResolvedEntity>;
  relationships: Map<RelationshipId, ResolvedRelationship>;
  
  // Adjacency for fast traversal
  outboundEdges: Map<EntityId, RelationshipId[]>;
  inboundEdges: Map<EntityId, RelationshipId[]>;
  
  // Decision queue
  decisions: SimulationDecision[];
  
  // Accumulators
  affectedEntities: Map<EntityId, AffectedEntity>;
  provenanceRecords: Map<string, ProvenanceRecord>;
  
  // Configuration
  maxPropagationDepth: number;        // Default: 10
  maxIterations: number;              // Default: 100
  cycleDetectionEnabled: boolean;     // Default: true
  unknownValueHandling: 'propagate' | 'stop'; // Default: 'propagate'
}

interface ResolvedEntity extends BaseEntity {
  // Computed fields for simulation
  effectiveBudget?: number;
  effectiveCapacity?: number;
  effectiveUtilization?: number;
  scenarioOverrides: EntityOverride[];
}

interface ResolvedRelationship extends Relationship {
  // Computed propagation factor based on type, strength, redundancy
  propagationFactor: number;  // 0-1
}
```

---

## 4. Dependency Propagation Algorithm

### 4.1 Propagation Rules by Relationship Type

```typescript
// packages/engine/src/simulation/propagation.ts

interface PropagationRule {
  relationshipType: RelationshipType;
  // Base propagation factor (0-1) before redundancy/strength adjustments
  baseFactor: number;
  // Whether impact flows opposite to relationship direction
  reverseFlow: boolean;
  // Custom propagation logic
  calculateFactor: (rel: ResolvedRelationship, context: PropagationContext) => number;
}

interface PropagationContext {
  sourceImpact: AffectedEntity;
  relationship: ResolvedRelationship;
  targetEntity: ResolvedEntity;
  pathSoFar: DependencyPathStep[];
  globalContext: SimulationContext;
}

// Default propagation rules
const PROPAGATION_RULES: PropagationRule[] = [
  // Organizational
  { relationshipType: RelationshipType.BelongsTo, baseFactor: 0.8, reverseFlow: true,
    calculateFactor: (rel, ctx) => rel.dependencyStrength === DependencyStrength.Hard ? 0.9 : 0.5 },
  
  { relationshipType: RelationshipType.Manages, baseFactor: 0.6, reverseFlow: true,
    calculateFactor: (rel, ctx) => 0.5 },
  
  { relationshipType: RelationshipType.Owns, baseFactor: 0.9, reverseFlow: false,
    calculateFactor: (rel, ctx) => rel.dependencyStrength === DependencyStrength.Hard ? 0.95 : 0.7 },
  
  // Project & Process
  { relationshipType: RelationshipType.DependsOn, baseFactor: 1.0, reverseFlow: false,
    calculateFactor: (rel, ctx) => {
      if (rel.dependencyStrength === DependencyStrength.Hard) return 1.0;
      return 0.6; // Soft dependency = partial impact
    }},
  
  { relationshipType: RelationshipType.Blocks, baseFactor: 1.0, reverseFlow: false,
    calculateFactor: (rel, ctx) => 1.0 },
  
  { relationshipType: RelationshipType.Feeds, baseFactor: 0.8, reverseFlow: false,
    calculateFactor: (rel, ctx) => 0.8 },
  
  // System & Infrastructure
  { relationshipType: RelationshipType.RunsOn, baseFactor: 1.0, reverseFlow: true,
    calculateFactor: (rel, ctx) => {
      // If target (asset) fails, source (system) impact depends on redundancy
      const redundancy = rel.redundancyInfo;
      if (!redundancy?.hasRedundancy) return 1.0;
      if (redundancy.redundancyType === 'active-active') return 0.1;
      if (redundancy.redundancyType === 'active-passive') return 0.3;
      if (redundancy.redundancyType === 'geo-redundant') return 0.15;
      return 0.5;
    }},
  
  { relationshipType: RelationshipType.Hosts, baseFactor: 0.7, reverseFlow: false,
    calculateFactor: (rel, ctx) => 0.7 },
  
  { relationshipType: RelationshipType.ConnectsTo, baseFactor: 0.5, reverseFlow: true,
    calculateFactor: (rel, ctx) => 0.5 },
  
  { relationshipType: RelationshipType.SuppliedBy, baseFactor: 0.6, reverseFlow: true,
    calculateFactor: (rel, ctx) => 0.6 },
  
  // Location
  { relationshipType: RelationshipType.LocatedAt, baseFactor: 0.4, reverseFlow: true,
    calculateFactor: (rel, ctx) => 0.4 },
  
  { relationshipType: RelationshipType.Serves, baseFactor: 0.5, reverseFlow: false,
    calculateFactor: (rel, ctx) => 0.5 },
  
  // Financial
  { relationshipType: RelationshipType.Funds, baseFactor: 0.9, reverseFlow: false,
    calculateFactor: (rel, ctx) => 0.9 },
  
  { relationshipType: RelationshipType.AllocatedTo, baseFactor: 0.8, reverseFlow: false,
    calculateFactor: (rel, ctx) => 0.8 },
];

// Default for unknown types
const DEFAULT_PROPAGATION_RULE: PropagationRule = {
  relationshipType: RelationshipType.Custom,
  baseFactor: 0.5,
  reverseFlow: false,
  calculateFactor: () => 0.5,
};
```

### 4.2 Propagation Algorithm (Pseudocode)

```typescript
// packages/engine/src/simulation/propagation.ts

function propagateImpacts(context: SimulationContext): Map<EntityId, AffectedEntity> {
  const frontier: FrontierItem[] = [];
  const visited = new Map<EntityId, number>(); // entityId -> visit count
  const affected = new Map<EntityId, AffectedEntity>();
  
  // Initialize frontier with directly affected entities from decisions
  for (const decision of context.decisions) {
    for (const targetId of decision.targetEntityIds) {
      const entity = context.entities.get(targetId);
      if (entity) {
        const impact = createDirectImpact(entity, decision);
        affected.set(targetId, impact);
        frontier.push({ entityId: targetId, impact, path: [], depth: 0 });
      }
    }
  }
  
  // BFS propagation
  while (frontier.length > 0) {
    const current = frontier.shift()!;
    
    // Cycle detection
    const visitCount = visited.get(current.entityId) || 0;
    if (visitCount >= context.maxIterations) {
      recordCycleDetected(current.entityId, current.path);
      continue;
    }
    visited.set(current.entityId, visitCount + 1);
    
    // Depth limit
    if (current.depth >= context.maxPropagationDepth) {
      continue;
    }
    
    // Get outbound relationships
    const outboundRelIds = context.outboundEdges.get(current.entityId) || [];
    
    for (const relId of outboundRelIds) {
      const relationship = context.relationships.get(relId);
      if (!relationship) continue;
      
      const targetEntity = context.entities.get(relationship.targetId);
      if (!targetEntity) continue;
      
      // Calculate propagation factor
      const rule = PROPAGATION_RULES.find(r => r.relationshipType === relationship.type) 
                   || DEFAULT_PROPAGATION_RULE;
      
      const propagationFactor = rule.calculateFactor(relationship, {
        sourceImpact: current.impact,
        relationship,
        targetEntity,
        pathSoFar: current.path,
        globalContext: context,
      });
      
      // Apply redundancy mitigation
      const mitigatedFactor = applyRedundancyMitigation(propagationFactor, relationship, current.impact);
      
      if (mitigatedFactor < 0.05) continue; // Threshold: negligible impact
      
      // Create or update affected entity
      const newPathStep: DependencyPathStep = {
        relationshipId: relId,
        sourceEntityId: current.entityId,
        targetEntityId: relationship.targetId,
        relationshipType: relationship.type,
        propagationFactor: mitigatedFactor,
        redundancyMitigated: mitigatedFactor < propagationFactor,
      };
      
      const newPath = [...current.path, newPathStep];
      const existingImpact = affected.get(relationship.targetId);
      
      if (!existingImpact || isMoreSevere(current.impact, existingImpact)) {
        const newImpact = createIndirectImpact(
          targetEntity,
          current.impact.triggeringDecisionId,
          newPath,
          mitigatedFactor
        );
        affected.set(relationship.targetId, newImpact);
        frontier.push({
          entityId: relationship.targetId,
          impact: newImpact,
          path: newPath,
          depth: current.depth + 1,
        });
      }
    }
  }
  
  return affected;
}

function applyRedundancyMitigation(
  factor: number, 
  relationship: ResolvedRelationship, 
  sourceImpact: AffectedEntity
): number {
  const redundancy = relationship.redundancyInfo;
  if (!redundancy?.hasRedundancy) return factor;
  
  // Redundancy reduces impact propagation
  const mitigation = redundancy.redundancyType === 'active-active' ? 0.9 :
                     redundancy.redundancyType === 'active-passive' ? 0.7 :
                     redundancy.redundancyType === 'geo-redundant' ? 0.85 :
                     0.5;
  
  // Failover capacity further reduces impact
  const capacityFactor = redundancy.failoverCapacityPercent ? 
    (1 - redundancy.failoverCapacityPercent / 100) : 0.5;
  
  return factor * mitigation * capacityFactor;
}
```

---

## 5. Domain Calculators

### 5.1 Budget Calculator

```typescript
// packages/engine/src/simulation/calculators/budget.ts

interface BudgetCalculatorInput {
  affectedEntities: Map<EntityId, AffectedEntity>;
  entities: Map<EntityId, ResolvedEntity>;
  decisions: SimulationDecision[];
  context: SimulationContext;
}

function calculateBudgetImpacts(input: BudgetCalculatorInput): BudgetDelta[] {
  const deltas: BudgetDelta[] = [];
  const budgetEntities = Array.from(input.entities.values())
    .filter(e => e.type === EntityType.Budget);
  
  for (const budget of budgetEntities) {
    const baselineAmount = budget.properties.totalAmount as number;
    let projectedAmount = baselineAmount;
    const breakdown: BudgetDeltaItem[] = [];
    
    // Apply direct budget change decisions
    for (const decision of input.decisions) {
      if (decision.type === DecisionType.BudgetChange) {
        const percentChange = decision.parameters.percentChange as number;
        const delta = baselineAmount * (percentChange / 100);
        projectedAmount += delta;
        breakdown.push({
          category: 'Direct Decision',
          baselineAmount,
          projectedAmount: baselineAmount + delta,
          delta,
          assumptionRefs: [],
        });
      }
    }
    
    // Propagate from affected projects/departments
    const fundedEntities = Array.from(input.entities.values())
      .filter(e => e.properties.budgetId === budget.id);
    
    for (const entity of fundedEntities) {
      const impact = input.affectedEntities.get(entity.id);
      if (impact && impact.impactSeverity !== Criticality.Low) {
        // Estimate budget impact based on severity
        const severityMultiplier = {
          [Criticality.Low]: 0.05,
          [Criticality.Medium]: 0.15,
          [Criticality.High]: 0.35,
          [Criticality.Critical]: 0.6,
        }[impact.impactSeverity];
        
        const entityBudget = entity.properties.allocatedBudget as number || 0;
        const delta = entityBudget * severityMultiplier;
        projectedAmount += delta;
        breakdown.push({
          category: `Impact from ${entity.name}`,
          baselineAmount: entityBudget,
          projectedAmount: entityBudget + delta,
          delta,
          assumptionRefs: impact.provenance.assumptions.map(a => a.assumptionId),
        });
      }
    }
    
    deltas.push({
      budgetId: budget.id,
      budgetName: budget.name,
      baselineAmount,
      projectedAmount,
      delta: projectedAmount - baselineAmount,
      deltaPercent: ((projectedAmount - baselineAmount) / baselineAmount) * 100,
      breakdown,
      provenance: createProvenanceRecord('budget_calculation', budget.id, {
        formula: 'baseline + direct_changes + propagated_impacts',
        assumptions: breakdown.flatMap(b => b.assumptionRefs),
        deterministic: breakdown.every(b => b.assumptionRefs.length === 0),
      }),
    });
  }
  
  return deltas;
}
```

### 5.2 Resource Calculator

```typescript
// packages/engine/src/simulation/calculators/resource.ts

function calculateResourceImpacts(input: BudgetCalculatorInput): ResourceShortage[] {
  const shortages: ResourceShortage[] = [];
  const resourceEntities = Array.from(input.entities.values())
    .filter(e => e.type === EntityType.Resource);
  
  for (const resource of resourceEntities) {
    const totalCapacity = resource.properties.totalCapacity as number;
    const reservedCapacity = resource.properties.reservedCapacity as number;
    let availableCapacity = totalCapacity - reservedCapacity;
    
    // Calculate projected utilization from affected projects/processes
    let projectedUsage = reservedCapacity;
    const affectedConsumers = Array.from(input.affectedEntities.entries())
      .filter(([_, impact]) => 
        impact.impactType === 'direct' || impact.impactSeverity >= Criticality.Medium
      );
    
    for (const [entityId, impact] of affectedConsumers) {
      const entity = input.entities.get(entityId);
      if (!entity) continue;
      
      // Check if this entity consumes this resource
      const required = entity.properties.requiredResources?.[resource.id] as number || 0;
      if (required > 0) {
        // Adjust for impact severity
        const severityMultiplier = {
          [Criticality.Low]: 1.0,
          [Criticality.Medium]: 1.2,
          [Criticality.High]: 1.5,
          [Criticality.Critical]: 2.0,
        }[impact.impactSeverity];
        
        projectedUsage += required * severityMultiplier;
      }
    }
    
    const utilization = projectedUsage / totalCapacity;
    const shortfall = Math.max(0, projectedUsage - availableCapacity);
    
    if (shortfall > 0 || utilization > 0.85) {
      shortages.push({
        resourceId: resource.id,
        resourceName: resource.name,
        resourceType: resource.properties.resourceType as string,
        currentUtilization: reservedCapacity / totalCapacity,
        projectedUtilization: utilization,
        shortfall,
        affectedEntities: affectedConsumers.map(([id]) => id),
        provenance: createProvenanceRecord('resource_calculation', resource.id, {
          formula: 'reserved + sum(affected_consumer_requirements * severity_multiplier)',
          assumptions: [],
          deterministic: true,
        }),
      });
    }
  }
  
  return shortages;
}
```

### 5.3 Project Calculator

```typescript
// packages/engine/src/simulation/calculators/project.ts

function calculateProjectImpacts(input: BudgetCalculatorInput): ProjectImpact[] {
  const impacts: ProjectImpact[] = [];
  const projectEntities = Array.from(input.entities.values())
    .filter(e => e.type === EntityType.Project);
  
  for (const project of projectEntities) {
    const directImpact = input.affectedEntities.get(project.id);
    let delayRisk: ProjectImpact['delayRisk'] = 'none';
    let estimatedDelayDays: number | 'unknown' = 0;
    const resourceGaps: ResourceGap[] = [];
    let budgetImpact = 0;
    
    // Direct impact from decisions
    if (directImpact) {
      delayRisk = mapSeverityToDelayRisk(directImpact.impactSeverity);
      estimatedDelayDays = estimateDelayDays(directImpact.impactSeverity, project);
    }
    
    // Indirect impacts from dependencies
    const dependencyImpacts = getDependencyImpacts(project.id, input.affectedEntities, input.entities);
    for (const depImpact of dependencyImpacts) {
      const risk = mapSeverityToDelayRisk(depImpact.impactSeverity);
      if (severityOrder(risk) > severityOrder(delayRisk)) {
        delayRisk = risk;
      }
      estimatedDelayDays = combineDelays(estimatedDelayDays, estimateDelayDays(depImpact.impactSeverity, project));
    }
    
    // Resource gaps
    const projectResources = project.properties.requiredResources as Record<string, number> || {};
    for (const [resourceId, required] of Object.entries(projectResources)) {
      const resource = input.entities.get(resourceId);
      if (!resource) continue;
      
      const available = resource.properties.availableCapacity as number;
      if (required > available) {
        resourceGaps.push({
          resourceType: resource.properties.resourceType as string,
          required,
          available,
          shortfall: required - available,
          criticality: required > available * 1.5 ? Criticality.Critical : Criticality.High,
        });
      }
    }
    
    // Budget impact
    const budgetId = project.properties.budgetId as EntityId | undefined;
    if (budgetId) {
      // Would be calculated from budget deltas
      budgetImpact = 0; // Placeholder
    }
    
    impacts.push({
      projectId: project.id,
      projectName: project.name,
      delayRisk,
      estimatedDelayDays,
      budgetImpact,
      resourceGaps,
      affectedMilestones: [], // Would extract from project properties
      provenance: createProvenanceRecord('project_calculation', project.id, {
        formula: 'max(direct_impact, dependency_impacts) + resource_gaps',
        assumptions: [],
        deterministic: true,
      }),
    });
  }
  
  return impacts;
}
```

### 5.4 Process Calculator

```typescript
// packages/engine/src/simulation/calculators/process.ts

function calculateProcessImpacts(input: BudgetCalculatorInput): ProcessDisruption[] {
  const disruptions: ProcessDisruption[] = [];
  const processEntities = Array.from(input.entities.values())
    .filter(e => e.type === EntityType.BusinessProcess);
  
  for (const process of processEntities) {
    const directImpact = input.affectedEntities.get(process.id);
    let disruptionLevel: ProcessDisruption['disruptionLevel'] = 'none';
    const affectedSystems: EntityId[] = [];
    let workaroundAvailable = false;
    
    // Check critical systems
    const criticalSystems = process.properties.criticalSystems as EntityId[] || [];
    for (const systemId of criticalSystems) {
      const systemImpact = input.affectedEntities.get(systemId);
      const system = input.entities.get(systemId);
      if (systemImpact && system) {
        affectedSystems.push(systemId);
        const systemRedundancy = system.properties.redundancyLevel as string;
        if (systemRedundancy === 'none') {
          disruptionLevel = 'critical';
        } else if (systemRedundancy === 'active-passive' && disruptionLevel !== 'critical') {
          disruptionLevel = 'major';
        } else if (disruptionLevel === 'none') {
          disruptionLevel = 'minor';
        }
        workaroundAvailable = systemRedundancy !== 'none';
      }
    }
    
    // Check dependency impacts
    const dependencyImpacts = getDependencyImpacts(process.id, input.affectedEntities, input.entities);
    for (const depImpact of dependencyImpacts) {
      if (depImpact.impactSeverity >= Criticality.High && disruptionLevel !== 'critical') {
        disruptionLevel = 'major';
      }
    }
    
    // Estimate recovery time
    let estimatedRecoveryTimeMs: number | 'unknown' = 'unknown';
    if (disruptionLevel !== 'none') {
      const baseRecovery = {
        minor: 3600000,      // 1 hour
        major: 14400000,     // 4 hours
        critical: 86400000,  // 24 hours
        halted: 604800000,   // 1 week
      }[disruptionLevel];
      
      // Adjust for redundancy
      const hasRedundancy = criticalSystems.some(sid => {
        const sys = input.entities.get(sid);
        return sys?.properties.redundancyLevel !== 'none';
      });
      estimatedRecoveryTimeMs = hasRedundancy ? baseRecovery * 0.3 : baseRecovery;
    }
    
    disruptions.push({
      processId: process.id,
      processName: process.name,
      disruptionLevel,
      affectedSystems,
      estimatedRecoveryTimeMs,
      workaroundAvailable,
      provenance: createProvenanceRecord('process_calculation', process.id, {
        formula: 'max(system_impacts) adjusted by redundancy',
        assumptions: [],
        deterministic: true,
      }),
    });
  }
  
  return disruptions;
}
```

---

## 6. Provenance Tracking

```typescript
// packages/engine/src/simulation/provenance.ts

function createProvenanceRecord(
  calculationType: string,
  entityId: EntityId,
  details: {
    formula: string;
    assumptions: string[];
    deterministic: boolean;
  }
): ProvenanceRecord {
  return {
    triggeringDecision: '', // Filled by caller
    affectedEntity: entityId,
    dependencyPath: [], // Filled by propagation
    formula: details.formula,
    assumptions: details.assumptions.map(id => ({
      assumptionId: id,
      key: '',
      value: null,
      source: ValueSource.Assumed,
    })),
    deterministic: details.deterministic,
    estimated: !details.deterministic,
    confidence: details.deterministic ? 1.0 : 0.7,
    calculatedAt: Date.now(),
  };
}

// Merge provenance from multiple calculators
function mergeProvenance(records: ProvenanceRecord[]): ProvenanceRecord {
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
```

---

## 7. Handling Unknowns

```typescript
// packages/engine/src/simulation/unknowns.ts

type UnknownReason = 
  | 'missing_entity'
  | 'missing_property'
  | 'missing_relationship'
  | 'circular_dependency'
  | 'insufficient_assumptions'
  | 'unmodeled_scenario';

interface UnknownValue<T> {
  value: T | 'unknown';
  reason?: UnknownReason;
  message?: string;
}

function unknown<T>(reason: UnknownReason, message?: string): UnknownValue<T> {
  return { value: 'unknown', reason, message };
}

function isUnknown<T>(val: UnknownValue<T>): val is { value: 'unknown'; reason: UnknownReason; message?: string } {
  return val.value === 'unknown';
}

// Usage in calculators:
function safeGetProperty<T>(entity: ResolvedEntity, key: string): UnknownValue<T> {
  if (!(key in entity.properties)) {
    return unknown('missing_property', `Property '${key}' not found on entity ${entity.id}`);
  }
  return { value: entity.properties[key] as T };
}

// Propagation with unknowns:
function propagateWithUnknowns(factor: number, unknowns: UnknownValue<any>[]): number {
  if (unknowns.some(isUnknown)) {
    // If any input is unknown, result is unknown
    return NaN; // Special marker for "unknown propagation"
  }
  return factor;
}
```

---

## 8. Simulation Decision Models

```typescript
// packages/engine/src/simulation/decisions.ts

interface DecisionParameterSchema {
  [key: string]: {
    type: 'number' | 'string' | 'boolean' | 'entity_id' | 'entity_id[]';
    required: boolean;
    description: string;
    validation?: (value: any) => boolean;
  };
}

const DECISION_SCHEMAS: Record<DecisionType, DecisionParameterSchema> = {
  [DecisionType.BudgetChange]: {
    percentChange: { type: 'number', required: true, description: 'Percentage change (-100 to 500)' },
    budgetId: { type: 'entity_id', required: true, description: 'Budget entity to modify' },
  },
  [DecisionType.AddLocation]: {
    name: { type: 'string', required: true },
    address: { type: 'string', required: true },
    timezone: { type: 'string', required: true },
    capacity: { type: 'number', required: true },
    infrastructure: { type: 'string', required: false },
  },
  [DecisionType.ReplaceSystem]: {
    currentSystemId: { type: 'entity_id', required: true },
    newSystemName: { type: 'string', required: true },
    newSystemVendorId: { type: 'entity_id', required: true },
    migrationDurationDays: { type: 'number', required: true },
    parallelRunDays: { type: 'number', required: false },
    dataMigrationComplexity: { type: 'string', required: false },
  },
  [DecisionType.SystemOutage]: {
    systemId: { type: 'entity_id', required: true },
    durationHours: { type: 'number', required: true },
    affectedRegions: { type: 'entity_id[]', required: false },
  },
  [DecisionType.RestructureDepartment]: {
    departmentId: { type: 'entity_id', required: true },
    newHeadcount: { type: 'number', required: false },
    budgetChangePercent: { type: 'number', required: false },
    roleChanges: { type: 'string', required: false },
  },
  [DecisionType.ReallocateResources]: {
    fromResourceId: { type: 'entity_id', required: true },
    toResourceId: { type: 'entity_id', required: true },
    amount: { type: 'number', required: true },
  },
  // ... others
};
```

---

## 9. Testing Requirements

| Test Case | Description | Expected |
|-----------|-------------|----------|
| TC-SIM-001 | Single budget cut decision | Direct budget delta, no propagation |
| TC-SIM-002 | Budget cut → department → projects | Budget delta + project delays |
| TC-SIM-003 | System outage with active-active redundancy | Minimal propagation (factor ~0.1) |
| TC-SIM-004 | System outage with no redundancy | Full propagation to dependent processes |
| TC-SIM-005 | Circular dependency (A→B→C→A) | Cycle detected, limited iterations, warning |
| TC-SIM-006 | Unknown property in calculation | Result marked 'unknown' with reason |
| TC-SIM-007 | Multiple decisions same scenario | Combined effects, provenance merged |
| TC-SIM-008 | Soft vs hard dependency | Hard=1.0 factor, Soft=0.6 factor |
| TC-SIM-009 | Provenance completeness check | Every output has triggeringDecision, path, formula |
| TC-SIM-010 | Deterministic flag accuracy | Pure calculations=true, assumption-based=false |

---

## 10. Performance Targets

| Metric | Target |
|--------|--------|
| Demo org (100 entities, 200 relationships) simulation | < 2 seconds |
| Propagation depth 10, 5 decisions | < 500ms |
| Memory usage | < 100 MB |
| Provenance record size per result | < 2 KB |

---

## 11. Integration Points

- **Input:** ScenarioEngine.getResolvedContext(scenarioId) → SimulationContext
- **Output:** SimulationResult stored via StorageAdapter
- **Comparison:** ComparisonEngine consumes SimulationResult[]
- **AI:** Explanation service consumes SimulationResult + ProvenanceRecord[]

---

## 12. Future Extensibility

- Plugin architecture for custom calculators
- Monte Carlo mode for probabilistic simulation (opt-in, labeled)
- Time-series simulation for multi-period scenarios
- What-if sensitivity analysis (parameter sweeps)