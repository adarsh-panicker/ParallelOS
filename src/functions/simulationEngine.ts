// src/functions/simulationEngine.ts
// Simulation engine function handler

import type { ForgeRequest, ForgeResponse} from './types';
import { parseRequestBody } from './types';
import { 
  buildSimulationContext, 
  runSimulation, 
  loadAureliaDemo,
} from '@parallelos/engine';

export async function handler(req: ForgeRequest): Promise<ForgeResponse> {
  const body = await parseRequestBody(req);
  const { scenarioId: _scenarioId, decisions = [] } = body;

  try {
    const demo = loadAureliaDemo();
    
    const entities = new Map<string, any>();
    const relationships = new Map<string, any>();
    const outboundEdges = new Map<string, string[]>();
    const inboundEdges = new Map<string, string[]>();

    for (const entity of demo.entities) {
      entities.set(entity.id, entity);
    }

    for (const rel of demo.relationships) {
      relationships.set(rel.id, rel);
      const outbound = outboundEdges.get(rel.sourceId) || [];
      outbound.push(rel.id);
      outboundEdges.set(rel.sourceId, outbound);
      const inbound = inboundEdges.get(rel.targetId) || [];
      inbound.push(rel.id);
      inboundEdges.set(rel.targetId, inbound);
    }

    const context = buildSimulationContext(entities, relationships, outboundEdges, inboundEdges, decisions);
    const result = await runSimulation(context);
    
    return { status: 200, body: result };
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : 'Simulation failed' },
    };
  }
}
