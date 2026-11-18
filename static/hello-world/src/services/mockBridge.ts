// Mock bridge for standalone browser preview (outside Atlassian Forge iframe)
import { aureliaEntities, aureliaRelationships } from '@parallelos/engine';

export function setupMockBridge() {
  if (typeof window === 'undefined') return;

  // If Forge has already provided a real bridge inside the Atlassian iframe, do NOT overwrite it
  if ((window as any).__bridge && !(window as any).__bridge.__isMockBridge) {
    return;
  }

  const handler = async (action: string, data: any) => {
    // Forge bridge sends invoke with { functionKey, payload }
    const fn = action === 'invoke' ? (data?.functionKey || action) : action;
    const payload = action === 'invoke' ? data?.payload : data;

    console.info(`[ParallelOS Local Preview Bridge] Resolving: "${fn}"`, payload);

    if (fn === 'healthCheck') {
      return { status: 'local-preview', timestamp: Date.now() };
    }

    if (fn === 'initializeDemoData') {
      return {
        success: true,
        entitiesLoaded: aureliaEntities.length,
        relationshipsLoaded: aureliaRelationships.length,
        executionTimeMs: 12,
      };
    }

    if (fn === 'getGraphData') {
      const entityTypes = payload?.entityTypes as string[] | undefined;
      let filteredNodes = aureliaEntities;
      if (entityTypes && entityTypes.length > 0) {
        filteredNodes = aureliaEntities.filter(e => entityTypes.includes(e.type));
      }
      const maxNodes = payload?.maxNodes || 200;
      const limitedNodes = filteredNodes.slice(0, maxNodes);
      const nodeIds = new Set(limitedNodes.map(n => n.id));
      const filteredEdges = aureliaRelationships.filter(
        r => nodeIds.has(r.sourceId) && nodeIds.has(r.targetId)
      );

      return {
        nodes: limitedNodes,
        edges: filteredEdges,
        totalNodes: filteredNodes.length,
        totalEdges: aureliaRelationships.length,
      };
    }

    if (fn === 'getEntity') {
      const id = payload?.id;
      const entity = aureliaEntities.find(e => e.id === id);
      if (!entity) {
        return { success: false, error: 'Entity not found', entity: null };
      }
      const rels = aureliaRelationships.filter(r => r.sourceId === id || r.targetId === id);
      return { success: true, entity, relationships: rels };
    }

    if (fn === 'getEntities') {
      const type = payload?.type;
      const filtered = type ? aureliaEntities.filter(e => e.type === type) : aureliaEntities;
      const limit = payload?.limit || 100;
      const offset = payload?.offset || 0;
      return {
        entities: filtered.slice(offset, offset + limit),
        total: filtered.length,
      };
    }

    if (fn === 'getRelationships') {
      const { sourceId, targetId, type, limit = 100 } = payload || {};
      let filtered = aureliaRelationships;
      if (sourceId) filtered = filtered.filter(r => r.sourceId === sourceId);
      if (targetId) filtered = filtered.filter(r => r.targetId === targetId);
      if (type) filtered = filtered.filter(r => r.type === type);
      return { relationships: filtered.slice(0, limit), total: filtered.length };
    }

    if (fn === 'searchEntities') {
      const query = (payload?.query || '').toLowerCase();
      const types = payload?.types;
      let results = aureliaEntities.filter(e =>
        (e.name || '').toLowerCase().includes(query) ||
        (e.description || '').toLowerCase().includes(query) ||
        JSON.stringify(e.properties || {}).toLowerCase().includes(query)
      );
      if (types && types.length > 0) {
        results = results.filter(e => types.includes(e.type));
      }
      const limit = payload?.limit || 20;
      return { entities: results.slice(0, limit), total: results.length };
    }

    if (fn === 'syncJiraProjects') {
      return { success: true, projectsCount: 9, mappedEntitiesCount: 32, timestamp: Date.now() };
    }

    if (fn === 'exportConfluenceReport') {
      return { 
        success: true, 
        reportId: 'report-future-a', 
        pageTitle: 'Strategic Comparison — Future A vs Baseline', 
        format: 'ADF',
        timestamp: Date.now() 
      };
    }

    if (fn === 'testRovoAction') {
      return { success: true, action: payload?.action || 'runScenario', certified: true, gateStatus: 'enforced' };
    }

    if (fn === 'verifyNvidiaNim') {
      return { success: true, model: 'meta/llama-3.1-70b-instruct', status: 'healthy', grounded: true };
    }

    return { status: 200, body: {} };
  };

  (window as any).__mockBridgeHandler = handler;

  if (!(window as any).__bridge || (window as any).__bridge.__isMockBridge) {
    (window as any).__bridge = {
      __isMockBridge: true,
      callBridge: handler,
    };
  }
}
