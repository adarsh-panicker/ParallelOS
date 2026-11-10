import Resolver from '@forge/resolver';
import { kvs } from '@forge/kvs';
import { z } from 'zod';
import { 
  loadAureliaDemo, 
  aureliaEntities, 
  aureliaRelationships,
  Entity,
  Relationship,
  EntityType,
} from '@parallelos/engine';

// Define the entity schema for our demo storage test
const TestEntitySchema = z.object({
  id: z.string(),
  value: z.string(),
  timestamp: z.number(),
});

type TestEntity = z.infer<typeof TestEntitySchema>;

type CursorResult<T> = {
  results: T[];
  nextCursor: string | undefined;
};

const resolver = new Resolver();

// Health check resolver
resolver.define('healthCheck', () => {
  return { status: 'ok', timestamp: Date.now() };
});

// Write a test value to Custom Entity Store
resolver.define('writeTestValue', async (req) => {
  const { value } = req.payload as { value: string };
  
  const testEntity: TestEntity = {
    id: 'phase0-test',
    value,
    timestamp: Date.now(),
  };
  
  // Validate with Zod
  const parsed = TestEntitySchema.safeParse(testEntity);
  if (!parsed.success) {
    throw new Error(`Validation failed: ${parsed.error.message}`);
  }
  
  // Store in Custom Entity Store using entity API
  await kvs.entity('parallelos_test').set('phase0-test', parsed.data);
  
  return { success: true, entity: parsed.data };
});

// Read the test value from Custom Entity Store
resolver.define('readTestValue', async () => {
  const result = await kvs.entity('parallelos_test').get('phase0-test');
  
  if (!result) {
    return { success: false, error: 'Not found', entity: null };
  }
  
  // Validate on read
  const parsed = TestEntitySchema.safeParse(result);
  if (!parsed.success) {
    return { success: false, error: `Validation failed: ${parsed.error.message}`, entity: null };
  }
  
  return { success: true, entity: parsed.data };
});

// Get all test entities (for debugging)
resolver.define('listTestEntities', async () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const queryBuilder = kvs.entity('parallelos_test').query();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const cursor = await (queryBuilder as any).getMany();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const results = (cursor as any).results || [];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const nextCursor = (cursor as any).nextCursor;
  return { entities: results, nextCursor };
});

// ============================================
// PHASE 2: ORGANIZATION TWIN RESOLVERS
// ============================================

// Initialize demo data in Custom Entity Store
resolver.define('initializeDemoData', async () => {
  try {
    // Store entities
    for (const entity of aureliaEntities) {
      await kvs.entity('parallelos_entities').set(entity.id, entity);
    }
    
    // Store relationships
    for (const rel of aureliaRelationships) {
      await kvs.entity('parallelos_relationships').set(rel.id, rel);
    }
    
    return { 
      success: true, 
      entitiesLoaded: aureliaEntities.length,
      relationshipsLoaded: aureliaRelationships.length 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
});

// Get all entities with optional filtering
resolver.define('getEntities', async (req) => {
  const { type, limit = 100, offset = 0 } = req.payload as { 
    type?: EntityType; 
    limit?: number; 
    offset?: number;
  };
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const queryBuilder = kvs.entity('parallelos_entities').query();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const cursor = await (queryBuilder as any).getMany();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const allEntities = ((cursor as any).results || []) as Entity[];
    
    let filtered = allEntities;
    if (type) {
      filtered = allEntities.filter(e => e.type === type);
    }
    
    const paginated = filtered.slice(offset, offset + limit);
    
    return { 
      entities: paginated, 
      total: filtered.length,
      nextCursor: offset + limit < filtered.length ? String(offset + limit) : undefined
    };
  } catch (error) {
    return { 
      entities: [], 
      total: 0,
      error: error instanceof Error ? error.message : String(error) 
    };
  }
});

// Get a single entity by ID with its relationships
resolver.define('getEntity', async (req) => {
  const { id } = req.payload as { id: string };
  
  try {
    const entity = await kvs.entity('parallelos_entities').get(id);
    
    if (!entity) {
      return { success: false, error: 'Entity not found', entity: null };
    }
    
    // Get related relationships
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const relQueryBuilder = kvs.entity('parallelos_relationships').query();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const relCursor = await (relQueryBuilder as any).getMany();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const allRels = ((relCursor as any).results || []) as Relationship[];
    
    const relationships = allRels.filter(r => r.sourceId === id || r.targetId === id);
    
    return { success: true, entity: entity as Entity, relationships };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error), 
      entity: null 
    };
  }
});

// Get relationships with optional filtering
resolver.define('getRelationships', async (req) => {
  const { sourceId, targetId, type, limit = 100 } = req.payload as { 
    sourceId?: string; 
    targetId?: string; 
    type?: string;
    limit?: number;
  };
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const queryBuilder = kvs.entity('parallelos_relationships').query();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const cursor = await (queryBuilder as any).getMany();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const allRels = ((cursor as any).results || []) as Relationship[];
    
    let filtered = allRels;
    if (sourceId) filtered = filtered.filter(r => r.sourceId === sourceId);
    if (targetId) filtered = filtered.filter(r => r.targetId === targetId);
    if (type) filtered = filtered.filter(r => r.type === type);
    
    return { relationships: filtered.slice(0, limit), total: filtered.length };
  } catch (error) {
    return { 
      relationships: [], 
      total: 0,
      error: error instanceof Error ? error.message : String(error) 
    };
  }
});

// Search entities by name or property
resolver.define('searchEntities', async (req) => {
  const { query, types, limit = 20 } = req.payload as { 
    query: string; 
    types?: EntityType[]; 
    limit?: number;
  };
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const queryBuilder = kvs.entity('parallelos_entities').query();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const cursor = await (queryBuilder as any).getMany();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const allEntities = ((cursor as any).results || []) as Entity[];
    
    const lowerQuery = query.toLowerCase();
    let results = allEntities.filter(e => 
      e.name.toLowerCase().includes(lowerQuery) ||
      e.description.toLowerCase().includes(lowerQuery) ||
      JSON.stringify(e.properties).toLowerCase().includes(lowerQuery)
    );
    
    if (types && types.length > 0) {
      results = results.filter(e => types.includes(e.type));
    }
    
    return { entities: results.slice(0, limit), total: results.length };
  } catch (error) {
    return { 
      entities: [], 
      total: 0,
      error: error instanceof Error ? error.message : String(error) 
    };
  }
});

// Get graph data for visualization (entities + relationships)
resolver.define('getGraphData', async (req) => {
  const { entityTypes, maxNodes = 200 } = req.payload as { 
    entityTypes?: EntityType[]; 
    maxNodes?: number;
  };
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const entityQueryBuilder = kvs.entity('parallelos_entities').query();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const entityCursor = await (entityQueryBuilder as any).getMany();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    let entities = ((entityCursor as any).results || []) as Entity[];
    
    if (entityTypes && entityTypes.length > 0) {
      entities = entities.filter(e => entityTypes.includes(e.type));
    }
    
    // Limit nodes for performance
    const limitedEntities = entities.slice(0, maxNodes);
    const entityIds = new Set(limitedEntities.map(e => e.id));
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const relQueryBuilder = kvs.entity('parallelos_relationships').query();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const relCursor = await (relQueryBuilder as any).getMany();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const allRels = ((relCursor as any).results || []) as Relationship[];
    
    // Filter relationships to only those between loaded entities
    const relationships = allRels.filter(r => 
      entityIds.has(r.sourceId) && entityIds.has(r.targetId)
    );
    
    return { 
      nodes: limitedEntities, 
      edges: relationships,
      totalNodes: entities.length,
      totalEdges: allRels.length
    };
  } catch (error) {
    return { 
      nodes: [], 
      edges: [],
      error: error instanceof Error ? error.message : String(error) 
    };
  }
});

export const handler = resolver.getDefinitions();