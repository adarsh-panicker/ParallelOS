// packages/engine/tests/ai.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  AIService, 
  getAIService, 
  initializeAIService, 
  createMockAIProvider,
  MockAIProvider,
  ScenarioProposalSchema,
  ExplanationSchema,
  RecommendationSchema,
  NVIDIANIMProvider,
} from '../src/ai';
import { SimulationResult, SimulationDecision, DecisionType, ProvenanceRecord } from '../src/simulation/types';
import { EntityId } from '../src/entities/types';

describe('AI Service', () => {
  let service: AIService;
  let mockProvider: MockAIProvider;

  beforeEach(() => {
    // Reset singleton
    vi.resetModules();
    service = new AIService();
    mockProvider = createMockAIProvider();
  });

  describe('Initialization', () => {
    it('should not be initialized by default', () => {
      expect(service.isInitialized()).toBe(false);
    });

    it('should initialize with mock provider', () => {
      service.initialize({
        name: 'Mock',
        modelId: 'mock',
        endpoint: 'mock://localhost',
        apiKey: 'test-key',
      });
      expect(service.isInitialized()).toBe(true);
    });

    it('should throw when using uninitialized service', async () => {
      await expect(service.interpretNaturalLanguage('test', { entities: [], relationships: [], scenarios: [], recentSimulations: [] }))
        .rejects.toThrow('AI service not initialized');
    });
  });

  describe('Singleton', () => {
    it('should return same instance', () => {
      const s1 = getAIService();
      const s2 = getAIService();
      expect(s1).toBe(s2);
    });

    it('should initialize singleton', () => {
      const service = initializeAIService({
        name: 'Test',
        modelId: 'test',
        endpoint: 'http://test',
        apiKey: 'key',
      });
      expect(service.isInitialized()).toBe(true);
      expect(getAIService()).toBe(service);
    });
  });

  describe('Mock Provider - Interpret Natural Language', () => {
    beforeEach(() => {
      service = new AIService();
      const mockProvider = createMockAIProvider();
      // We can't directly inject, but we can test the mock provider directly
    });

    it('should generate budget change decision for cost-related prompts', async () => {
      const provider = createMockAIProvider();
      const context = {
        entities: [
          { id: 'budget-eng' as EntityId, type: 'budget', name: 'Engineering Budget', description: '', properties: {}, state: 'active', criticality: 'medium', source: 'assumed', createdAt: Date.now(), updatedAt: Date.now() },
        ],
        relationships: [],
        scenarios: [],
        recentSimulations: [],
      };

      const result = await provider.interpretNaturalLanguage('Reduce engineering budget by 15%', context);
      
      expect(result.decisions.length).toBeGreaterThan(0);
      expect(result.decisions[0].type).toBe('budget_change');
      expect(result.decisions[0].parameters.percentChange).toBe(-15);
      expect(result.name).toBe('AI-Generated Scenario');
    });

    it('should generate add_location decision for expansion prompts', async () => {
      const provider = createMockAIProvider();
      const context = { entities: [], relationships: [], scenarios: [], recentSimulations: [] };

      const result = await provider.interpretNaturalLanguage('Expand to London', context);
      
      expect(result.decisions.length).toBeGreaterThan(0);
      expect(result.decisions.some(d => d.type === 'add_location')).toBe(true);
    });

    it('should generate replace_system decision for system prompts', async () => {
      const provider = createMockAIProvider();
      const context = {
        entities: [
          { id: 'sys-legacy' as EntityId, type: 'system', name: 'Legacy ERP', description: '', properties: {}, state: 'active', criticality: 'high', source: 'assumed', createdAt: Date.now(), updatedAt: Date.now() },
        ],
        relationships: [],
        scenarios: [],
        recentSimulations: [],
      };

      const result = await provider.interpretNaturalLanguage('Replace the legacy ERP system', context);
      
      expect(result.decisions.some(d => d.type === 'replace_system')).toBe(true);
      expect(result.decisions.find(d => d.type === 'replace_system')?.parameters.currentSystemId).toBe('sys-legacy');
    });

    it('should include clarifying questions when no decisions match', async () => {
      const provider = createMockAIProvider();
      const context = { entities: [], relationships: [], scenarios: [], recentSimulations: [] };

      const result = await provider.interpretNaturalLanguage('Do something random', context);
      
      expect(result.clarifyingQuestions.length).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should include assumptions with confidence scores', async () => {
      const provider = createMockAIProvider();
      const context = { entities: [], relationships: [], scenarios: [], recentSimulations: [] };

      const result = await provider.interpretNaturalLanguage('Reduce costs', context);
      
      expect(result.assumptions.length).toBeGreaterThan(0);
      expect(result.assumptions.every(a => a.confidence >= 0 && a.confidence <= 1)).toBe(true);
    });
  });

  describe('Mock Provider - Explain Simulation', () => {
    it('should explain simulation results with evidence', async () => {
      const provider = createMockAIProvider();
      const results: SimulationResult[] = [{
        id: 'sim-1',
        scenarioId: 'scenario-1',
        decisions: [{ id: 'dec-1', type: 'budget_change', description: 'Reduce budget', parameters: { percentChange: -15 }, targetEntityIds: ['budget-eng'], timestamp: Date.now() }],
        affectedEntities: [
          { entityId: 'budget-eng', entityType: 'budget', entityName: 'Engineering Budget', impactType: 'direct', impactSeverity: 'high', dependencyPath: [], triggeringDecisionId: 'dec-1', provenance: {} as ProvenanceRecord },
        ],
        budgetDeltas: [{ budgetId: 'budget-eng', budgetName: 'Engineering Budget', baselineAmount: 8000000, projectedAmount: 6800000, delta: -1200000, deltaPercent: -15, breakdown: [], provenance: {} as ProvenanceRecord }],
        resourceShortages: [],
        projectImpacts: [{ projectId: 'proj-1', projectName: 'Project Apollo', delayRisk: 'high', estimatedDelayDays: 15, budgetImpact: 0, resourceGaps: [], affectedMilestones: [], provenance: {} as ProvenanceRecord }],
        processDisruptions: [],
        unresolvedDependencies: [],
        executedAt: Date.now(),
        executionTimeMs: 100,
        deterministic: true,
        warnings: [],
      }];

      const result = await provider.explainSimulation('What is the budget impact?', results);
      
      expect(result.answer.toLowerCase()).toContain('budget impact');
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle empty results', async () => {
      const provider = createMockAIProvider();
      const result = await provider.explainSimulation('What happened?', []);
      
      expect(result.answer).toContain('No simulation results');
      expect(result.confidence).toBe(0);
    });
  });

  describe('Mock Provider - Recommend Decisions', () => {
    it('should recommend budget reduction for cost goals', async () => {
      const provider = createMockAIProvider();
      const context = {
        entities: [
          { id: 'budget-eng' as EntityId, type: 'budget', name: 'Engineering Budget', description: '', properties: {}, state: 'active', criticality: 'medium', source: 'assumed', createdAt: Date.now(), updatedAt: Date.now() },
        ],
        relationships: [],
        scenarios: [],
        recentSimulations: [],
      };

      const result = await provider.recommendDecisions(['reduce costs'], context);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].title).toContain('Cost');
      expect(result.recommendations[0].decisions[0].type).toBe('budget_change');
      expect(result.recommendations[0].risks.length).toBeGreaterThan(0);
    });

    it('should recommend expansion for growth goals', async () => {
      const provider = createMockAIProvider();
      const context = { entities: [], relationships: [], scenarios: [], recentSimulations: [] };

      const result = await provider.recommendDecisions(['expand globally'], context);
      
      expect(result.recommendations.some(r => r.title.includes('Global') || r.title.includes('Expansion'))).toBe(true);
    });

    it('should always return at least one recommendation', async () => {
      const provider = createMockAIProvider();
      const context = { entities: [], relationships: [], scenarios: [], recentSimulations: [] };

      const result = await provider.recommendDecisions(['optimize'], context);
      
      expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(result.recommendations[0].confidence).toBeGreaterThan(0);
    });
  });

  describe('Mock Provider - Health Check', () => {
    it('should return healthy', async () => {
      const provider = createMockAIProvider();
      const result = await provider.healthCheck();
      
      expect(result.healthy).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Schema Validation', () => {
    it('should validate scenario proposal schema', () => {
      const validProposal = {
        name: 'Test Scenario',
        description: 'Test description',
        decisions: [{
          type: 'budget_change',
          description: 'Reduce budget',
          parameters: { percentChange: -15, budgetId: 'budget-eng' },
          targetEntityIds: ['550e8400-e29b-41d4-a716-446655440000'],
        }],
        assumptions: [{ key: 'test', value: 'value', description: 'Test assumption', confidence: 0.8 }],
        clarifyingQuestions: [],
        confidence: 0.9,
      };
      
      const result = ScenarioProposalSchema.safeParse(validProposal);
      if (!result.success) {
        console.log('Validation errors:', result.error.issues);
      }
      expect(result.success).toBe(true);
    });

    it('should reject invalid scenario proposal', () => {
      const invalidProposal = {
        name: '',
        description: 'Test',
        decisions: [],
        assumptions: [],
        clarifyingQuestions: [],
        confidence: 1.5, // Invalid
      };
      
      const result = ScenarioProposalSchema.safeParse(invalidProposal);
      expect(result.success).toBe(false);
    });

    it('should validate explanation schema', () => {
      const validExplanation = {
        answer: 'Test explanation',
        evidence: [{ findingId: 'f1', description: 'Evidence', provenance: 'calc' }],
        uncertainties: ['Unknown factor'],
        confidence: 0.8,
      };
      
      const result = ExplanationSchema.safeParse(validExplanation);
      expect(result.success).toBe(true);
    });

    it('should validate recommendation schema', () => {
      const validRecommendation = {
        recommendations: [{
          title: 'Test',
          description: 'Test recommendation',
          decisions: [{ type: 'budget_change', parameters: { percentChange: -10 } }],
          expectedImpact: 'Reduces cost',
          risks: ['Risk 1'],
          confidence: 0.8,
        }],
      };
      
      const result = RecommendationSchema.safeParse(validRecommendation);
      expect(result.success).toBe(true);
    });
  });

  describe('AI Service - Build Org Context', () => {
    it('should build context from engine maps', () => {
      const service = new AIService();
      const entities = new Map();
      entities.set('ent-1', { id: 'ent-1', type: 'budget', name: 'Budget', description: '', properties: {}, state: 'active', criticality: 'high', source: 'assumed', createdAt: Date.now(), updatedAt: Date.now() });
      
      const relationships = new Map();
      relationships.set('rel-1', { id: 'rel-1', sourceId: 'ent-1', targetId: 'ent-2', type: 'funds', direction: 'forward', criticality: 'high', dependencyStrength: 'hard', confidence: 1.0 });
      
      const scenarios = new Map();
      scenarios.set('scen-1', { id: 'scen-1', name: 'Scenario', description: '', parentScenarioId: undefined, baselineVersionId: 'v1', assumptions: [], entityOverrides: [], relationshipOverrides: [], appliedDecisions: [], versionHistory: [], createdAt: Date.now(), updatedAt: Date.now() });
      
      const simulations: SimulationResult[] = [];
      
      const context = service.buildOrgContext(entities, relationships, scenarios, simulations);
      
      expect(context.entities.length).toBe(1);
      expect(context.entities[0].id).toBe('ent-1');
      expect(context.relationships.length).toBe(1);
      expect(context.scenarios.length).toBe(1);
      expect(context.recentSimulations).toEqual([]);
    });
  });

  describe('NVIDIA Provider - Factory', () => {
    it('should create provider from config', () => {
      const config = {
        name: 'NVIDIA NIM',
        modelId: 'meta/llama-3.1-70b-instruct',
        endpoint: 'https://integrate.api.nvidia.com/v1',
        apiKey: 'test-key',
      };
      
      // We can't fully test without network, but we can verify the factory works
      expect(() => {
        const provider = new NVIDIANIMProvider(config);
        expect(provider.name).toBe('NVIDIA NIM');
        expect(provider.modelId).toBe(config.modelId);
        expect(provider.endpoint).toBe(config.endpoint);
      }).not.toThrow();
    });
  });
});