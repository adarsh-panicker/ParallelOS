// packages/engine/src/simulation/engine/engine.ts

import {
  Entity,
  EntityId,
  Relationship,
  EntityType,
  ValueSource,
  Criticality,
  DecisionType,
  EntityState,
} from '../../entities/types';
import { Relationship as RelType } from '../../relationships/types';
import {
  SimulationDecision,
  SimulationResult,
  SimulationExecutionContext,
  AffectedEntity,
  DependencyPathStep,
  ProvenanceRecord,
  ProjectImpact,
  ResourceGap,
  ResourceShortage,
  BudgetDelta,
  BudgetDeltaItem,
  ProcessDisruption,
  UnresolvedDependency,
} from './types';
import {
  propagateImpacts,
  createDirectImpact,
  createIndirectImpact,
  isMoreSevere,
  getPropagationRule,
  applyRedundancyMitigation,
} from '../propagation';
import { calculateBudgetImpacts, calculateResourceImpacts, calculateProjectImpacts, calculateProcessImpacts } from '../calculators';
import { createProvenanceRecord, mergeProvenance } from '../provenance';

/**
 * Main simulation engine entry point
 */
export async function runSimulation(
  context: ScenarioContext,
  decisions: SimulationDecision[]
): Promise<SimulationResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  try {
    // Step 1: Build execution context
    const executionContext = buildExecutionContext(context, decisions);

    // Step 2: Propagate impacts through dependency graph
    const affectedEntities = propagateImpacts(executionContext);
    executionContext.affectedEntities = affectedEntities;

    // Step 3: Run domain calculators
    const [
      budgetDeltas,
      resourceShortages,
      projectImpacts,
      processDisruptions,
    ] = await Promise.all([
      calculateBudgetImpacts(executionContext),
      calculateResourceImpacts(executionContext),
      calculateProjectImpacts(executionContext),
      calculateProcessImpacts(executionContext),
    ]);

    // Step 4: Identify unresolved dependencies
    const unresolvedDependencies = identifyUnresolvedDependencies(executionContext);

    // Step 5: Determine if fully deterministic
    const allCalculations = [
      ...budgetDeltas,
      ...resourceShortages,
      ...projectImpacts,
      ...processDisruptions,
    ];
    const deterministic = allCalculations.every(c => c.provenance.deterministic);

    // Step 6: Build result
    const result: SimulationResult = {
      id: generateId(),
      scenarioId: context.scenario.id,
      decisions,
      affectedEntities: Array.from(affectedEntities.values()),
      projectImpacts,
      resourceShortages,
      budgetDeltas,
      processDisruptions,
      unresolvedDependencies,
      executedAt: Date.now(),
      executionTimeMs: Date.now() - startTime,
      deterministic,
      warnings,
    };

    return result;
  } catch (error) {
    warnings.push(`Simulation error: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      id: generateId(),
      scenarioId: context.scenario.id,
      decisions,
      affectedEntities: Array.from(executionContext.affectedEntities.values()),
      projectImpacts: [],
      resourceShortages: [],
      budgetDeltas: [],
      processDisruptions: [],
      unresolvedDependencies: [],
      executedAt: Date.now(),
      executionTimeMs: Date.now() - startTime,
      deterministic: false,
      warnings,
    };
  }
}

/**
 * Build simulation execution context from scenario context
 */
function buildExecutionContext(
  context: ScenarioContext,
  decisions: SimulationDecision[]
): SimulationExecutionContext {
  const entities = new Map<EntityId, any>();
  const relationships = new Map<string, any>();
  const outboundEdges = new Map<EntityId, string[]>();
  const inboundEdges = new Map<EntityId, string[]>();

  // Add resolved entities
  for (const [id, entity] of context.resolvedEntities) {
    entities.set(id, entity);
  }

  // Add resolved relationships
  for (const [id, rel] of context.resolvedRelationships) {
    relationships.set(id, rel);
    
    const outbound = outboundEdges.get(rel.sourceId) || [];
    outbound.push(id);
    outboundEdges.set(rel.sourceId, outbound);

    const inbound = inboundEdges.get(rel.targetId) || [];
    inbound.push(id);
    inboundEdges.set(rel.targetId, inbound);
  }

  return {
    entities,
    relationships,
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
 * Identify unresolved dependencies in the simulation
 */
function identifyUnresolvedDependencies(context: SimulationExecutionContext): UnresolvedDependency[] {
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

  // Check for circular dependencies (simplified detection)
  const visited = new Set<EntityId>();
  const recStack = new Set<EntityId>();

  function detectCycles(entityId: EntityId, path: EntityId[]): boolean {
    if (recStack.has(entityId)) {
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
 * Generate a unique ID
 */
function generateId(): string {
  return crypto.randomUUID();
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
    case 'budget_change':
      if (typeof decision.parameters.percentChange !== 'number') {
        errors.push('percentChange must be a number');
      } else if (decision.parameters.percentChange < -100 || decision.parameters.percentChange > 500) {
        errors.push('percentChange must be between -100 and 500');
      }
      if (!decision.parameters.budgetId) {
        errors.push('budgetId is required');
      }
      break;

    case 'add_location':
      if (!decision.parameters.name) errors.push('name is required');
      if (!decision.parameters.address) errors.push('address is required');
      if (!decision.parameters.timezone) errors.push('timezone is required');
      if (typeof decision.parameters.capacity !== 'number') errors.push('capacity must be a number');
      break;

    case 'replace_system':
      if (!decision.parameters.currentSystemId) errors.push('currentSystemId is required');
      if (!decision.parameters.newSystemName) errors.push('newSystemName is required');
      if (!decision.parameters.newSystemVendorId) errors.push('newSystemVendorId is required');
      if (typeof decision.parameters.migrationDurationDays !== 'number') errors.push('migrationDurationDays must be a number');
      break;

    case 'system_outage':
      if (!decision.parameters.systemId) errors.push('systemId is required');
      if (typeof decision.parameters.durationHours !== 'number') errors.push('durationHours must be a number');
      break;

    case 'restructure_department':
      if (!decision.parameters.departmentId) errors.push('departmentId is required');
      break;

    case 'reallocate_resources':
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
    type: ad.type as any,
    description: ad.description,
    parameters: ad.parameters || {},
    targetEntityIds: resolveTargetEntities(ad, entities),
    timestamp: ad.appliedAt || Date.now(),
  }));
}

function resolveTargetEntities(decision: any, entities: Map<EntityId, any>): EntityId[] {
  return decision.targetEntityIds || [];
}