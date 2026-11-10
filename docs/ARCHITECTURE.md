# ParallelOS — Architecture Document

**Version:** 1.0  
**Date:** 2026-11-10  
**Status:** Phase 1 — Architecture & Foundation

---

## 1. System Overview

ParallelOS follows a modular architecture with clear separation between:
- **Engine Package** (`/packages/engine`): Pure TypeScript, zero Forge dependencies. Core domain logic: entities, relationships, scenarios, simulation, comparison. Unit-testable in isolation.
- **Forge Backend** (`/src`): Resolvers, storage adapters, Jira/Confluence services, AI provider abstraction, Rovo actions, audit log.
- **Custom UI** (`/static/ui`): React + TypeScript + Vite, React Flow for graphs, Recharts for visualizations.

```
┌─────────────────────────────────────────────────────────────────┐
│                      ParallelOS Forge App                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │   Custom UI      │  │  Forge Backend   │  │  Engine Pkg   │  │
│  │  (static/ui)     │◄─►│  (src/)          │◄─►│  (packages/   │  │
│  │                  │  │                  │  │   engine)     │  │
│  │  • React Flow    │  │  • Resolvers     │  │               │  │
│  │  • Recharts      │  │  • Storage Adptr │  │  • Entities   │  │
│  │  • Lucide        │  │  • Jira/Conf Svc │  │  • Relationships│  │
│  │  • Components    │  │  • AI Provider   │  │  • Scenarios  │  │
│  └──────────────────┘  │  • Rovo Actions  │  │  • Simulation │  │
│                        │  • Audit Log     │  │  • Comparison │  │
│                        └──────────────────┘  │  • Zod Schemas│  │
│                                               └───────────────┘  │
│                              ▲                    ▲              │
│                              │                    │              │
│                    ┌─────────┴─────────┐  ┌──────┴──────┐       │
│                    │  Atlassian APIs   │  │ NVIDIA NIM  │       │
│                    │  (Jira, Confluence│  │  (LLM API)  │       │
│                    │   Rovo)           │  │             │       │
│                    └───────────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principle:** The Engine Package has **zero knowledge of Forge**. It is a pure domain library. The Forge backend adapts engine outputs to resolver responses and persists via storage adapters.

---

## 2. Module Architecture

### 2.1 Package: `@parallelos/engine` (`/packages/engine`)

```
packages/engine/
├── src/
│   ├── entities/           # Entity definitions & Zod schemas
│   │   ├── types.ts        # Branded types, enums
│   │   ├── schemas.ts      # Zod schemas for all entity types
│   │   ├── factory.ts      # Entity constructors with defaults
│   │   └── index.ts
│   ├── relationships/      # Relationship definitions
│   │   ├── types.ts
│   │   ├── schemas.ts
│   │   ├── factory.ts
│   │   └── index.ts
│   ├── scenario/           # Scenario model & operations
│   │   ├── types.ts
│   │   ├── schemas.ts
│   │   ├── overlay.ts      # Copy-on-write overlay logic
│   │   ├── versioning.ts   # Scenario version history
│   │   └── index.ts
│   ├── simulation/         # Deterministic simulation engine
│   │   ├── types.ts
│   │   ├── decisions.ts    # Decision models (budget, location, etc.)
│   │   ├── propagation.ts  # Dependency graph propagation
│   │   ├── calculators/    # Budget, resource, project, process calculators
│   │   ├── provenance.ts   # Result provenance tracking
│   │   └── index.ts
│   ├── comparison/         # Scenario comparison engine
│   │   ├── types.ts
│   │   ├── dimensions.ts   # Comparison dimensions & weights
│   │   ├── scorecard.ts    # Scorecard generation
│   │   └── index.ts
│   ├── demo/               # Demo data generation
│   │   ├── aurelia.ts      # Aurelia Global Technologies dataset
│   │   └── index.ts
│   ├── validation/         # Cross-module validation
│   └── index.ts            # Public API exports
├── tests/                  # Vitest unit tests
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

**Public API Surface:**
```typescript
// Entities
createOrganization, createDepartment, createEmployee, ...
// Relationships
createRelationship, RelationshipType, DependencyStrength
// Scenarios
createScenario, applyOverride, getEntityInScenario, getRelationshipsInScenario
// Simulation
runSimulation, SimulationDecision, SimulationResult, Provenance
// Comparison
compareScenarios, ComparisonResult, Scorecard
// Demo
loadAureliaDemo
```

### 2.2 Forge Backend (`/src`)

```
src/
├── resolvers/              # Forge resolver definitions
│   ├── health.ts
│   ├── entities.ts
│   ├── scenarios.ts
│   ├── simulation.ts
│   ├── comparison.ts
│   ├── ai.ts
│   ├── jira.ts
│   ├── confluence.ts
│   └── index.ts
├── storage/                # Storage adapters (Custom Entity Store)
│   ├── entity-store.ts     # Generic CRUD + query
│   ├── entities.ts         # Entity-specific operations
│   ├── relationships.ts
│   ├── scenarios.ts
│   └── index.ts
├── services/               # External service integrations
│   ├── jira.ts
│   ├── confluence.ts
│   ├── ai-provider.ts      # NVIDIA NIM abstraction
│   ├── rovo-actions.ts     # Rovo action implementations
│   └── index.ts
├── audit/                  # Audit logging
│   └── logger.ts
├── validation/             # Request/response Zod validation
└── index.ts                # Resolver handler export
```

### 2.3 Custom UI (`/static/ui`)

```
static/ui/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── graph/          # React Flow wrapper components
│   │   ├── charts/         # Recharts wrapper components
│   │   ├── forms/          # Form components with Zod integration
│   │   ├── layout/         # Header, sidebar, navigation
│   │   └── feedback/       # Loading, error, empty states
│   ├── pages/              # Page-level components (routes)
│   │   ├── Overview.tsx
│   │   ├── OrganizationTwin.tsx
│   │   ├── ScenarioLab.tsx
│   │   ├── CompareFutures.tsx
│   │   ├── SimulationHistory.tsx
│   │   ├── Integrations.tsx
│   │   └── Settings.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useResolver.ts  # Typed resolver invocation
│   │   ├── useGraph.ts     # Graph state management
│   │   └── useScenario.ts
│   ├── services/           # Frontend service layer
│   │   ├── api.ts          # Resolver client
│   │   └── storage.ts      # Local UI state
│   ├── styles/             # CSS variables, theme, global styles
│   ├── types/              # Shared TypeScript types
│   ├── utils/              # Helpers
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── public/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 3. Data Flow

### 3.1 Scenario Creation Flow

```
User Action (UI) 
    │
    ▼
Resolver: createScenario(name, description, baselineId)
    │
    ▼
Engine: ScenarioEngine.createScenario(baselineSnapshot)
    │
    ▼
Storage: Persist Scenario entity (with baseline reference)
    │
    ▼
Return: Scenario ID + initial state
```

### 3.2 Simulation Flow

```
User Action: Run Simulation (scenarioId, decisions[])
    │
    ▼
Resolver: runSimulation(scenarioId, decisions)
    │
    ▼
Engine: SimulationEngine.run(scenarioOverlay, decisions)
    │
    ├── Load baseline + scenario overrides
    ├── Build dependency graph
    ├── Propagate decisions through graph
    ├── Calculate impacts (budget, resources, projects, processes)
    ├── Generate provenance for each result
    │
    ▼
Storage: Persist SimulationResult linked to scenario
    │
    ▼
Return: SimulationResult with full provenance
```

### 3.3 Comparison Flow

```
User Action: Compare Scenarios (baselineId, scenarioIds[])
    │
    ▼
Resolver: compareScenarios(baselineId, scenarioIds)
    │
    ▼
Engine: ComparisonEngine.compare(baseline, scenarios)
    │
    ├── Load simulation results for each scenario
    ├── Compute dimensional differences
    ├── Generate scorecards with configurable weights
    │
    ▼
Return: ComparisonResult with side-by-side data
```

### 3.4 AI Flow (NL → Scenario)

```
User: "Reduce OPEX by 15% without affecting critical operations"
    │
    ▼
Resolver: interpretNaturalLanguage(prompt, context)
    │
    ▼
AI Provider: NVIDIA NIM (structured output schema)
    │
    ├── Validates against Zod scenario proposal schema
    ├── Identifies missing info → clarification questions
    │
    ▼
Return: ScenarioProposal { decisions, assumptions, questions }
    │
    ▼
User reviews/edits → creates scenario
```

---

## 4. Storage Architecture

### 4.1 Custom Entity Store Strategy

**Entities** (max 20 per app):
| Entity | Purpose | Key Attributes |
|--------|---------|----------------|
| `Organization` | Tenant root | id, name, baselineVersion |
| `Entity` | All domain entities | id, type, name, data (JSON), version |
| `Relationship` | First-class relationships | id, sourceId, targetId, type, data (JSON) |
| `Scenario` | Scenario definitions | id, name, parentId, baselineVersion, overrides (JSON) |
| `SimulationResult` | Simulation outputs | id, scenarioId, decisions, results (JSON), provenance |
| `ComparisonResult` | Cached comparisons | id, baselineId, scenarioIds, comparison (JSON) |
| `AuditLog` | Important actions | id, timestamp, actor, action, entityRef, details |

**Indexes:** Entity(type), Scenario(parentId), SimulationResult(scenarioId), Relationship(sourceId), Relationship(targetId)

**Limits Check:**
- Demo org: ~100 entities + ~200 relationships = fits in 20 entity types with JSON payloads
- Value size: 240 KiB per object → JSON payloads must stay under limit
- Batch operations for demo data loading

### 4.2 Baseline Versioning

- Baseline is a named snapshot: `baseline:v1`, `baseline:v2`
- Scenarios reference baseline version + parent scenario ID
- Overlays store only deltas (entity overrides, relationship overrides)
- Reconstruction: baseline + parent overrides + own overrides

---

## 5. Forge Manifest Configuration

```yaml
# manifest.yml (key sections)
app:
  id: ari:cloud:ecosystem::app/parallelos-codegeist-2026
  runtime:
    name: nodejs24.x
permissions:
  scopes:
    - storage:app
    - read:jira-work
    - write:jira-work
    - read:confluence-content.all
    - write:confluence-content
    - read:me
  external:
    fetch:
      backend:
        - 'integrate.api.nvidia.com'
        - 'api.nvidia.com'
modules:
  jira:globalPage:
    - key: parallelos-main
      title: ParallelOS
      resource: main
      resolver: resolver
  function:
    - key: resolver
      handler: index.handler
  rovo:agent:
    - key: parallelos-intelligence
      name: ParallelOS Intelligence
      description: Run scenarios, compare futures, create Jira tasks
      actions:
        - runScenario
        - compareScenarios
        - createJiraTasks
resources:
  - key: main
    path: static/ui/build
```

---

## 6. NVIDIA AI Provider Abstraction

```typescript
// src/services/ai-provider.ts
interface AIProvider {
  interpretNaturalLanguage(prompt: string, context: OrgContext): Promise<ScenarioProposal>;
  explainSimulation(question: string, results: SimulationResult[]): Promise<Explanation>;
  recommendDecisions(goals: string[], context: OrgContext): Promise<Recommendation[]>;
}

// Implementation: NVIDIANIMProvider
// Config: modelId, endpoint, apiKey (from Forge encrypted env vars)
// Validation: All outputs parsed against Zod schemas
// Fallback: Deterministic template responses if API unavailable
```

**Model Verification Required:** Check NVIDIA NIM docs for current model IDs, endpoints, rate limits, authentication before implementation.

---

## 7. Rovo Agent Actions

| Action | Input | Output | Approval |
|--------|-------|--------|----------|
| `runScenario` | scenarioId, decisions? | SimulationResult | No |
| `compareScenarios` | baselineId, scenarioIds[] | ComparisonResult | No |
| `createJiraTasks` | scenarioId, taskProposals[] | CreatedIssue[] | **Yes (explicit)** |

---

## 8. Security Architecture

- **Tenant Isolation:** Custom Entity Store is tenant-isolated by Forge platform
- **Permission Checks:** Resolver context provides user/account IDs; validate before Jira/Confluence calls
- **Server-Side Validation:** All resolver inputs validated with Zod
- **Input Sanitization:** No raw user input in queries; parameterized operations
- **Secret Management:** NVIDIA API key in Forge encrypted environment variables; never in code, logs, or frontend
- **Audit Log:** Write-only append for scenario creation, simulation runs, Jira task creation, AI interactions
- **No Cross-Tenant Exposure:** All queries scoped to current tenant/context

---

## 9. TypeScript Configuration

**Engine Package (`packages/engine/tsconfig.json`):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Forge Backend (`tsconfig.json` - existing):**
- CommonJS module for Forge Functions compatibility

**Custom UI (`static/ui/tsconfig.json`):**
- ESNext module, React JSX, Vite aliases

---

## 10. Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Engine Unit | Vitest | All pure functions: entities, relationships, scenario overlay, simulation propagation, calculators, comparison |
| Engine Integration | Vitest | Scenario isolation, versioning, demo data loading |
| Backend Unit | Vitest | Resolvers (mocked storage), storage adapters, service adapters |
| Backend Integration | Manual/Forge | Deploy + test against dev site |
| Frontend Unit | Vitest + RTL | Components, hooks, utilities |
| E2E | Playwright (if env permits) | Critical user flows |

**Test Data:** Deterministic fixtures in `packages/engine/tests/fixtures/`

---

## 11. Build & Deployment Pipeline

```bash
# Local development
npm run lint              # ESLint all packages
npm run typecheck         # tsc --noEmit all packages
npm run test              # Vitest all packages
cd static/ui && npm run build  # Vite production build
forge build               # Forge backend compile check

# Deployment
forge deploy              # Deploy to Forge
forge install             # Install on site
forge tunnel              # Live development
```

---

## 12. Architecture Decisions Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| ADR-001 | Engine as separate package, zero Forge deps | Testability, portability, clear domain boundary | 2026-11-10 |
| ADR-002 | Custom Entity Store for persistence | Structured data, indexes, batch ops, tenant isolation | 2026-11-10 |
| ADR-003 | Copy-on-write scenario overlays | Immutable baseline, efficient storage, clear provenance | 2026-11-10 |
| ADR-004 | Deterministic simulation in TypeScript | Auditability, reproducibility, no LLM hallucination | 2026-11-10 |
| ADR-005 | Provider abstraction for AI | Model swappability, testability, no vendor lock-in | 2026-11-10 |
| ADR-006 | Dark-first enterprise UI theme | Professional control-room aesthetic | 2026-11-10 |
| ADR-007 | React Flow for graph visualization | Interactive, performant, good TypeScript support | 2026-11-10 |

---

## 13. Next Steps (Phase 2+)

1. **Phase 2:** Implement engine entities, relationships, graph, demo data
2. **Phase 3:** Scenario engine with overlay & versioning
3. **Phase 4:** Deterministic simulation engine
4. **Phase 5:** Comparison engine
5. **Phase 6:** NVIDIA AI integration
6. **Phase 7:** Atlassian + Rovo integration
7. **Phase 8:** UI polish
8. **Phase 9:** Testing, deployment, demo prep