// packages/engine/tests/entities.test.ts

import { describe, it, expect } from 'vitest';
import {
  EntityType,
  ValueSource,
  Criticality,
  EntityState,
  VerificationStatus,
  createEntityId,
  createDepartment,
  createEmployee,
  createProject,
  createBusinessSystem,
  EntitySchema,
  DepartmentPropertiesSchema,
  EmployeePropertiesSchema,
} from '../src';

describe('Entity Types', () => {
  it('should have all required entity types', () => {
    expect(EntityType.Organization).toBe('organization');
    expect(EntityType.Department).toBe('department');
    expect(EntityType.Employee).toBe('employee');
    expect(EntityType.Role).toBe('role');
    expect(EntityType.Project).toBe('project');
    expect(EntityType.BusinessProcess).toBe('business_process');
    expect(EntityType.BusinessSystem).toBe('business_system');
    expect(EntityType.ITAsset).toBe('it_asset');
    expect(EntityType.Location).toBe('location');
    expect(EntityType.Vendor).toBe('vendor');
    expect(EntityType.Budget).toBe('budget');
    expect(EntityType.Resource).toBe('resource');
  });
});

describe('ValueSource', () => {
  it('should have exactly 5 values', () => {
    const values = Object.values(ValueSource);
    expect(values).toHaveLength(5);
    expect(values).toContain('actual');
    expect(values).toContain('imported');
    expect(values).toContain('assumed');
    expect(values).toContain('ai-hypothesis');
    expect(values).toContain('simulated');
  });
});

describe('Entity Creation', () => {
  it('should create a department with defaults', () => {
    const dept = createDepartment('Engineering', 'user-1');
    expect(dept.type).toBe(EntityType.Department);
    expect(dept.name).toBe('Engineering');
    expect(dept.properties.headcount).toBe(0);
    expect(dept.source).toBe(ValueSource.Assumed);
    expect(dept.criticality).toBe(Criticality.Medium);
    expect(dept.state).toBe(EntityState.Active);
    expect(dept.verificationStatus).toBe(VerificationStatus.Unverified);
  });

  it('should create an employee with required fields', () => {
    const emp = createEmployee('John Doe', 'john@example.com', 'user-1');
    expect(emp.type).toBe(EntityType.Employee);
    expect(emp.name).toBe('John Doe');
    expect(emp.properties.email).toBe('john@example.com');
    expect(emp.properties.skills).toEqual([]);
    expect(emp.properties.allocation).toBe(100);
  });

  it('should create a project with defaults', () => {
    const proj = createProject('Project Alpha', 'user-1');
    expect(proj.type).toBe(EntityType.Project);
    expect(proj.name).toBe('Project Alpha');
    expect(proj.properties.status).toBe('planned');
    expect(proj.properties.progress).toBe(0);
    expect(proj.properties.dependencies).toEqual([]);
  });

  it('should create a business system with defaults', () => {
    const sys = createBusinessSystem('CRM', 'user-1');
    expect(sys.type).toBe(EntityType.BusinessSystem);
    expect(sys.name).toBe('CRM');
    expect(sys.properties.version).toBe('1.0');
    expect(sys.properties.lifecycleStage).toBe('production');
    expect(sys.properties.redundancyLevel).toBe('none');
  });
});

describe('Zod Schemas', () => {
  it('should validate department properties', () => {
    const result = DepartmentPropertiesSchema.safeParse({
      headcount: 10,
      budgetId: '123e4567-e89b-12d3-a456-426614174000',
      costCenter: 'ENG-001',
    });
    expect(result.success).toBe(true);
  });

  it('should validate employee properties', () => {
    const result = EmployeePropertiesSchema.safeParse({
      email: 'test@example.com',
      roleId: '123e4567-e89b-12d3-a456-426614174000',
      departmentId: '123e4567-e89b-12d3-a456-426614174000',
      locationId: '123e4567-e89b-12d3-a456-426614174000',
      skills: ['TypeScript', 'React'],
      allocation: 100,
      costPerMonth: 15000,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = EmployeePropertiesSchema.safeParse({
      email: 'not-an-email',
      skills: [],
      allocation: 100,
    });
    expect(result.success).toBe(false);
  });

  it('should reject allocation out of range', () => {
    const result = EmployeePropertiesSchema.safeParse({
      email: 'test@example.com',
      skills: [],
      allocation: 150,
    });
    expect(result.success).toBe(false);
  });
});

describe('Branded IDs', () => {
  it('should create branded entity IDs', () => {
    const id = createEntityId('123e4567-e89b-12d3-a456-426614174000');
    expect(typeof id).toBe('string');
    expect(id).toBe('123e4567-e89b-12d3-a456-426614174000');
  });
});