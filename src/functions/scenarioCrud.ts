// src/functions/scenarioCrud.ts
// Scenario CRUD operations function handler

import type { ForgeRequest, ForgeResponse} from './types';
import { parseRequestBody } from './types';
import { kvs } from '@forge/kvs';

export async function handler(req: ForgeRequest): Promise<ForgeResponse> {
  const body = await parseRequestBody(req);
  const { action, scenarioId, ...data } = body;

  try {
    switch (action) {
      case 'create': {
        const scenario = {
          id: `scenario-${Date.now()}`,
          name: data.name,
          description: data.description,
          parentScenarioId: data.parentScenarioId,
          baselineVersion: 'baseline-v1',
          assumptions: [],
          entityOverrides: [],
          relationshipOverrides: [],
          appliedDecisions: [],
          simulationResults: null,
          versionHistory: [],
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        await kvs.entity('scenario').set(scenario.id, scenario);
        
        return { status: 200, body: scenario };
      }
      
      case 'get': {
        const scenario = await kvs.entity('scenario').get(scenarioId);
        if (!scenario) {
          return { status: 404, body: { error: 'Scenario not found' } };
        }
        return { status: 200, body: scenario };
      }
      
      case 'list': {
        return { status: 200, body: { scenarios: [] } };
      }
      
      case 'update': {
        const existing = await kvs.entity('scenario').get(scenarioId);
        if (!existing) {
          return { status: 404, body: { error: 'Scenario not found' } };
        }
        
        const updated = {
          ...(existing as any),
          ...data,
          updatedAt: Date.now(),
        };
        
        await kvs.entity('scenario').set(scenarioId, updated);
        return { status: 200, body: updated };
      }
      
      case 'delete': {
        await kvs.entity('scenario').delete(scenarioId);
        return { status: 200, body: { success: true } };
      }
      
      case 'version': {
        const scenario = await kvs.entity('scenario').get(scenarioId);
        if (!scenario) {
          return { status: 404, body: { error: 'Scenario not found' } };
        }
        
        const version = {
          id: `version-${Date.now()}`,
          scenarioId,
          label: data.label,
          snapshot: { ...(scenario as any) },
          createdAt: Date.now(),
          createdBy: 'user',
        };
        
        await kvs.entity('scenarioVersion').set(version.id, version);
        return { status: 200, body: version };
      }
      
      case 'restore': {
        const version = await kvs.entity('scenarioVersion').get(data.versionId);
        if (!version) {
          return { status: 404, body: { error: 'Version not found' } };
        }
        
        await kvs.entity('scenario').set(scenarioId, {
          ...(version as any).snapshot,
          updatedAt: Date.now(),
        });
        
        return { status: 200, body: (version as any).snapshot };
      }
      
      default:
        return { status: 400, body: { error: 'Invalid action' } };
    }
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : 'Operation failed' },
    };
  }
}
