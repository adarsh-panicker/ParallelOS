// packages/engine/src/ai/nvidia-provider.ts

import { 
  AIProvider, 
  AIProviderConfig, 
  OrgContext, 
  ScenarioProposal, 
  Explanation, 
  Recommendation,
  ChatMessage, 
  CompletionOptions,
  AIProviderError,
  InterpretationError,
  ExplanationError,
  RecommendationError,
} from './types';
import { 
  ScenarioProposalSchema, 
  ExplanationSchema, 
  RecommendationSchema,
  ChatCompletionRequestSchema,
  ChatCompletionResponseSchema,
  NIMErrorResponseSchema,
} from './schemas';

/**
 * NVIDIA NIM Provider Implementation
 */
export class NVIDIANIMProvider implements AIProvider {
  readonly name = 'NVIDIA NIM';
  readonly modelId: string;
  readonly endpoint: string;
  
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(config: AIProviderConfig) {
    this.modelId = config.modelId;
    this.endpoint = config.endpoint.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 20000; // 20s default (Forge limit is 25s)
    this.maxRetries = config.maxRetries ?? 2;
  }

  /**
   * Interpret natural language as a scenario proposal
   */
  async interpretNaturalLanguage(prompt: string, context: OrgContext): Promise<ScenarioProposal> {
    const systemPrompt = this.buildInterpretationPrompt(context);
    
    const response = await this.callNIM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ], {
      temperature: 0.1,
      maxTokens: 4096,
      responseFormat: 'json_schema',
      jsonSchema: this.getScenarioProposalJSONSchema(),
    });

    return this.validateProposal(response);
  }

  /**
   * Explain simulation results using grounded data
   */
  async explainSimulation(question: string, results: SimulationResult[]): Promise<Explanation> {
    const context = this.formatResultsForExplanation(results);
    const systemPrompt = `You are an expert organizational analyst. Explain simulation results using ONLY the provided data. Never invent facts, numbers, or relationships not present in the data. Always mark uncertainty explicitly. Use the provenance information to cite specific findings.`;

    const response = await this.callNIM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Simulation results:\n${context}\n\nQuestion: ${question}` },
    ], {
      temperature: 0.2,
      maxTokens: 2048,
      responseFormat: 'json_schema',
      jsonSchema: this.getExplanationJSONSchema(),
    });

    return this.validateExplanation(response);
  }

  /**
   * Recommend decisions based on goals
   */
  async recommendDecisions(goals: string[], context: OrgContext): Promise<Recommendation> {
    const systemPrompt = this.buildRecommendationPrompt(context);
    
    const response = await this.callNIM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Goals: ${goals.join(', ')}` },
    ], {
      temperature: 0.3,
      maxTokens: 4096,
      responseFormat: 'json_schema',
      jsonSchema: this.getRecommendationJSONSchema(),
    });

    return this.validateRecommendation(response);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      // Simple test call with minimal tokens
      await this.callNIM([
        { role: 'user', content: 'Health check' },
      ], {
        temperature: 0,
        maxTokens: 10,
      });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }

  /**
   * Build system prompt for interpretation
   */
  private buildInterpretationPrompt(context: OrgContext): string {
    const entitySummary = this.summarizeEntities(context.entities);
    const relationshipSummary = this.summarizeRelationships(context.relationships);
    const scenarioSummary = this.summarizeScenarios(context.scenarios);

    return `You are an expert organizational analyst helping users create parallel scenarios for simulation.

ORGANIZATION CONTEXT:
${entitySummary}

RELATIONSHIPS:
${relationshipSummary}

EXISTING SCENARIOS:
${scenarioSummary}

DECISION TYPES AVAILABLE:
- budget_change: Change a budget by percentage (params: budgetId, percentChange)
- add_location: Add a new location (params: name, address, timezone, capacity)
- replace_system: Replace a business system (params: currentSystemId, newSystemName, newSystemVendorId, migrationDurationDays)
- system_outage: Simulate system outage (params: systemId, durationHours)
- restructure_department: Restructure a department (params: departmentId)
- reallocate_resources: Move resources between entities (params: fromResourceId, toResourceId, amount)

RULES:
1. Only propose decisions that make sense given the organization context
2. Target entities MUST exist in the organization (use provided IDs)
3. If information is missing, ask clarifying questions
4. Assumptions must be explicit with confidence scores
5. Return valid JSON matching the schema exactly
6. Confidence should reflect how well the prompt maps to actual entities/relationships`;
  }

  /**
   * Build system prompt for recommendations
   */
  private buildRecommendationPrompt(context: OrgContext): string {
    const entitySummary = this.summarizeEntities(context.entities);
    const relationshipSummary = this.summarizeRelationships(context.relationships);

    return `You are an expert organizational analyst recommending decisions to achieve specific goals.

ORGANIZATION CONTEXT:
${entitySummary}

RELATIONSHIPS:
${relationshipSummary}

DECISION TYPES AVAILABLE:
- budget_change: Change a budget by percentage (params: budgetId, percentChange)
- add_location: Add a new location (params: name, address, timezone, capacity)
- replace_system: Replace a business system (params: currentSystemId, newSystemName, newSystemVendorId, migrationDurationDays)
- system_outage: Simulate system outage (params: systemId, durationHours)
- restructure_department: Restructure a department (params: departmentId)
- reallocate_resources: Move resources between entities (params: fromResourceId, toResourceId, amount)

RULES:
1. Recommendations must be specific, actionable proposals
2. Each recommendation must include expected impact and risks
3. Decisions must target existing entities
3. Confidence reflects likelihood of achieving the goal
4. Never recommend actions that would harm the organization
5. Return valid JSON matching the schema exactly`;
  }

  /**
   * Summarize entities for context
   */
  private summarizeEntities(entities: OrgContext['entities']): string {
    const byType = new Map<string, number>();
    for (const e of entities) {
      byType.set(e.type, (byType.get(e.type) || 0) + 1);
    }
    
    const lines = [`Total entities: ${entities.length}`];
    for (const [type, count] of byType) {
      lines.push(`  ${type}: ${count}`);
    }
    
    // Include key entities (budgets, critical systems, etc.)
    const keyEntities = entities
      .filter(e => e.type === 'budget' || e.criticality === 'critical' || e.type === 'project')
      .slice(0, 20);
    
    for (const e of keyEntities) {
      lines.push(`  - ${e.name} (${e.type}, ${e.criticality}): ${e.id}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Summarize relationships for context
   */
  private summarizeRelationships(relationships: OrgContext['relationships']): string {
    const byType = new Map<string, number>();
    for (const r of relationships) {
      byType.set(r.type, (byType.get(r.type) || 0) + 1);
    }
    
    const lines = [`Total relationships: ${relationships.length}`];
    for (const [type, count] of byType) {
      lines.push(`  ${type}: ${count}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Summarize scenarios for context
   */
  private summarizeScenarios(scenarios: OrgContext['scenarios']): string {
    if (scenarios.length === 0) return 'No existing scenarios';
    
    return scenarios.map(s => 
      `  - ${s.name} (${s.id}): ${s.description} [${s.appliedDecisions.length} decisions]`
    ).join('\n');
  }

  /**
   * Format simulation results for explanation
   */
  private formatResultsForExplanation(results: SimulationResult[]): string {
    if (results.length === 0) return 'No simulation results available.';
    
    return results.map((r, i) => {
      const lines = [`=== Simulation ${i + 1} (${r.id}) ===`];
      lines.push(`Decisions: ${r.decisions.map(d => `${d.type}: ${d.description}`).join(', ')}`);
      lines.push(`Affected entities: ${r.affectedEntities.length}`);
      lines.push(`Budget deltas: ${r.budgetDeltas.length}`);
      lines.push(`Resource shortages: ${r.resourceShortages.length}`);
      lines.push(`Project impacts: ${r.projectImpacts.length}`);
      lines.push(`Process disruptions: ${r.processDisruptions.length}`);
      lines.push(`Unresolved dependencies: ${r.unresolvedDependencies.length}`);
      lines.push(`Deterministic: ${r.deterministic}`);
      lines.push(`Warnings: ${r.warnings.join('; ') || 'None'}`);
      
      // Key findings
      const criticalAffected = r.affectedEntities.filter(e => e.impactSeverity === 'critical');
      if (criticalAffected.length > 0) {
        lines.push(`Critical impacts: ${criticalAffected.map(e => `${e.entityName} (${e.entityType})`).join(', ')}`);
      }
      
      const delayedProjects = r.projectImpacts.filter(p => p.delayRisk === 'critical' || p.delayRisk === 'high');
      if (delayedProjects.length > 0) {
        lines.push(`At-risk projects: ${delayedProjects.map(p => `${p.projectName} (${p.delayRisk})`).join(', ')}`);
      }
      
      return lines.join('\n');
    }).join('\n\n');
  }

  /**
   * Call NVIDIA NIM API
   */
  private async callNIM(messages: ChatMessage[], options: CompletionOptions): Promise<string> {
    const url = `${this.endpoint}/chat/completions`;
    
    const requestBody = {
      model: this.modelId,
      messages,
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 2048,
      response_format: options.responseFormat === 'json_schema' && options.jsonSchema
        ? { type: 'json_schema', json_schema: { name: 'response', schema: options.jsonSchema, strict: true } }
        : options.responseFormat === 'json'
          ? { type: 'json_object' }
          : undefined,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorDetail = '';
          try {
            const errorBody = await response.json();
            errorDetail = errorBody.error?.message || JSON.stringify(errorBody);
          } catch {
            errorDetail = await response.text();
          }
          throw new Error(`NIM API error: ${response.status} - ${errorDetail}`);
        }

        const data = await response.json();
        const parsed = ChatCompletionResponseSchema.parse(data);
        
        const content = parsed.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from NIM');
        }
        
        return content;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof AIProviderError) {
          throw error;
        }
        
        // Check for rate limit or timeout
        const isRetryable = error instanceof Error && (
          error.name === 'AbortError' || 
          error.message.includes('429') ||
          error.message.includes('timeout')
        );
        
        if (!isRetryable || attempt === this.maxRetries) {
          throw new AIProviderError(
            `NIM call failed after ${attempt + 1} attempt(s): ${error instanceof Error ? error.message : String(error)}`,
            'api_error',
            error as Error
          );
        }
        
        // Exponential backoff
        await new Promise(r => setTimeout(r, Math.min(1000 * 2 ** attempt, 5000)));
      }
    }
    
    throw new AIProviderError(
      `NIM call failed: ${lastError?.message || 'Unknown error'}`,
      'api_error',
      lastError ?? undefined
    );
  }

  /**
   * Validate scenario proposal response
   */
  private validateProposal(response: string): ScenarioProposal {
    try {
      const parsed = JSON.parse(response);
      return ScenarioProposalSchema.parse(parsed);
    } catch (error) {
      throw new InterpretationError(
        `Invalid scenario proposal: ${error instanceof Error ? error.message : String(error)}`,
        error as Error
      );
    }
  }

  /**
   * Validate explanation response
   */
  private validateExplanation(response: string): Explanation {
    try {
      const parsed = JSON.parse(response);
      return ExplanationSchema.parse(parsed);
    } catch (error) {
      throw new ExplanationError(
        `Invalid explanation: ${error instanceof Error ? error.message : String(error)}`,
        error as Error
      );
    }
  }

  /**
   * Validate recommendation response
   */
  private validateRecommendation(response: string): Recommendation {
    try {
      const parsed = JSON.parse(response);
      return RecommendationSchema.parse(parsed);
    } catch (error) {
      throw new RecommendationError(
        `Invalid recommendation: ${error instanceof Error ? error.message : String(error)}`,
        error as Error
      );
    }
  }

  /**
   * Get JSON schema for scenario proposal (for structured output)
   */
  private getScenarioProposalJSONSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 200 },
        description: { type: 'string', minLength: 1, maxLength: 2000 },
        decisions: {
          type: 'array',
          minItems: 1,
          maxItems: 20,
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['budget_change', 'add_location', 'replace_system', 'system_outage', 'restructure_department', 'reallocate_resources'] },
              description: { type: 'string', minLength: 1, maxLength: 500 },
              parameters: { type: 'object' },
              targetEntityIds: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1 },
            },
            required: ['type', 'description', 'parameters', 'targetEntityIds'],
            additionalProperties: false,
          },
        },
        assumptions: {
          type: 'array',
          maxItems: 50,
          items: {
            type: 'object',
            properties: {
              key: { type: 'string', minLength: 1, maxLength: 100 },
              value: { type: 'object' },
              description: { type: 'string', minLength: 1, maxLength: 500 },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['key', 'value', 'description', 'confidence'],
            additionalProperties: false,
          },
        },
        clarifyingQuestions: {
          type: 'array',
          maxItems: 10,
          items: { type: 'string', minLength: 1, maxLength: 500 },
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: ['name', 'description', 'decisions', 'assumptions', 'clarifyingQuestions', 'confidence'],
      additionalProperties: false,
    };
  }

  /**
   * Get JSON schema for explanation
   */
  private getExplanationJSONSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        answer: { type: 'string', minLength: 1, maxLength: 5000 },
        evidence: {
          type: 'array',
          maxItems: 20,
          items: {
            type: 'object',
            properties: {
              findingId: { type: 'string', minLength: 1 },
              description: { type: 'string', minLength: 1, maxLength: 1000 },
              provenance: { type: 'string', minLength: 1, maxLength: 500 },
            },
            required: ['findingId', 'description', 'provenance'],
            additionalProperties: false,
          },
        },
        uncertainties: {
          type: 'array',
          maxItems: 10,
          items: { type: 'string', minLength: 1, maxLength: 500 },
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: ['answer', 'evidence', 'uncertainties', 'confidence'],
      additionalProperties: false,
    };
  }

  /**
   * Get JSON schema for recommendation
   */
  private getRecommendationJSONSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          minItems: 1,
          maxItems: 10,
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', minLength: 1, maxLength: 200 },
              description: { type: 'string', minLength: 1, maxLength: 2000 },
              decisions: {
                type: 'array',
                minItems: 1,
                maxItems: 10,
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['budget_change', 'add_location', 'replace_system', 'system_outage', 'restructure_department', 'reallocate_resources'] },
                    parameters: { type: 'object' },
                  },
                  required: ['type', 'parameters'],
                  additionalProperties: false,
                },
              },
              expectedImpact: { type: 'string', minLength: 1, maxLength: 1000 },
              risks: {
                type: 'array',
                maxItems: 10,
                items: { type: 'string', minLength: 1, maxLength: 500 },
              },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['title', 'description', 'decisions', 'expectedImpact', 'risks', 'confidence'],
            additionalProperties: false,
          },
        },
      },
      required: ['recommendations'],
      additionalProperties: false,
    };
  }
}

/**
 * Factory function to create provider from config
 */
export function createAIProvider(config: AIProviderConfig): AIProvider {
  // Currently only NVIDIA NIM is supported
  return new NVIDIANIMProvider(config);
}