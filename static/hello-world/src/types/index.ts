// UI Type definitions matching engine package types

export type EntityId = string;
export type ScenarioId = string;
export type RelationshipId = string;
export type VersionId = string;
export type SimulationId = string;
export type ComparisonId = string;
export type AuditId = string;

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

export enum ValueSource {
  Actual = 'actual',
  Imported = 'imported',
  Assumed = 'assumed',
  AiHypothesis = 'ai-hypothesis',
  Simulated = 'simulated',
}

export enum Criticality {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum VerificationStatus {
  Verified = 'verified',
  Unverified = 'unverified',
  Disputed = 'disputed',
  Deprecated = 'deprecated',
}

export enum EntityState {
  Active = 'active',
  Inactive = 'inactive',
  Planned = 'planned',
  Deprecated = 'deprecated',
  UnderReview = 'under_review',
}

export enum DependencyStrength {
  Hard = 'hard',
  Soft = 'soft',
}

export enum RelationshipDirection {
  Outbound = 'outbound',
  Inbound = 'inbound',
  Bidirectional = 'bidirectional',
}

export enum RelationshipType {
  BelongsTo = 'belongs_to',
  Manages = 'manages',
  Owns = 'owns',
  DependsOn = 'depends_on',
  Blocks = 'blocks',
  Feeds = 'feeds',
  RunsOn = 'runs_on',
  Hosts = 'hosts',
  ConnectsTo = 'connects_to',
  SuppliedBy = 'supplied_by',
  LocatedAt = 'located_at',
  Serves = 'serves',
  Funds = 'funds',
  AllocatedTo = 'allocated_to',
  Custom = 'custom',
}

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

export enum ScenarioStatus {
  Draft = 'draft',
  Active = 'active',
  Archived = 'archived',
  Completed = 'completed',
}

export enum ImpactType {
  Direct = 'direct',
  Indirect = 'indirect',
}

export enum DelayRisk {
  None = 'none',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum DisruptionLevel {
  None = 'none',
  Minor = 'minor',
  Major = 'major',
  Critical = 'critical',
  Halted = 'halted',
}

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

export function generateId(): string {
  return crypto.randomUUID();
}

export interface BaseEntity {
  id: EntityId;
  type: EntityType;
  name: string;
  description: string;
  properties: Record<string, unknown>;
  state: EntityState;
  criticality: Criticality;
  source: ValueSource;
  verificationStatus: VerificationStatus;
  version: VersionId;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

export type Entity = BaseEntity;

export interface RedundancyInfo {
  hasRedundancy: boolean;
  redundancyType?: 'active-passive' | 'active-active' | 'load-balanced' | 'geo-redundant';
  failoverTimeMs?: number;
  failoverCapacityPercent?: number;
  backupEntityIds?: EntityId[];
}

export interface EvidenceRef {
  type: 'jira_issue' | 'confluence_page' | 'document' | 'interview' | 'assumption' | 'ai_inference';
  referenceId: string;
  description: string;
  accessedAt: number;
}

export interface Relationship {
  id: RelationshipId;
  sourceId: EntityId;
  targetId: EntityId;
  type: RelationshipType;
  direction: RelationshipDirection;
  criticality: Criticality;
  dependencyStrength: DependencyStrength;
  redundancyInfo?: RedundancyInfo;
  confidence: number;
  evidence: EvidenceRef[];
  properties: Record<string, unknown>;
  version: VersionId;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface GraphData {
  nodes: Entity[];
  edges: Relationship[];
  totalNodes: number;
  totalEdges: number;
}

export interface EntitiesResponse {
  entities: Entity[];
  total: number;
  nextCursor?: string;
  error?: string;
}

export interface EntityResponse {
  success: boolean;
  entity: Entity | null;
  relationships: Relationship[];
  error?: string;
}

export interface RelationshipsResponse {
  relationships: Relationship[];
  total: number;
  error?: string;
}

export interface SearchResponse {
  entities: Entity[];
  total: number;
  error?: string;
}

export interface InitializeDemoResponse {
  success: boolean;
  entitiesLoaded?: number;
  relationshipsLoaded?: number;
  error?: string;
}

export interface GraphDataResponse {
  nodes: Entity[];
  edges: Relationship[];
  totalNodes: number;
  totalEdges: number;
  error?: string;
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    entity: Entity;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  data?: {
    relationship: Relationship;
  };
}

// Entity type colors for visualization
export const ENTITY_TYPE_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  organization: { bg: '#1e3a5f', border: '#3b82f6', icon: '🏢' },
  department: { bg: '#1e4d3b', border: '#22c55e', icon: '🏬' },
  employee: { bg: '#4c1d95', border: '#a855f7', icon: '👤' },
  role: { bg: '#7c2d12', border: '#f97316', icon: '🎭' },
  project: { bg: '#92400e', border: '#f59e0b', icon: '📋' },
  business_process: { bg: '#0c4a6e', border: '#06b6d4', icon: '🔄' },
  business_system: { bg: '#1e3a5f', border: '#3b82f6', icon: '💻' },
  it_asset: { bg: '#374151', border: '#6b7280', icon: '🖥️' },
  location: { bg: '#14532d', border: '#22c55e', icon: '📍' },
  vendor: { bg: '#7f1d1d', border: '#ef4444', icon: '🤝' },
  budget: { bg: '#92400e', border: '#f59e0b', icon: '💰' },
  resource: { bg: '#4c1d95', border: '#a855f7', icon: '⚡' },
};

// Relationship type colors
export const RELATIONSHIP_TYPE_COLORS: Record<string, string> = {
  belongs_to: '#22c55e',
  manages: '#a855f7',
  owns: '#f59e0b',
  depends_on: '#ef4444',
  blocks: '#dc2626',
  feeds: '#06b6d4',
  runs_on: '#3b82f6',
  hosts: '#6b7280',
  connects_to: '#84cc16',
  supplied_by: '#f97316',
  located_at: '#22c55e',
  serves: '#a855f7',
  funds: '#f59e0b',
  allocated_to: '#a855f7',
  custom: '#6b7280',
};

// Entity type labels
export const ENTITY_TYPE_LABELS: Record<string, string> = {
  organization: 'Organizations',
  department: 'Departments',
  employee: 'Employees',
  role: 'Roles',
  project: 'Projects',
  business_process: 'Processes',
  business_system: 'Systems',
  it_asset: 'Assets',
  location: 'Locations',
  vendor: 'Vendors',
  budget: 'Budgets',
  resource: 'Resources',
};

// Entity type icons (using emoji for simplicity)
export const ENTITY_TYPE_ICONS: Record<string, string> = {
  organization: '🏢',
  department: '🏬',
  employee: '👤',
  role: '🎭',
  project: '📋',
  business_process: '🔄',
  business_system: '💻',
  it_asset: '🖥️',
  location: '📍',
  vendor: '🤝',
  budget: '💰',
  resource: '⚡',
};

// Entity type icon components for visualization (inline SVG strings)
export const ENTITY_ICONS_MAP: Record<string, string> = {
  organization: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
  department: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  employee: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  role: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>',
  project: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  business_process: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
  business_system: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
  it_asset: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
  location: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  vendor: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  budget: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 1 0 7h5a3.5 3.5 0 0 1 0 7H9"/></svg>',
  resource: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 16 17 22 11 22 17"/></svg>',
};

export const ALL_ENTITY_TYPES: string[] = [
  'organization',
  'department',
  'employee',
  'role',
  'project',
  'business_process',
  'business_system',
  'it_asset',
  'location',
  'vendor',
  'budget',
  'resource',
];