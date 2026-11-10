// src/functions/comparisonEngine.ts
// Comparison engine function handler

import { ForgeRequest, ForgeResponse } from '@forge/api';
import { compareScenarios, ComparisonResult } from '../../engine/src/comparison';

export async function handler(req: ForgeRequest): Promise<ForgeResponse> {
  const body = await req.json();
  const { baselineScenarioId, scenarioIds, customWeights } = body;

  try {
    // In production, fetch simulations from storage
    // For now, return mock comparison
    const mockComparison: ComparisonResult = {
      id: `comparison-${Date.now()}`,
      baselineScenarioId,
      comparedScenarioIds: scenarioIds,
      dimensions: [],
      scenarioScores: [],
      differences: [],
      generatedAt: Date.now(),
    };
    
    return { status: 200, body: mockComparison };
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : 'Comparison failed' },
    };
  }
}