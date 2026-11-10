// src/functions/scenarioCrud.ts
// Scenario CRUD operations function handler

import { ForgeRequest, ForgeResponse } from '@forge/api';
import { storage } from '@forge/api';

export async function handler(req: ForgeRequest): Promise<ForgeResponse> {
  const body = await req.json();
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
        
        await storage.set(`scenario:${scenario.id}`, scenario);
        
        return { status: 200, body: scenario };
      }
      
      case 'get': {
        const scenario = await storage.get(`scenario:${scenarioId}`);
        if (!scenario) {
          return { status: 404, body: { error: 'Scenario not found' } };
        }
        return { status: 200, body: scenario };
      }
      
      case 'list': {
        // In production, query storage with pagination
        return { status: 200, body: { scenarios: [] } };
      }
      
      case 'update': {
        const existing = await storage.get(`scenario:${scenarioId}`);
        if (!existing) {
          return { status: 404, body: { error: 'Scenario not found' } };
        }
        
        const updated = {
          ...existing,
          ...data,
          updatedAt: Date.now(),
        };
        
        await storage.set(`scenario:${scenarioId}`, updated);
        return { status: 200, body: updated };
      }
      
      case 'delete': {
        await storage.delete(`scenario:${scenarioId}`);
        return { status: 200, body: { success: true } };
      }
      
      case 'version': {
        // Create version snapshot
        const scenario = await storage.get(`scenario:${scenarioId}`);
        if (!scenario) {
          return { status: 404, body: { error: 'Scenario not found' } };
        }
        
        const version = {
          id: `version-${Date.now()}`,
          scenarioId,
          label: data.label,
          snapshot: { ...scenario },
          createdAt: Date.now(),
          createdBy: 'user',
        };
        
        await storage.set(`scenario-version:${version.id}`, version);
        return { status: 200, body: version };
      }
      
      case 'restore': {
        // Restore to version
        const version = await storage.get(`scenario-version:${data.versionId}`);
        if (!version) {
          return { status: 404, body: { error: 'Version not found' } };
        }
        
        await storage.set(`scenario:${scenarioId}`, {
          ...version.snapshot,
          updatedAt: Date.now(),
        });
        
        return { status: 200, body: version.snapshot };
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