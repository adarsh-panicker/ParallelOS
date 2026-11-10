// packages/engine/tests/relationships.test.ts

import { describe, it, expect } from 'vitest';
import {
  RelationshipType,
  DependencyStrength,
  Criticality,
  RelationshipDirection,
  createRelationship,
  belongsTo,
  manages,
  owns,
  dependsOn,
  runsOn,
  hosts,
  connectsTo,
  suppliedBy,
  locatedAt,
  funds,
  allocatedTo,
  createActiveActiveRedundancy,
  createActivePassiveRedundancy,
  createNoRedundancy,
  RelationshipSchema,
  RedundancyInfoSchema,
  EvidenceRefSchema,
  EntityId,
  createEntityId,
} from '../src';

describe('Relationship Types', () => {
  it('should have all required relationship types', () => {
    expect(RelationshipType.BelongsTo).toBe('belongs_to');
    expect(RelationshipType.Manages).toBe('manages');
    expect(RelationshipType.Owns).toBe('owns');
    expect(RelationshipType.DependsOn).toBe('depends_on');
    expect(RelationshipType.RunsOn).toBe('runs_on');
    expect(RelationshipType.Hosts).toBe('hosts');
    expect(RelationshipType.ConnectsTo).toBe('connects_to');
    expect(RelationshipType.SuppliedBy).toBe('supplied_by');
    expect(RelationshipType.LocatedAt).toBe('located_at');
    expect(RelationshipType.Funds).toBe('funds');
    expect(RelationshipType.AllocatedTo).toBe('allocated_to');
  });
});

describe('Relationship Creation', () => {
  const sourceId = createEntityId('123e4567-e89b-12d3-a456-426614174000');
  const targetId = createEntityId('123e4567-e89b-12d3-a456-426614174001');
  const creator = 'user-1';

  it('should create a basic relationship', () => {
    const rel = createRelationship(sourceId, targetId, RelationshipType.DependsOn, creator);
    expect(rel.sourceId).toBe(sourceId);
    expect(rel.targetId).toBe(targetId);
    expect(rel.type).toBe(RelationshipType.DependsOn);
    expect(rel.direction).toBe(RelationshipDirection.Outbound);
    expect(rel.dependencyStrength).toBe(DependencyStrength.Soft);
    expect(rel.criticality).toBe(Criticality.Medium);
    expect(rel.confidence).toBe(1);
    expect(rel.evidence).toEqual([]);
  });

  it('should create belongsTo with hard dependency', () => {
    const rel = belongsTo(sourceId, targetId, creator);
    expect(rel.type).toBe(RelationshipType.BelongsTo);
    expect(rel.dependencyStrength).toBe(DependencyStrength.Hard);
    expect(rel.criticality).toBe(Criticality.High);
  });

  it('should create manages relationship', () => {
    const rel = manages(sourceId, targetId, creator);
    expect(rel.type).toBe(RelationshipType.Manages);
    expect(rel.dependencyStrength).toBe(DependencyStrength.Soft);
  });

  it('should create owns relationship', () => {
    const rel = owns(sourceId, targetId, creator);
    expect(rel.type).toBe(RelationshipType.Owns);
    expect(rel.dependencyStrength).toBe(DependencyStrength.Hard);
    expect(rel.criticality).toBe(Criticality.High);
  });

  it('should create dependsOn with configurable strength', () => {
    const hard = dependsOn(sourceId, targetId, creator, true);
    expect(hard.dependencyStrength).toBe(DependencyStrength.Hard);
    expect(hard.criticality).toBe(Criticality.High);

    const soft = dependsOn(sourceId, targetId, creator, false);
    expect(soft.dependencyStrength).toBe(DependencyStrength.Soft);
    expect(soft.criticality).toBe(Criticality.Medium);
  });

  it('should create runsOn with redundancy', () => {
    const redundancy = createActivePassiveRedundancy(['backup-1']);
    const rel = runsOn(sourceId, targetId, creator, redundancy);
    expect(rel.type).toBe(RelationshipType.RunsOn);
    expect(rel.redundancyInfo?.hasRedundancy).toBe(true);
    expect(rel.redundancyInfo?.redundancyType).toBe('active-passive');
  });

  it('should create funds relationship', () => {
    const rel = funds(sourceId, targetId, creator);
    expect(rel.type).toBe(RelationshipType.Funds);
    expect(rel.dependencyStrength).toBe(DependencyStrength.Hard);
  });
});

describe('Redundancy Helpers', () => {
  it('should create active-active redundancy', () => {
    const red = createActiveActiveRedundancy(['backup-1', 'backup-2']);
    expect(red.hasRedundancy).toBe(true);
    expect(red.redundancyType).toBe('active-active');
    expect(red.failoverTimeMs).toBe(100);
    expect(red.failoverCapacityPercent).toBe(100);
  });

  it('should create active-passive redundancy', () => {
    const red = createActivePassiveRedundancy(['backup-1']);
    expect(red.hasRedundancy).toBe(true);
    expect(red.redundancyType).toBe('active-passive');
    expect(red.failoverTimeMs).toBe(30000);
    expect(red.failoverCapacityPercent).toBe(100);
  });

  it('should create no redundancy', () => {
    const red = createNoRedundancy();
    expect(red.hasRedundancy).toBe(false);
    expect(red.redundancyType).toBeUndefined();
  });
});

describe('Zod Schemas', () => {
  it('should validate redundancy info', () => {
    const result = RedundancyInfoSchema.safeParse({
      hasRedundancy: true,
      redundancyType: 'active-active',
      failoverTimeMs: 100,
      failoverCapacityPercent: 100,
      backupEntityIds: ['123e4567-e89b-12d3-a456-426614174000'],
    });
    expect(result.success).toBe(true);
  });

  it('should validate evidence ref', () => {
    const result = EvidenceRefSchema.safeParse({
      type: 'jira_issue',
      referenceId: 'PROJ-123',
      description: 'Jira issue documenting this dependency',
      accessedAt: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it('should validate relationship', () => {
    const result = RelationshipSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      sourceId: '123e4567-e89b-12d3-a456-426614174001',
      targetId: '123e4567-e89b-12d3-a456-426614174002',
      type: 'depends_on',
      direction: 'outbound',
      criticality: 'high',
      dependencyStrength: 'hard',
      confidence: 0.9,
      evidence: [],
      properties: {},
      version: '123e4567-e89b-12d3-a456-426614174003',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'user-1',
    });
    expect(result.success).toBe(true);
  });
});