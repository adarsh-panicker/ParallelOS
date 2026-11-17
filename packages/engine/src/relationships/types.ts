// packages/engine/src/relationships/types.ts

import { RelationshipId, EntityId, VersionId, RelationshipType, RelationshipDirection, DependencyStrength, Criticality } from '../entities/types';

/**
 * Redundancy information for relationships
 */
export interface RedundancyInfo {
  hasRedundancy: boolean;
  redundancyType?: 'active-passive' | 'active-active' | 'load-balanced' | 'geo-redundant';
  failoverTimeMs?: number;
  failoverCapacityPercent?: number;
  backupEntityIds?: EntityId[];
}

/**
 * Evidence reference for relationship provenance
 */
export interface EvidenceRef {
  type: 'jira_issue' | 'confluence_page' | 'document' | 'interview' | 'assumption' | 'ai_inference';
  referenceId: string;
  description: string;
  accessedAt: number;
}

/**
 * Relationship schema
 */
export interface Relationship {
  id: RelationshipId;
  sourceId: EntityId;
  targetId: EntityId;
  type: RelationshipType;
  direction: RelationshipDirection;
  criticality: Criticality;
  dependencyStrength: DependencyStrength;
  redundancyInfo?: RedundancyInfo;
  confidence: number; // 0-1
  evidence: EvidenceRef[];
  properties: Record<string, unknown>;
  version: VersionId;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

/**
 * Propagation factor calculation context
 */
export interface PropagationContext {
  sourceImpact: {
    entityId: EntityId;
    impactSeverity: Criticality;
    impactType: 'direct' | 'indirect';
  };
  relationship: Relationship;
  targetEntity: {
    id: EntityId;
    type: string;
    properties: Record<string, unknown>;
  };
  pathSoFar: DependencyPathStep[];
  globalContext: {
    entities: Map<EntityId, any>;
    relationships: Map<RelationshipId, Relationship>;
  };
}

/**
 * Dependency path step for provenance
 */
export interface DependencyPathStep {
  relationshipId: RelationshipId;
  sourceEntityId: EntityId;
  targetEntityId: EntityId;
  relationshipType: RelationshipType;
  propagationFactor: number;
  redundancyMitigated: boolean;
}

/**
 * Propagation rule for a relationship type
 */
export interface PropagationRule {
  relationshipType: RelationshipType | string;
  baseFactor: number;
  reverseFlow: boolean;
  calculateFactor: (rel: Relationship, ctx: PropagationContext) => number;
}