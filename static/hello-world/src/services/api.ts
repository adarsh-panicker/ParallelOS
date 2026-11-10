// API service for invoking Forge resolvers

import { invoke } from '@forge/bridge';
import type { Entity, Relationship, EntityType, EntitiesResponse, EntityResponse, RelationshipsResponse, SearchResponse, InitializeDemoResponse, GraphDataResponse } from '../types';

interface InvokeOptions {
  payload?: Record<string, unknown>;
}

async function invokeResolver<T>(functionName: string, options: InvokeOptions = {}): Promise<T> {
  try {
    const response = await invoke<T>(functionName, options.payload);
    // @ts-ignore - Forge invoke returns complex type
    return 'body' in response ? response.body as T : response as T;
  } catch (error) {
    console.error(`Resolver ${functionName} failed:`, error);
    throw error;
  }
}

export async function initializeDemoData(): Promise<InitializeDemoResponse> {
  return invokeResolver<InitializeDemoResponse>('initializeDemoData');
}

export async function getEntities(params: {
  type?: EntityType;
  limit?: number;
  offset?: number;
} = {}): Promise<EntitiesResponse> {
  return invokeResolver<EntitiesResponse>('getEntities', { payload: params });
}

export async function getEntity(id: string): Promise<EntityResponse> {
  return invokeResolver<EntityResponse>('getEntity', { payload: { id } });
}

export async function getRelationships(params: {
  sourceId?: string;
  targetId?: string;
  type?: string;
  limit?: number;
} = {}): Promise<RelationshipsResponse> {
  return invokeResolver<RelationshipsResponse>('getRelationships', { payload: params });
}

export async function searchEntities(params: {
  query: string;
  types?: EntityType[];
  limit?: number;
}): Promise<SearchResponse> {
  return invokeResolver<SearchResponse>('searchEntities', { payload: params });
}

export async function getGraphData(params: {
  entityTypes?: EntityType[];
  maxNodes?: number;
} = {}): Promise<GraphDataResponse> {
  return invokeResolver<GraphDataResponse>('getGraphData', { payload: params });
}