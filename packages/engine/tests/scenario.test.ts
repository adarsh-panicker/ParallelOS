// packages/engine/tests/scenario.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createScenario,
  getScenario,
  listScenarios,
  getScenarioContext,
  applyEntityOverride,
  applyRelationshipOverride,
  addAssumption,
  createScenarioVersion,
  restoreScenarioVersion,
  deleteScenario,
  clearScenarios,
  initializeBaseline,
  getScenarioCount,
  baselineEntities,
  baselineRelationships,
  EntityType,
  ValueSource,
  Criticality,
  EntityState,
  VerificationStatus,
  DecisionType,
  EntityId,
  ScenarioId,
  VersionId,
  RelationshipId,
  Entity,
  Relationship,
  createDepartment,
  createEmployee,
  createProject,
  createBusinessSystem,
  createRelationship,
  belongsTo,
  dependsOn,
  runsOn,
} from '../src';

describe('Scenario Engine', () => {
  let demoEntities: Entity[];
  let demoRelationships: Relationship[];

  beforeEach(() => {
    clearScenarios();
    
    // Create minimal demo data
    const deptEng = createDepartment('Engineering', 'sys', { headcount: 10, budgetId: 'budget-eng' as any });
    deptEng.id = 'dept-eng' as any;
    
    const emp1 = createEmployee('Alice', 'alice@test.com', 'sys', { 
      roleId: 'role-dev' as any, 
      departmentId: deptEng.id, 
      skills: ['TypeScript'], 
      allocation: 100 
    });
    emp1.id = 'emp-1' as any;
    
    const proj1 = createProject('Project Alpha', 'sys', {
      budgetId: 'budget-eng' as any,
      status: 'active',
      progress: 50,
    });
    proj1.id = 'proj-1' as any;
    
    const sys1 = createBusinessSystem('Core System', 'sys', {
      redundancyLevel: 'active-passive',
      criticalProcesses: [],
    });
    sys1.id = 'sys-1' as any;
    
    const asset1 = {
      id: 'asset-1' as any,
      type: 'server' as any,
      name: 'App Server',
      description: '',
      properties: {},
      state: 'active' as any,
      criticality: 'high' as any,
      source: 'assumed' as any,
      verificationStatus: 'unverified' as any,
      version: 'v1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'sys',
      updatedBy: 'sys',
    };
    
    const rel1 = belongsTo('emp-1', 'dept-eng', 'sys');
    const rel2 = dependsOn('proj-1', 'sys-1', 'sys', true);
    const rel3 = runsOn('sys-1', 'asset-1', 'sys', { hasRedundancy: true, redundancyType: 'active-passive', failoverTimeMs: 30000, failoverCapacityPercent: 100, backupEntityIds: [] });
    
    demoEntities = [deptEng, emp1, proj1, sys1, asset1];
    demoRelationships = [rel1, rel2, rel3];
    
    // Initialize baseline
    initializeBaseline(demoEntities, demoRelationships);
  });

  let rel1Id: string;
  let rel2Id: string;
  let rel3Id: string;

  beforeEach(() => {
    // Capture relationship IDs for use in tests
    rel1Id = demoRelationships[0].id;
    rel2Id = demoRelationships[1].id;
    rel3Id = demoRelationships[2].id;
  });

  describe('Scenario CRUD', () => {
    it('should create a new scenario', () => {
      const result = createScenario({
        name: 'Test Scenario',
        description: 'A test scenario',
        baselineVersionId: 'baseline-v1',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Test Scenario');
      expect(result.data?.status).toBe('draft');
    });

    it('should get scenario by ID', () => {
      const createResult = createScenario({
        name: 'Get Test',
        baselineVersionId: 'baseline-v1',
      });
      
      const getResult = getScenario(createResult.data!.id);
      
      expect(getResult.success).toBe(true);
      expect(getResult.data?.id).toBe(createResult.data!.id);
    });

    it('should list all scenarios', () => {
      createScenario({ name: 'Scenario 1', baselineVersionId: 'baseline-v1' });
      createScenario({ name: 'Scenario 2', baselineVersionId: 'baseline-v1' });
      
      const scenarios = listScenarios();
      expect(scenarios.length).toBeGreaterThanOrEqual(2);
    });

    it('should delete (archive) a scenario', () => {
      const createResult = createScenario({ name: 'To Delete', baselineVersionId: 'baseline-v1' });
      const deleteResult = deleteScenario(createResult.data!.id);
      
      expect(deleteResult.success).toBe(true);
      
      const getResult = getScenario(createResult.data!.id);
      expect(getResult.data?.status).toBe('archived');
    });
  });

  describe('Entity Overrides', () => {
    it('should apply entity update override', () => {
      const scenarioResult = createScenario({ name: 'Override Test', baselineVersionId: 'baseline-v1' });
      const scenarioId = scenarioResult.data!.id;
      
      const overrideResult = applyEntityOverride(
        scenarioId,
        'dept-eng',
        'update',
        { name: 'Engineering (Modified)', headcount: 15 }
      );
      
      expect(overrideResult.success).toBe(true);
      
      const contextResult = getScenarioContext(scenarioId);
      expect(contextResult.success).toBe(true);
      
      const dept = contextResult.data?.resolvedEntities.get('dept-eng');
      expect(dept?.name).toBe('Engineering (Modified)');
      expect(dept?.properties.headcount).toBe(15);
    });

    it('should create new entity in scenario', () => {
      const scenarioResult = createScenario({ name: 'New Entity Test', baselineVersionId: 'baseline-v1' });
      const scenarioId = scenarioResult.data!.id;
      
      const overrideResult = applyEntityOverride(
        scenarioId,
        'new-dept' as any,
        'create',
        { 
          type: 'department' as any, 
          name: 'New Department', 
          properties: { headcount: 5, budgetId: 'budget-new' }
        }
      );
      
      expect(overrideResult.success).toBe(true);
      
      const contextResult = getScenarioContext(scenarioId);
      expect(contextResult.success).toBe(true);
      
      // Find the new entity
      const entities = Array.from(contextResult.data!.resolvedEntities.values());
      const newDept = entities.find(e => e.name === 'New Department');
      expect(newDept).toBeDefined();
      expect(newDept?.properties.headcount).toBe(5);
    });

    it('should delete entity in scenario', () => {
      const scenarioResult = createScenario({ name: 'Delete Test', baselineVersionId: 'baseline-v1' });
      const scenarioId = scenarioResult.data!.id;
      
      const overrideResult = applyEntityOverride(scenarioId, 'dept-eng', 'delete');
      
      expect(overrideResult.success).toBe(true);
      
      const contextResult = getScenarioContext(scenarioId);
      const dept = contextResult.data?.resolvedEntities.get('dept-eng');
      expect(dept?.state).toBe('deleted');
    });
  });

  describe('Relationship Overrides', () => {
    it('should apply relationship override', () => {
      const scenarioResult = createScenario({ name: 'Rel Override', baselineVersionId: 'baseline-v1' });
      const scenarioId = scenarioResult.data!.id;
      
      const overrideResult = applyRelationshipOverride(
        scenarioId,
        rel1Id as any,
        'update',
        { criticality: 'critical', dependencyStrength: 'hard' }
      );
      
      expect(overrideResult.success).toBe(true);
      
      const contextResult = getScenarioContext(scenarioId);
      const rel = contextResult.data?.resolvedRelationships.get(rel1Id);
      expect(rel?.criticality).toBe('critical');
      expect(rel?.dependencyStrength).toBe('hard');
    });

    it('should create new relationship', () => {
      const scenarioResult = createScenario({ name: 'New Rel Test', baselineVersionId: 'baseline-v1' });
      const scenarioId = scenarioResult.data!.id;
      
      const overrideResult = applyRelationshipOverride(
        scenarioId,
        'new-rel' as any,
        'create',
        { 
          type: 'depends_on', 
          sourceId: 'proj-1', 
          targetId: 'dept-eng',
          dependencyStrength: 'hard'
        }
      );
      
      expect(overrideResult.success).toBe(true);
      
      const contextResult = getScenarioContext(scenarioId);
      const rels = Array.from(contextResult.data!.resolvedRelationships.values());
      const newRel = rels.find(r => r.sourceId === 'proj-1' && r.targetId === 'dept-eng');
      expect(newRel).toBeDefined();
      expect(newRel?.dependencyStrength).toBe('hard');
    });
  });

  describe('Assumptions', () => {
    it('should add assumption to scenario', () => {
      const scenarioResult = createScenario({ name: 'Assumption Test', baselineVersionId: 'baseline-v1' });
      const scenarioId = scenarioResult.data!.id;
      
      const result = addAssumption(
        scenarioId,
        'budget.cut.percent',
        15,
        'Expected budget reduction percentage',
        'assumed',
        0.8
      );
      
      expect(result.success).toBe(true);
      
      const scenario = getScenario(scenarioId).data;
      expect(scenario?.assumptions.length).toBe(1);
      expect(scenario?.assumptions[0].key).toBe('budget.cut.percent');
      expect(scenario?.assumptions[0].value).toBe(15);
    });
  });

  describe('Scenario Versioning', () => {
    it('should create new version', () => {
      const scenarioResult = createScenario({ name: 'Version Test', baselineVersionId: 'baseline-v1' });
      const scenarioId = scenarioResult.data!.id;
      
      const versionResult = createScenarioVersion(scenarioId, 'Initial version', 'tester');
      
      expect(versionResult.success).toBe(true);
      expect(versionResult.versionId).toBeDefined();
      
      const scenario = getScenario(scenarioId).data;
      expect(scenario?.versionHistory.length).toBe(2); // Initial + new
    });

    it('should restore to previous version', () => {
      const scenarioResult = createScenario({ name: 'Restore Test', baselineVersionId: 'baseline-v1' });
      const scenarioId = scenarioResult.data!.id;
      
      const v1 = createScenarioVersion(scenarioId, 'Version 1', 'tester');
      expect(v1.success).toBe(true);
      
      // Apply some changes
      applyEntityOverride(scenarioId, 'dept-eng', 'update', { name: 'Modified' });
      
      const v2 = createScenarioVersion(scenarioId, 'Version 2', 'tester');
      expect(v2.success).toBe(true);
      
      // Restore to v1
      const restoreResult = restoreScenarioVersion(scenarioId, v1.versionId!);
      expect(restoreResult.success).toBe(true);
      
      const scenario = getScenario(scenarioId).data;
      expect(scenario?.versionHistory.length).toBe(4); // initial + v1 + v2 + restore
    });
  });

  describe('Scenario Context Resolution', () => {
    it('should resolve baseline entities with overrides', () => {
      const scenarioResult = createScenario({ name: 'Context Test', baselineVersionId: 'baseline-v1' });
      const scenarioId = scenarioResult.data!.id;
      
      applyEntityOverride(scenarioId, 'dept-eng', 'update', { name: 'Modified Eng' });
      applyRelationshipOverride(scenarioId, rel1Id as any, 'update', { criticality: 'critical' });
      
      const contextResult = getScenarioContext(scenarioId);
      expect(contextResult.success).toBe(true);
      
      // Check entity override applied
      const dept = contextResult.data?.resolvedEntities.get('dept-eng');
      expect(dept?.name).toBe('Modified Eng');
      expect(dept?.scenarioOverrides.length).toBe(1);
      
      // Check relationship override applied
      const rel = contextResult.data?.resolvedRelationships.get(rel1Id);
      expect(rel?.criticality).toBe('critical');
      expect(rel?.scenarioOverrides.length).toBe(1);
      
      // Check unresolved entities still present
      expect(contextResult.data?.resolvedEntities.has('emp-1')).toBe(true);
      expect(contextResult.data?.resolvedEntities.has('proj-1')).toBe(true);
      expect(contextResult.data?.resolvedEntities.has('sys-1')).toBe(true);
      
      // Check adjacency lists built
      expect(contextResult.data?.outboundEdges.size).toBeGreaterThan(0);
      expect(contextResult.data?.inboundEdges.size).toBeGreaterThan(0);
    });

    it('should include scenario-created entities in context', () => {
      const scenarioResult = createScenario({ name: 'New Entity Context', baselineVersionId: 'baseline-v1' });
      const scenarioId = scenarioResult.data!.id;
      
      applyEntityOverride(scenarioId, 'new-dept' as any, 'create', {
        type: 'department',
        name: 'Brand New Dept',
        properties: { headcount: 3 }
      });
      
      const contextResult = getScenarioContext(scenarioId);
      const entities = Array.from(contextResult.data!.resolvedEntities.values());
      const newDept = entities.find(e => e.name === 'Brand New Dept');
      
      expect(newDept).toBeDefined();
      expect(newDept?.properties.headcount).toBe(3);
      expect(newDept?.scenarioOverrides.length).toBe(1);
    });
  });

  describe('Scenario Isolation', () => {
    it('should isolate scenarios from each other', () => {
      const scenario1 = createScenario({ name: 'Scenario 1', baselineVersionId: 'baseline-v1' }).data!.id;
      const scenario2 = createScenario({ name: 'Scenario 2', baselineVersionId: 'baseline-v1' }).data!.id;
      
      // Modify in scenario 1
      applyEntityOverride(scenario1, 'dept-eng', 'update', { name: 'Scenario 1 Dept' });
      
      // Modify in scenario 2
      applyEntityOverride(scenario2, 'dept-eng', 'update', { name: 'Scenario 2 Dept' });
      
      // Check isolation
      const ctx1 = getScenarioContext(scenario1);
      const ctx2 = getScenarioContext(scenario2);
      
      expect(ctx1.data?.resolvedEntities.get('dept-eng')?.name).toBe('Scenario 1 Dept');
      expect(ctx2.data?.resolvedEntities.get('dept-eng')?.name).toBe('Scenario 2 Dept');
      
      // Baseline unchanged
      expect(baselineEntities.get('dept-eng')?.name).toBe('Engineering');
    });

    it('should not affect baseline when creating new entities', () => {
      const scenarioResult = createScenario({ name: 'New Entity Isolation', baselineVersionId: 'baseline-v1' });
      const scenarioId = scenarioResult.data!.id;
      
      applyEntityOverride(scenarioId, 'brand-new' as any, 'create', {
        type: 'department',
        name: 'Isolated Dept',
      });
      
      // Baseline should not have the new entity
      expect(baselineEntities.has('brand-new' as any)).toBe(false);
      
      // But scenario context should have it
      const contextResult = getScenarioContext(scenarioId);
      const entities = Array.from(contextResult.data!.resolvedEntities.values());
      expect(entities.some(e => e.name === 'Isolated Dept')).toBe(true);
    });
  });
});