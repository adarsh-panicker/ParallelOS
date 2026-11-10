// packages/engine/src/scenario/schemas.ts

import { z } from 'zod';
import { ValueSource, Criticality, DecisionType, EntityId, VersionId, ScenarioId } from '../entities/types';
import { Assumption, EntityOverride, RelationshipOverride, AppliedDecision, ScenarioVersion, Scenario } from './types';

/**
 * Zod schemas for scenario validation
 */
export const AssumptionSchema = z.object({
  id: z.string().uuid(),
  key: z.string().min(1).max(100),
  value: z.unknown(),
  description: z.string().max(500),
  source: z.enum([ValueSource.Assumed, ValueSource.AiHypothesis]),
  confidence: z.number().min(0).max(1),
  createdAt: z.number().int().positive(),
  createdBy: z.string().min(1),
});

export const EntityOverrideSchema = z.object({
  entityId: z.string().uuid(),
  operation: z.enum(['create', 'update', 'delete']),
  previousVersion: z.string().uuid().optional(),
  newData: z.object({
    name: z.string().max(200).optional(),
    description: z.string().max(5000).optional(),
    properties: z.record(z.unknown()).optional(),
    state: z.string().optional(),
    criticality: z.nativeEnum(Criticality).optional(),
    source: z.nativeEnum(ValueSource).optional(),
    verificationStatus: z.string().optional(),
  }).optional(),
  appliedAt: z.number().int().positive(),
  appliedBy: z.string().min(1),
});

export const RelationshipOverrideSchema = z.object({
  relationshipId: z.string().uuid(),
  operation: z.enum(['create', 'update', 'delete']),
  previousVersion: z.string().uuid().optional(),
  newData: z.object({
    type: z.string().optional(),
    direction: z.string().optional(),
    criticality: z.nativeEnum(Criticality).optional(),
    dependencyStrength: z.string().optional(),
    redundancyInfo: z.unknown().optional(),
    confidence: z.number().min(0).max(1).optional(),
    properties: z.record(z.unknown()).optional(),
  }).optional(),
  appliedAt: z.number().int().positive(),
  appliedBy: z.string().min(1),
});

export const AppliedDecisionSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(DecisionType),
  description: z.string().max(500),
  parameters: z.record(z.unknown()),
  appliedAt: z.number().int().positive(),
  appliedBy: z.string().min(1),
  simulationId: z.string().uuid().optional(),
});

export const ScenarioVersionSchema = z.object({
  versionId: z.string().uuid(),
  timestamp: z.number().int().positive(),
  author: z.string().min(1),
  changeSummary: z.string().max(500),
  entityOverridesCount: z.number().int().nonnegative(),
  relationshipOverridesCount: z.number().int().nonnegative(),
});

export const ScenarioSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(''),
  parentScenarioId: z.string().uuid().optional(),
  baselineVersionId: z.string().uuid(),
  assumptions: z.array(AssumptionSchema).max(100).default([]),
  entityOverrides: z.array(EntityOverrideSchema).max(1000).default([]),
  relationshipOverrides: z.array(RelationshipOverrideSchema).max(1000).default([]),
  appliedDecisions: z.array(AppliedDecisionSchema).max(100).default([]),
  latestSimulationId: z.string().uuid().optional(),
  versionHistory: z.array(ScenarioVersionSchema).default([]),
  status: z.enum(['draft', 'active', 'archived', 'completed']).default('draft'),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  createdBy: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

export type ScenarioSchemaType = z.infer<typeof ScenarioSchema>;

/**
 * Input schemas for resolvers
 */
export const CreateScenarioInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  baselineVersionId: z.string().uuid(),
  parentScenarioId: z.string().uuid().optional(),
  assumptions: z.array(AssumptionSchema).max(50).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const UpdateScenarioInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['draft', 'active', 'archived', 'completed']).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const ApplyEntityOverrideInputSchema = z.object({
  scenarioId: z.string().uuid(),
  entityId: z.string().uuid(),
  operation: z.enum(['create', 'update', 'delete']),
  newData: z.record(z.unknown()).optional(),
});

export const ApplyRelationshipOverrideInputSchema = z.object({
  scenarioId: z.string().uuid(),
  relationshipId: z.string().uuid(),
  operation: z.enum(['create', 'update', 'delete']),
  newData: z.record(z.unknown()).optional(),
});

export const AddAssumptionInputSchema = z.object({
  scenarioId: z.string().uuid(),
  key: z.string().min(1).max(100),
  value: z.unknown(),
  description: z.string().max(500),
  source: z.enum([ValueSource.Assumed, ValueSource.AiHypothesis]),
  confidence: z.number().min(0).max(1).default(0.5),
});