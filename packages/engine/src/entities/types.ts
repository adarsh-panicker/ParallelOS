// packages/engine/src/entities/types.ts

/**
 * Type aliases for entity identifiers (branded for documentation)
 * Using simple string types for practicality while maintaining semantic meaning
 */
export type EntityId = string;
export type ScenarioId = string;
export type RelationshipId = string;
export type VersionId = string;
export type SimulationId = string;
export type ComparisonId = string;
export type AuditId = string;

/**
 * Entity type enumeration
 */
export enum EntityType {
  Organization = 'organization',
  Department = 'department',
  Employee = 'employee',
  Role = 'role',
  Project = 'project',
  BusinessProcess = 'business_process',
  BusinessSystem = 'business_system',
  ITAsset = 'it_asset',
  Location = 'location',
  Vendor = 'vendor',
  Budget = 'budget',
  Resource = 'resource',
}

/**
 * Value source classification - NON-NEGOTIABLE
 * Every value in the system must carry one of these labels
 */
export enum ValueSource {
  Actual = 'actual',
  Imported = 'imported',
  Assumed = 'assumed',
  AiHypothesis = 'ai-hypothesis',
  Simulated = 'simulated',
}

/**
 * Criticality levels
 */
export enum Criticality {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

/**
 * Verification status
 */
export enum VerificationStatus {
  Verified = 'verified',
  Unverified = 'unverified',
  Disputed = 'disputed',
  Deprecated = 'deprecated',
}

/**
 * Entity state
 */
export enum EntityState {
  Active = 'active',
  Inactive = 'inactive',
  Planned = 'planned',
  Deprecated = 'deprecated',
  UnderReview = 'under_review',
}

/**
 * Dependency strength
 */
export enum DependencyStrength {
  Hard = 'hard',
  Soft = 'soft',
}

/**
 * Relationship direction
 */
export enum RelationshipDirection {
  Outbound = 'outbound',
  Inbound = 'inbound',
  Bidirectional = 'bidirectional',
}

/**
 * Relationship types
 */
export enum RelationshipType {
  // Organizational
  BelongsTo = 'belongs_to',
  Manages = 'manages',
  Owns = 'owns',
  
  // Project & Process
  DependsOn = 'depends_on',
  Blocks = 'blocks',
  Feeds = 'feeds',
  
  // System & Infrastructure
  RunsOn = 'runs_on',
  Hosts = 'hosts',
  ConnectsTo = 'connects_to',
  SuppliedBy = 'supplied_by',
  
  // Location
  LocatedAt = 'located_at',
  Serves = 'serves',
  
  // Financial
  Funds = 'funds',
  AllocatedTo = 'allocated_to',
  
  // Custom
  Custom = 'custom',
}

/**
 * Decision types for simulation
 */
export enum DecisionType {
  BudgetChange = 'budget_change',
  AddLocation = 'add_location',
  RemoveLocation = 'remove_location',
  ReplaceSystem = 'replace_system',
  SystemOutage = 'system_outage',
  RestructureDepartment = 'restructure_department',
  ReallocateResources = 'reallocate_resources',
  AddEmployee = 'add_employee',
  RemoveEmployee = 'remove_employee',
  ChangeProjectScope = 'change_project_scope',
  ModifyProcess = 'modify_process',
  Custom = 'custom',
}

/**
 * Scenario status
 */
export enum ScenarioStatus {
  Draft = 'draft',
  Active = 'active',
  Archived = 'archived',
  Completed = 'completed',
}

/**
 * Impact type for affected entities
 */
export enum ImpactType {
  Direct = 'direct',
  Indirect = 'indirect',
}

/**
 * Delay risk levels
 */
export enum DelayRisk {
  None = 'none',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

/**
 * Process disruption levels
 */
export enum DisruptionLevel {
  None = 'none',
  Minor = 'minor',
  Major = 'major',
  Critical = 'critical',
  Halted = 'halted',
}

/**
 * Unknown value marker
 */
export type UnknownValue<T> = T | 'unknown';

export function isUnknown<T>(val: UnknownValue<T>): val is 'unknown' {
  return val === 'unknown';
}

export function unknown<T>(reason?: string): UnknownValue<T> {
  return 'unknown';
}

/**
 * Utility to create branded IDs
 */
export function createEntityId(id: string): EntityId {
  return id as EntityId;
}

export function createScenarioId(id: string): ScenarioId {
  return id as ScenarioId;
}

export function createRelationshipId(id: string): RelationshipId {
  return id as RelationshipId;
}

export function createVersionId(id: string): VersionId {
  return id as VersionId;
}

export function createSimulationId(id: string): SimulationId {
  return id as SimulationId;
}

export function createComparisonId(id: string): ComparisonId {
  return id as ComparisonId;
}

export function createAuditId(id: string): AuditId {
  return id as AuditId;
}

/**
 * Generate a new UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}