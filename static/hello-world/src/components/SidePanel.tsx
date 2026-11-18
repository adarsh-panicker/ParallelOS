// Side Panel Component for Entity Inspection

import React from 'react';
import { X } from 'lucide-react';
import type { Entity, Relationship } from '../types';
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_LABELS, ENTITY_ICONS_MAP } from '../types';

interface SidePanelProps {
  entity: import('../types').Entity | null;
  relationships: import('../types').Relationship[];
  onClose: () => void;
  onNavigateToEntity?: (entityId: string) => void;
}

const getCriticalityColor = (criticality: string) => {
  switch (criticality) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#f59e0b';
    default: return '#22c55e';
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case 'actual': return { bg: '#22c55e', text: '#f0fdf4', label: 'Actual' };
    case 'imported': return { bg: '#3b82f6', text: '#eff6ff', label: 'Imported' };
    case 'assumed': return { bg: '#f59e0b', text: '#fffbeb', label: 'Assumed' };
    case 'ai-hypothesis': return { bg: '#a855f7', text: '#faf5ff', label: 'AI Hypothesis' };
    case 'simulated': return { bg: '#ef4444', text: '#fef2f2', label: 'Simulated' };
    default: return { bg: '#6b7280', text: '#f3f4f6', label: source };
  }
};

const formatTimestamp = (ts: number): string => {
  return new Date(ts).toLocaleString();
};

const formatPropertyValue = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && value.length > 50) return value.slice(0, 50) + '...';
  return String(value);
};

export const SidePanel: React.FC<SidePanelProps> = ({ entity, relationships = [], onClose, onNavigateToEntity }) => {
  if (!entity) return null;

  const entityType = entity.type || 'organization';
  const colors = ENTITY_TYPE_COLORS[entityType] || { bg: '#1e293b', border: '#64748b' };
  const typeLabel = entityType.toUpperCase().replace(/_/g, ' ');
  const safeProperties = (entity.properties && typeof entity.properties === 'object') ? entity.properties : {};
  const safeVersion = typeof entity.version === 'string' ? entity.version : '1.0.0';
  const safeCriticality = entity.criticality || 'medium';
  const safeSource = entity.source || 'actual';
  const safeName = entity.name || 'Unnamed Entity';

  const outboundRels = (relationships || []).filter(r => r && r.sourceId === entity.id);
  const inboundRels = (relationships || []).filter(r => r && r.targetId === entity.id);

  return (
    <div className="side-panel" style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '420px',
      height: '100%',
      background: '#0f172a',
      borderLeft: '1px solid #1e293b',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.4)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '16px',
        borderBottom: '1px solid #1e293b',
        background: '#0a1120',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            background: colors.bg,
            border: `2px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '24px' }}>📦</span>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
              {safeName}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{
                background: colors.border,
                color: '#0f172a',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 600,
              }}>
                {typeLabel}
              </span>
              <span style={{
                background: safeCriticality === 'critical' ? '#ef4444' : safeCriticality === 'high' ? '#f97316' : '#22c55e',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 500,
              }}>
                {safeCriticality.toUpperCase()}
              </span>
              <span style={{
                background: '#10b981',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 500,
              }}>
                {safeSource.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#1e293b'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {entity.description && (
          <div style={{ marginBottom: '24px', padding: '16px', background: '#111827', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Description
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
              {entity.description}
            </p>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Properties
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <PropertyRow label="ID" value={entity.id || 'N/A'} copyable />
            <PropertyRow label="Type" value={entityType} />
            <PropertyRow label="State" value={entity.state || 'active'} />
            <PropertyRow label="Version" value={safeVersion.slice(0, 8)} copyable />
            <PropertyRow label="Created" value={entity.createdAt ? new Date(entity.createdAt).toLocaleString() : 'N/A'} />
            <PropertyRow label="Updated" value={entity.updatedAt ? new Date(entity.updatedAt).toLocaleString() : 'N/A'} />
            <PropertyRow label="Created By" value={entity.createdBy || 'system'} />
            <PropertyRow label="Updated By" value={entity.updatedBy || 'system'} />
          </div>
        </div>

        {Object.keys(safeProperties).length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Custom Properties
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(safeProperties).map(([key, value]) => (
                <PropertyRow key={key} label={key} value={formatPropertyValue(value)} />
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Relationships ({relationships.length})
          </h3>
          
          {outboundRels.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Outbound ({outboundRels.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {outboundRels.slice(0, 10).map(rel => (
                  <RelationshipRow 
                    key={rel.id} 
                    relationship={rel} 
                    direction="outbound"
                    onNavigate={onNavigateToEntity}
                  />
                ))}
                {outboundRels.length > 10 && (
                  <span style={{ fontSize: '11px', color: '#64748b', padding: '4px' }}>
                    +{outboundRels.length - 10} more...
                  </span>
                )}
              </div>
            </div>
          )}

          {inboundRels.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 600, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Inbound ({inboundRels.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {inboundRels.slice(0, 10).map(rel => (
                  <RelationshipRow 
                    key={rel.id} 
                    relationship={rel} 
                    direction="inbound"
                    onNavigate={onNavigateToEntity}
                  />
                ))}
                {inboundRels.length > 10 && (
                  <span style={{ fontSize: '11px', color: '#64748b', padding: '4px' }}>
                    +{inboundRels.length - 10} more...
                  </span>
                )}
              </div>
            </div>
          )}

          {relationships.length === 0 && (
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '24px' }}>
              No relationships found
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const PropertyRow = ({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) => (
  <div style={{ display: 'contents' }}>
    <div style={{ 
      gridColumn: 'span 1', 
      fontSize: '10px', 
      color: '#64748b', 
      textTransform: 'uppercase', 
      letterSpacing: '0.05em',
      padding: '4px 0',
    }}>
      {label}
    </div>
    <div style={{ 
      gridColumn: 'span 1', 
      fontSize: '12px', 
      color: '#e2e8f0',
      fontFamily: 'monospace',
      padding: '4px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      wordBreak: 'break-all',
    }}>
      <span>{value}</span>
      {copyable && (
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: '4px',
            opacity: 0,
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '0'}
          title="Copy to clipboard"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      )}
    </div>
  </div>
);

const RelationshipRow = ({ 
  relationship, 
  direction, 
  onNavigate 
}: { 
  relationship: import('../types').Relationship; 
  direction: 'inbound' | 'outbound';
  onNavigate?: (entityId: string) => void;
}) => {
  const isOutbound = direction === 'outbound';
  const otherEntityId = (isOutbound ? relationship?.targetId : relationship?.sourceId) || '';
  const relType = (relationship?.type || 'related_to').replace(/_/g, ' ');
  
  return (
    <button
      onClick={() => otherEntityId && onNavigate?.(otherEntityId)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        background: '#111827',
        border: '1px solid #1e293b',
        borderRadius: '6px',
        cursor: otherEntityId ? 'pointer' : 'default',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.2s',
      }}
      onMouseOver={(e) => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.borderColor = '#334155'; }}
      onMouseOut={(e) => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.borderColor = '#1e293b'; }}
    >
      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
        {'→'}
      </span>
      <span style={{ 
        fontSize: '11px', 
        color: '#94a3b8', 
        flex: 1,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {relType}
      </span>
      <span style={{ 
        fontSize: '10px', 
        color: '#64748b',
        fontFamily: 'monospace',
      }}>
        {otherEntityId ? `${otherEntityId.slice(0, 8)}...` : 'unknown'}
      </span>
    </button>
  );
};

export default SidePanel;