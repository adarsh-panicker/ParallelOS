// packages/engine/src/simulation/engine.ts

import { EntityId, SimulationId, DecisionType, VersionId, Criticality, EntityType } from '../entities/types';
import { Relationship } from '../relationships/types';
import {
  SimulationContext,
  SimulationDecision,
  SimulationResult,
  AffectedEntity,
  BudgetDelta,
  ResourceShortage,
  ProjectImpact,
  ProcessDisruption,
  MitigationEffect,
  UnresolvedDependency,
  ProvenanceRecord,
  DependencyPathStep,
} from './types';
import { propagateImpacts } from './propagation';
import { calculateBudgetImpacts, calculateResourceImpacts, calculateProjectImpacts, calculateProcessImpacts, calculateMitigationEffects } from './calculators';
import { createProvenanceRecord } from './provenance';

/**
 * Build simulation context from resolved scenario data
 */
export function buildSimulationContext(
  resolvedEntities: Map<EntityId, any>,
  resolvedRelationships: Map<string, Relationship>,
  outboundEdges: Map<EntityId, string[]>,
  inboundEdges: Map<EntityId, string[]>,
  decisions: SimulationDecision[]
): SimulationContext {
  return {
    entities: resolvedEntities,
    relationships: resolvedRelationships,
    outboundEdges,
    inboundEdges,
    decisions,
    affectedEntities: new Map(),
    provenanceRecords: new Map(),
    maxPropagationDepth: 10,
    maxIterations: 100,
    cycleDetectionEnabled: true,
    unknownValueHandling: 'propagate',
  };
}

/**
 * Main simulation engine entry point
 */
export async function runSimulation(
  context: SimulationContext
): Promise<SimulationResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  
  try {
    // Step 1: Dependency propagation
    const affectedEntities = propagateImpacts(context);
    context.affectedEntities = affectedEntities;
    
    // Step 2: Run domain calculators in parallel (conceptually)
    const [
      budgetDeltas,
      resourceShortages,
      projectImpacts,
      processDisruptions,
      mitigationEffects,
    ] = await Promise.all([
      Promise.resolve(calculateBudgetImpacts(context)),
      Promise.resolve(calculateResourceImpacts(context)),
      Promise.resolve(calculateProjectImpacts(context)),
      Promise.resolve(calculateProcessImpacts(context)),
      Promise.resolve(calculateMitigationEffects(context)),
    ]);
    
    // Step 3: Identify unresolved dependencies
    const unresolvedDependencies = identifyUnresolvedDependencies(context);
    
    // Step 4: Determine if fully deterministic
    const allCalculations = [
      ...budgetDeltas,
      ...resourceShortages,
      ...projectImpacts,
      ...processDisruptions,
      ...mitigationEffects,
    ];
    const deterministic = allCalculations.every(c => c.provenance.deterministic);
    
    // Step 5: Build result
    const result: SimulationResult = {
      id: crypto.randomUUID() as SimulationId,
      scenarioId: '', // Set by caller
      decisions: context.decisions,
      baselineVersionId: '' as VersionId, // Set by caller
      affectedEntities: Array.from(affectedEntities.values()),
      projectImpacts,
      resourceShortages,
      budgetDeltas,
      processDisruptions,
      mitigationEffects,
      unresolvedDependencies,
      executedAt: Date.now(),
      executionTimeMs: Date.now() - startTime,
      deterministic,
      warnings,
    };
    
    return result;
  } catch (error) {
    warnings.push(`Simulation error: ${error instanceof Error ? error.message : String(error)}`);
    
    // Return partial result on error
    return {
      id: crypto.randomUUID() as SimulationId,
      scenarioId: '',
      decisions: context.decisions,
      baselineVersionId: '' as VersionId,
      affectedEntities: Array.from(context.affectedEntities.values()),
      projectImpacts: [],
      resourceShortages: [],
      budgetDeltas: [],
      processDisruptions: [],
      mitigationEffects: [],
      unresolvedDependencies: [],
      executedAt: Date.now(),
      executionTimeMs: Date.now() - startTime,
      deterministic: false,
      warnings,
    };
  }
}

/**
 * Identify unresolved dependencies in the simulation context
 */
function identifyUnresolvedDependencies(context: SimulationContext): UnresolvedDependency[] {
  const unresolved: UnresolvedDependency[] = [];
  
  // Check for missing entities referenced in relationships
  for (const [relId, relationship] of context.relationships.entries()) {
    const sourceExists = context.entities.has(relationship.sourceId);
    const targetExists = context.entities.has(relationship.targetId);
    
    if (!sourceExists) {
      unresolved.push({
        sourceEntityId: relationship.sourceId,
        targetEntityId: relationship.targetId,
        relationshipType: relationship.type,
        reason: 'missing_entity',
        impact: 'unknown',
      });
    }
    if (!targetExists) {
      unresolved.push({
        sourceEntityId: relationship.sourceId,
        targetEntityId: relationship.targetId,
        relationshipType: relationship.type,
        reason: 'missing_entity',
        impact: 'unknown',
      });
    }
  }
  
  // Check for circular dependencies (simplified)
  // In production, would use Tarjan's algorithm or similar
  const visited = new Set<EntityId>();
  const recStack = new Set<EntityId>();
  
  function detectCycles(entityId: EntityId, path: EntityId[]): boolean {
    if (recStack.has(entityId)) {
      // Cycle detected
      const cycleStart = path.indexOf(entityId);
      const cycle = path.slice(cycleStart);
      for (let i = 0; i < cycle.length; i++) {
        const source = cycle[i];
        const target = cycle[(i + 1) % cycle.length];
        unresolved.push({
          sourceEntityId: source,
          targetEntityId: target,
          relationshipType: 'circular',
          reason: 'circular_dependency',
          impact: 'degraded',
        });
      }
      return true;
    }
    
    if (visited.has(entityId)) return false;
    
    visited.add(entityId);
    recStack.add(entityId);
    
    const outboundRels = context.outboundEdges.get(entityId) || [];
    for (const relId of outboundRels) {
      const rel = context.relationships.get(relId);
      if (rel && detectCycles(rel.targetId, [...path, entityId])) {
        return true;
      }
    }
    
    recStack.delete(entityId);
    return false;
  }
  
  for (const entityId of context.entities.keys()) {
    if (!visited.has(entityId)) {
      detectCycles(entityId, []);
    }
  }
  
  return unresolved;
}

/**
 * Validate simulation decisions
 */
export function validateDecisions(decisions: SimulationDecision[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (decisions.length === 0) {
    errors.push('At least one decision is required');
  }
  
  if (decisions.length > 20) {
    errors.push('Maximum 20 decisions per simulation');
  }
  
  for (let i = 0; i < decisions.length; i++) {
    const decision = decisions[i];
    
    if (!decision.id) {
      errors.push(`Decision ${i}: missing id`);
    }
    
    if (!decision.type) {
      errors.push(`Decision ${i}: missing type`);
    }
    
    if (!decision.targetEntityIds || decision.targetEntityIds.length === 0) {
      errors.push(`Decision ${i}: at least one target entity required`);
    }
    
    // Validate decision-specific parameters
    const paramErrors = validateDecisionParameters(decision);
    errors.push(...paramErrors.map(e => `Decision ${i} (${decision.type}): ${e}`));
  }
  
  return { valid: errors.length === 0, errors };
}

function validateDecisionParameters(decision: SimulationDecision): string[] {
  const errors: string[] = [];
  
  switch (decision.type) {
    case DecisionType.BudgetChange:
      if (typeof decision.parameters.percentChange !== 'number') {
        errors.push('percentChange must be a number');
      } else if (decision.parameters.percentChange < -100 || decision.parameters.percentChange > 500) {
        errors.push('percentChange must be between -100 and 500');
      }
      if (!decision.parameters.budgetId) {
        errors.push('budgetId is required');
      }
      break;
      
    case DecisionType.AddLocation:
      if (!decision.parameters.name) errors.push('name is required');
      if (!decision.parameters.address) errors.push('address is required');
      if (!decision.parameters.timezone) errors.push('timezone is required');
      if (typeof decision.parameters.capacity !== 'number') errors.push('capacity must be a number');
      break;
      
    case DecisionType.ReplaceSystem:
      if (!decision.parameters.currentSystemId) errors.push('currentSystemId is required');
      if (!decision.parameters.newSystemName) errors.push('newSystemName is required');
      if (!decision.parameters.newSystemVendorId) errors.push('newSystemVendorId is required');
      if (typeof decision.parameters.migrationDurationDays !== 'number') errors.push('migrationDurationDays must be a number');
      break;
      
    case DecisionType.SystemOutage:
      if (!decision.parameters.systemId) errors.push('systemId is required');
      if (typeof decision.parameters.durationHours !== 'number') errors.push('durationHours must be a number');
      break;
      
    case DecisionType.RestructureDepartment:
      if (!decision.parameters.departmentId) errors.push('departmentId is required');
      break;
      
    case DecisionType.ReallocateResources:
      if (!decision.parameters.fromResourceId) errors.push('fromResourceId is required');
      if (!decision.parameters.toResourceId) errors.push('toResourceId is required');
      if (typeof decision.parameters.amount !== 'number') errors.push('amount must be a number');
      break;
  }
  
  return errors;
}

/**
 * Create simulation decisions from scenario applied decisions
 */
export function createSimulationDecisions(
  appliedDecisions: any[],
  entities: Map<EntityId, any>
): SimulationDecision[] {
  return appliedDecisions.map((ad, index) => ({
    id: ad.id || `decision-${index}`,
    type: ad.type as DecisionType,
    description: ad.description,
    parameters: ad.parameters || {},
    targetEntityIds: resolveTargetEntities(ad, entities),
    timestamp: ad.appliedAt || Date.now(),
  }));
}

function resolveTargetEntities(decision: any, entities: Map<EntityId, any>): EntityId[] {
  // In a full implementation, this would resolve entity references from decision parameters
  // For now, return empty array - caller should provide targetEntityIds
  return decision.targetEntityIds || [];
}