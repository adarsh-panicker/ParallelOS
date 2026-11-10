// packages/engine/src/comparison/types.ts

import { ScenarioId, SimulationId, ComparisonId, EntityId } from '../entities/types';
import { ProvenanceRecord } from '../simulation/types';

/**
 * Comparison dimension definition
 */
export interface ComparisonDimension {
  id: string;
  name: string;
  description: string;
  weight: number;
  higherIsBetter: boolean;
  normalize: (value: number, baseline: number) => number;
}

/**
 * Per-dimension score for a scenario
 */
export interface DimensionScore {
  dimensionId: string;
  rawValue: number | 'unknown';
  normalizedScore: number | 'unknown';
  label: string;
  provenance: ProvenanceRecord;
}

/**
 * Aggregate score for a scenario
 */
export interface ScenarioScore {
  scenarioId: ScenarioId;
  scenarioName: string;
  dimensionScores: DimensionScore[];
  weightedTotal: number | 'unknown';
}

/**
 * Difference between baseline and scenario
 */
export interface ScenarioDifference {
  dimensionId: string;
  baselineValue: number | 'unknown';
  scenarioValues: { scenarioId: ScenarioId; value: number | 'unknown' }[];
  absoluteDifferences: { scenarioId: ScenarioId; difference: number }[];
  percentDifferences: { scenarioId: ScenarioId; difference: number }[];
  significance: 'negligible' | 'minor' | 'moderate' | 'major' | 'critical';
}

/**
 * Comparison result
 */
export interface ComparisonResult {
  id: ComparisonId;
  baselineScenarioId: ScenarioId;
  comparedScenarioIds: ScenarioId[];
  dimensions: ComparisonDimension[];
  scenarioScores: ScenarioScore[];
  differences: ScenarioDifference[];
  generatedAt: number;
}

/**
 * Default comparison dimensions
 */
export const DEFAULT_DIMENSIONS: ComparisonDimension[] = [
  {
    id: 'operating_cost',
    name: 'Operating Cost',
    description: 'Total projected OPEX',
    weight: 1.0,
    higherIsBetter: false,
    normalize: (value, baseline) => {
      if (baseline === 0) return 50;
      const ratio = value / baseline;
      // Lower is better: 0 ratio = 100, 1 ratio = 50, 2 ratio = 0
      return Math.max(0, Math.min(100, 100 - (ratio - 1) * 50));
    },
  },
  {
    id: 'budget_variance',
    name: 'Budget Variance',
    description: 'Deviation from baseline budget',
    weight: 1.0,
    higherIsBetter: false,
    normalize: (value, baseline) => {
      // value is absolute variance, baseline is baseline budget
      if (baseline === 0) return 50;
      const percent = Math.abs(value) / baseline * 100;
      return Math.max(0, 100 - percent * 2);
    },
  },
  {
    id: 'resource_utilization',
    name: 'Resource Utilization',
    description: 'Average resource utilization efficiency',
    weight: 1.0,
    higherIsBetter: true,
    normalize: (value, baseline) => {
      // value is utilization 0-1, optimal around 0.7-0.8
      const util = value;
      if (util <= 0.7) return util / 0.7 * 80;
      if (util <= 0.85) return 80 + (util - 0.7) / 0.15 * 20;
      return Math.max(0, 100 - (util - 0.85) / 0.15 * 50);
    },
  },
  {
    id: 'project_delivery',
    name: 'Project Delivery',
    description: 'On-time delivery probability',
    weight: 1.0,
    higherIsBetter: true,
    normalize: (value, baseline) => {
      // value is on-time probability 0-1
      return value * 100;
    },
  },
  {
    id: 'operational_resilience',
    name: 'Operational Resilience',
    description: 'Ability to withstand disruptions',
    weight: 1.0,
    higherIsBetter: true,
    normalize: (value, baseline) => {
      // value is resilience score 0-1
      return value * 100;
    },
  },
  {
    id: 'process_continuity',
    name: 'Process Continuity',
    description: 'Business process uptime',
    weight: 1.0,
    higherIsBetter: true,
    normalize: (value, baseline) => {
      // value is uptime 0-1
      return value * 100;
    },
  },
  {
    id: 'dependency_risk',
    name: 'Dependency Risk',
    description: 'Critical dependency exposure',
    weight: 1.0,
    higherIsBetter: false,
    normalize: (value, baseline) => {
      // value is risk score 0-1
      return (1 - value) * 100;
    },
  },
  {
    id: 'risk_exposure',
    name: 'Risk Exposure',
    description: 'Aggregate risk score',
    weight: 1.0,
    higherIsBetter: false,
    normalize: (value, baseline) => {
      // value is risk score 0-1
      return (1 - value) * 100;
    },
  },
  {
    id: 'implementation_complexity',
    name: 'Implementation Complexity',
    description: 'Effort to execute scenario',
    weight: 1.0,
    higherIsBetter: false,
    normalize: (value, baseline) => {
      // value is complexity score 0-1
      return (1 - value) * 100;
    },
  },
];

/**
 * Extract dimension values from simulation results
 */
export interface DimensionExtractor {
  (simulationResult: any, baselineResult: any, context: any): number | 'unknown';
}

export const DEFAULT_EXTRACTORS: Record<string, DimensionExtractor> = {
  operating_cost: (sim, base) => {
    const totalDelta = sim.budgetDeltas?.reduce((sum: number, b: any) => sum + b.delta, 0) || 0;
    const baseCost = base.budgetDeltas?.reduce((sum: number, b: any) => sum + b.baselineAmount, 0) || 1;
    return baseCost + totalDelta;
  },
  budget_variance: (sim) => {
    return sim.budgetDeltas?.reduce((sum: number, b: any) => sum + Math.abs(b.delta), 0) || 0;
  },
  resource_utilization: (sim) => {
    const shortages = sim.resourceShortages || [];
    if (shortages.length === 0) return 0.7;
    const avgUtil = shortages.reduce((sum: number, s: any) => sum + s.projectedUtilization, 0) / shortages.length;
    return avgUtil;
  },
  project_delivery: (sim) => {
    const impacts = sim.projectImpacts || [];
    if (impacts.length === 0) return 1;
    const onTime = impacts.filter((p: any) => p.delayRisk === 'none' || p.delayRisk === 'low').length;
    return onTime / impacts.length;
  },
  operational_resilience: (sim) => {
    // Based on redundancy and unresolved dependencies
    const unresolved = sim.unresolvedDependencies?.length || 0;
    const affectedCritical = sim.affectedEntities?.filter((e: any) => e.impactSeverity === 'critical').length || 0;
    return Math.max(0, 1 - (unresolved * 0.1 + affectedCritical * 0.15));
  },
  process_continuity: (sim) => {
    const disruptions = sim.processDisruptions || [];
    if (disruptions.length === 0) return 1;
    const running = disruptions.filter((d: any) => d.disruptionLevel === 'none' || d.disruptionLevel === 'minor').length;
    return running / disruptions.length;
  },
  dependency_risk: (sim) => {
    const criticalDeps = sim.affectedEntities?.filter((e: any) => 
      e.impactType === 'direct' && e.impactSeverity === 'critical'
    ).length || 0;
    return Math.min(1, criticalDeps * 0.2);
  },
  risk_exposure: (sim) => {
    const criticalCount = sim.affectedEntities?.filter((e: any) => e.impactSeverity === 'critical').length || 0;
    const highCount = sim.affectedEntities?.filter((e: any) => e.impactSeverity === 'high').length || 0;
    return Math.min(1, (criticalCount * 0.3 + highCount * 0.15));
  },
  implementation_complexity: (sim) => {
    const decisionCount = sim.decisions?.length || 0;
    const affectedCount = sim.affectedEntities?.size || 0;
    return Math.min(1, (decisionCount * 0.1 + affectedCount * 0.01));
  },
};