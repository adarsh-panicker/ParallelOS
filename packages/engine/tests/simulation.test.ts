// packages/engine/tests/simulation.test.ts

import { describe, it, expect, vi } from 'vitest';
import { loadAureliaDemo, buildSimulationContext, runSimulation, validateDecisions, SimulationDecision, DecisionType, EntityId, createEntityId, Criticality, RelationshipType, DependencyStrength } from '../src';

describe('Simulation Engine', () => {
  const demo = loadAureliaDemo();
  
  // Build entity and relationship maps
  const entities = new Map<EntityId, any>();
  const relationships = new Map<string, any>();
  const outboundEdges = new Map<EntityId, string[]>();
  const inboundEdges = new Map<EntityId, string[]>();

  for (const entity of demo.entities) {
    entities.set(entity.id as EntityId, entity);
  }

  for (const rel of demo.relationships) {
    relationships.set(rel.id, rel);
    const outbound = outboundEdges.get(rel.sourceId) || [];
    outbound.push(rel.id);
    outboundEdges.set(rel.sourceId, outbound);
    
    const inbound = inboundEdges.get(rel.targetId) || [];
    inbound.push(rel.id);
    inboundEdges.set(rel.targetId, inbound);
  }

  it('should build simulation context', () => {
    const decisions: SimulationDecision[] = [
      {
        id: 'dec-1',
        type: DecisionType.BudgetChange,
        description: 'Reduce engineering budget by 15%',
        parameters: { percentChange: -15, budgetId: 'budget-eng' },
        targetEntityIds: ['budget-eng' as EntityId],
        timestamp: Date.now(),
      },
    ];

    const context = buildSimulationContext(entities, relationships, outboundEdges, inboundEdges, decisions);
    expect(context.entities.size).toBeGreaterThan(100);
    expect(context.relationships.size).toBeGreaterThan(200);
    expect(context.decisions.length).toBe(1);
    expect(context.maxPropagationDepth).toBe(10);
    expect(context.maxIterations).toBe(100);
  });

  it('should run simulation with budget change decision', async () => {
    const decisions: SimulationDecision[] = [
      {
        id: 'dec-1',
        type: DecisionType.BudgetChange,
        description: 'Reduce engineering budget by 15%',
        parameters: { percentChange: -15, budgetId: 'budget-eng' },
        targetEntityIds: ['budget-eng' as EntityId],
        timestamp: Date.now(),
      },
    ];

    const context = buildSimulationContext(entities, relationships, outboundEdges, inboundEdges, decisions);
    const result = await runSimulation(context);

    expect(result.id).toBeDefined();
    expect(result.decisions.length).toBe(1);
    expect(result.affectedEntities.length).toBeGreaterThan(0);
    expect(result.budgetDeltas.length).toBeGreaterThan(0);
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.deterministic).toBe('boolean');
  });

  it('should propagate budget change to engineering department', async () => {
    const decisions: SimulationDecision[] = [
      {
        id: 'dec-1',
        type: DecisionType.BudgetChange,
        description: 'Reduce engineering budget by 15%',
        parameters: { percentChange: -15, budgetId: 'budget-eng' },
        targetEntityIds: ['budget-eng' as EntityId],
        timestamp: Date.now(),
      },
    ];

    const context = buildSimulationContext(entities, relationships, outboundEdges, inboundEdges, decisions);
    const result = await runSimulation(context);

    // Should affect the budget directly
    const budgetImpact = result.affectedEntities.find(e => e.entityId === 'budget-eng');
    expect(budgetImpact).toBeDefined();
    expect(budgetImpact!.impactType).toBe('direct');
    expect(budgetImpact!.impactSeverity).toBe(Criticality.Medium); // 15% budget change = Medium severity

    // Should have budget delta
    const budgetDelta = result.budgetDeltas.find(b => b.budgetId === 'budget-eng');
    expect(budgetDelta).toBeDefined();
    expect(budgetDelta!.delta).toBeLessThan(0); // Negative delta = reduction
    expect(budgetDelta!.deltaPercent).toBeCloseTo(-15, 0);
  });

  it('should propagate to projects funded by engineering budget', async () => {
    const decisions: SimulationDecision[] = [
      {
        id: 'dec-1',
        type: DecisionType.BudgetChange,
        description: 'Reduce engineering budget by 15%',
        parameters: { percentChange: -15, budgetId: 'budget-eng' },
        targetEntityIds: ['budget-eng' as EntityId],
        timestamp: Date.now(),
      },
    ];

    const context = buildSimulationContext(entities, relationships, outboundEdges, inboundEdges, decisions);
    const result = await runSimulation(context);

    // Should affect projects that depend on engineering budget
    const projectImpacts = result.projectImpacts.filter(p => 
      ['proj-apollo', 'proj-hermes', 'proj-athena', 'proj-zeus'].includes(p.projectId)
    );
    expect(projectImpacts.length).toBeGreaterThan(0);
  });

  it('should validate decisions correctly', () => {
    const validDecisions: SimulationDecision[] = [
      {
        id: 'dec-1',
        type: DecisionType.BudgetChange,
        description: 'Test',
        parameters: { percentChange: -15, budgetId: 'budget-eng' },
        targetEntityIds: ['budget-eng' as EntityId],
        timestamp: Date.now(),
      },
    ];

    const validation = validateDecisions(validDecisions);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should reject invalid budget change', () => {
    const invalidDecisions: SimulationDecision[] = [
      {
        id: 'dec-1',
        type: DecisionType.BudgetChange,
        description: 'Test',
        parameters: { percentChange: -200, budgetId: 'budget-eng' }, // Out of range
        targetEntityIds: ['budget-eng' as EntityId],
        timestamp: Date.now(),
      },
    ];

    const validation = validateDecisions(invalidDecisions);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should reject missing budgetId', () => {
    const invalidDecisions: SimulationDecision[] = [
      {
        id: 'dec-1',
        type: DecisionType.BudgetChange,
        description: 'Test',
        parameters: { percentChange: -15 }, // Missing budgetId
        targetEntityIds: ['budget-eng' as EntityId],
        timestamp: Date.now(),
      },
    ];

    const validation = validateDecisions(invalidDecisions);
    expect(validation.valid).toBe(false);
  });

  it('should reject empty decisions array', () => {
    const validation = validateDecisions([]);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('At least one decision is required');
  });

  it('should reject too many decisions', () => {
    const decisions: SimulationDecision[] = Array.from({ length: 25 }, (_, i) => ({
      id: `dec-${i}`,
      type: DecisionType.BudgetChange,
      description: 'Test',
      parameters: { percentChange: -1, budgetId: 'budget-eng' },
      targetEntityIds: ['budget-eng' as EntityId],
      timestamp: Date.now(),
    }));

    const validation = validateDecisions(decisions);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.includes('Maximum 20'))).toBe(true);
  });

  describe('Provenance Tracking', () => {
    it('should include provenance on all results', async () => {
      const decisions: SimulationDecision[] = [
        {
          id: 'dec-1',
          type: DecisionType.BudgetChange,
          description: 'Reduce engineering budget by 15%',
          parameters: { percentChange: -15, budgetId: 'budget-eng' },
          targetEntityIds: ['budget-eng' as EntityId],
          timestamp: Date.now(),
        },
      ];

      const context = buildSimulationContext(entities, relationships, outboundEdges, inboundEdges, decisions);
      const result = await runSimulation(context);

      // Every affected entity should have provenance
      for (const entity of result.affectedEntities) {
        expect(entity.provenance).toBeDefined();
        expect(entity.provenance.triggeringDecision).toBe('dec-1');
        expect(entity.provenance.formula).toBeDefined();
        expect(typeof entity.provenance.deterministic).toBe('boolean');
        expect(typeof entity.provenance.confidence).toBe('number');
      }

      // Every budget delta should have provenance
      for (const delta of result.budgetDeltas) {
        expect(delta.provenance).toBeDefined();
        expect(delta.provenance.formula).toContain('baseline');
      }
    });
  });
});