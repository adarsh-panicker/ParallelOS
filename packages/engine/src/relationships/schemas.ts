// packages/engine/src/relationships/schemas.ts

import { z } from 'zod';
import {
  RelationshipId,
  EntityId,
  VersionId,
  RelationshipType,
  RelationshipDirection,
  DependencyStrength,
  Criticality,
} from '../entities/types';
import { RedundancyInfo, EvidenceRef, Relationship } from './types';

/**
 * Zod schemas for relationship validation
 */
export const RedundancyInfoSchema = z.object({
  hasRedundancy: z.boolean(),
  redundancyType: z.enum(['active-passive', 'active-active', 'load-balanced', 'geo-redundant']).optional(),
  failoverTimeMs: z.number().int().nonnegative().optional(),
  failoverCapacityPercent: z.number().min(0).max(100).optional(),
  backupEntityIds: z.array(z.string().uuid()).optional(),
});

export const EvidenceRefSchema = z.object({
  type: z.enum(['jira_issue', 'confluence_page', 'document', 'interview', 'assumption', 'ai_inference']),
  referenceId: z.string().min(1),
  description: z.string().max(500),
  accessedAt: z.number().int().positive(),
});

export const RelationshipSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  type: z.nativeEnum(RelationshipType),
  direction: z.nativeEnum(RelationshipDirection),
  criticality: z.nativeEnum(Criticality).default(Criticality.Medium),
  dependencyStrength: z.nativeEnum(DependencyStrength).default(DependencyStrength.Soft),
  redundancyInfo: RedundancyInfoSchema.optional(),
  confidence: z.number().min(0).max(1).default(1),
  evidence: z.array(EvidenceRefSchema).default([]),
  properties: z.record(z.unknown()).default({}),
  version: z.string().uuid(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  createdBy: z.string().min(1),
});

export type RelationshipSchemaType = z.infer<typeof RelationshipSchema>;

/**
 * Factory functions for creating relationships
 * Accepts string IDs and converts to branded types internally
 */
export function createRelationship(
  sourceId: string | EntityId,
  targetId: string | EntityId,
  type: RelationshipType,
  createdBy: string,
  overrides: Partial<Relationship> = {}
): Relationship {
  const now = Date.now();
  const id = crypto.randomUUID();
  const version = crypto.randomUUID();
  
  return {
    id: id as RelationshipId,
    sourceId: sourceId as EntityId,
    targetId: targetId as EntityId,
    type,
    direction: RelationshipDirection.Outbound,
    criticality: Criticality.Medium,
    dependencyStrength: DependencyStrength.Soft,
    confidence: 1,
    evidence: [],
    properties: {},
    version: version as VersionId,
    createdAt: now,
    updatedAt: now,
    createdBy,
    ...overrides,
  };
}

/**
 * Common relationship creators
 */
export function belongsTo(
  employeeId: string | EntityId,
  departmentId: string | EntityId,
  createdBy: string
): Relationship {
  return createRelationship(employeeId, departmentId, RelationshipType.BelongsTo, createdBy, {
    dependencyStrength: DependencyStrength.Hard,
    criticality: Criticality.High,
  });
}

export function manages(
  managerId: string | EntityId,
  subordinateId: string | EntityId,
  createdBy: string
): Relationship {
  return createRelationship(managerId, subordinateId, RelationshipType.Manages, createdBy, {
    dependencyStrength: DependencyStrength.Soft,
    criticality: Criticality.Medium,
  });
}

export function owns(
  ownerId: string | EntityId,
  ownedId: string | EntityId,
  createdBy: string
): Relationship {
  return createRelationship(ownerId, ownedId, RelationshipType.Owns, createdBy, {
    dependencyStrength: DependencyStrength.Hard,
    criticality: Criticality.High,
  });
}

export function dependsOn(
  sourceId: string | EntityId,
  targetId: string | EntityId,
  createdBy: string,
  isHard: boolean = false
): Relationship {
  return createRelationship(sourceId, targetId, RelationshipType.DependsOn, createdBy, {
    dependencyStrength: isHard ? DependencyStrength.Hard : DependencyStrength.Soft,
    criticality: isHard ? Criticality.High : Criticality.Medium,
  });
}

export function blocks(
  blockerId: string | EntityId,
  blockedId: string | EntityId,
  createdBy: string
): Relationship {
  return createRelationship(blockerId, blockedId, RelationshipType.Blocks, createdBy, {
    dependencyStrength: DependencyStrength.Hard,
    criticality: Criticality.Critical,
  });
}

export function feeds(
  sourceId: string | EntityId,
  targetId: string | EntityId,
  createdBy: string
): Relationship {
  return createRelationship(sourceId, targetId, RelationshipType.Feeds, createdBy, {
    dependencyStrength: DependencyStrength.Soft,
    criticality: Criticality.Medium,
  });
}

export function runsOn(
  systemId: string | EntityId,
  assetId: string | EntityId,
  createdBy: string,
  redundancy?: RedundancyInfo
): Relationship {
  return createRelationship(systemId, assetId, RelationshipType.RunsOn, createdBy, {
    direction: RelationshipDirection.Outbound,
    dependencyStrength: DependencyStrength.Hard,
    criticality: Criticality.Critical,
    redundancyInfo: redundancy,
  });
}

export function hosts(
  assetId: string | EntityId,
  systemId: string | EntityId,
  createdBy: string
): Relationship {
  return createRelationship(assetId, systemId, RelationshipType.Hosts, createdBy, {
    dependencyStrength: DependencyStrength.Soft,
    criticality: Criticality.Medium,
  });
}

export function connectsTo(
  sourceId: string | EntityId,
  targetId: string | EntityId,
  createdBy: string
): Relationship {
  return createRelationship(sourceId, targetId, RelationshipType.ConnectsTo, createdBy, {
    direction: RelationshipDirection.Bidirectional,
    dependencyStrength: DependencyStrength.Soft,
    criticality: Criticality.Medium,
  });
}

export function suppliedBy(
  systemId: string | EntityId,
  vendorId: string | EntityId,
  createdBy: string
): Relationship {
  return createRelationship(systemId, vendorId, RelationshipType.SuppliedBy, createdBy, {
    dependencyStrength: DependencyStrength.Soft,
    criticality: Criticality.Medium,
  });
}

export function locatedAt(
  entityId: string | EntityId,
  locationId: string | EntityId,
  createdBy: string
): Relationship {
  return createRelationship(entityId, locationId, RelationshipType.LocatedAt, createdBy, {
    dependencyStrength: DependencyStrength.Soft,
    criticality: Criticality.Low,
  });
}

export function serves(
  locationId: string | EntityId,
  entityId: string | EntityId,
  createdBy: string
): Relationship {
  return createRelationship(locationId, entityId, RelationshipType.Serves, createdBy, {
    dependencyStrength: DependencyStrength.Soft,
    criticality: Criticality.Low,
  });
}

export function funds(
  budgetId: string | EntityId,
  targetId: string | EntityId,
  createdBy: string
): Relationship {
  return createRelationship(budgetId, targetId, RelationshipType.Funds, createdBy, {
    dependencyStrength: DependencyStrength.Hard,
    criticality: Criticality.High,
  });
}

export function allocatedTo(
  resourceId: string | EntityId,
  targetId: string | EntityId,
  createdBy: string
): Relationship {
  return createRelationship(resourceId, targetId, RelationshipType.AllocatedTo, createdBy, {
    dependencyStrength: DependencyStrength.Soft,
    criticality: Criticality.Medium,
  });
}

/**
 * Redundancy helpers
 */
export function createActiveActiveRedundancy(backupIds: EntityId[] = []): RedundancyInfo {
  return {
    hasRedundancy: true,
    redundancyType: 'active-active',
    failoverTimeMs: 100,
    failoverCapacityPercent: 100,
    backupEntityIds: backupIds,
  };
}

export function createActivePassiveRedundancy(backupIds: EntityId[] = []): RedundancyInfo {
  return {
    hasRedundancy: true,
    redundancyType: 'active-passive',
    failoverTimeMs: 30000, // 30 seconds
    failoverCapacityPercent: 100,
    backupEntityIds: backupIds,
  };
}

export function createGeoRedundancy(backupIds: EntityId[] = []): RedundancyInfo {
  return {
    hasRedundancy: true,
    redundancyType: 'geo-redundant',
    failoverTimeMs: 60000, // 1 minute
    failoverCapacityPercent: 80,
    backupEntityIds: backupIds,
  };
}

export function createNoRedundancy(): RedundancyInfo {
  return {
    hasRedundancy: false,
  };
}