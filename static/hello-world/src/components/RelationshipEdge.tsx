// Custom Relationship Edge Component for React Flow

import React from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';
import { RELATIONSHIP_TYPE_COLORS } from '../types';

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

export const RelationshipEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const relationship = (data as any)?.relationship;
  const type = relationship?.type || 'custom';
  const color = RELATIONSHIP_TYPE_COLORS[type as keyof typeof RELATIONSHIP_TYPE_COLORS] || '#6b7280';
  const strokeConfig = RELATIONSHIP_STYLE[type as keyof typeof RELATIONSHIP_STYLE] || { strokeWidth: 1 };

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: color,
        strokeWidth: strokeConfig.strokeWidth || 1,
        strokeDasharray: strokeConfig.strokeDasharray,
        ...style,
      }}
    />
  );
};

export const edgeTypes = {
  relationshipEdge: RelationshipEdge,
};

export default RelationshipEdge;
