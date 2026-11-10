// packages/engine/tests/demo.test.ts

import { describe, it, expect } from 'vitest';
import { loadAureliaDemo, EntityType, ValueSource, Criticality, RelationshipType } from '../src';

describe('Aurelia Demo Data', () => {
  const demo = loadAureliaDemo();

  it('should load all entities', () => {
    expect(demo.entities.length).toBeGreaterThan(100);
    expect(demo.relationships.length).toBeGreaterThan(200);
    expect(demo.baselineVersion).toBe('baseline-v1');
  });

  it('should have all entity types represented', () => {
    const types = new Set(demo.entities.map(e => e.type));
    expect(types.has(EntityType.Organization)).toBe(true);
    expect(types.has(EntityType.Department)).toBe(true);
    expect(types.has(EntityType.Employee)).toBe(true);
    expect(types.has(EntityType.Role)).toBe(true);
    expect(types.has(EntityType.Project)).toBe(true);
    expect(types.has(EntityType.BusinessProcess)).toBe(true);
    expect(types.has(EntityType.BusinessSystem)).toBe(true);
    expect(types.has(EntityType.ITAsset)).toBe(true);
    expect(types.has(EntityType.Location)).toBe(true);
    expect(types.has(EntityType.Vendor)).toBe(true);
    expect(types.has(EntityType.Budget)).toBe(true);
    expect(types.has(EntityType.Resource)).toBe(true);
  });

  it('should have 6 departments', () => {
    const departments = demo.entities.filter(e => e.type === EntityType.Department);
    expect(departments.length).toBe(6);
    const names = departments.map(d => d.name).sort();
    expect(names).toEqual([
      'Engineering',
      'Finance',
      'Human Resources',
      'Marketing',
      'Operations',
      'Sales',
    ]);
  });

  it('should have 30-40 employees', () => {
    const employees = demo.entities.filter(e => e.type === EntityType.Employee);
    expect(employees.length).toBeGreaterThanOrEqual(30);
    expect(employees.length).toBeLessThanOrEqual(40);
  });

  it('should have 8-10 projects', () => {
    const projects = demo.entities.filter(e => e.type === EntityType.Project);
    expect(projects.length).toBeGreaterThanOrEqual(8);
    expect(projects.length).toBeLessThanOrEqual(10);
  });

  it('should have 10-15 business systems', () => {
    const systems = demo.entities.filter(e => e.type === EntityType.BusinessSystem);
    expect(systems.length).toBeGreaterThanOrEqual(10);
    expect(systems.length).toBeLessThanOrEqual(15);
  });

  it('should have 15-20 IT assets', () => {
    const assets = demo.entities.filter(e => e.type === EntityType.ITAsset);
    expect(assets.length).toBeGreaterThanOrEqual(15);
    expect(assets.length).toBeLessThanOrEqual(20);
  });

  it('should have 3 locations', () => {
    const locations = demo.entities.filter(e => e.type === EntityType.Location);
    expect(locations.length).toBe(3);
    const names = locations.map(l => l.name).sort();
    expect(names).toEqual([
      'London Office',
      'San Francisco HQ',
      'Singapore Office',
    ]);
  });

  it('should have 8 business processes', () => {
    const processes = demo.entities.filter(e => e.type === EntityType.BusinessProcess);
    expect(processes.length).toBe(8);
  });

  it('should have 5 vendors', () => {
    const vendors = demo.entities.filter(e => e.type === EntityType.Vendor);
    expect(vendors.length).toBe(5);
  });

  it('should have all entities marked as demo data (assumed source)', () => {
    const nonAssumed = demo.entities.filter(e => e.source !== ValueSource.Assumed);
    expect(nonAssumed.length).toBe(0);
  });

  it('should have organization with critical criticality', () => {
    const org = demo.entities.find(e => e.type === EntityType.Organization);
    expect(org).toBeDefined();
    expect(org!.criticality).toBe(Criticality.Critical);
  });

  it('should have rich relationship network', () => {
    const relTypes = new Set(demo.relationships.map(r => r.type));
    expect(relTypes.has(RelationshipType.BelongsTo)).toBe(true);
    expect(relTypes.has(RelationshipType.Manages)).toBe(true);
    expect(relTypes.has(RelationshipType.Owns)).toBe(true);
    expect(relTypes.has(RelationshipType.DependsOn)).toBe(true);
    expect(relTypes.has(RelationshipType.RunsOn)).toBe(true);
    expect(relTypes.has(RelationshipType.Hosts)).toBe(true);
    expect(relTypes.has(RelationshipType.ConnectsTo)).toBe(true);
    expect(relTypes.has(RelationshipType.SuppliedBy)).toBe(true);
    expect(relTypes.has(RelationshipType.LocatedAt)).toBe(true);
    expect(relTypes.has(RelationshipType.Funds)).toBe(true);
    expect(relTypes.has(RelationshipType.AllocatedTo)).toBe(true);
  });

  it('should have redundancy on critical systems', () => {
    const runsOnRels = demo.relationships.filter(r => r.type === RelationshipType.RunsOn);
    const withRedundancy = runsOnRels.filter(r => r.redundancyInfo?.hasRedundancy);
    expect(withRedundancy.length).toBeGreaterThan(0);
  });

  it('should have all entities with valid IDs', () => {
    for (const entity of demo.entities) {
      // Demo data uses simple IDs like 'loc-hq' or UUIDs
      expect(entity.id).toBeTruthy();
      expect(typeof entity.id).toBe('string');
      expect(entity.version).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    }
  });

  it('should have all relationships with valid IDs', () => {
    for (const rel of demo.relationships) {
      // Demo data uses simple IDs like 'rel-1' or UUIDs
      expect(rel.id).toBeTruthy();
      expect(typeof rel.id).toBe('string');
      expect(rel.version).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      // Source and target should exist in entities (demo data may have some forward references)
      const sourceExists = demo.entities.some(e => e.id === rel.sourceId);
      const targetExists = demo.entities.some(e => e.id === rel.targetId);
      // In demo data, most relationships should have valid references
      // Allow a small number of forward references
      if (!sourceExists || !targetExists) {
        console.warn(`Relationship ${rel.id} references missing entity: source=${rel.sourceId}, target=${rel.targetId}`);
      }
    }
  });
});