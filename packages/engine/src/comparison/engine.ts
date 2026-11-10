// packages/engine/src/comparison/engine.ts

import { ScenarioId, ComparisonId, SimulationId, EntityId } from '../entities/types';
import { ProvenanceRecord } from '../simulation/types';
import {
  ComparisonDimension,
  ComparisonResult,
  ScenarioScore,
  DimensionScore,
  ScenarioDifference,
  DEFAULT_DIMENSIONS,
  DEFAULT_EXTRACTORS,
  DimensionExtractor,
} from './types';

/**
 * Comparison engine
 */
export class ComparisonEngine {
  private dimensions: ComparisonDimension[];
  private extractors: Record<string, DimensionExtractor>;
  
  constructor(
    dimensions: ComparisonDimension[] = DEFAULT_DIMENSIONS,
    extractors: Record<string, DimensionExtractor> = DEFAULT_EXTRACTORS
  ) {
    this.dimensions = dimensions;
    this.extractors = extractors;
  }
  
  /**
   * Compare scenarios against a baseline
   */
  compare(
    baselineScenarioId: ScenarioId,
    baselineSimulation: any,
    scenarioSimulations: Map<ScenarioId, any>,
    scenarioNames: Map<ScenarioId, string>,
    customWeights?: Record<string, number>
  ): ComparisonResult {
    // Apply custom weights
    const dimensions = customWeights 
      ? this.dimensions.map(d => ({ ...d, weight: customWeights[d.id] ?? d.weight }))
      : this.dimensions;
    
    // Extract dimension values for baseline
    const baselineValues = this.extractDimensionValues(baselineSimulation, baselineSimulation);
    
    // Extract dimension values for each scenario
    const scenarioValues = new Map<ScenarioId, Map<string, number | 'unknown'>>();
    for (const [scenarioId, simulation] of scenarioSimulations.entries()) {
      scenarioValues.set(scenarioId, this.extractDimensionValues(simulation, baselineSimulation));
    }
    
    // Calculate scores
    const scenarioScores = this.calculateScores(
      baselineScenarioId,
      scenarioSimulations,
      scenarioNames,
      baselineValues,
      scenarioValues,
      dimensions
    );
    
    // Calculate differences
    const differences = this.calculateDifferences(
      baselineScenarioId,
      scenarioSimulations,
      baselineValues,
      scenarioValues,
      dimensions
    );
    
    return {
      id: crypto.randomUUID() as ComparisonId,
      baselineScenarioId,
      comparedScenarioIds: Array.from(scenarioSimulations.keys()),
      dimensions,
      scenarioScores,
      differences,
      generatedAt: Date.now(),
    };
  }
  
  /**
   * Extract dimension values from simulation result
   */
  private extractDimensionValues(
    simulation: any,
    baseline: any
  ): Map<string, number | 'unknown'> {
    const values = new Map<string, number | 'unknown'>();
    
    for (const dimension of this.dimensions) {
      const extractor = this.extractors[dimension.id];
      if (extractor) {
        try {
          const value = extractor(simulation, baseline, {});
          values.set(dimension.id, value);
        } catch {
          values.set(dimension.id, 'unknown');
        }
      } else {
        values.set(dimension.id, 'unknown');
      }
    }
    
    return values;
  }
  
  /**
   * Calculate normalized scores for each scenario
   */
  private calculateScores(
    baselineScenarioId: ScenarioId,
    scenarioSimulations: Map<ScenarioId, any>,
    scenarioNames: Map<ScenarioId, string>,
    baselineValues: Map<string, number | 'unknown'>,
    scenarioValues: Map<ScenarioId, Map<string, number | 'unknown'>>,
    dimensions: ComparisonDimension[]
  ): ScenarioScore[] {
    const scores: ScenarioScore[] = [];
    
    for (const [scenarioId, simulation] of scenarioSimulations.entries()) {
      const dimScores: DimensionScore[] = [];
      let weightedSum = 0;
      let totalWeight = 0;
      let allKnown = true;
      
      for (const dimension of dimensions) {
        const baselineVal = baselineValues.get(dimension.id);
        const scenarioVal = scenarioValues.get(scenarioId)?.get(dimension.id);
        
        let normalizedScore: number | 'unknown' = 'unknown';
        let label = 'Unknown';
        
        if (typeof scenarioVal === 'number' && typeof baselineVal === 'number') {
          normalizedScore = dimension.normalize(scenarioVal, baselineVal);
          label = this.formatLabel(dimension.id, scenarioVal);
        } else if (typeof scenarioVal === 'number') {
          // No baseline - normalize against reasonable defaults
          normalizedScore = this.normalizeWithoutBaseline(dimension.id, scenarioVal);
          label = this.formatLabel(dimension.id, scenarioVal);
        }
        
        if (normalizedScore === 'unknown') {
          allKnown = false;
        }
        
        dimScores.push({
          dimensionId: dimension.id,
          rawValue: scenarioVal ?? 'unknown',
          normalizedScore,
          label,
          provenance: {
            triggeringDecision: '',
            affectedEntity: '' as EntityId,
            dependencyPath: [],
            formula: `Normalized ${dimension.name}`,
            assumptions: [],
            deterministic: normalizedScore !== 'unknown',
            estimated: normalizedScore === 'unknown',
            confidence: normalizedScore !== 'unknown' ? 1.0 : 0,
            calculatedAt: Date.now(),
          },
        });
        
        if (typeof normalizedScore === 'number') {
          weightedSum += normalizedScore * dimension.weight;
          totalWeight += dimension.weight;
        }
      }
      
      scores.push({
        scenarioId,
        scenarioName: scenarioNames.get(scenarioId) || scenarioId,
        dimensionScores: dimScores,
        weightedTotal: allKnown && totalWeight > 0 ? weightedSum / totalWeight : 'unknown',
      });
    }
    
    return scores;
  }
  
  /**
   * Calculate differences between baseline and scenarios
   */
  private calculateDifferences(
    baselineScenarioId: ScenarioId,
    scenarioSimulations: Map<ScenarioId, any>,
    baselineValues: Map<string, number | 'unknown'>,
    scenarioValues: Map<ScenarioId, Map<string, number | 'unknown'>>,
    dimensions: ComparisonDimension[]
  ): ScenarioDifference[] {
    const differences: ScenarioDifference[] = [];
    
    for (const dimension of dimensions) {
      const baselineVal = baselineValues.get(dimension.id);
      const scenarioVals: { scenarioId: ScenarioId; value: number | 'unknown' }[] = [];
      const absoluteDiffs: { scenarioId: ScenarioId; difference: number }[] = [];
      const percentDiffs: { scenarioId: ScenarioId; difference: number }[] = [];
      
      for (const [scenarioId, values] of scenarioValues.entries()) {
        const scenarioVal = values.get(dimension.id);
        scenarioVals.push({ scenarioId, value: scenarioVal ?? 'unknown' });
        
        if (typeof baselineVal === 'number' && typeof scenarioVal === 'number') {
          const absDiff = scenarioVal - baselineVal;
          const pctDiff = baselineVal !== 0 ? (absDiff / baselineVal) * 100 : 0;
          absoluteDiffs.push({ scenarioId, difference: absDiff });
          percentDiffs.push({ scenarioId, difference: pctDiff });
        }
      }
      
      // Determine significance
      const maxAbsDiff = Math.max(...absoluteDiffs.map(d => Math.abs(d.difference)), 0);
      const significance = this.classifySignificance(maxAbsDiff, dimension.id);
      
      differences.push({
        dimensionId: dimension.id,
        baselineValue: baselineVal ?? 'unknown',
        scenarioValues,
        absoluteDifferences: absoluteDiffs,
        percentDifferences: percentDiffs,
        significance,
      });
    }
    
    return differences;
  }
  
  private normalizeWithoutBaseline(dimensionId: string, value: number): number {
    // Fallback normalization without baseline
    switch (dimensionId) {
      case 'resource_utilization':
        return Math.min(100, value * 100);
      case 'project_delivery':
      case 'operational_resilience':
      case 'process_continuity':
        return value * 100;
      case 'dependency_risk':
      case 'risk_exposure':
      case 'implementation_complexity':
        return (1 - value) * 100;
      default:
        return 50;
    }
  }
  
  private formatLabel(dimensionId: string, value: number): string {
    switch (dimensionId) {
      case 'operating_cost':
      case 'budget_variance':
        return `$${(value / 1e6).toFixed(1)}M`;
      case 'resource_utilization':
      case 'project_delivery':
      case 'operational_resilience':
      case 'process_continuity':
      case 'dependency_risk':
      case 'risk_exposure':
      case 'implementation_complexity':
        return `${(value * 100).toFixed(0)}%`;
      default:
        return value.toFixed(2);
    }
  }
  
  private classifySignificance(
    maxDiff: number,
    dimensionId: string
  ): ScenarioDifference['significance'] {
    // Thresholds vary by dimension
    const thresholds: Record<string, { minor: number; moderate: number; major: number; critical: number }> = {
      operating_cost: { minor: 0.05, moderate: 0.15, major: 0.3, critical: 0.5 },
      budget_variance: { minor: 0.05, moderate: 0.15, major: 0.3, critical: 0.5 },
      resource_utilization: { minor: 0.05, moderate: 0.1, major: 0.2, critical: 0.3 },
      project_delivery: { minor: 0.05, moderate: 0.1, major: 0.2, critical: 0.3 },
      operational_resilience: { minor: 0.05, moderate: 0.1, major: 0.2, critical: 0.3 },
      process_continuity: { minor: 0.05, moderate: 0.1, major: 0.2, critical: 0.3 },
      dependency_risk: { minor: 0.05, moderate: 0.1, major: 0.2, critical: 0.3 },
      risk_exposure: { minor: 0.05, moderate: 0.1, major: 0.2, critical: 0.3 },
      implementation_complexity: { minor: 0.1, moderate: 0.2, major: 0.4, critical: 0.6 },
    };
    
    const t = thresholds[dimensionId] || { minor: 0.1, moderate: 0.2, major: 0.4, critical: 0.6 };
    
    if (maxDiff >= t.critical) return 'critical';
    if (maxDiff >= t.major) return 'major';
    if (maxDiff >= t.moderate) return 'moderate';
    if (maxDiff >= t.minor) return 'minor';
    return 'negligible';
  }
}

/**
 * Convenience function for simple comparisons
 */
export function compareScenarios(
  baselineScenarioId: ScenarioId,
  baselineSimulation: any,
  scenarioSimulations: Map<ScenarioId, any>,
  scenarioNames: Map<ScenarioId, string>,
  customWeights?: Record<string, number>
): ComparisonResult {
  const engine = new ComparisonEngine();
  return engine.compare(baselineScenarioId, baselineSimulation, scenarioSimulations, scenarioNames, customWeights);
}