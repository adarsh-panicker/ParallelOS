# ParallelOS — Data Model Specification

**Version:** 1.0  
**Date:** 2026-11-10  
**Status:** Phase 1 — Architecture & Foundation

---

## 1. Design Principles

1. **Immutability:** Baseline entities are never modified. Scenarios use copy-on-write overlays.
2. **Provenance:** Every value carries source information (actual, imported, assumed, ai-hypothesis, simulated).
3. **First-Class Relationships:** Relationships are entities with their own properties, not just graph edges.
4. **Typed Flexibility:** Core attributes are typed; domain-specific data uses validated JSON payloads.
5. **Versioning:** All entities and scenarios carry version metadata for audit and reconstruction.

---

## 2. Core Type Definitions

### 2.1 Branded Types & Enums

```typescript
// packages/engine/src/entities/types.ts

// Branded IDs for type safety
type EntityId = string & { readonly __brand: unique symbol };
type ScenarioId = string & { readonly __brand: unique symbol };
type RelationshipId = string & { readonly __brand: unique symbol };
type VersionId = string & { readonly __brand: unique symbol };

// Entity types
enum EntityType {
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

// Value source classification (NON-NEGOTIABLE)
enum ValueSource {
  Actual = 'actual',           // Verified organizational fact
  Imported = 'imported',       // From Jira/Confluence/authorized source
  Assumed = 'assumed',         // User-provided assumption
  AiHypothesis = 'ai-hypothesis', // AI-generated hypothesis
  Simulated = 'simulated',     // Calculated by simulation engine
}

// Criticality levels
enum Criticality {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

// Verification status
enum VerificationStatus {
  Verified = 'verified',
  Unverified = 'unverified',
  Disputed = 'disputed',
  Deprecated = 'deprecated',
}

// Dependency strength
enum DependencyStrength {
  Hard = 'hard',      // Failure propagates completely
  Soft = 'soft',      // Partial degradation, graceful
}

// Relationship direction
enum RelationshipDirection {
  Outbound = 'outbound',   // Source → Target
  Inbound = 'inbound',     // Target → Source
  Bidirectional = 'bidirectional',
}

// Relationship types
enum RelationshipType {
  // Organizational
  BelongsTo = 'belongs_to',           // Employee → Department
  Manages = 'manages',                // Employee → Employee/Department
  Owns = 'owns',                      // Department → Project/Process
  
  // Project & Process
  DependsOn = 'depends_on',           // Project → Project/System/Process
  Blocks = 'blocks',                  // Project → Project
  Feeds = 'feeds',                    // Process → Process
  
  // System & Infrastructure
  RunsOn = 'runs_on',                 // System → ITAsset
  Hosts = 'hosts',                    // ITAsset → System
  ConnectsTo = 'connects_to',         // Asset → Asset / Location → Location
  SuppliedBy = 'supplied_by',         // System/Asset → Vendor
  
  // Location
  LocatedAt = 'located_at',           // Entity → Location
  Serves = 'serves',                  // Location → Department/System
  
  // Financial
  Funds = 'funds',                    // Budget → Project/Department
  AllocatedTo = 'allocated_to',       // Resource → Project/Department
  
  // Custom
  Custom = 'custom',
}

// Entity state (varies by type)
enum EntityState {
  Active = 'active',
  Inactive = 'inactive',
  Planned = 'planned',
  Deprecated = 'deprecated',
  UnderReview = 'under_review',
}
```

---

## 3. Base Entity Schema

```typescript
// packages/engine/src/entities/schemas.ts

interface BaseEntity {
  id: EntityId;
  type: EntityType;
  name: string;
  description: string;
  properties: Record<string, unknown>;  // Type-specific flexible data
  state: EntityState;
  criticality: Criticality;
  source: ValueSource;
  verificationStatus: VerificationStatus;
  version: VersionId;
  createdAt: number;  // Unix timestamp ms
  updatedAt: number;
  createdBy: string;  // User/account ID
  updatedBy: string;
}

// Type-specific property interfaces (examples)
interface DepartmentProperties {
  headcount: number;
  budgetId?: EntityId;
  costCenter?: string;
}

interface EmployeeProperties {
  email: string;
  roleId?: EntityId;
  departmentId?: EntityId;
  locationId?: EntityId;
  skills: string[];
  allocation: number;  // 0-100%
  costPerMonth?: number;
}

interface ProjectProperties {
  startDate: number;
  endDate: number;
  budgetId?: EntityId;
  status: 'planned' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  progress: number;  // 0-100
  dependencies: EntityId[];  // Project IDs
  requiredSkills: string[];
  assignedEmployees: EntityId[];
}

interface BusinessSystemProperties {
  vendorId?: EntityId;
  version: string;
  lifecycleStage: 'evaluation' | 'deployment' | 'production' | 'maintenance' | 'sunset';
  criticalProcesses: EntityId[];  // BusinessProcess IDs
  redundancyLevel: 'none' | 'active-passive' | 'active-active' | 'multi-region';
  estimatedReplacementCost: number;
  annualLicenseCost: number;
}

interface ITAssetProperties {
  assetType: 'server' | 'network' | 'storage' | 'endpoint' | 'license' | 'cloud_resource';
  specifications: Record<string, unknown>;
  locationId?: EntityId;
  systemIds: EntityId[];  // Systems running on this asset
  purchaseDate: number;
  warrantyExpiry?: number;
  monthlyCost: number;
}

interface LocationProperties {
  address: string;
  timezone: string;
  capacity: number;  // Max employees
  currentHeadcount: number;
  infrastructure: string[];  // e.g., 'datacenter', 'office', 'remote_hub'
  networkLatencyToHq?: number;  // ms
}

interface BudgetProperties {
  fiscalYear: string;
  totalAmount: number;
  currency: 'USD' | 'EUR' | 'GBP';  // Extensible
  allocatedAmount: number;
  spentAmount: number;
  departmentId?: EntityId;
  projectId?: EntityId;
}

interface ResourceProperties {
  resourceType: 'compute' | 'storage' | 'network' | 'license' | 'human' | 'budget';
  unit: string;
  totalCapacity: number;
  availableCapacity: number;
  reservedCapacity: number;
  costPerUnit?: number;
}
```

---

## 4. Relationship Schema

```typescript
// packages/engine/src/relationships/schemas.ts

interface Relationship {
  id: RelationshipId;
  sourceId: EntityId;
  targetId: EntityId;
  type: RelationshipType;
  direction: RelationshipDirection;
  criticality: Criticality;
  dependencyStrength: DependencyStrength;
  
  // Redundancy & Failover
  redundancyInfo?: {
    hasRedundancy: boolean;
    redundancyType?: 'active-passive' | 'active-active' | 'load-balanced' | 'geo-redundant';
    failoverTimeMs?: number;
    failoverCapacityPercent?: number;  // % of capacity available after failover
    backupEntityIds?: EntityId[];
  };
  
  // Confidence & Evidence
  confidence: number;  // 0-1
  evidence: EvidenceRef[];
  
  // Metadata
  properties: Record<string, unknown>;
  version: VersionId;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

interface EvidenceRef {
  type: 'jira_issue' | 'confluence_page' | 'document' | 'interview' | 'assumption' | 'ai_inference';
  referenceId: string;
  description: string;
  accessedAt: number;
}
```

---

## 5. Scenario Schema

```typescript
// packages/engine/src/scenario/schemas.ts

interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  parentScenarioId?: ScenarioId;  // For branching
  baselineVersionId: VersionId;   // Baseline snapshot reference
  
  // Assumptions: key-value pairs with metadata
  assumptions: Assumption[];
  
  // Overrides: Only store deltas
  entityOverrides: EntityOverride[];
  relationshipOverrides: RelationshipOverride[];
  
  // Applied decisions (for audit trail)
  appliedDecisions: AppliedDecision[];
  
  // Simulation results (latest)
  latestSimulationId?: string;
  
  // Version history
  versionHistory: ScenarioVersion[];
  
  // Metadata
  status: 'draft' | 'active' | 'archived' | 'completed';
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  tags: string[];
}

interface Assumption {
  id: string;
  key: string;           // e.g., "budget.cut.percentage"
  value: unknown;        // The assumed value
  description: string;
  source: ValueSource;   // Must be Assumed or AiHypothesis
  confidence: number;    // 0-1
  createdAt: number;
  createdBy: string;
}

interface EntityOverride {
  entityId: EntityId;
  operation: 'create' | 'update' | 'delete';
  previousVersion?: VersionId;
  newData: Partial<BaseEntity>;  // Only changed fields
  appliedAt: number;
  appliedBy: string;
}

interface RelationshipOverride {
  relationshipId: RelationshipId;
  operation: 'create' | 'update' | 'delete';
  previousVersion?: VersionId;
  newData?: Partial<Relationship>;
  appliedAt: number;
  appliedBy: string;
}

interface AppliedDecision {
  id: string;
  type: DecisionType;
  description: string;
  parameters: Record<string, unknown>;
  appliedAt: number;
  appliedBy: string;
  simulationId?: string;  // Link to simulation that evaluated this
}

interface ScenarioVersion {
  versionId: VersionId;
  timestamp: number;
  author: string;
  changeSummary: string;
  entityOverridesCount: number;
  relationshipOverridesCount: number;
}

enum DecisionType {
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
```

---

## 6. Simulation Schemas

```typescript
// packages/engine/src/simulation/types.ts

interface SimulationDecision {
  id: string;
  type: DecisionType;
  description: string;
  parameters: Record<string, unknown>;
  targetEntityIds: EntityId[];
  timestamp: number;
}

interface SimulationResult {
  id: string;
  scenarioId: ScenarioId;
  decisions: SimulationDecision[];
  baselineVersionId: VersionId;
  
  // Core outputs
  affectedEntities: AffectedEntity[];
  projectImpacts: ProjectImpact[];
  resourceShortages: ResourceShortage[];
  budgetDeltas: BudgetDelta[];
  processDisruptions: ProcessDisruption[];
  mitigationEffects: MitigationEffect[];
  unresolvedDependencies: UnresolvedDependency[];
  
  // Metadata
  executedAt: number;
  executionTimeMs: number;
  deterministic: boolean;  // True if all calculations deterministic
  warnings: string[];
}

interface AffectedEntity {
  entityId: EntityId;
  entityType: EntityType;
  entityName: string;
  impactType: 'direct' | 'indirect';
  impactSeverity: Criticality;
  dependencyPath: DependencyPathStep[];
  triggeringDecisionId: string;
  provenance: ProvenanceRecord;
}

interface DependencyPathStep {
  relationshipId: RelationshipId;
  sourceEntityId: EntityId;
  targetEntityId: EntityId;
  relationshipType: RelationshipType;
  propagationFactor: number;  // 0-1, how much impact propagates
  redundancyMitigated: boolean;
}

interface ProvenanceRecord {
  triggeringDecision: string;
  affectedEntity: EntityId;
  dependencyPath: DependencyPathStep[];
  formula: string;           // Human-readable calculation description
  assumptions: AssumptionRef[];
  deterministic: boolean;    // True if fully deterministic
  estimated: boolean;        // True if estimation was used
  confidence: number;        // 0-1 overall confidence
  calculatedAt: number;
}

interface AssumptionRef {
  assumptionId: string;
  key: string;
  value: unknown;
  source: ValueSource;
}

interface ProjectImpact {
  projectId: EntityId;
  projectName: string;
  delayRisk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  estimatedDelayDays: number | 'unknown';
  budgetImpact: number;  // Positive = over budget
  resourceGaps: ResourceGap[];
  affectedMilestones: string[];
  provenance: ProvenanceRecord;
}

interface ResourceGap {
  resourceType: string;
  required: number;
  available: number;
  shortfall: number;
  criticality: Criticality;
}

interface ResourceShortage {
  resourceId: EntityId;
  resourceName: string;
  resourceType: string;
  currentUtilization: number;  // 0-1
  projectedUtilization: number;
  shortfall: number;
  affectedEntities: EntityId[];
  provenance: ProvenanceRecord;
}

interface BudgetDelta {
  budgetId: EntityId;
  budgetName: string;
  baselineAmount: number;
  projectedAmount: number;
  delta: number;  // Positive = increase
  deltaPercent: number;
  breakdown: BudgetDeltaItem[];
  provenance: ProvenanceRecord;
}

interface BudgetDeltaItem {
  category: string;
  baselineAmount: number;
  projectedAmount: number;
  delta: number;
  assumptionRefs: string[];
}

interface ProcessDisruption {
  processId: EntityId;
  processName: string;
  disruptionLevel: 'none' | 'minor' | 'major' | 'critical' | 'halted';
  affectedSystems: EntityId[];
  estimatedRecoveryTimeMs: number | 'unknown';
  workaroundAvailable: boolean;
  provenance: ProvenanceRecord;
}

interface MitigationEffect {
  mitigationId: string;
  description: string;
  targetEntityIds: EntityId[];
  effectiveness: number;  // 0-1
  cost: number;
  provenance: ProvenanceRecord;
}

interface UnresolvedDependency {
  sourceEntityId: EntityId;
  targetEntityId: EntityId;
  relationshipType: RelationshipType;
  reason: 'missing_entity' | 'circular_dependency' | 'insufficient_data' | 'conflicting_overrides';
  impact: 'unknown' | 'blocked' | 'degraded';
}
```

---

## 7. Comparison Schemas

```typescript
// packages/engine/src/comparison/types.ts

interface ComparisonDimension {
  id: string;
  name: string;
  description: string;
  weight: number;  // User-adjustable, default 1.0
  higherIsBetter: boolean;  // For scoring direction
}

interface ComparisonResult {
  id: string;
  baselineScenarioId: ScenarioId;
  comparedScenarioIds: ScenarioId[];
  dimensions: ComparisonDimension[];
  
  // Per-scenario scores
  scenarioScores: ScenarioScore[];
  
  // Differential analysis
  differences: ScenarioDifference[];
  
  // Generated at
  generatedAt: number;
}

interface ScenarioScore {
  scenarioId: ScenarioId;
  scenarioName: string;
  dimensionScores: DimensionScore[];
  weightedTotal: number;  // Sum of (score * weight) / sum(weights)
}

interface DimensionScore {
  dimensionId: string;
  rawValue: number | 'unknown';
  normalizedScore: number | 'unknown';  // 0-100 scale
  label: string;  // Human-readable
  provenance: ProvenanceRecord;
}

interface ScenarioDifference {
  dimensionId: string;
  baselineValue: number | 'unknown';
  scenarioValues: { scenarioId: ScenarioId; value: number | 'unknown' }[];
  absoluteDifferences: { scenarioId: ScenarioId; difference: number }[];
  percentDifferences: { scenarioId: ScenarioId; difference: number }[];
  significance: 'negligible' | 'minor' | 'moderate' | 'major' | 'critical';
}

const DEFAULT_DIMENSIONS: ComparisonDimension[] = [
  { id: 'operating_cost', name: 'Operating Cost', description: 'Total projected OPEX', weight: 1.0, higherIsBetter: false },
  { id: 'budget_variance', name: 'Budget Variance', description: 'Deviation from baseline budget', weight: 1.0, higherIsBetter: false },
  { id: 'resource_utilization', name: 'Resource Utilization', description: 'Average resource utilization efficiency', weight: 1.0, higherIsBetter: true },
  { id: 'project_delivery', name: 'Project Delivery', description: 'On-time delivery probability', weight: 1.0, higherIsBetter: true },
  { id: 'operational_resilience', name: 'Operational Resilience', description: 'Ability to withstand disruptions', weight: 1.0, higherIsBetter: true },
  { id: 'process_continuity', name: 'Process Continuity', description: 'Business process uptime', weight: 1.0, higherIsBetter: true },
  { id: 'dependency_risk', name: 'Dependency Risk', description: 'Critical dependency exposure', weight: 1.0, higherIsBetter: false },
  { id: 'risk_exposure', name: 'Risk Exposure', description: 'Aggregate risk score', weight: 1.0, higherIsBetter: false },
  { id: 'implementation_complexity', name: 'Implementation Complexity', description: 'Effort to execute scenario', weight: 1.0, higherIsBetter: false },
];
```

---

## 8. Demo Data: Aurelia Global Technologies

```typescript
// packages/engine/src/demo/aurelia.ts

// 6 Departments
const departments = [
  { id: 'dept-eng', name: 'Engineering', headcount: 12, budgetId: 'budget-eng' },
  { id: 'dept-sales', name: 'Sales', headcount: 8, budgetId: 'budget-sales' },
  { id: 'dept-marketing', name: 'Marketing', headcount: 5, budgetId: 'budget-marketing' },
  { id: 'dept-ops', name: 'Operations', headcount: 6, budgetId: 'budget-ops' },
  { id: 'dept-finance', name: 'Finance', headcount: 4, budgetId: 'budget-finance' },
  { id: 'dept-hr', name: 'Human Resources', headcount: 3, budgetId: 'budget-hr' },
];

// 30-40 Employees across departments with roles, skills, allocations
// 8-10 Projects with dependencies, budgets, timelines
// 10-15 Business Systems with vendor, redundancy, critical processes
// 15-20 IT Assets (servers, network, cloud, licenses)
// 3 Locations: HQ (San Francisco), London, Singapore
// 8 Business Processes with system dependencies
// 5 Vendors: CloudProvider, ERPVendor, SecurityVendor, NetworkVendor, DataVendor

// Rich dependency network:
// - Engineering projects depend on CI/CD system, code repository, cloud infra
// - Sales depends on CRM, marketing automation, communication tools
// - Operations depends on ERP, monitoring, ticketing
// - Cross-department: Finance processes depend on ERP, HR systems
// - Redundancy: Cloud infra active-active, ERP active-passive, CRM single-point
// - Resource constraints: Limited senior engineers, budget caps per dept
```

---

## 9. Validation Rules

| Rule | Description |
|------|-------------|
| V1 | Every entity must have unique ID, type, name |
| V2 | Relationship source/target must exist in same scenario context |
| V3 | Scenario baseline version must reference existing baseline |
| V4 | Override operations must not create circular dependencies in relationships |
| V5 | Simulation decisions must reference existing entities |
| V6 | Comparison requires baseline + at least one scenario with simulation results |
| V7 | All ValueSource labels must be one of the 5 enum values |
| V8 | Provenance required for every simulated output |
| V9 | Unknown values must be explicit `'unknown'` string, never null/undefined |

---

## 10. Zod Schema Exports

All schemas defined as Zod objects in `packages/engine/src/*/schemas.ts` with:
- `.strict()` for objects
- Branded types via `.brand()` or runtime checks
- Custom refinements for cross-field validation
- Exports: `EntitySchema`, `RelationshipSchema`, `ScenarioSchema`, `SimulationResultSchema`, `ComparisonResultSchema`

---

## 11. Migration & Evolution

- Version field on every entity enables schema evolution
- New optional fields added with defaults in factory functions
- Breaking changes require new baseline version
- Scenario reconstruction validates against current schemas
- Demo data versioned separately from user data