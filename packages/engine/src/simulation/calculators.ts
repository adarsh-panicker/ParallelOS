// packages/engine/src/simulation/calculators.ts

import { EntityId, Criticality, DecisionType, ValueSource, EntityType } from '../entities/types';
import {
  SimulationContext,
  AffectedEntity,
  BudgetDelta,
  BudgetDeltaItem,
  ResourceShortage,
  ProjectImpact,
  ResourceGap,
  ProcessDisruption,
  MitigationEffect,
  ProvenanceRecord,
  SimEntity,
} from './types';
import { createProvenanceRecord } from './provenance';

/**
 * Budget Calculator
 */
export function calculateBudgetImpacts(context: SimulationContext): BudgetDelta[] {
  const deltas: BudgetDelta[] = [];
  const budgetEntities = Array.from(context.entities.values())
    .filter(e => e.type === EntityType.Budget);
  
  for (const budget of budgetEntities) {
    const baselineAmount = safeGetNumber(budget.properties.totalAmount);
    let projectedAmount = baselineAmount;
    const breakdown: BudgetDeltaItem[] = [];
    
    // Apply direct budget change decisions
    for (const decision of context.decisions) {
      if (decision.type === DecisionType.BudgetChange) {
        const targetBudgetId = decision.parameters.budgetId as EntityId | undefined;
        if (targetBudgetId && targetBudgetId === budget.id) {
          const percentChange = safeGetNumber(decision.parameters.percentChange);
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
    }
    
    // Propagate from affected projects/departments
    const fundedEntities = Array.from(context.entities.values())
      .filter(e => safeGetString(e.properties.budgetId) === budget.id);
    
    for (const entity of fundedEntities) {
      const impact = context.affectedEntities.get(entity.id);
      if (impact && impact.impactSeverity !== Criticality.Low) {
        const severityMultiplier = getSeverityMultiplier(impact.impactSeverity);
        const entityBudget = safeGetNumber(entity.properties.allocatedBudget);
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
    
    const provenance = createProvenanceRecord('budget_calculation', budget.id, {
      formula: 'baseline + direct_changes + propagated_impacts',
      assumptions: breakdown.flatMap(b => b.assumptionRefs).map(id => 
        createAssumptionRef(id, '', null, ValueSource.Assumed)
      ),
      deterministic: breakdown.every(b => b.assumptionRefs.length === 0),
      triggeringDecision: context.decisions[0]?.id || '',
      dependencyPath: [],
    });
    
    deltas.push({
      budgetId: budget.id,
      budgetName: budget.name,
      baselineAmount,
      projectedAmount,
      delta: projectedAmount - baselineAmount,
      deltaPercent: baselineAmount > 0 ? ((projectedAmount - baselineAmount) / baselineAmount) * 100 : 0,
      breakdown,
      provenance,
    });
  }
  
  return deltas;
}

/**
 * Resource Calculator
 */
export function calculateResourceImpacts(context: SimulationContext): ResourceShortage[] {
  const shortages: ResourceShortage[] = [];
  const resourceEntities = Array.from(context.entities.values())
    .filter(e => e.type === EntityType.Resource);
  
  for (const resource of resourceEntities) {
    const totalCapacity = safeGetNumber(resource.properties.totalCapacity);
    const reservedCapacity = safeGetNumber(resource.properties.reservedCapacity);
    const availableCapacity = totalCapacity - reservedCapacity;
    let projectedUsage = reservedCapacity;
    
    // Calculate projected usage from affected consumers
    for (const [entityId, impact] of context.affectedEntities.entries()) {
      if (impact.impactType === 'direct' || impact.impactSeverity >= Criticality.Medium) {
        const entity = context.entities.get(entityId);
        if (!entity) continue;
        
        const required = safeGetNumber((entity.properties.requiredResources as Record<string, number> | undefined)?.[resource.id]);
        if (required > 0) {
          const severityMultiplier = getSeverityMultiplier(impact.impactSeverity);
          projectedUsage += required * severityMultiplier;
        }
      }
    }
    
    const utilization = totalCapacity > 0 ? projectedUsage / totalCapacity : 0;
    const shortfall = Math.max(0, projectedUsage - availableCapacity);
    
    if (shortfall > 0 || utilization > 0.85) {
      const affectedConsumers = Array.from(context.affectedEntities.entries())
        .filter(([eid]) => {
          const e = context.entities.get(eid);
          return e && safeGetNumber((e.properties.requiredResources as Record<string, number> | undefined)?.[resource.id]) > 0;
        })
        .map(([eid]) => eid);
      
      shortages.push({
        resourceId: resource.id,
        resourceName: resource.name,
        resourceType: safeGetString(resource.properties.resourceType),
        currentUtilization: reservedCapacity / totalCapacity,
        projectedUtilization: utilization,
        shortfall,
        affectedEntities: affectedConsumers,
        provenance: createProvenanceRecord('resource_calculation', resource.id, {
          formula: 'reserved + sum(affected_consumer_requirements * severity_multiplier)',
          assumptions: [],
          deterministic: true,
          triggeringDecision: context.decisions[0]?.id || '',
          dependencyPath: [],
        }),
      });
    }
  }
  
  return shortages;
}

/**
 * Project Calculator
 */
export function calculateProjectImpacts(context: SimulationContext): ProjectImpact[] {
  const impacts: ProjectImpact[] = [];
  const projectEntities = Array.from(context.entities.values())
    .filter(e => e.type === EntityType.Project);
  
  for (const project of projectEntities) {
    const directImpact = context.affectedEntities.get(project.id);
    let delayRisk: ProjectImpact['delayRisk'] = 'none';
    let estimatedDelayDays: number | 'unknown' = 0;
    const resourceGaps: ResourceGap[] = [];
    let budgetImpact = 0;
    
    // Direct impact
    if (directImpact) {
      delayRisk = mapSeverityToDelayRisk(directImpact.impactSeverity);
      estimatedDelayDays = estimateDelayDays(directImpact.impactSeverity, project);
    }
    
    // Indirect impacts from dependencies
    const dependencyImpacts = getDependencyImpacts(project.id, context.affectedEntities, context.entities);
    for (const depImpact of dependencyImpacts) {
      const risk = mapSeverityToDelayRisk(depImpact.impactSeverity);
      if (severityOrder(risk) > severityOrder(delayRisk)) {
        delayRisk = risk;
      }
      const depDelay = estimateDelayDays(depImpact.impactSeverity, project);
      estimatedDelayDays = combineDelays(estimatedDelayDays, depDelay);
    }
    
    // Resource gaps
    const projectResources = (project.properties.requiredResources as Record<string, number>) || {};
    for (const [resourceId, required] of Object.entries(projectResources)) {
      const resource = context.entities.get(resourceId as EntityId);
      if (!resource) continue;
      
      const available = safeGetNumber(resource.properties.availableCapacity);
      if (required > available) {
        resourceGaps.push({
          resourceType: safeGetString(resource.properties.resourceType),
          required,
          available,
          shortfall: required - available,
          criticality: required > available * 1.5 ? Criticality.Critical : Criticality.High,
        });
      }
    }
    
    // Budget impact (would come from budget deltas)
    const budgetId = safeGetString(project.properties.budgetId);
    if (budgetId) {
      budgetImpact = 0; // Placeholder - would calculate from budget deltas
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
        triggeringDecision: context.decisions[0]?.id || '',
        dependencyPath: [],
      }),
    });
  }
  
  return impacts;
}

/**
 * Process Calculator
 */
export function calculateProcessImpacts(context: SimulationContext): ProcessDisruption[] {
  const disruptions: ProcessDisruption[] = [];
  const processEntities = Array.from(context.entities.values())
    .filter(e => e.type === EntityType.BusinessProcess);
  
  for (const process of processEntities) {
    const directImpact = context.affectedEntities.get(process.id);
    let disruptionLevel: ProcessDisruption['disruptionLevel'] = 'none';
    const affectedSystems: EntityId[] = [];
    let workaroundAvailable = false;
    
    // Check critical systems
    const criticalSystems = (safeGetArray(process.properties.criticalSystems) as EntityId[]) || [];
    for (const systemId of criticalSystems) {
      const systemImpact = context.affectedEntities.get(systemId);
      const system = context.entities.get(systemId);
      if (systemImpact && system) {
        affectedSystems.push(systemId);
        const redundancyLevel = safeGetString(system.properties.redundancyLevel);
        if (redundancyLevel === 'none') {
          disruptionLevel = 'critical';
        } else if (redundancyLevel === 'active-passive' && disruptionLevel !== 'critical') {
          disruptionLevel = 'major';
        } else if (disruptionLevel === 'none') {
          disruptionLevel = 'minor';
        }
        workaroundAvailable = redundancyLevel !== 'none';
      }
    }
    
    // Check dependency impacts
    const dependencyImpacts = getDependencyImpacts(process.id, context.affectedEntities, context.entities);
    for (const depImpact of dependencyImpacts) {
      if (depImpact.impactSeverity >= Criticality.High && disruptionLevel !== 'critical') {
        disruptionLevel = 'major';
      }
    }
    
    // Direct impact can also cause disruption
    if (directImpact && directImpact.impactSeverity >= Criticality.High) {
      if (directImpact.impactSeverity === Criticality.Critical) {
        disruptionLevel = 'critical';
      } else if (disruptionLevel === 'none') {
        disruptionLevel = 'major';
      }
    }
    
    // Estimate recovery time
    let estimatedRecoveryTimeMs: number | 'unknown' = 'unknown';
    if (disruptionLevel !== 'none') {
      const baseRecovery: Record<ProcessDisruption['disruptionLevel'], number> = {
        minor: 3600000,      // 1 hour
        major: 14400000,     // 4 hours
        critical: 86400000,  // 24 hours
        halted: 604800000,   // 1 week
        none: 0,
      };
      
      const hasRedundancy = criticalSystems.some(sid => {
        const sys = context.entities.get(sid);
        return sys && safeGetString(sys.properties.redundancyLevel) !== 'none';
      });
      estimatedRecoveryTimeMs = hasRedundancy ? baseRecovery[disruptionLevel] * 0.3 : baseRecovery[disruptionLevel];
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
        triggeringDecision: context.decisions[0]?.id || '',
        dependencyPath: [],
      }),
    });
  }
  
  return disruptions;
}

/**
 * Mitigation Calculator (placeholder)
 */
export function calculateMitigationEffects(context: SimulationContext): MitigationEffect[] {
  // In a full implementation, this would analyze potential mitigations
  // For now, return empty array
  return [];
}

/**
 * Helper functions
 */
function safeGetNumber(val: unknown): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function safeGetString(val: unknown): string {
  if (typeof val === 'string') return val;
  return '';
}

function safeGetArray(val: unknown): unknown[] {
  if (Array.isArray(val)) return val;
  return [];
}

function getSeverityMultiplier(severity: Criticality): number {
  switch (severity) {
    case Criticality.Low: return 0.05;
    case Criticality.Medium: return 0.15;
    case Criticality.High: return 0.35;
    case Criticality.Critical: return 0.6;
  }
}

function mapSeverityToDelayRisk(severity: Criticality): ProjectImpact['delayRisk'] {
  switch (severity) {
    case Criticality.Low: return 'low';
    case Criticality.Medium: return 'medium';
    case Criticality.High: return 'high';
    case Criticality.Critical: return 'critical';
  }
}

function severityOrder(risk: ProjectImpact['delayRisk']): number {
  const order = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
  return order[risk];
}

function estimateDelayDays(severity: Criticality, project: SimEntity): number | 'unknown' {
  const baseDays = {
    [Criticality.Low]: 1,
    [Criticality.Medium]: 5,
    [Criticality.High]: 15,
    [Criticality.Critical]: 30,
  }[severity];
  
  // Adjust for project duration
  const projectDuration = safeGetNumber(project.properties.endDate) - safeGetNumber(project.properties.startDate);
  const durationWeeks = projectDuration / (7 * 24 * 60 * 60 * 1000);
  const factor = Math.min(2, Math.max(0.5, durationWeeks / 12));
  
  return Math.round(baseDays * factor);
}

function combineDelays(d1: number | 'unknown', d2: number | 'unknown'): number | 'unknown' {
  if (d1 === 'unknown' || d2 === 'unknown') return 'unknown';
  return Math.max(d1, d2); // Take the worst case
}

function getDependencyImpacts(
  entityId: EntityId,
  affectedEntities: Map<EntityId, AffectedEntity>,
  entities: Map<EntityId, SimEntity>
): AffectedEntity[] {
  // In a full implementation, this would trace back through relationships
  // For now, return direct impacts only
  const impact = affectedEntities.get(entityId);
  return impact ? [impact] : [];
}

function createAssumptionRef(id: string, key: string, value: unknown, source: ValueSource) {
  return { assumptionId: id, key, value, source };
}