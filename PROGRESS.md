# ParallelOS Progress Tracker

## Done
- Initialized project tracking files: `AGENTS.md` with Master Rules and architecture constraints.
- Saved full prompt pack reference for Codegeist 2026 build phases.
- Environment verified: Node.js v24.19.0, npm 11.17.0, Git 2.55.0, Forge CLI 14.2.0
- Forge documentation researched and summarized below
- **Phase 0 vertical slice completed:**
  - Created minimal Forge app with Custom UI (React 18 + TypeScript + Vite)
  - Dark-themed enterprise UI with ParallelOS branding
  - Resolver functions: healthCheck, writeTestValue, readTestValue, listTestEntities
  - Custom Entity Store integration with Zod validation
  - ESLint passes for both backend and frontend
  - TypeScript compiles without errors
  - Vite build produces production assets in `static/hello-world/build/`
  - README.md with setup instructions
  - .gitignore with proper exclusions

- **Phase 1 Architecture & Foundation completed:**
  - Created 7 core architecture documents in `/docs`:
    - PRD.md - Product Requirements Document
    - ARCHITECTURE.md - System Architecture
    - DATA_MODEL.md - Entity, Relationship, Scenario, Simulation schemas
    - SIMULATION_DESIGN.md - Deterministic Simulation Engine Design
    - INTEGRATION_PLAN.md - Atlassian & NVIDIA Integration Plan
    - SECURITY.md - Security Architecture
    - ROADMAP.md - 9-Phase Roadmap & Risk Register
  - Created engine package (`packages/engine`) with:
    - Entity models (12 types) with Zod schemas and factories
    - Relationship models (15 types) with redundancy/failover support
    - Scenario model with copy-on-write overlays and versioning
    - Deterministic simulation engine with dependency propagation
    - Domain calculators (budget, resources, projects, processes)
    - Provenance tracking for all simulation results
    - Scenario comparison engine with 9 dimensions and adjustable weights
    - Aurelia Global Technologies demo data (100+ entities, 200+ relationships)
    - 51 passing unit tests (entities, relationships, demo data, simulation)
  - Updated AGENTS.md with Phase 1 decisions
  - Root UI builds successfully (Vite + React + TypeScript)
  - Engine package tests pass (51/51)

- **Phase 2 Organization Twin completed:**
  - Built Organization Twin UI with React Flow graph visualization
  - Implemented entity/relationship CRUD resolvers
  - Connected Aurelia demo data to UI
  - Implemented graph filtering, search, inspection
  - Side panel for entity inspection with relationships
  - Toolbar with search, filters, zoom controls, export
  - MiniMap for navigation
  - Loading states and error handling
  - All TypeScript errors resolved (tsc passes)
  - Vite build successful (esbuild)
  - Engine package tests pass (51/51)

- **Phase 3 Parallel Scenario Engine completed:**
  - Scenario CRUD: create, get, list, delete (archive)
  - Entity overrides: create, update, delete with copy-on-write semantics
  - Relationship overrides: create, update, delete with proper merging
  - Assumptions tracking with source tracking (assumed/ai-hypothesis)
  - Scenario versioning: create versions, restore to previous versions
  - Scenario context resolution: baseline + overrides merged correctly
  - Scenario isolation: changes in one scenario don't affect others or baseline
  - Scenario versioning: create versions, restore to previous versions
  - 16 scenario tests passing (67 total tests passing)
  - Copy-on-write overlays with proper merge semantics
  - Scenario isolation guarantees verified by tests

## In Progress
- ESLint configuration for engine package (style issues - non-blocking)

## Next (Phase 4 - Deterministic Simulation)
- Implement decision models (budget, location, system, outage, restructure)
- Implement dependency propagation with redundancy awareness
- Implement domain calculators (budget, resources, projects, processes)
- Implement provenance tracking
- Simulation result provenance

## Next (Phase 5 - Scenario Comparison)
- Side-by-side comparison UI
- 9 comparison dimensions with adjustable weights
- Difference analysis and trade-off visualization
- Simulation history and re-run capability

## Next (Phase 5 - Scenario Comparison)
- Side-by-side comparison UI
- 9 comparison dimensions with adjustable weights
- Difference analysis and trade-off visualization
- Simulation history and re-run capability

## Next (Phase 6 - NVIDIA AI Integration)
- Natural language to scenario proposal
- Grounded simulation explanations
- Decision recommendations (proposals only)

## Next (Phase 7 - Atlassian & Rovo Integration)
- Jira: import projects/issues, create remediation tasks
- Confluence: link docs, store scenario reports
- Rovo Agent: 3 actions (run scenario, compare, create Jira tasks)

## Next (Phase 8 - Product Polish)
- UI refinement, accessibility, performance
- Onboarding, error handling, empty states

## Next (Phase 9 - Testing & Deployment)
- Full test suite, Forge deployment, demo prep

## Manual steps needed (for Forge deployment)
- **forge login**: Create API token at https://id.atlassian.com/manage-profile/security/api-tokens (select "Forge" as app)
- **forge create**: Run in project root to create/register app on Forge platform
- **forge deploy**: Deploy the app code
- **forge install**: Install on your developer site or demo site
- **Open app**: Navigate to Jira/Confluence and find "ParallelOS" in the global navigation

## Doc URLs consulted
- Getting started: https://developer.atlassian.com/platform/forge/getting-started/
- Manifest reference: https://developer.atlassian.com/platform/forge/manifest-reference/
- Custom UI in Jira: https://developer.atlassian.com/platform/forge/build-a-custom-ui-app-in-jira/
- Storage overview: https://developer.atlassian.com/platform/forge/storage-reference/
- Forge SQL: https://developer.atlassian.com/platform/forge/storage-reference/sql/
- Custom Entity Store: https://developer.atlassian.com/platform/forge/storage-reference/entities/
- KVS/Custom Entity limits: https://developer.atlassian.com/platform/forge/limits-kvs-ce/
- Invocation limits: https://developer.atlassian.com/platform/forge/limits-invocation/
- Egress permissions: https://developer.atlassian.com/platform/forge/runtime-egress-permissions/
- Rovo Agent: https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-agent/
- Custom UI Bridge: https://developer.atlassian.com/platform/forge/apis-reference/ui-api-bridge/bridge/
- NVIDIA NIM API: https://docs.nvidia.com/nim/ (to be verified before Phase 6)

## Forge limits affecting this project
1. **Function timeout**: 25 seconds for standard functions, 55 seconds for web trigger/action/rovo modules, 900 seconds for async events/scheduled triggers
2. **Memory**: 512 MB default, up to 1024 MB configurable
3. **Storage - Custom Entity Store**: 
   - Max 20 entities per app
   - Max 50 attributes per entity
   - Max 7 custom indexes per entity
   - Value size: 240 KiB per object
   - Object depth: 31 max
   - Query conditions: 100 max per query
   - Read rate: 4000 per minute (10KB requests)
   - Write rate: 4000 per minute (10KB requests)
4. **Egress**: Must declare external domains in manifest `permissions.external.fetch.backend`
5. **Manifest size**: 200 KB max
6. **Invocation payload**: 5 MB max request, 500 KB front-end request, 5 MB front-end response

## Storage Recommendation: Custom Entity Store
**Reasoning**: 
- ParallelOS needs structured data (entities, relationships, scenarios) with complex queries
- Custom Entity Store supports indexes for efficient querying
- Supports batch operations for bulk data loading (demo data)
- Type-safe with schema validation in manifest
- Tenant-isolated automatically
- Better for our data model than simple KVS or heavy SQL
- No SQL migration complexity needed for Phase 0-3