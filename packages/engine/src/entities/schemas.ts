// packages/engine/src/entities/schemas.ts

import { z } from 'zod';
import {
  EntityType,
  ValueSource,
  Criticality,
  VerificationStatus,
  EntityState,
  EntityId,
  VersionId,
  EntityId as EntityIdType,
} from './types';

/**
 * Base entity schema - all entities share these fields
 */
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(EntityType),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(''),
  properties: z.record(z.unknown()).default({}),
  state: z.nativeEnum(EntityState).default(EntityState.Active),
  criticality: z.nativeEnum(Criticality).default(Criticality.Medium),
  source: z.nativeEnum(ValueSource).default(ValueSource.Assumed),
  verificationStatus: z.nativeEnum(VerificationStatus).default(VerificationStatus.Unverified),
  version: z.string().uuid(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  createdBy: z.string().min(1),
  updatedBy: z.string().min(1),
});

export type BaseEntity = z.infer<typeof BaseEntitySchema>;

/**
 * Type-specific property schemas
 */
export const DepartmentPropertiesSchema = z.object({
  headcount: z.number().int().nonnegative().default(0),
  budgetId: z.string().uuid().optional(),
  costCenter: z.string().max(50).optional(),
});

export type DepartmentProperties = z.infer<typeof DepartmentPropertiesSchema>;

export const EmployeePropertiesSchema = z.object({
  email: z.string().email(),
  roleId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  skills: z.array(z.string()).default([]),
  allocation: z.number().min(0).max(100).default(100),
  costPerMonth: z.number().nonnegative().optional(),
});

export type EmployeeProperties = z.infer<typeof EmployeePropertiesSchema>;

export const RolePropertiesSchema = z.object({
  title: z.string().max(100),
  level: z.string().max(50).optional(),
  departmentId: z.string().uuid().optional(),
  responsibilities: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
});

export type RoleProperties = z.infer<typeof RolePropertiesSchema>;

export const ProjectPropertiesSchema = z.object({
  startDate: z.number().int().positive(),
  endDate: z.number().int().positive(),
  budgetId: z.string().uuid().optional(),
  status: z.enum(['planned', 'active', 'on_hold', 'completed', 'cancelled']).default('planned'),
  progress: z.number().min(0).max(100).default(0),
  dependencies: z.array(z.string().uuid()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  assignedEmployees: z.array(z.string().uuid()).default([]),
  requiredResources: z.record(z.number().nonnegative()).default({}),
});

export type ProjectProperties = z.infer<typeof ProjectPropertiesSchema>;

export const BusinessProcessPropertiesSchema = z.object({
  ownerDepartmentId: z.string().uuid().optional(),
  criticalSystems: z.array(z.string().uuid()).default([]),
  inputProcesses: z.array(z.string().uuid()).default([]),
  outputProcesses: z.array(z.string().uuid()).default([]),
  slaDescription: z.string().max(500).optional(),
  currentThroughput: z.number().nonnegative().optional(),
  maxThroughput: z.number().nonnegative().optional(),
});

export type BusinessProcessProperties = z.infer<typeof BusinessProcessPropertiesSchema>;

export const BusinessSystemPropertiesSchema = z.object({
  vendorId: z.string().uuid().optional(),
  version: z.string().max(50).default('1.0'),
  lifecycleStage: z.enum(['evaluation', 'deployment', 'production', 'maintenance', 'sunset']).default('production'),
  criticalProcesses: z.array(z.string().uuid()).default([]),
  redundancyLevel: z.enum(['none', 'active-passive', 'active-active', 'multi-region', 'geo-redundant']).default('none'),
  estimatedReplacementCost: z.number().nonnegative().default(0),
  annualLicenseCost: z.number().nonnegative().default(0),
  dependentSystems: z.array(z.string().uuid()).default([]),
  hostedAssets: z.array(z.string().uuid()).default([]),
});

export type BusinessSystemProperties = z.infer<typeof BusinessSystemPropertiesSchema>;

export const ITAssetPropertiesSchema = z.object({
  assetType: z.enum(['server', 'network', 'storage', 'endpoint', 'license', 'cloud_resource']),
  specifications: z.record(z.unknown()).default({}),
  locationId: z.string().uuid().optional(),
  systemIds: z.array(z.string().uuid()).default([]),
  purchaseDate: z.number().int().positive().optional(),
  warrantyExpiry: z.number().int().positive().optional(),
  monthlyCost: z.number().nonnegative().default(0),
});

export type ITAssetProperties = z.infer<typeof ITAssetPropertiesSchema>;

export const LocationPropertiesSchema = z.object({
  address: z.string().max(500),
  timezone: z.string().max(50),
  capacity: z.number().int().nonnegative().default(0),
  currentHeadcount: z.number().int().nonnegative().default(0),
  infrastructure: z.array(z.string()).default([]),
  networkLatencyToHq: z.number().nonnegative().optional(),
});

export type LocationProperties = z.infer<typeof LocationPropertiesSchema>;

export const VendorPropertiesSchema = z.object({
  name: z.string().max(200),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(50).optional(),
  contractExpiry: z.number().int().positive().optional(),
  servicesProvided: z.array(z.string()).default([]),
  slaTier: z.enum(['basic', 'standard', 'premium', 'enterprise']).default('standard'),
});

export type VendorProperties = z.infer<typeof VendorPropertiesSchema>;

export const BudgetPropertiesSchema = z.object({
  fiscalYear: z.string().max(20),
  totalAmount: z.number().nonnegative(),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
  allocatedAmount: z.number().nonnegative().default(0),
  spentAmount: z.number().nonnegative().default(0),
  departmentId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});

export type BudgetProperties = z.infer<typeof BudgetPropertiesSchema>;

export const ResourcePropertiesSchema = z.object({
  resourceType: z.enum(['compute', 'storage', 'network', 'license', 'human', 'budget']),
  unit: z.string().max(50),
  totalCapacity: z.number().nonnegative(),
  availableCapacity: z.number().nonnegative(),
  reservedCapacity: z.number().nonnegative().default(0),
  costPerUnit: z.number().nonnegative().optional(),
});

export type ResourceProperties = z.infer<typeof ResourcePropertiesSchema>;

export const OrganizationPropertiesSchema = z.object({
  industry: z.string().max(100).optional(),
  employeeCount: z.number().int().nonnegative().default(0),
  annualRevenue: z.number().nonnegative().optional(),
  headquartersLocationId: z.string().uuid().optional(),
});

export type OrganizationProperties = z.infer<typeof OrganizationPropertiesSchema>;

/**
 * Entity schema discriminated union by type
 */
export const EntitySchema = BaseEntitySchema.extend({
  properties: z.union([
    DepartmentPropertiesSchema,
    EmployeePropertiesSchema,
    RolePropertiesSchema,
    ProjectPropertiesSchema,
    BusinessProcessPropertiesSchema,
    BusinessSystemPropertiesSchema,
    ITAssetPropertiesSchema,
    LocationPropertiesSchema,
    VendorPropertiesSchema,
    BudgetPropertiesSchema,
    ResourcePropertiesSchema,
    OrganizationPropertiesSchema,
    z.record(z.unknown()),
  ]),
});

export type Entity = z.infer<typeof EntitySchema>;

/**
 * Factory functions for creating entities with defaults
 */
export function createBaseEntity(
  type: EntityType,
  name: string,
  createdBy: string,
  overrides: Partial<BaseEntity> = {}
): BaseEntity {
  const now = Date.now();
  const id = crypto.randomUUID();
  const version = crypto.randomUUID();
  
  return {
    id,
    type,
    name,
    description: '',
    properties: {},
    state: EntityState.Active,
    criticality: Criticality.Medium,
    source: ValueSource.Assumed,
    verificationStatus: VerificationStatus.Unverified,
    version,
    createdAt: now,
    updatedAt: now,
    createdBy,
    updatedBy: createdBy,
    ...overrides,
  };
}

export function createDepartment(
  name: string,
  createdBy: string,
  props: Partial<DepartmentProperties> = {}
): Entity {
  return {
    ...createBaseEntity(EntityType.Department, name, createdBy),
    properties: {
      headcount: 0,
      ...props,
    },
  };
}

export function createEmployee(
  name: string,
  email: string,
  createdBy: string,
  props: Partial<EmployeeProperties> = {}
): Entity {
  return {
    ...createBaseEntity(EntityType.Employee, name, createdBy),
    properties: {
      email,
      skills: [],
      allocation: 100,
      ...props,
    },
  };
}

export function createProject(
  name: string,
  createdBy: string,
  props: Partial<ProjectProperties> = {}
): Entity {
  const now = Date.now();
  return {
    ...createBaseEntity(EntityType.Project, name, createdBy),
    properties: {
      startDate: now,
      endDate: now + 90 * 24 * 60 * 60 * 1000, // 90 days default
      status: 'planned',
      progress: 0,
      dependencies: [],
      requiredSkills: [],
      assignedEmployees: [],
      requiredResources: {},
      ...props,
    },
  };
}

export function createBusinessSystem(
  name: string,
  createdBy: string,
  props: Partial<BusinessSystemProperties> = {}
): Entity {
  return {
    ...createBaseEntity(EntityType.BusinessSystem, name, createdBy),
    properties: {
      version: '1.0',
      lifecycleStage: 'production',
      redundancyLevel: 'none',
      criticalProcesses: [],
      estimatedReplacementCost: 0,
      annualLicenseCost: 0,
      dependentSystems: [],
      hostedAssets: [],
      ...props,
    },
  };
}

export function createBusinessProcess(
  name: string,
  createdBy: string,
  props: Partial<BusinessProcessProperties> = {}
): Entity {
  return {
    ...createBaseEntity(EntityType.BusinessProcess, name, createdBy),
    properties: {
      criticalSystems: [],
      inputProcesses: [],
      outputProcesses: [],
      ...props,
    },
  };
}

export function createITAsset(
  name: string,
  assetType: ITAssetProperties['assetType'],
  createdBy: string,
  props: Partial<ITAssetProperties> = {}
): Entity {
  return {
    ...createBaseEntity(EntityType.ITAsset, name, createdBy),
    properties: {
      assetType,
      specifications: {},
      systemIds: [],
      monthlyCost: 0,
      ...props,
    },
  };
}

export function createLocation(
  name: string,
  address: string,
  timezone: string,
  createdBy: string,
  props: Partial<LocationProperties> = {}
): Entity {
  return {
    ...createBaseEntity(EntityType.Location, name, createdBy),
    properties: {
      address,
      timezone,
      capacity: 0,
      currentHeadcount: 0,
      infrastructure: [],
      ...props,
    },
  };
}

export function createVendor(
  name: string,
  createdBy: string,
  props: Partial<VendorProperties> = {}
): Entity {
  return {
    ...createBaseEntity(EntityType.Vendor, name, createdBy),
    properties: {
      name,
      servicesProvided: [],
      slaTier: 'standard',
      ...props,
    },
  };
}

export function createBudget(
  name: string,
  fiscalYear: string,
  totalAmount: number,
  createdBy: string,
  props: Partial<BudgetProperties> = {}
): Entity {
  return {
    ...createBaseEntity(EntityType.Budget, name, createdBy),
    properties: {
      fiscalYear,
      totalAmount,
      currency: 'USD',
      allocatedAmount: 0,
      spentAmount: 0,
      ...props,
    },
  };
}

export function createResource(
  name: string,
  resourceType: ResourceProperties['resourceType'],
  unit: string,
  totalCapacity: number,
  createdBy: string,
  props: Partial<ResourceProperties> = {}
): Entity {
  return {
    ...createBaseEntity(EntityType.Resource, name, createdBy),
    properties: {
      resourceType,
      unit,
      totalCapacity,
      availableCapacity: totalCapacity,
      reservedCapacity: 0,
      ...props,
    },
  };
}

export function createOrganization(
  name: string,
  createdBy: string,
  props: Partial<OrganizationProperties> = {}
): Entity {
  return {
    ...createBaseEntity(EntityType.Organization, name, createdBy),
    criticality: Criticality.Critical,
    properties: {
      employeeCount: 0,
      ...props,
    },
  };
}

export function createRole(
  name: string,
  createdBy: string,
  props: Partial<RoleProperties> = {}
): Entity {
  return {
    ...createBaseEntity(EntityType.Role, name, createdBy),
    properties: {
      title: name,
      responsibilities: [],
      requiredSkills: [],
      ...props,
    },
  };
}