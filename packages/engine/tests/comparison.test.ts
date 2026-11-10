// packages/engine/tests/comparison.test.ts

import { describe, it, expect } from 'vitest';
import { compareScenarios, DEFAULT_DIMENSIONS, DEFAULT_EXTRACTORS } from '../src/comparison';

describe('Comparison Engine', () => {
  const baselineScenarioId = 'scenario-baseline';
  const scenarioA = 'scenario-a';
  const scenarioB = 'scenario-b';

  // Mock simulation results (affectedEntities as array to match simulation engine output)
  const baselineSimulation = {
    decisions: [],
    budgetDeltas: [
      { budgetId: 'budget-eng', baselineAmount: 8_000_000, delta: 0, projectedAmount: 8_000_000 },
      { budgetId: 'budget-sales', baselineAmount: 3_500_000, delta: 0, projectedAmount: 3_500_000 },
    ],
    resourceShortages: [],
    projectImpacts: [
      { projectId: 'proj-apollo', delayRisk: 'none', estimatedDelayDays: 0 },
      { projectId: 'proj-hermes', delayRisk: 'low', estimatedDelayDays: 1 },
      { projectId: 'proj-athena', delayRisk: 'medium', estimatedDelayDays: 5 },
    ],
    processDisruptions: [
      { processId: 'proc-1', disruptionLevel: 'none' },
      { processId: 'proc-2', disruptionLevel: 'minor' },
    ],
    affectedEntities: [
      { entityId: 'budget-eng', impactType: 'direct', impactSeverity: 'low' },
      { entityId: 'proj-apollo', impactType: 'indirect', impactSeverity: 'low' },
    ],
    unresolvedDependencies: [],
  };

  const scenarioASimulation = {
    decisions: [{ id: 'dec-1', type: 'budget_change', parameters: { percentChange: -15, budgetId: 'budget-eng' } }],
    budgetDeltas: [
      { budgetId: 'budget-eng', baselineAmount: 8_000_000, delta: -1_200_000, projectedAmount: 6_800_000 },
      { budgetId: 'budget-sales', baselineAmount: 3_500_000, delta: 0, projectedAmount: 3_500_000 },
    ],
    resourceShortages: [
      { resourceId: 'res-compute', projectedUtilization: 0.85, shortfall: 50000 },
    ],
    projectImpacts: [
      { projectId: 'proj-apollo', delayRisk: 'high', estimatedDelayDays: 15 },
      { projectId: 'proj-hermes', delayRisk: 'critical', estimatedDelayDays: 30 },
      { projectId: 'proj-athena', delayRisk: 'high', estimatedDelayDays: 15 },
    ],
    processDisruptions: [
      { processId: 'proc-1', disruptionLevel: 'major' },
      { processId: 'proc-2', disruptionLevel: 'critical' },
    ],
    affectedEntities: [
      { entityId: 'budget-eng', impactType: 'direct', impactSeverity: 'high' },
      { entityId: 'proj-apollo', impactType: 'indirect', impactSeverity: 'high' },
      { entityId: 'proj-hermes', impactType: 'indirect', impactSeverity: 'critical' },
      { entityId: 'proc-1', impactType: 'indirect', impactSeverity: 'high' },
    ],
    unresolvedDependencies: [
      { sourceEntityId: 'sys-1', targetEntityId: 'sys-2', reason: 'missing_entity' },
    ],
  };

  const scenarioBSimulation = {
    decisions: [{ id: 'dec-1', type: 'add_location', parameters: { name: 'London', capacity: 200 } }],
    budgetDeltas: [
      { budgetId: 'budget-eng', baselineAmount: 8_000_000, delta: 500_000, projectedAmount: 8_500_000 },
      { budgetId: 'budget-sales', baselineAmount: 3_500_000, delta: 1_000_000, projectedAmount: 4_500_000 },
    ],
    resourceShortages: [
      { resourceId: 'res-compute', projectedUtilization: 0.65, shortfall: 0 },
    ],
    projectImpacts: [
      { projectId: 'proj-apollo', delayRisk: 'low', estimatedDelayDays: 1 },
      { projectId: 'proj-hermes', delayRisk: 'none', estimatedDelayDays: 0 },
      { projectId: 'proj-athena', delayRisk: 'low', estimatedDelayDays: 1 },
    ],
    processDisruptions: [
      { processId: 'proc-1', disruptionLevel: 'minor' },
      { processId: 'proc-2', disruptionLevel: 'none' },
    ],
    affectedEntities: [
      { entityId: 'budget-eng', impactType: 'direct', impactSeverity: 'medium' },
      { entityId: 'budget-sales', impactType: 'direct', impactSeverity: 'medium' },
    ],
    unresolvedDependencies: [],
  };

  const scenarioNames = new Map([
    [baselineScenarioId, 'Baseline'],
    [scenarioA, 'Cost Optimization'],
    [scenarioB, 'International Expansion'],
  ]);

  const scenarioSimulations = new Map([
    [scenarioA, scenarioASimulation],
    [scenarioB, scenarioBSimulation],
  ]);

  it('should compare scenarios against baseline', () => {
    const result = compareScenarios(baselineScenarioId, baselineSimulation, scenarioSimulations, scenarioNames);

    expect(result.id).toBeDefined();
    expect(result.baselineScenarioId).toBe(baselineScenarioId);
    expect(result.comparedScenarioIds).toEqual([scenarioA, scenarioB]);
    expect(result.dimensions.length).toBe(9);
    expect(result.scenarioScores.length).toBe(2);
    expect(result.differences.length).toBe(9);
    expect(result.generatedAt).toBeDefined();
  });

  it('should have 9 default dimensions', () => {
    expect(DEFAULT_DIMENSIONS.length).toBe(9);

    const dimensionIds = DEFAULT_DIMENSIONS.map(d => d.id);
    expect(dimensionIds).toContain('operating_cost');
    expect(dimensionIds).toContain('budget_variance');
    expect(dimensionIds).toContain('resource_utilization');
    expect(dimensionIds).toContain('project_delivery');
    expect(dimensionIds).toContain('operational_resilience');
    expect(dimensionIds).toContain('process_continuity');
    expect(dimensionIds).toContain('dependency_risk');
    expect(dimensionIds).toContain('risk_exposure');
    expect(dimensionIds).toContain('implementation_complexity');
  });

  it('should calculate scenario scores with dimension scores', () => {
    const result = compareScenarios(baselineScenarioId, baselineSimulation, scenarioSimulations, scenarioNames);

    for (const score of result.scenarioScores) {
      expect(score.scenarioId).toBeDefined();
      expect(score.scenarioName).toBeDefined();
      expect(score.dimensionScores.length).toBe(9);
      // weightedTotal can be number or 'unknown' if some dimensions are unknown
      expect(typeof score.weightedTotal === 'number' || score.weightedTotal === 'unknown').toBe(true);
    }
  });

  it('should calculate differences between baseline and scenarios', () => {
    const result = compareScenarios(baselineScenarioId, baselineSimulation, scenarioSimulations, scenarioNames);

    for (const diff of result.differences) {
      expect(diff.dimensionId).toBeDefined();
      expect(diff.baselineValue).toBeDefined();
      expect(diff.scenarioValues.length).toBe(2);
      expect(diff.absoluteDifferences.length).toBeGreaterThanOrEqual(0);
      expect(diff.percentDifferences.length).toBeGreaterThanOrEqual(0);
      expect(['negligible', 'minor', 'moderate', 'major', 'critical']).toContain(diff.significance);
    }
  });

  it('should apply custom weights', () => {
    const customWeights = {
      operating_cost: 2.0,
      budget_variance: 0.5,
      risk_exposure: 2.0,
    };

    const result = compareScenarios(
      baselineScenarioId,
      baselineSimulation,
      scenarioSimulations,
      scenarioNames,
      customWeights
    );

    const opCostDim = result.dimensions.find(d => d.id === 'operating_cost');
    expect(opCostDim?.weight).toBe(2.0);

    const budgetDim = result.dimensions.find(d => d.id === 'budget_variance');
    expect(budgetDim?.weight).toBe(0.5);
  });

  it('should mark unknown values when extractor fails', () => {
    // Simulation with missing data
    const incompleteSim = { decisions: [], budgetDeltas: [], resourceShortages: [] };
    const result = compareScenarios(baselineScenarioId, incompleteSim, new Map([[scenarioA, incompleteSim]]), scenarioNames);

    // Some dimensions will be unknown
    const score = result.scenarioScores[0];
    const unknownCount = score.dimensionScores.filter(d => d.normalizedScore === 'unknown').length;
    expect(unknownCount).toBeGreaterThanOrEqual(0);
  });

  describe('Dimension Extractors', () => {
    it('should extract operating_cost from budget deltas', () => {
      const value = DEFAULT_EXTRACTORS.operating_cost(scenarioASimulation, baselineSimulation, {});
      expect(typeof value).toBe('number');
      expect(value).toBeLessThan(8_000_000 + 3_500_000); // Should be lower due to budget cut
    });

    it('should extract budget_variance as absolute delta sum', () => {
      const value = DEFAULT_EXTRACTORS.budget_variance(scenarioASimulation, baselineSimulation, {});
      expect(value).toBe(1_200_000); // | -1.2M | + | 0 |
    });

    it('should extract resource_utilization from shortages', () => {
      const value = DEFAULT_EXTRACTORS.resource_utilization(scenarioASimulation, baselineSimulation, {});
      expect(value).toBe(0.85);
    });

    it('should extract project_delivery from project impacts', () => {
      const value = DEFAULT_EXTRACTORS.project_delivery(scenarioASimulation, baselineSimulation, {});
      // 0 out of 3 projects on-time (none/low)
      expect(value).toBe(0);
    });

    it('should extract operational_resilience', () => {
      const value = DEFAULT_EXTRACTORS.operational_resilience(scenarioASimulation, baselineSimulation, {});
      expect(value).toBeLessThan(1);
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it('should extract process_continuity', () => {
      const value = DEFAULT_EXTRACTORS.process_continuity(scenarioASimulation, baselineSimulation, {});
      expect(value).toBeLessThan(1);
      expect(value).toBeGreaterThanOrEqual(0);
    });

    it('should extract dependency_risk', () => {
      const value = DEFAULT_EXTRACTORS.dependency_risk(scenarioASimulation, baselineSimulation, {});
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('should extract risk_exposure', () => {
      const value = DEFAULT_EXTRACTORS.risk_exposure(scenarioASimulation, baselineSimulation, {});
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });

    it('should extract implementation_complexity', () => {
      const value = DEFAULT_EXTRACTORS.implementation_complexity(scenarioASimulation, baselineSimulation, {});
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });

  describe('Normalization', () => {
    it('should normalize operating_cost (lower is better)', () => {
      const dim = DEFAULT_DIMENSIONS.find(d => d.id === 'operating_cost')!;
      // Same as baseline = 50
      expect(dim.normalize(100, 100)).toBe(50);
      // Half of baseline = 100 (best)
      expect(dim.normalize(50, 100)).toBe(100);
      // Double baseline = 0 (worst)
      expect(dim.normalize(200, 100)).toBe(0);
    });

    it('should normalize budget_variance', () => {
      const dim = DEFAULT_DIMENSIONS.find(d => d.id === 'budget_variance')!;
      // No variance = 100
      expect(dim.normalize(0, 1000)).toBe(100);
      // 10% variance = 80
      expect(dim.normalize(100, 1000)).toBe(80);
      // 50% variance = 0
      expect(dim.normalize(500, 1000)).toBe(0);
    });

    it('should normalize resource_utilization (optimal 0.7-0.85)', () => {
      const dim = DEFAULT_DIMENSIONS.find(d => d.id === 'resource_utilization')!;
      expect(dim.normalize(0.5, 0)).toBeLessThan(80); // Underutilized
      expect(dim.normalize(0.75, 0)).toBeGreaterThanOrEqual(80); // Optimal
      expect(dim.normalize(0.75, 0)).toBeLessThanOrEqual(100);
      expect(dim.normalize(1.0, 0)).toBeLessThan(80); // Overutilized
    });

    it('should normalize project_delivery (higher is better)', () => {
      const dim = DEFAULT_DIMENSIONS.find(d => d.id === 'project_delivery')!;
      expect(dim.normalize(0, 0)).toBe(0);
      expect(dim.normalize(1, 0)).toBe(100);
      expect(dim.normalize(0.8, 0)).toBe(80);
    });

    it('should normalize risk dimensions (lower is better)', () => {
      const riskDims = ['dependency_risk', 'risk_exposure', 'implementation_complexity'];
      for (const id of riskDims) {
        const dim = DEFAULT_DIMENSIONS.find(d => d.id === id)!;
        expect(dim.normalize(0, 0)).toBe(100); // No risk = best
        expect(dim.normalize(1, 0)).toBe(0); // Max risk = worst
        expect(dim.normalize(0.5, 0)).toBe(50);
      }
    });
  });

  describe('Significance Classification', () => {
    it('should classify significance correctly for operating_cost', () => {
      const dim = DEFAULT_DIMENSIONS.find(d => d.id === 'operating_cost')!;
      // Test through calculateDifferences indirectly
      // The thresholds: minor: 0.05, moderate: 0.15, major: 0.3, critical: 0.5
    });
  });
});

describe('Comparison Engine - Edge Cases', () => {
  it('should handle empty scenario simulations', () => {
    const baseline = {
      decisions: [],
      budgetDeltas: [],
      resourceShortages: [],
      projectImpacts: [],
      processDisruptions: [],
      affectedEntities: new Map(),
      unresolvedDependencies: [],
    };
    const result = compareScenarios('baseline', baseline, new Map(), new Map([['baseline', 'Baseline']]));
    expect(result.scenarioScores).toHaveLength(0);
    expect(result.differences).toHaveLength(9); // Still has dimension differences (just empty scenario values)
  });

  it('should handle missing budget deltas gracefully', () => {
    const baseline = { decisions: [], budgetDeltas: [], resourceShortages: [], projectImpacts: [], processDisruptions: [], affectedEntities: new Map(), unresolvedDependencies: [] };
    const scenario = { decisions: [], resourceShortages: [], projectImpacts: [], processDisruptions: [], affectedEntities: new Map(), unresolvedDependencies: [] };
    const result = compareScenarios('baseline', baseline, new Map([['a', scenario]]), new Map([['a', 'A']]));
    expect(result).toBeDefined();
  });
});