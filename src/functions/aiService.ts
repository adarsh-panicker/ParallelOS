// src/functions/aiService.ts
// AI service function handler

import { ForgeRequest, ForgeResponse } from '@forge/api';
import { AIService, getAIService, initializeAIService, createMockAIProvider } from '../../engine/src/ai';

let aiService: ReturnType<typeof getAIService> | null = null;

function getOrCreateAIService() {
  if (!aiService) {
    aiService = getAIService();
    // In production, initialize with NVIDIA NIM config from env vars
    // aiService.initialize({
    //   name: 'NVIDIA NIM',
    //   modelId: process.env.NVIDIA_NIM_MODEL_ID || 'meta/llama-3.1-70b-instruct',
    //   endpoint: process.env.NVIDIA_NIM_ENDPOINT || 'https://integrate.api.nvidia.com/v1',
    //   apiKey: process.env.NVIDIA_NIM_API_KEY || '',
    // });
    // For development, use mock provider
    const mockProvider = createMockAIProvider();
    (aiService as any).provider = mockProvider;
    (aiService as any).config = { name: 'mock', modelId: 'mock', endpoint: 'mock', apiKey: 'mock' };
  }
  return aiService;
}

export async function handler(req: ForgeRequest): Promise<ForgeResponse> {
  const body = await req.json();
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