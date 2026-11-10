// packages/engine/src/ai/types.ts

import { DecisionType, EntityId, ScenarioId, SimulationId, VersionId } from '../entities/types';
import { SimulationResult, SimulationDecision, ProvenanceRecord } from '../simulation/types';

/**
 * AI Provider interface for abstraction
 */
export interface AIProvider {
  readonly name: string;
  readonly modelId: string;
  readonly endpoint: string;

  // Core capabilities
  interpretNaturalLanguage(prompt: string, context: OrgContext): Promise<ScenarioProposal>;
  explainSimulation(question: string, results: SimulationResult[]): Promise<Explanation>;
  recommendDecisions(goals: string[], context: OrgContext): Promise<Recommendation[]>;

  // Health check
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;
}

/**
 * Organizational context provided to AI
 */
export interface OrgContext {
  entities: BaseEntity[];
  relationships: BaseRelationship[];
  scenarios: BaseScenario[];
  recentSimulations: SimulationResult[];
}

/**
 * Minimal entity for AI context
 */
export interface BaseEntity {
  id: EntityId;
  type: string;
  name: string;
  description: string;
  properties: Record<string, unknown>;
  state: string;
  criticality: string;
  source: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Minimal relationship for AI context
 */
export interface BaseRelationship {
  id: string;
  sourceId: EntityId;
  targetId: EntityId;
  type: string;
  direction: 'forward' | 'reverse' | 'bidirectional';
  criticality: string;
  dependencyStrength: 'hard' | 'soft';
  confidence: number;
}

/**
 * Minimal scenario for AI context
 */
export interface BaseScenario {
  id: ScenarioId;
  name: string;
  description: string;
  parentScenarioId?: ScenarioId;
  baselineVersionId: VersionId;
  assumptions: BaseAssumption[];
  entityOverrides: BaseEntityOverride[];
  relationshipOverrides: BaseRelationshipOverride[];
  appliedDecisions: BaseAppliedDecision[];
  simulationResults?: SimulationResult;
  versionHistory: BaseScenarioVersion[];
  createdAt: number;
  updatedAt: number;
}

export interface BaseAssumption {
  id: string;
  key: string;
  value: unknown;
  description: string;
  source: 'assumed' | 'ai-hypothesis' | 'imported' | 'actual';
  confidence: number;
  createdAt: number;
}

export interface BaseEntityOverride {
  entityId: EntityId;
  operation: 'upsert' | 'delete';
  properties?: Record<string, unknown>;
  state?: string;
}

export interface BaseRelationshipOverride {
  id?: string;
  sourceId: EntityId;
  targetId: EntityId;
  type: string;
  operation: 'upsert' | 'delete';
  dependencyStrength?: 'hard' | 'soft';
}

export interface BaseAppliedDecision {
  id: string;
  type: DecisionType;
  description: string;
  parameters: Record<string, unknown>;
  appliedAt: number;
}

export interface BaseScenarioVersion {
  id: VersionId;
  scenarioId: ScenarioId;
  label: string;
  snapshot: BaseScenario;
  createdAt: number;
  createdBy: string;
}

/**
 * Scenario proposal from natural language interpretation
 */
export interface ScenarioProposal {
  name: string;
  description: string;
  decisions: ProposedDecision[];
  assumptions: ProposedAssumption[];
  clarifyingQuestions: string[];
  confidence: number;
}

export interface ProposedDecision {
  type: DecisionType;
  description: string;
  parameters: Record<string, unknown>;
  targetEntityIds: EntityId[];
}

export interface ProposedAssumption {
  key: string;
  value: unknown;
  description: string;
  confidence: number;
}

/**
 * Explanation of simulation results
 */
export interface Explanation {
  answer: string;
  evidence: EvidenceItem[];
  uncertainties: string[];
  confidence: number;
}

export interface EvidenceItem {
  findingId: string;
  description: string;
  provenance: string;
}

/**
 * Decision recommendation
 */
export interface Recommendation {
  recommendations: RecommendationItem[];
}

export interface RecommendationItem {
  title: string;
  description: string;
  decisions: ProposedDecision[];
  expectedImpact: string;
  risks: string[];
  confidence: number;
}

/**
 * AI Provider configuration
 */
export interface AIProviderConfig {
  name: string;
  modelId: string;
  endpoint: string;
  apiKey: string;
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * Chat message format for LLM
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Completion options
 */
export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'json_schema';
  jsonSchema?: Record<string, unknown>;
}

/**
 * NVIDIA NIM specific config
 */
export interface NVIDIAConfig extends AIProviderConfig {
  // Additional NVIDIA-specific options
  region?: string;
}

/**
 * Error types for AI operations
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly code: 'timeout' | 'invalid_response' | 'schema_validation' | 'api_error' | 'rate_limit' | 'network',
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class InterpretationError extends AIProviderError {
  constructor(message: string, originalError?: Error) {
    super(message, 'schema_validation', originalError);
    this.name = 'InterpretationError';
  }
}

export class ExplanationError extends AIProviderError {
  constructor(message: string, originalError?: Error) {
    super(message, 'api_error', originalError);
    this.name = 'ExplanationError';
  }
}

export class RecommendationError extends AIProviderError {
  constructor(message: string, originalError?: Error) {
    super(message, 'schema_validation', originalError);
    this.name = 'RecommendationError';
  }
}