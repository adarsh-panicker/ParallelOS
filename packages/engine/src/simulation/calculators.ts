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
  ProvenanceRecord,
  MitigationEffect,
} from './types';
import { createProvenanceRecord } from './provenance';

/**
 * Budget Calculator
 */
export function calculateBudgetImpacts(context: any): BudgetDelta[] {
  const deltas: BudgetDelta[] = [];
  const budgetEntities = (Array.from(context.entities.values()) as any[])
    .filter((e: any) => e.type === 'budget');

  for (const budget of budgetEntities) {
    const baselineAmount = safeGetNumber(budget.properties.totalAmount);
    let projectedAmount = baselineAmount;
    const breakdown: BudgetDeltaItem[] = [];

    // Apply direct budget change decisions
    for (const decision of context.decisions) {
      if (decision.type === 'budget_change') {
        const targetBudgetId = decision.parameters.budgetId as string;
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
    const fundedEntities = (Array.from(context.affectedEntities.values()) as any[])
      .filter((e: any) => e.impactType === 'direct' || e.impactSeverity !== 'low');

    for (const impact of fundedEntities) {
      const entity = impact.entityId;
      // This is a simplified model - in reality would trace through relationship graph
    }

    // For demo, just show the direct budget change
    const provenance = {
      triggeringDecision: 'budget_change',
      affectedEntity: budget.id,
      dependencyPath: [],
      formula: 'baseline + direct_changes + propagated_impacts',
      assumptions: [],
      deterministic: true,
      estimated: false,
      confidence: 1.0,
      calculatedAt: Date.now(),
    };

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
export function calculateResourceImpacts(context: any): any[] {
  const shortages: any[] = [];
  const resourceEntities = (Array.from(context.entities.values()) as any[])
    .filter((e: any) => e.type === 'resource');

  for (const resource of resourceEntities) {
    const totalCapacity = safeGetNumber(resource.properties.totalCapacity);
    const reservedCapacity = safeGetNumber(resource.properties.reservedCapacity);
    const availableCapacity = totalCapacity - reservedCapacity;
    let projectedUsage = reservedCapacity;

    // Calculate projected usage from affected consumers
    for (const [entityId, impact] of context.affectedEntities.entries()) {
      if (impact.impactType === 'direct' || impact.impactSeverity !== 'low') {
        const entity = context.entities.get(entityId);
        if (!entity) continue;

        const required = safeGetNumber(entity.properties.requiredResources?.[resource.id]);
        if (required > 0) {
          const severityMultiplier = getSeverityMultiplier(impact.impactSeverity);
          projectedUsage += required * severityMultiplier;
        }
      }
    }

    const utilization = totalCapacity > 0 ? projectedUsage / totalCapacity : 0;
    const shortfall = Math.max(0, projectedUsage - availableCapacity);

    if (shortfall > 0 || utilization > 0.85) {
      shortages.push({
        resourceId: resource.id,
        resourceName: resource.name,
        resourceType: resource.properties.resourceType,
        currentUtilization: reservedCapacity / totalCapacity,
        projectedUtilization: utilization,
        shortfall,
        affectedEntities: [], // Would be populated with actual affected entities
        provenance: {
          triggeringDecision: 'resource_calculation',
          affectedEntity: resource.id,
          dependencyPath: [],
          formula: 'reserved + sum(affected_consumer_requirements * severity_multiplier)',
          assumptions: [],
          deterministic: true,
          estimated: false,
          confidence: 1.0,
          calculatedAt: Date.now(),
        },
      });
    }
  }

  return shortages;
}

/**
 * Project Calculator
 */
export function calculateProjectImpacts(context: any): any[] {
  const impacts: any[] = [];
  const projectEntities = (Array.from(context.entities.values()) as any[])
    .filter((e: any) => e.type === 'project');

  for (const project of projectEntities) {
    const directImpact = context.affectedEntities.get(project.id);
    let delayRisk = 'none';
    let estimatedDelayDays: number | 'unknown' = 0;
    const resourceGaps: any[] = [];
    let budgetImpact = 0;

    // Direct impact from decisions
    if (directImpact) {
      delayRisk = mapSeverityToDelayRisk(directImpact.impactSeverity);
      estimatedDelayDays = estimateDelayDays(directImpact.impactSeverity, project);
    }

    // Indirect impacts from dependencies
    // Would trace through dependency graph in full implementation

    // Resource gaps
    const projectResources = (project.properties.requiredResources || {}) as Record<string, any>;
    for (const [resourceId, reqVal] of Object.entries(projectResources)) {
      const resource = context.entities.get(resourceId);
      if (!resource) continue;

      const required = safeGetNumber(reqVal);
      const available = safeGetNumber(resource.properties.availableCapacity);
      if (required > available) {
        resourceGaps.push({
          resourceType: resource.properties.resourceType,
          required,
          available,
          shortfall: required - available,
          criticality: required > available * 1.5 ? 'critical' : 'high',
        });
      }
    }

    // Budget impact (placeholder)
    const budgetId = project.properties.budgetId;
    if (budgetId) {
      budgetImpact = 0; // Would calculate from budget deltas
    }

    impacts.push({
      projectId: project.id,
      projectName: project.name,
      delayRisk,
      estimatedDelayDays,
      budgetImpact,
      resourceGaps,
      affectedMilestones: [],
      provenance: {
        triggeringDecision: '',
        affectedEntity: project.id,
        dependencyPath: [],
        formula: 'max(direct_impact, dependency_impacts) + resource_gaps',
        assumptions: [],
        deterministic: true,
        estimated: false,
        confidence: 1.0,
        calculatedAt: Date.now(),
      },
    });
  }

  return impacts;
}

/**
 * Process Calculator
 */
export function calculateProcessImpacts(context: any): any[] {
  const disruptions: any[] = [];
  const processEntities = (Array.from(context.entities.values()) as any[])
    .filter((e: any) => e.type === 'process' || e.type === 'business_process');

  for (const process of processEntities) {
    const directImpact = context.affectedEntities.get(process.id);
    let disruptionLevel = 'none';
    const affectedSystems: string[] = [];
    let workaroundAvailable = false;

    // Check critical systems
    const criticalSystems = safeGetArray(process.properties.criticalSystems) || [];
    for (const systemId of criticalSystems) {
      const systemImpact = context.affectedEntities.get(systemId);
      const system = context.entities.get(systemId);
      if (systemImpact && system) {
        affectedSystems.push(systemId);
        const redundancyLevel = system.properties.redundancyLevel;
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
    // Would trace through dependency graph in full implementation

    // Direct impact can also cause disruption
    if (directImpact && directImpact.impactSeverity >= 'high') {
      if (directImpact.impactSeverity === 'critical') {
        disruptionLevel = 'critical';
      } else if (disruptionLevel === 'none') {
        disruptionLevel = 'major';
      }
    }

    // Estimate recovery time
    let estimatedRecoveryTimeMs: number | string = 'unknown';
    if (disruptionLevel !== 'none') {
      const recoveryMap: Record<string, number> = {
        minor: 3600000,      // 1 hour
        major: 14400000,     // 4 hours
        critical: 86400000,  // 24 hours
        halted: 604800000,   // 1 week
        none: 0,
      };
      const baseRecovery = recoveryMap[disruptionLevel] ?? 0;

      const hasRedundancy = criticalSystems.some((sid: string) => {
        const sys = context.entities.get(sid);
        return sys && sys.properties.redundancyLevel !== 'none';
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
      provenance: {
        triggeringDecision: '',
        affectedEntity: process.id,
        dependencyPath: [],
        formula: 'max(system_impacts) adjusted by redundancy',
        assumptions: [],
        deterministic: true,
        estimated: false,
        confidence: 1.0,
        calculatedAt: Date.now(),
      },
    });
  }

  return disruptions;
}

// Helper functions
function safeGetNumber(val: unknown): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function safeGetArray(val: unknown): any[] {
  if (Array.isArray(val)) return val;
  return [];
}

function getSeverityMultiplier(severity: string): number {
  switch (severity) {
    case 'low': return 0.05;
    case 'medium': return 0.15;
    case 'high': return 0.35;
    case 'critical': return 0.6;
    default: return 0;
  }
}

function mapSeverityToDelayRisk(severity: string): any {
  switch (severity) {
    case 'low': return 'low';
    case 'medium': return 'medium';
    case 'high': return 'high';
    case 'critical': return 'critical';
  }
}

function severityOrder(risk: string): number {
  const order: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
  return order[risk] ?? 0;
}

function estimateDelayDays(severity: string, project: any): number | 'unknown' {
  const baseDaysMap: Record<string, number> = {
    low: 1,
    medium: 5,
    high: 15,
    critical: 30,
  };
  const baseDays = baseDaysMap[severity] ?? 0;

  const projectDuration = safeGetNumber(project.properties.endDate) - safeGetNumber(project.properties.startDate);
  const durationWeeks = projectDuration / (7 * 24 * 60 * 60 * 1000);
  const factor = Math.min(2, Math.max(0.5, durationWeeks / 12));

  return Math.round(baseDays * factor);
}

/**
 * Mitigation Effects Calculator
 */
export function calculateMitigationEffects(context: any): MitigationEffect[] {
  const mitigations: MitigationEffect[] = [];
  // Placeholder - in a full implementation, this would analyze the simulation results
  // and suggest mitigation strategies for identified risks
  return mitigations;
}

function combineDelays(d1: number | 'unknown', d2: number | 'unknown'): number | 'unknown' {
  if (d1 === 'unknown' || d2 === 'unknown') return 'unknown';
  return Math.max(d1, d2); // Take the worst case
}