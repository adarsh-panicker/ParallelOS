// Custom Relationship Edge Component for React Flow

import React from 'react';
import { EdgeTypes, BaseEdge } from '@xyflow/react';
import { Relationship, RELATIONSHIP_TYPE_COLORS } from '../types';

interface RelationshipEdgeProps {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: {
    relationship: import('../types').Relationship;
  };
  style?: React.CSSProperties;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  belongs_to: 'belongs to',
  manages: 'manages',
  owns: 'owns',
  depends_on: 'depends on',
  blocks: 'blocks',
  feeds: 'feeds',
  runs_on: 'runs on',
  hosts: 'hosts',
  connects_to: 'connects to',
  supplied_by: 'supplied by',
  located_at: 'located at',
  serves: 'serves',
  funds: 'funds',
  allocated_to: 'allocated to',
  custom: 'custom',
};

const RELATIONSHIP_STYLE: Record<string, { strokeDasharray?: string; strokeWidth: number }> = {
  belongs_to: { strokeWidth: 2 },
  manages: { strokeWidth: 2, strokeDasharray: '5,5' },
  owns: { strokeWidth: 3 },
  depends_on: { strokeWidth: 2, strokeDasharray: '3,3' },
  blocks: { strokeWidth: 3, strokeDasharray: '1,2' },
  feeds: { strokeWidth: 2 },
  runs_on: { strokeWidth: 2 },
  hosts: { strokeWidth: 1 },
  connects_to: { strokeWidth: 1, strokeDasharray: '5,5' },
  supplied_by: { strokeWidth: 1, strokeDasharray: '5,5' },
  located_at: { strokeWidth: 1 },
  serves: { strokeWidth: 1, strokeDasharray: '5,5' },
  funds: { strokeWidth: 2 },
  allocated_to: { strokeWidth: 2, strokeDasharray: '5,5' },
  custom: { strokeWidth: 1 },
};

export const RelationshipEdge = ({
  id,
  source,
  target,
  data,
  style = {},
}: RelationshipEdgeProps) => {
  const relationship = data?.relationship;
  const type = relationship?.type || 'custom';
  const color = RELATIONSHIP_TYPE_COLORS[type as keyof typeof RELATIONSHIP_TYPE_COLORS] || '#6b7280';
  const label = RELATIONSHIP_LABELS[type] || type;
  const edgeStyle = RELATIONSHIP_STYLE[type] || { strokeWidth: 1 };
  
  const isHard = relationship?.dependencyStrength === 'hard';

  return (
    <svg
      id={id}
      style={{
        position: 'absolute',
        stroke: color,
        strokeWidth: RELATIONSHIP_STYLE[type as keyof typeof RELATIONSHIP_STYLE]?.strokeWidth || 1,
        strokeDasharray: RELATIONSHIP_STYLE[type as keyof typeof RELATIONSHIP_STYLE]?.strokeDasharray,
        ...style,
      }}
    >
      <line
        x1={0}
        y1={0}
        x2={100}
        y2={0}
        markerEnd="url(#arrowhead)"
      />
    </svg>
  );
};

export const edgeTypes = {
  relationshipEdge: RelationshipEdge,
} satisfies EdgeTypes;

export default RelationshipEdge;