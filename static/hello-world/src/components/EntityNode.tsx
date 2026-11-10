// Custom Entity Node Component for React Flow

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  Building2, Building, User, Briefcase, 
  GitBranch, Server, HardDrive, MapPin, 
  Handshake, DollarSign, Zap, Circle 
} from 'lucide-react';
import { Entity, EntityType, ENTITY_TYPE_COLORS } from '../types';

interface EntityNodeProps {
  data: {
    entity: Entity;
    onClick?: (entity: Entity) => void;
  };
}

const ENTITY_ICONS_MAP: Record<string, React.FC<{ size?: number }>> = {
  organization: Building2 as any,
  department: Building as any,
  employee: User as any,
  role: Circle as any,
  project: Briefcase as any,
  business_process: GitBranch as any,
  business_system: Server as any,
  it_asset: HardDrive as any,
  location: MapPin as any,
  vendor: Handshake as any,
  budget: DollarSign as any,
  resource: Zap as any,
};

export const EntityNode: React.FC<{ data: { entity: import('../types').Entity; onClick?: (entity: import('../types').Entity) => void } }> = ({ data }) => {
  const { entity, onClick } = data;
  const colors = ENTITY_TYPE_COLORS[entity.type];
  const Icon = ENTITY_ICONS_MAP[entity.type] as any;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(entity);
  };

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
      case 'actual': return '#22c55e';
      case 'imported': return '#3b82f6';
      case 'assumed': return '#f59e0b';
      case 'ai-hypothesis': return '#a855f7';
      case 'simulated': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div 
      className="entity-node"
      onClick={handleClick}
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '12px',
        minWidth: '220px',
        maxWidth: '280px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Header with icon and type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Icon size={20} style={{ color: colors.border }} />
        <span style={{ 
          background: colors.border, 
          color: '#0f172a', 
          padding: '2px 8px', 
          borderRadius: '4px', 
          fontSize: '10px', 
          fontWeight: 600,
          textTransform: 'uppercase',
        }}>
          {entity.type.toUpperCase().replace(/_/g, ' ').slice(0, 4)}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          {/* Criticality indicator */}
          <div 
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: (() => {
                switch (entity.criticality) {
                  case 'critical': return '#ef4444';
                  case 'high': return '#f97316';
                  case 'medium': return '#f59e0b';
                  default: return '#22c55e';
                }
              })(),
            }} 
          />
          {/* Source indicator */}
          <div 
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: (() => {
                switch (entity.source) {
                  case 'actual': return '#22c55e';
                  case 'imported': return '#3b82f6';
                  case 'assumed': return '#f59e0b';
                  case 'ai-hypothesis': return '#a855f7';
                  case 'simulated': return '#ef4444';
                  default: return '#6b7280';
                }
              })(),
            }} 
          />
        </div>
      </div>

      {/* Entity name */}
      <h3 style={{ 
        margin: '0 0 4px 0', 
        fontSize: '14px', 
        fontWeight: 600, 
        color: '#f8fafc',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {entity.name}
      </h3>

      {/* Description */}
      {entity.description && (
        <p style={{ 
          margin: '0 0 8px 0', 
          fontSize: '11px', 
          color: '#94a3b8',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {entity.description}
        </p>
      )}

      {/* Key properties */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '6px',
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(148, 163, 184, 0.2)',
      }}>
        {Object.entries(entity.properties).slice(0, 4).map(([key, value]) => (
          <span 
            key={key}
            style={{ 
              background: 'rgba(148, 163, 184, 0.1)', 
              color: '#94a3b8', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              fontSize: '10px',
              fontFamily: 'monospace',
            }}
            title={`${key}: ${String(value)}`}
          >
            {key}: {String(value).slice(0, 20)}
          </span>
        ))}
        {Object.keys(entity.properties).length > 4 && (
          <span style={{ 
            background: 'rgba(148, 163, 184, 0.1)', 
            color: '#64748b', 
            padding: '2px 6px', 
            borderRadius: '4px', 
            fontSize: '10px',
          }}>
            +{Object.keys(entity.properties).length - 4} more
          </span>
        )}
      </div>

      {/* Connection handles */}
      <Handle type="target" position={Position.Left} style={{ background: colors.border }} />
      <Handle type="source" position={Position.Right} style={{ background: colors.border }} />
    </div>
  );
};

export default EntityNode;