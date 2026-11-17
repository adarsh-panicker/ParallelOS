// Organization Twin Page - Main Graph Visualization

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Viewport, ConnectionMode, ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { EntityNode } from '../components/EntityNode';
import { RelationshipEdge } from '../components/RelationshipEdge';
import { SidePanel } from '../components/SidePanel';
import { Toolbar } from '../components/Toolbar';
import { initializeDemoData, getGraphData, getEntity, searchEntities } from '../services/api';
import type { Entity, Relationship, EntityType, GraphNode, GraphEdge } from '../types';
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_LABELS } from '../types';

export const OrganizationTwin: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<import('../types').Entity | null>(null);
  const [entityRelationships, setEntityRelationships] = useState<import('../types').Relationship[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<import('../types').Entity[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [demoInitialized, setDemoInitialized] = useState(false);
  
  const reactFlowInstance = useRef<ReactFlowInstance<GraphNode, GraphEdge> | null>(null);
const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const nodeTypes = useMemo(() => ({
    entityNode: EntityNode,
  }), []);

  const edgeTypesMemo = useMemo(() => ({
    relationshipEdge: RelationshipEdge,
  }), []);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async (entityTypes?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGraphData({ entityTypes: entityTypes as any, maxNodes: 200 });
      if (data.error) throw new Error(data.error);
      
      const newNodes: GraphNode[] = data.nodes.map((entity, index) => ({
        id: entity.id,
        type: 'entityNode',
        position: { x: (index % 20) * 220, y: Math.floor(index / 20) * 160 },
        data: { label: entity.name, entity },
      }));
      
      const newEdges: GraphEdge[] = data.edges.map(rel => ({
        id: rel.id,
        source: rel.sourceId,
        target: rel.targetId,
        type: 'relationshipEdge',
        label: rel.type.replace(/_/g, ' '),
        data: { relationship: rel },
      }));
      
      setNodes(newNodes);
      setEdges(newEdges);
      setNodeCount(data.totalNodes);
      setEdgeCount(data.totalEdges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph data');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeDemo = async () => {
    setInitializing(true);
    setError(null);
    try {
      const result = await initializeDemoData();
      if (result.success) {
        setDemoInitialized(true);
        await loadGraphData();
      } else {
        throw new Error(result.error || 'Failed to initialize demo data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize demo');
    } finally {
      setInitializing(false);
    }
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: GraphNode) => {
    if (node.data.entity) {
      loadEntityDetails(node.data.entity.id);
    }
  }, []);

  const loadEntityDetails = async (entityId: string) => {
    try {
      const result = await getEntity(entityId);
      if (result.success && result.entity) {
        setSelectedEntity(result.entity);
        if (result.relationships) {
          setEntityRelationships(result.relationships);
        }
      }
    } catch (err) {
      console.error('Failed to load entity details:', err);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (query.length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await searchEntities({ query, limit: 10 });
          setSearchResults(result.entities);
          setShowSearchResults(true);
        } catch (err) {
          console.error('Search failed:', err);
        }
      }, 300);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 2) return;
    try {
      const result = await searchEntities({ query, limit: 20 });
      setSearchResults(result.entities);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleSearchResultClick = (entity: import('../types').Entity) => {
    const node = nodes.find(n => n.id === entity.id);
    if (node && reactFlowWrapper.current) {
      const width = reactFlowWrapper.current?.clientWidth || 800;
      const height = reactFlowWrapper.current?.clientHeight || 600;
      reactFlowInstance.current?.setViewport({
        x: -node.position.x * viewport.zoom + width / 2,
        y: -node.position.y * viewport.zoom + height / 2,
        zoom: 1,
      }, { duration: 500 });
      loadEntityDetails(entity.id);
    }
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const applyTypeFilter = () => {
    if (selectedTypes.length > 0) {
      loadGraphData(selectedTypes);
    } else {
      loadGraphData();
    }
  };

  const onViewportChange = (newViewport: Viewport) => {
    setViewport(newViewport);
    setZoom(newViewport.zoom);
  };

  const zoomIn = () => reactFlowInstance.current?.zoomIn();
  const zoomOut = () => reactFlowInstance.current?.zoomOut();
  const fitView = () => reactFlowInstance.current?.fitView({ padding: 0.1, duration: 500 } as any);
  const resetLayout = () => {
    loadGraphData(selectedTypes.length > 0 ? selectedTypes : undefined);
  };

  const exportImage = () => {
    (reactFlowInstance.current as any)?.toImage?.({ 
      quality: 1, 
      backgroundColor: '#0f172a' 
    }).then((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parallelos-graph-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const toggleFilters = () => setShowFilters(prev => !prev);

  useEffect(() => {
    const handleClickOutside = () => setShowSearchResults(false);
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  if (loading && !demoInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#0f172a',
        color: '#f8fafc',
        gap: '24px',
      }}>
        <svg className="animate-spin" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.75" strokeLinecap="round" />
        </svg>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Loading Organization Twin</h2>
          <p style={{ margin: 0, color: '#94a3b8' }}>Initializing graph visualization...</p>
        </div>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      background: 'radial-gradient(circle at 10% 12%, rgba(249, 115, 22, 0.14) 0%, transparent 45%), radial-gradient(circle at 90% 88%, rgba(16, 185, 129, 0.14) 0%, transparent 45%), #090e13', 
      position: 'relative',
      overflow: 'hidden',
    }}>
      {error && (
        <div style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ef4444',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '90vw',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ 
            background: 'transparent', 
            border: 'none', 
            color: '#ffffff', 
            cursor: 'pointer',
            padding: '4px',
          }}>
            ×
          </button>
        </div>
      )}

      {!demoInitialized && (
        <div style={{
          position: 'fixed',
          top: error ? '72px' : '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(14, 22, 32, 0.95)',
          border: '1px solid rgba(249, 115, 22, 0.4)',
          color: '#f8fafc',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(249, 115, 22, 0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '90vw',
          backdropFilter: 'blur(10px)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg>
          <span style={{ flex: 1 }}>
            Welcome to ParallelOS Organization Twin. Click below to load the Aurelia Global Technologies demo data.
          </span>
          <button 
            onClick={handleInitializeDemo}
            disabled={initializing}
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #10b981 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: initializing ? 'not-allowed' : 'pointer',
              opacity: initializing ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
            }}
          >
            {initializing ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.75" strokeLinecap="round" /></svg>
                Loading...
              </>
            ) : (
              'Load Demo Data'
            )}
          </button>
        </div>
      )}

      <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
        <ReactFlow<GraphNode, GraphEdge>
          ref={reactFlowInstance as any}
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          onViewportChange={onViewportChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypesMemo}
          fitView={false}
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
          connectionMode={ConnectionMode.Loose}
          elementsSelectable={true}
          minZoom={0.1}
          maxZoom={2}
          snapToGrid={false}
          snapGrid={[20, 20]}
        >
          <Background 
            color="#1e293b" 
            gap={20} 
            size={1} 
            style={{ opacity: 0.5 }}
          />
          <Controls position="bottom-right" />
          <MiniMap 
            position="bottom-left" 
            nodeColor={(node) => ENTITY_TYPE_COLORS[(node.data as any)?.entity?.type as string]?.border || '#3b82f6'}
            maskColor="rgba(15, 23, 42, 0.8)"
          />
        </ReactFlow>
      </div>

      <Toolbar
        selectedTypes={selectedTypes as any}
        onTypeToggle={handleTypeToggle}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitView={fitView}
        onResetLayout={resetLayout}
        onToggleFilters={toggleFilters}
        showFilters={showFilters}
        nodeCount={nodeCount}
        edgeCount={edgeCount}
        onExportImage={exportImage}
      />

      {showSearchResults && searchResults.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '72px',
          left: '16px',
          right: '16px',
          maxWidth: '600px',
          margin: '0 auto',
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          zIndex: 200,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#f8fafc' }}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </span>
            <button onClick={() => { setShowSearchResults(false); setSearchQuery(''); }} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {searchResults.map(entity => (
              <button
                key={entity.id}
                onClick={() => handleSearchResultClick(entity)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: '1px solid #1e293b',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'background 0.15s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#111827'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: ENTITY_TYPE_COLORS[entity.type]?.bg || '#1e3a5f',
                  border: `2px solid ${ENTITY_TYPE_COLORS[entity.type]?.border || '#3b82f6'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entity.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>
                    {entity.type.replace(/_/g, ' ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedEntity && (
        <SidePanel
          entity={selectedEntity}
          relationships={entityRelationships}
          onClose={() => setSelectedEntity(null)}
          onNavigateToEntity={loadEntityDetails}
        />
      )}

      {nodes.length === 0 && !loading && demoInitialized && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          padding: '48px',
          background: '#0a1120',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          maxWidth: '480px',
        }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#1e3a5f', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
          </div>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: 600, color: '#f8fafc' }}>
            No entities to display
          </h2>
          <p style={{ margin: '0 0 24px 0', color: '#94a3b8', lineHeight: 1.6 }}>
            Use the toolbar to select entity types to display, or search for specific entities.
          </p>
          <button 
            onClick={() => loadGraphData()}
            style={{
              background: '#3b82f6',
              border: 'none',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Show All Entities
          </button>
        </div>
      )}
    </div>
  );
};

export default OrganizationTwin;