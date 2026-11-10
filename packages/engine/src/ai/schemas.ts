// packages/engine/src/ai/schemas.ts

import { z } from 'zod';
import { DecisionType } from '../entities/types';
import { EntityId } from '../entities/types';

/**
 * Scenario proposal schema for structured output
 */
export const ScenarioProposalSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  decisions: z.array(z.object({
    type: z.nativeEnum(DecisionType),
    description: z.string().min(1).max(500),
    parameters: z.record(z.unknown()),
    targetEntityIds: z.array(z.string().uuid()).min(1),
  })).min(1).max(20),
  assumptions: z.array(z.object({
    key: z.string().min(1).max(100),
    value: z.unknown(),
    description: z.string().min(1).max(500),
    confidence: z.number().min(0).max(1),
  })).max(50),
  clarifyingQuestions: z.array(z.string().min(1).max(500)).max(10),
  confidence: z.number().min(0).max(1),
});

export type ScenarioProposal = z.infer<typeof ScenarioProposalSchema>;

/**
 * Explanation schema for structured output
 */
export const ExplanationSchema = z.object({
  answer: z.string().min(1).max(5000),
  evidence: z.array(z.object({
    findingId: z.string().min(1),
    description: z.string().min(1).max(1000),
    provenance: z.string().min(1).max(500),
  })).max(20),
  uncertainties: z.array(z.string().min(1).max(500)).max(10),
  confidence: z.number().min(0).max(1),
});

export type Explanation = z.infer<typeof ExplanationSchema>;

/**
 * Recommendation schema for structured output
 */
export const RecommendationSchema = z.object({
  recommendations: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    decisions: z.array(z.object({
      type: z.nativeEnum(DecisionType),
      parameters: z.record(z.unknown()),
    })).min(1).max(10),
    expectedImpact: z.string().min(1).max(1000),
    risks: z.array(z.string().min(1).max(500)).max(10),
    confidence: z.number().min(0).max(1),
  })).min(1).max(10),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

/**
 * Chat completion request schema
 */
export const ChatCompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(32768).optional(),
  response_format: z.object({
    type: z.enum(['json', 'json_schema']),
    json_schema: z.object({
      name: z.string(),
      schema: z.record(z.unknown()),
      strict: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

/**
 * Chat completion response schema
 */
export const ChatCompletionResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    message: z.object({
      role: z.enum(['assistant']),
      content: z.string().nullable(),
    }),
    finish_reason: z.enum(['stop', 'length', 'content_filter', 'function_call']),
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }).optional(),
});

/**
 * NVIDIA NIM error response schema
 */
export const NIMErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string(),
    param: z.string().nullable(),
    code: z.string().nullable(),
  }),
});

/**
 * Health check response schema
 */
export const HealthCheckSchema = z.object({
  healthy: z.boolean(),
  latencyMs: z.number().min(0),
  model: z.string().optional(),
  version: z.string().optional(),
});