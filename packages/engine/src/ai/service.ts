// packages/engine/src/ai/service.ts

import { 
  AIProvider, 
  AIProviderConfig, 
  OrgContext, 
  ScenarioProposal, 
  Explanation, 
  Recommendation,
  BaseEntity,
  BaseRelationship,
  BaseScenario,
  InterpretationError,
  ExplanationError,
  RecommendationError,
} from './types';
import { SimulationResult } from '../simulation/types';
import { createAIProvider } from './nvidia-provider';

/**
 * AI Service - High-level interface for AI operations
 */
export class AIService {
  private provider: AIProvider | null = null;
  private config: AIProviderConfig | null = null;

  /**
   * Initialize the AI service with provider configuration
   */
  initialize(config: AIProviderConfig): void {
    this.config = config;
    this.provider = createAIProvider(config);
  }

  /**
   * Check if AI service is initialized
   */
  isInitialized(): boolean {
    return this.provider !== null;
  }

  /**
   * Get provider info
   */
  getProviderInfo(): { name: string; modelId: string } | null {
    if (!this.provider) return null;
    return { name: this.provider.name, modelId: this.provider.modelId };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    if (!this.provider) {
      return { healthy: false, latencyMs: 0 };
    }
    return this.provider.healthCheck();
  }

  /**
   * Interpret natural language as a scenario proposal
   */
  async interpretNaturalLanguage(
    prompt: string, 
    context: OrgContext
  ): Promise<ScenarioProposal> {
    this.ensureInitialized();
    return this.provider!.interpretNaturalLanguage(prompt, context);
  }

  /**
   * Explain simulation results
   */
  async explainSimulation(
    question: string, 
    results: SimulationResult[]
  ): Promise<Explanation> {
    this.ensureInitialized();
    return this.provider!.explainSimulation(question, results);
  }

  /**
   * Recommend decisions for goals
   */
  async recommendDecisions(
    goals: string[], 
    context: OrgContext
  ): Promise<Recommendation> {
    this.ensureInitialized();
    return this.provider!.recommendDecisions(goals, context);
  }

  /**
   * Build organization context from engine data
   */
  buildOrgContext(
    entities: Map<string, any>,
    relationships: Map<string, any>,
    scenarios: Map<string, any>,
    recentSimulations: SimulationResult[]
  ): OrgContext {
    return {
      entities: this.mapEntities(entities),
      relationships: this.mapRelationships(relationships),
      scenarios: this.mapScenarios(scenarios),
      recentSimulations,
    };
  }

  /**
   * Map raw entities to base entities
   */
  private mapEntities(entities: Map<string, any>): BaseEntity[] {
    return Array.from(entities.values()).map(e => ({
      id: e.id,
      type: e.type,
      name: e.name,
      description: e.description || '',
      properties: e.properties || {},
      state: e.state || 'active',
      criticality: e.criticality || 'medium',
      source: e.source || 'assumed',
      createdAt: e.createdAt || Date.now(),
      updatedAt: e.updatedAt || Date.now(),
    }));
  }

  /**
   * Map raw relationships to base relationships
   */
  private mapRelationships(relationships: Map<string, any>): BaseRelationship[] {
    return Array.from(relationships.values()).map(r => ({
      id: r.id,
      sourceId: r.sourceId,
      targetId: r.targetId,
      type: r.type,
      direction: r.direction || 'forward',
      criticality: r.criticality || 'medium',
      dependencyStrength: r.dependencyStrength || 'soft',
      confidence: r.confidence ?? 1.0,
    }));
  }

  /**
   * Map raw scenarios to base scenarios
   */
  private mapScenarios(scenarios: Map<string, any>): BaseScenario[] {
    return Array.from(scenarios.values()).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description || '',
      parentScenarioId: s.parentScenarioId,
      baselineVersionId: s.baselineVersionId,
      assumptions: (s.assumptions || []).map((a: any) => ({
        id: a.id,
        key: a.key,
        value: a.value,
        description: a.description || '',
        source: a.source || 'assumed',
        confidence: a.confidence ?? 1.0,
        createdAt: a.createdAt || Date.now(),
      })),
      entityOverrides: (s.entityOverrides || []).map((o: any) => ({
        entityId: o.entityId,
        operation: o.operation,
        properties: o.properties,
        state: o.state,
      })),
      relationshipOverrides: (s.relationshipOverrides || []).map((o: any) => ({
        id: o.id,
        sourceId: o.sourceId,
        targetId: o.targetId,
        type: o.type,
        operation: o.operation,
        dependencyStrength: o.dependencyStrength,
      })),
      appliedDecisions: (s.appliedDecisions || []).map((d: any) => ({
        id: d.id,
        type: d.type,
        description: d.description || '',
        parameters: d.parameters || {},
        appliedAt: d.appliedAt || Date.now(),
      })),
      versionHistory: (s.versionHistory || []).map((v: any) => ({
        id: v.id,
        scenarioId: v.scenarioId,
        label: v.label || '',
        snapshot: v.snapshot,
        createdAt: v.createdAt || Date.now(),
        createdBy: v.createdBy || 'system',
      })),
      createdAt: s.createdAt || Date.now(),
      updatedAt: s.updatedAt || Date.now(),
    }));
  }

  /**
   * Ensure provider is initialized
   */
  private ensureInitialized(): void {
    if (!this.provider) {
      throw new Error('AI service not initialized. Call initialize() first.');
    }
  }
}

/**
 * Singleton instance for app-wide use
 */
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}

export function initializeAIService(config: AIProviderConfig): AIService {
  const service = getAIService();
  service.initialize(config);
  return service;
}

/**
 * Mock provider for testing/development
 */
export class MockAIProvider implements AIProvider {
  readonly name = 'Mock AI';
  readonly modelId = 'mock';
  readonly endpoint = 'mock://localhost';

  async interpretNaturalLanguage(prompt: string, context: OrgContext): Promise<ScenarioProposal> {
    // Simple keyword-based mock
    const lowerPrompt = prompt.toLowerCase();
    const decisions = [];
    
    if (lowerPrompt.includes('budget') || lowerPrompt.includes('cost')) {
      const budgetEntity = context.entities.find(e => e.type === 'budget');
      if (budgetEntity) {
        decisions.push({
          type: 'budget_change' as any,
          description: 'Reduce budget by 15%',
          parameters: { percentChange: -15, budgetId: budgetEntity.id },
          targetEntityIds: [budgetEntity.id],
        });
      }
    }
    
    if (lowerPrompt.includes('expand') || lowerPrompt.includes('location')) {
      decisions.push({
        type: 'add_location' as any,
        description: 'Add new London office',
        parameters: { name: 'London Office', address: '123 London St', timezone: 'Europe/London', capacity: 200 },
        targetEntityIds: [],
      });
    }
    
    if (lowerPrompt.includes('replace') || lowerPrompt.includes('system')) {
      const systemEntity = context.entities.find(e => e.type === 'system');
      if (systemEntity) {
        decisions.push({
          type: 'replace_system' as any,
          description: 'Replace legacy system',
          parameters: { 
            currentSystemId: systemEntity.id, 
            newSystemName: 'Modern ERP', 
            newSystemVendorId: 'vendor-new', 
            migrationDurationDays: 90 
          },
          targetEntityIds: [systemEntity.id],
        });
      }
    }

    return {
      name: 'AI-Generated Scenario',
      description: `Generated from: "${prompt}"`,
      decisions,
      assumptions: [
        { key: 'growth_rate', value: 0.05, description: 'Assumed 5% annual growth', confidence: 0.7 },
        { key: 'migration_success', value: 0.9, description: 'High migration success probability', confidence: 0.8 },
      ],
      clarifyingQuestions: decisions.length === 0 
        ? ['What specific changes would you like to simulate?']
        : ['Should the budget reduction apply to all departments or just Engineering?'],
      confidence: decisions.length > 0 ? 0.8 : 0.3,
    };
  }

  async explainSimulation(question: string, results: SimulationResult[]): Promise<Explanation> {
    const result = results[0];
    if (!result) {
      return {
        answer: 'No simulation results available to explain.',
        evidence: [],
        uncertainties: ['No simulation data provided'],
        confidence: 0,
      };
    }

    const findings = [];
    if (result.budgetDeltas.length > 0) {
      findings.push({ findingId: 'budget', description: `Budget impact: ${result.budgetDeltas.reduce((s, b) => s + b.delta, 0).toLocaleString()}`, provenance: 'budget_calculator' });
    }
    if (result.projectImpacts.length > 0) {
      const delayed = result.projectImpacts.filter(p => p.delayRisk === 'critical' || p.delayRisk === 'high');
      findings.push({ findingId: 'projects', description: `${delayed.length} projects at high/critical delay risk`, provenance: 'project_calculator' });
    }
    if (result.processDisruptions.length > 0) {
      const critical = result.processDisruptions.filter(p => p.disruptionLevel === 'critical');
      findings.push({ findingId: 'processes', description: `${critical.length} processes critically disrupted`, provenance: 'process_calculator' });
    }

    return {
      answer: `Based on the simulation results: ${findings.map(f => f.description).join('. ')}. The simulation was ${result.deterministic ? 'fully deterministic' : 'partially estimated'}.`,
      evidence: findings,
      uncertainties: result.deterministic ? [] : ['Some calculations used estimated values'],
      confidence: result.deterministic ? 0.95 : 0.7,
    };
  }

  async recommendDecisions(goals: string[], context: OrgContext): Promise<Recommendation> {
    const recommendations = [];
    
    if (goals.some(g => g.toLowerCase().includes('cost') || g.toLowerCase().includes('budget'))) {
      const budgetEntity = context.entities.find(e => e.type === 'budget');
      if (budgetEntity) {
        recommendations.push({
          title: 'Reduce Operating Costs',
          description: 'Implement 15% budget reduction across non-critical departments',
          decisions: [{
            type: 'budget_change' as any,
            parameters: { percentChange: -15, budgetId: budgetEntity.id },
          }],
          expectedImpact: 'Reduces OpEx by ~15% but may delay projects and reduce resilience',
          risks: ['Project delays', 'Resource shortages', 'Reduced operational resilience'],
          confidence: 0.75,
        });
      }
    }
    
    if (goals.some(g => g.toLowerCase().includes('expand') || g.toLowerCase().includes('growth'))) {
      recommendations.push({
        title: 'Global Expansion',
        description: 'Add two new international locations with supporting departments',
        decisions: [{
          type: 'add_location' as any,
          parameters: { name: 'London Office', address: '123 London St', timezone: 'Europe/London', capacity: 200 },
        }, {
          type: 'add_location' as any,
          parameters: { name: 'Singapore Office', address: '456 Singapore Ave', timezone: 'Asia/Singapore', capacity: 150 },
        }],
        expectedImpact: 'Increases revenue potential but raises OpEx by ~25%',
        risks: ['Higher operational complexity', 'Cultural integration challenges', 'Regulatory compliance'],
        confidence: 0.7,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Optimize Resource Allocation',
        description: 'Reallocate compute resources from low-utilization to high-demand projects',
        decisions: [{
          type: 'reallocate_resources' as any,
          parameters: { fromResourceId: 'res-compute', toResourceId: 'res-senior-eng', amount: 10 },
        }],
        expectedImpact: 'Improves project delivery without additional cost',
        risks: ['May cause compute bottlenecks in other areas'],
        confidence: 0.8,
      });
    }

    return { recommendations };
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    return { healthy: true, latencyMs: 1 };
  }
}

export function createMockAIProvider(): AIProvider {
  return new MockAIProvider();
}