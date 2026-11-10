// packages/engine/src/simulation/propagation.ts

import {
  RelationshipType,
  DependencyStrength,
  Criticality,
  EntityId,
  RelationshipId,
} from '../../entities/types';
import { Relationship, PropagationRule, PropagationContext, RedundancyInfo } from '../../relationships/types';
import { SimulationExecutionContext, AffectedEntity, DependencyPathStep, FrontierItem, SimulationDecision } from '../engine/types';

/**
 * Default propagation rules for each relationship type
 */
export const PROPAGATION_RULES: PropagationRule[] = [
  // Organizational
  {
    relationshipType: 'belongs_to',
    baseFactor: 0.8,
    reverseFlow: true,
    calculateFactor: (rel, ctx) => rel.dependencyStrength === 'hard' ? 0.9 : 0.5,
  },
  {
    relationshipType: 'manages',
    baseFactor: 0.6,
    reverseFlow: true,
    calculateFactor: () => 0.5,
  },
  {
    relationshipType: 'owns',
    baseFactor: 0.9,
    reverseFlow: false,
    calculateFactor: (rel) => rel.dependencyStrength === 'hard' ? 0.95 : 0.7,
  },

  // Project & Process
  {
    relationshipType: 'depends_on',
    baseFactor: 1.0,
    reverseFlow: false,
    calculateFactor: (rel) => rel.dependencyStrength === 'hard' ? 1.0 : 0.6,
  },
  {
    relationshipType: 'blocks',
    baseFactor: 1.0,
    reverseFlow: false,
    calculateFactor: () => 1.0,
  },
  {
    relationshipType: 'feeds',
    baseFactor: 0.8,
    reverseFlow: false,
    calculateFactor: () => 0.8,
  },

  // System & Infrastructure
  {
    relationshipType: 'runs_on',
    baseFactor: 1.0,
    reverseFlow: true,
    calculateFactor: (rel) => calculateRunsOnFactor(rel),
  },
  {
    relationshipType: 'hosts',
    baseFactor: 0.7,
    reverseFlow: false,
    calculateFactor: () => 0.7,
  },
  {
    relationshipType: 'connects_to',
    baseFactor: 0.5,
    reverseFlow: true,
    calculateFactor: () => 0.5,
  },
  {
    relationshipType: 'supplied_by',
    baseFactor: 0.6,
    reverseFlow: true,
    calculateFactor: () => 0.6,
  },

  // Location
  {
    relationshipType: 'located_at',
    baseFactor: 0.4,
    reverseFlow: true,
    calculateFactor: () => 0.4,
  },
  {
    relationshipType: 'serves',
    baseFactor: 0.5,
    reverseFlow: false,
    calculateFactor: () => 0.5,
  },

  // Financial
  {
    relationshipType: 'funds',
    baseFactor: 0.9,
    reverseFlow: false,
    calculateFactor: () => 0.9,
  },
  {
    relationshipType: 'allocated_to',
    baseFactor: 0.8,
    reverseFlow: false,
    calculateFactor: () => 0.8,
  },
];

const DEFAULT_PROPAGATION_RULE: PropagationRule = {
  relationshipType: 'custom',
  baseFactor: 0.5,
  reverseFlow: false,
  calculateFactor: () => 0.5,
};

/**
 * Calculate propagation factor for RunsOn relationship considering redundancy
 */
function calculateRunsOnFactor(rel: Relationship): number {
  const redundancy = rel.redundancyInfo;
  if (!redundancy?.hasRedundancy) return 1.0;

  switch (redundancy.redundancyType) {
    case 'active-active':
      return 0.1;
    case 'active-passive':
      return 0.3;
    case 'geo-redundant':
      return 0.15;
    case 'load-balanced':
      return 0.2;
    default:
      return 0.5;
  }
}

/**
 * Apply redundancy mitigation to propagation factor
 */
export function applyRedundancyMitigation(
  factor: number,
  relationship: Relationship,
  sourceImpact: AffectedEntity
): number {
  const redundancy = relationship.redundancyInfo;
  if (!redundancy?.hasRedundancy) return factor;

  let mitigation = 1.0;
  switch (redundancy.redundancyType) {
    case 'active-active':
      mitigation = 0.1;
      break;
    case 'active-passive':
      mitigation = 0.3;
      break;
    case 'geo-redundant':
      mitigation = 0.15;
      break;
    case 'load-balanced':
      mitigation = 0.2;
      break;
    default:
      mitigation = 0.5;
  }

  const capacityFactor = redundancy.failoverCapacityPercent
    ? (1 - redundancy.failoverCapacityPercent / 100)
    : 0.5;

  return factor * mitigation * capacityFactor;
}

/**
 * Get propagation rule for relationship type
 */
export function getPropagationRule(relationshipType: string): PropagationRule {
  return PROPAGATION_RULES.find(r => r.relationshipType === relationshipType) || DEFAULT_PROPAGATION_RULE;
}

/**
 * Create direct impact from decision
 */
export function createDirectImpact(
  entity: any,
  decision: SimulationDecision,
  context: SimulationExecutionContext
): any {
  const severity = calculateImpactSeverity(decision, entity);

  return {
    entityId: entity.id,
    entityType: entity.type,
    entityName: entity.name,
    impactType: 'direct',
    impactSeverity: severity,
    dependencyPath: [],
    triggeringDecisionId: decision.id,
    provenance: {
      triggeringDecision: decision.id,
      affectedEntity: entity.id,
      dependencyPath: [],
      formula: `Direct impact from decision: ${decision.description}`,
      assumptions: [],
      deterministic: true,
      estimated: false,
      confidence: 1.0,
      calculatedAt: Date.now(),
    },
  };
}

/**
 * Create indirect impact from propagation
 */
export function createIndirectImpact(
  targetEntity: any,
  triggeringDecisionId: string,
  path: DependencyPathStep[],
  propagationFactor: number,
  context: SimulationExecutionContext
): any {
  const severity = propagateSeverity(path[path.length - 1]?.sourceEntityId, propagationFactor, context);

  return {
    entityId: targetEntity.id,
    entityType: targetEntity.type,
    entityName: targetEntity.name,
    impactType: 'indirect',
    impactSeverity: severity,
    dependencyPath: path,
    triggeringDecisionId,
    provenance: {
      triggeringDecision: triggeringDecisionId,
      affectedEntity: targetEntity.id,
      dependencyPath: path,
      formula: `Propagated impact via ${path.map(p => p.relationshipType).join(' → ')} (factor: ${propagationFactor.toFixed(2)})`,
      assumptions: [],
      deterministic: true,
      estimated: false,
      confidence: Math.max(0.5, 1 - path.length * 0.1),
      calculatedAt: Date.now(),
    },
  };
}

/**
 * Calculate impact severity based on decision and entity
 */
function calculateImpactSeverity(decision: any, entity: any): 'low' | 'medium' | 'high' | 'critical' {
  switch (decision.type) {
    case 'budget_change':
      const percentChange = Math.abs(decision.parameters.percentChange || 0);
      if (percentChange > 30) return 'critical';
      if (percentChange > 15) return 'high';
      if (percentChange > 5) return 'medium';
      return 'low';
    case 'system_outage':
      return 'critical';
    case 'replace_system':
      return 'high';
    case 'restructure_department':
      return 'high';
    default:
      return 'medium';
  }
}

/**
 * Propagate severity through dependency path
 */
function propagateSeverity(
  sourceEntityId: string,
  propagationFactor: number,
  context: any
): 'low' | 'medium' | 'high' | 'critical' {
  const sourceImpact = context.affectedEntities.get(sourceEntityId);
  if (!sourceImpact) return 'low';

  const severityOrder = ['low', 'medium', 'high', 'critical'];
  const sourceIndex = severityOrder.indexOf(sourceImpact.impactSeverity);
  const propagatedIndex = Math.max(0, sourceIndex - Math.ceil((1 - propagationFactor) * 3));

  return severityOrder[propagatedIndex];
}

/**
 * Check if new impact is more severe than existing
 */
export function isMoreSevere(newImpact: any, existingImpact: any): boolean {
  const severityOrder = ['low', 'medium', 'high', 'critical'];
  return severityOrder.indexOf(newImpact.impactSeverity) > severityOrder.indexOf(existingImpact.impactSeverity);
}

/**
 * Main propagation algorithm
 */
export function propagateImpacts(context: any): Map<string, any> {
  const frontier: any[] = [];
  const visited = new Map<string, number>();
  const affected = new Map<string, any>();

  // Initialize frontier with directly affected entities from decisions
  for (const decision of context.decisions) {
    for (const targetId of decision.targetEntityIds) {
      const entity = context.entities.get(targetId);
      if (entity) {
        const impact = createDirectImpact(entity, decision, context);
        affected.set(targetId, impact);
        frontier.push({ entityId: targetId, impact, path: [], depth: 0 });
      }
    }

    // BFS propagation
    while (frontier.length > 0) {
      const current = frontier.shift()!;

      // Cycle detection
      const visitCount = visited.get(current.entityId) || 0;
      if (visitCount >= context.maxIterations) {
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

        // Get propagation rule
        const rule = getPropagationRule(relationship.type);

        // Calculate propagation factor
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

        // Create path step
        const newPathStep = {
          relationshipId: relId,
          sourceEntityId: current.entityId,
          targetEntityId: relationship.targetId,
          relationshipType: relationship.type,
          propagationFactor: mitigatedFactor,
          redundancyMitigated: mitigatedFactor < propagationFactor,
        };

        const newPath = [...current.path, newPathStep];
        const existingImpact = affected.get(relationship.targetId);

        if (!existingImpact || isMoreSevere(
          { ...current.impact, entityId: relationship.targetId, impactType: 'indirect', dependencyPath: newPath },
          existingImpact
        )) {
          const newImpact = createIndirectImpact(
            targetEntity,
            current.impact.triggeringDecisionId,
            newPath,
            mitigatedFactor,
            context
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
}

// Re-export types
export * from './types';