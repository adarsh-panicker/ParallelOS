// src/functions/aiService.ts
// AI service function handler

import type { ForgeRequest, ForgeResponse} from './types';
import { parseRequestBody } from './types';
import { getAIService, createMockAIProvider } from '@parallelos/engine';

let aiService: ReturnType<typeof getAIService> | null = null;

function getOrCreateAIService() {
  if (!aiService) {
    aiService = getAIService();
    const mockProvider = createMockAIProvider();
    (aiService as any).provider = mockProvider;
    (aiService as any).config = { name: 'mock', modelId: 'mock', endpoint: 'mock', apiKey: 'mock' };
  }
  return aiService;
}

export async function handler(req: ForgeRequest): Promise<ForgeResponse> {
  const body = await parseRequestBody(req);
  const { action, ...data } = body;

  try {
    const service = getOrCreateAIService();

    switch (action) {
      case 'interpretNaturalLanguage': {
        const { prompt, context } = data;
        const proposal = await service.interpretNaturalLanguage(prompt, context);
        return { status: 200, body: proposal };
      }

      case 'explainSimulation': {
        const { question, simulationResults } = data;
        const explanation = await service.explainSimulation(question, simulationResults);
        return { status: 200, body: explanation };
      }

      case 'recommendDecisions': {
        const { goals, context } = data;
        const recommendations = await service.recommendDecisions(goals, context);
        return { status: 200, body: recommendations };
      }

      case 'healthCheck': {
        const health = await service.healthCheck();
        return { status: 200, body: health };
      }

      default:
        return { status: 400, body: { error: 'Invalid action' } };
    }
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : 'AI service error' },
    };
  }
}
