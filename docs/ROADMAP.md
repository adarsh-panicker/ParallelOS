# ParallelOS — Roadmap & Phase Plan

**Version:** 1.0  
**Date:** 2026-11-10  
**Status:** Phase 1 — Architecture & Foundation

---

## 1. Phase Overview

| Phase | Focus | Duration | Key Deliverable |
|-------|-------|----------|-----------------|
| **Phase 0** | Vertical Slice | ✅ Done | Forge app with Custom UI, Resolver, Custom Entity Store |
| **Phase 1** | Architecture & Foundation | Current | PRD, Architecture, Data Model, Simulation Design, Integration Plan, Security, Roadmap, Engine skeleton, AGENTS.md |
| **Phase 2** | Organization Twin | 1-2 weeks | Entities, relationships, graph visualization, demo data, tests |
| **Phase 3** | Parallel Scenario Engine | 1-2 weeks | Scenario CRUD, copy-on-write overlays, versioning, isolation tests |
| **Phase 4** | Deterministic Simulation | 2-3 weeks | Decision models, propagation, calculators, provenance, tests |
| **Phase 5** | Scenario Comparison | 1-2 weeks | Side-by-side, dimensions, scorecards, history, tests |
| **Phase 6** | NVIDIA AI Integration | 1-2 weeks | Provider abstraction, NL→Scenario, Explanation, Recommendations |
| **Phase 7** | Atlassian & Rovo | 1-2 weeks | Jira import/tasks, Confluence link/reports, Rovo Agent actions |
| **Phase 8** | Product Polish | 1 week | UI refinement, accessibility, performance, onboarding |
| **Phase 9** | Testing & Deployment | 1 week | Full test suite, Forge deploy, demo prep, documentation |

**Total Estimated:** 9-14 weeks (Codegeist 2026 deadline dependent)

---

## 2. Phase 1 — Architecture & Foundation (Current)

### 2.1 Completed
- [x] Project initialized with Forge CLI
- [x] Phase 0 vertical slice: Custom UI + Resolver + Custom Entity Store
- [x] TypeScript strict mode, ESLint, Vite build working
- [x] AGENTS.md with master rules
- [x] PROGRESS.md tracking

### 2.2 In Progress / To Complete
- [x] **PRD.md** - Product Requirements Document
- [x] **ARCHITECTURE.md** - System architecture
- [x] **DATA_MODEL.md** - Entity, relationship, scenario, simulation schemas
- [x] **SIMULATION_DESIGN.md** - Deterministic engine design
- [x] **INTEGRATION_PLAN.md** - Atlassian + NVIDIA integration
- [x] **SECURITY.md** - Security architecture
- [x] **ROADMAP.md** - This document
- [ ] **Engine package skeleton** (`packages/engine`) with Zod schemas
- [ ] **Vitest configuration** for engine package
- [ ] **Placeholder tests** to verify test pipeline
- [ ] **Git commit** with Phase 1 deliverables
- [ ] **PROGRESS.md** update

### 2.3 Phase 1 Exit Criteria
- [ ] All 7 documentation files created and reviewed
- [ ] `packages/engine` compiles with `tsc --noEmit`
- [ ] `npm run test` passes (even if only placeholder tests)
- [ ] `npm run lint` passes for all packages
- [ ] Git commit with message: "Phase 1: Architecture & Foundation complete"

---

## 3. Phase 2 — Organization Twin

### 3.1 Goals
Implement the core entity/relationship model and interactive graph visualization with Aurelia demo data.

### 3.2 Engine Package (`packages/engine`)

#### Entities
- [ ] `EntityType` enum + branded `EntityId`
- [ ] Zod schemas for all 12 entity types
- [ ] Factory functions with defaults
- [ ] `ValueSource` enum enforcement

#### Relationships
- [ ] `RelationshipType` enum + branded `RelationshipId`
- [ ] Zod schema with redundancy, confidence, evidence
- [ ] Factory functions

#### Demo Data
- [ ] `loadAureliaDemo()` returning baseline entities + relationships
- [ ] 6 departments, 30-40 employees, 8-10 projects
- [ ] 10-15 systems, 15-20 assets, 3 locations
- [ ] 8 processes, 5 vendors
- [ ] Rich dependency network with redundancy

#### Graph Utilities
- [ ] Adjacency list builders
- [ ] Filter by entity type
- [ ] Search by name/property
- [ ] Connected component extraction

#### Tests
- [ ] Entity schema validation
- [ ] Relationship schema validation
- [ ] Demo data loads without errors
- [ ] Graph utilities return correct results

### 3.3 Forge Backend (`src`)

#### Resolvers
- [ ] `getEntities(type?, filter?)` - paginated entity list
- [ ] `getEntity(id)` - single entity with relationships
- [ ] `getRelationships(sourceId?, targetId?, type?)`
- [ ] `searchEntities(query, types?)`
- [ ] `loadDemoData()` - initializes Aurelia baseline

#### Storage
- [ ] Entity store adapter with batch operations
- [ ] Relationship store adapter
- [ ] Baseline version management

### 3.4 Custom UI (`static/ui`)

#### Components
- [ ] `GraphCanvas` - React Flow wrapper with dark theme
- [ ] `EntityNode` - Custom node component per type
- [ ] `Edge` - Custom edge with dependency strength styling
- [ ] `SidePanel` - Entity inspector with provenance
- [ ] `Toolbar` - Filter, search, zoom, layout controls

#### Pages
- [ ] `OrganizationTwin` - Main graph view
- [ ] Routing setup (React Router or simple state)

#### Styling
- [ ] Dark-first theme (charcoal bg, blue/violet accents)
- [ ] CSS variables for theming
- [ ] Lucide icons integration
- [ ] Responsive layout

### 3.5 Phase 2 Exit Criteria
- [ ] Organization Twin renders interactive graph with 100+ nodes
- [ ] Filter, search, pan, zoom work smoothly
- [ ] Entity inspection shows properties + relationships
- [ ] Demo data loads and displays correctly
- [ ] All engine tests pass
- [ ] Backend resolvers return demo data
- [ ] UI builds without errors

---

## 4. Phase 3 — Parallel Scenario Engine

### 4.1 Goals
Implement scenario branching with copy-on-write overlays and versioning.

### 4.2 Engine Package

#### Scenario Model
- [ ] `Scenario` schema with overrides, assumptions, version history
- [ ] `Assumption` schema with source tracking
- [ ] `EntityOverride`, `RelationshipOverride` schemas

#### Overlay Engine
- [ ] `ScenarioEngine.createScenario(baselineVersion, parentId?)`
- [ ] `ScenarioEngine.applyEntityOverride(scenarioId, override)`
- [ ] `ScenarioEngine.applyRelationshipOverride(scenarioId, override)`
- [ ] `ScenarioEngine.getResolvedEntity(scenarioId, entityId)` - merges baseline + overlays
- [ ] `ScenarioEngine.getResolvedRelationships(scenarioId)`
- [ ] `ScenarioEngine.getResolvedContext(scenarioId)` - full context for simulation

#### Versioning
- [ ] `ScenarioEngine.createVersion(scenarioId, summary)`
- [ ] `ScenarioEngine.getVersionHistory(scenarioId)`
- [ ] `ScenarioEngine.restoreVersion(scenarioId, versionId)`

#### Isolation Guarantees
- [ ] Baseline entities never mutated (enforced by tests)
- [ ] Scenario A changes don't affect Scenario B
- [ ] Concurrent overlay application safe

### 4.3 Forge Backend

#### Resolvers
- [ ] `createScenario(input)`
- [ ] `getScenario(id)`
- [ ] `listScenarios(filter?)`
- [ ] `updateScenario(id, updates)`
- [ ] `deleteScenario(id)` (archive)
- [ ] `applyEntityOverride(scenarioId, override)`
- [ ] `applyRelationshipOverride(scenarioId, override)`
- [ ] `getScenarioContext(scenarioId)` - for simulation

#### Storage
- [ ] Scenario entity with JSON overrides
- [ ] Version history entity
- [ ] Efficient querying by parent/baseline

### 4.4 Custom UI

#### Scenario Lab Page
- [ ] Scenario list with create/duplicate/archive
- [ ] Scenario detail view
- [ ] Assumption editor (structured form)
- [ ] Override preview before apply
- [ ] Version history timeline

### 4.5 Tests (Critical)
- [ ] **Isolation Test:** Modify Scenario A → verify Baseline unchanged
- [ ] **Isolation Test:** Modify Scenario A → verify Scenario B unchanged
- [ ] **Isolation Test:** Nested scenarios (A→B→C) → verify independence
- [ ] **Versioning Test:** Restore version → verify state matches
- [ ] **Override Test:** Entity override → resolved context reflects change
- [ ] **Override Test:** Relationship override → graph reflects change
- [ ] **Concurrency Test:** Parallel overlay applications

### 4.6 Phase 3 Exit Criteria
- [ ] Scenarios create, duplicate, version, restore
- [ ] Entity/relationship overrides work
- [ ] **All isolation tests pass** (non-negotiable)
- [ ] Scenario Lab UI functional
- [ ] Resolvers handle scenario operations

---

## 5. Phase 4 — Deterministic Simulation Engine

### 5.1 Goals
Build the core simulation engine with dependency propagation, calculators, and provenance.

### 5.2 Engine Package

#### Decision Models
- [ ] `DecisionType` enum + parameter schemas (Zod)
- [ ] Decision validation and expansion

#### Propagation Engine
- [ ] `PropagationEngine.propagate(context, decisions)`
- [ ] Rules for all 15+ relationship types
- [ ] Redundancy/failover mitigation
- [ ] Cycle detection with iteration limits
- [ ] Depth limiting

#### Calculators
- [ ] `BudgetCalculator` → `BudgetDelta[]`
- [ ] `ResourceCalculator` → `ResourceShortage[]`
- [ ] `ProjectCalculator` → `ProjectImpact[]`
- [ ] `ProcessCalculator` → `ProcessDisruption[]`
- [ ] `MitigationCalculator` → `MitigationEffect[]`

#### Provenance
- [ ] `ProvenanceTracker` records every calculation step
- [ ] Links decision → entity → path → formula → assumptions
- [ ] Deterministic vs estimated flagging
- [ ] Unknown value handling

#### Main Entry Point
- [ ] `SimulationEngine.run(context, decisions)` → `SimulationResult`

### 5.3 Forge Backend

#### Resolvers
- [ ] `runSimulation(scenarioId, decisions)`
- [ ] `getSimulationResult(id)`
- [ ] `listSimulationResults(scenarioId)`

#### Storage
- [ ] SimulationResult entity with full provenance

### 5.4 Custom UI

#### Scenario Lab (Enhanced)
- [ ] Decision builder (guided forms per decision type)
- [ ] Run simulation button with progress
- [ ] Results visualization (affected entities, impacts)
- [ ] Provenance explorer

### 5.5 Tests (Comprehensive)
- [ ] **TC-SIM-001:** Single budget cut → direct delta only
- [ ] **TC-SIM-002:** Budget cut → department → projects
- [ ] **TC-SIM-003:** System outage with active-active → minimal propagation
- [ ] **TC-SIM-004:** System outage no redundancy → full propagation
- [ ] **TC-SIM-005:** Circular dependency → cycle detected, limited
- [ ] **TC-SIM-006:** Unknown property → result marked unknown
- [ ] **TC-SIM-007:** Multiple decisions → combined effects
- [ ] **TC-SIM-008:** Soft vs hard dependency factors
- [ ] **TC-SIM-009:** Provenance completeness on every output
- [ ] **TC-SIM-010:** Deterministic flag accuracy
- [ ] **Performance:** Demo org simulation < 2s

### 5.6 Phase 4 Exit Criteria
- [ ] All 10+ test cases pass
- [ ] Simulation runs on demo org in < 2s
- [ ] Provenance complete for every result
- [ ] Unknown values explicit, never invented
- [ ] Redundancy mitigation working
- [ ] Results stored and retrievable

---

## 6. Phase 5 — Scenario Comparison

### 6.1 Goals
Side-by-side comparison with dimensional analysis and adjustable weights.

### 6.2 Engine Package

#### Comparison Engine
- [ ] `ComparisonEngine.compare(baseline, scenarios)` → `ComparisonResult`
- [ ] 9 default dimensions (configurable)
- [ ] Normalization (0-100) per dimension
- [ ] Weighted scoring (no single unexplained score)
- [ ] Difference analysis (absolute + percent)
- [ ] Significance classification

#### Scorecards
- [ ] Per-scenario dimension scores
- [ ] Weighted total (transparent calculation)
- [ ] Visualization-ready data structures

### 6.3 Forge Backend

#### Resolvers
- [ ] `compareScenarios(baselineId, scenarioIds, weights?)`
- [ ] `getComparisonResult(id)`
- [ ] `listComparisons(baselineId?)`

### 6.4 Custom UI

#### Compare Futures Page
- [ ] Scenario selector (baseline + 2-4 scenarios)
- [ ] Dimension weight sliders
- [ ] Side-by-side table view
- [ ] Bar/radar charts (Recharts)
- [ ] Difference heatmap
- [ ] Trade-off narrative (AI-enhanced in Phase 6)

#### Simulation History Page
- [ ] List of past simulations
- [ ] Drill-down to inputs/outputs
- [ ] Re-run capability
- [ ] Version comparison

### 6.5 Tests
- [ ] Comparison produces correct deltas
- [ ] Weight changes affect scores correctly
- [ ] Normalization handles unknowns
- [ ] UI renders charts correctly

### 6.6 Phase 5 Exit Criteria
- [ ] Compare 3 scenarios against baseline
- [ ] Adjustable weights update scores in real-time
- [ ] Charts render correctly
- [ ] History page shows past simulations
- [ ] No single unexplained overall score shown

---

## 7. Phase 6 — NVIDIA AI Integration

### 7.1 Goals
Server-side NVIDIA NIM integration with provider abstraction.

### 7.2 Pre-Implementation Verification
- [ ] **Verify NVIDIA NIM docs:** Current models, endpoints, auth, rate limits
- [ ] **Select model:** e.g., `meta/llama-3.1-70b-instruct` or `nvidia/nemotron-3-ultra`
- [ ] **Test API:** Manual curl to verify endpoint + key
- [ ] **Record in PROGRESS.md:** Doc URLs, model ID, endpoint, limits

### 7.3 Engine/Backend

#### Provider Abstraction
- [ ] `AIProvider` interface
- [ ] `NVIDIANIMProvider` implementation
- [ ] Config from Forge encrypted env vars
- [ ] Health check endpoint

#### Capabilities
- [ ] `interpretNaturalLanguage(prompt, context)` → `ScenarioProposal`
- [ ] `explainSimulation(question, results)` → `Explanation`
- [ ] `recommendDecisions(goals, context)` → `Recommendation[]`

#### Validation
- [ ] All outputs parsed against Zod schemas
- [ ] Retry on validation failure (max 2)
- [ ] Fallback to template responses

#### Safeguards
- [ ] AI cannot invent relationships (validated against context)
- [ ] AI cannot modify baseline (read-only context)
- [ ] AI cannot fabricate results (grounded in simulation outputs)
- [ ] Evidence/assumption distinction in output
- [ ] Uncertainty explicitly marked
- [ ] No real Atlassian changes without approval

### 7.4 Forge Backend

#### Resolvers
- [ ] `interpretNaturalLanguage(prompt)`
- [ ] `explainSimulation(simulationId, question)`
- [ ] `recommendDecisions(goals[])`

### 7.5 Custom UI

#### Scenario Lab (Enhanced)
- [ ] Natural language input → structured proposal
- [ ] Clarifying questions display
- [ ] Proposal review/edit before create

#### Compare Futures (Enhanced)
- [ ] "Explain this difference" buttons
- [ ] AI-generated trade-off narratives

#### Rovo Integration Preview
- [ ] Test action invocations

### 7.6 Tests
- [ ] Provider abstraction works (mock provider)
- [ ] NL → Proposal validation passes
- [ ] Explanation grounded in actual results
- [ ] Recommendations are proposals only
- [ ] Schema validation rejects invalid output
- [ ] Fallback works when API unavailable

### 7.7 Phase 6 Exit Criteria
- [ ] NVIDIA NIM integration working server-side
- [ ] Provider abstraction allows model swap
- [ ] All three AI functions operational
- [ ] Safeguards enforced
- [ ] No API key exposure

---

## 8. Phase 7 — Atlassian & Rovo Integration

### 8.1 Jira Integration

#### Import
- [ ] `importJiraProjects(projectKeys[])` resolver
- [ ] Project → Project entity mapping
- [ ] Issues → Project milestones/tasks
- [ ] Users → Employees
- [ ] Components → BusinessSystems
- [ ] Relationships: owns, depends_on, allocated_to
- [ ] Source = `ValueSource.Imported`

#### Remediation Tasks
- [ ] `createRemediationTasks(scenarioId, proposals[], approvalToken)` resolver
- [ ] Approval token verification (audit log)
- [ ] Issue creation with scenario link (entity property)
- [ ] Labels: `parallelos`, `scenario-{id}`, `remediation`

### 8.2 Confluence Integration

#### Document Linking
- [ ] `linkDocumentToEntity(entityId, pageId)` resolver
- [ ] `searchDocuments(query, entityTypes[])` resolver
- [ ] Excerpt extraction and storage

#### Report Storage
- [ ] `storeScenarioReport(input)` resolver
- [ ] ADF generation for rich content
- [ ] Labels for discoverability

### 8.3 Rovo Agent

#### Manifest
- [ ] `rovo:agent` module with 3 actions
- [ ] Prompt templates

#### Actions
- [ ] `runScenario` → invokes simulation resolver
- [ ] `compareScenarios` → invokes comparison resolver
- [ ] `createJiraTasks` → invokes task creation with approval confirmation

#### Testing
- [ ] Agent installs and appears in Rovo
- [ ] Actions invoke correct resolvers
- [ ] Responses formatted for chat
- [ ] Approval flow works

### 8.4 Teamwork Graph
- [ ] Investigate GA status (timebox: 4 hours)
- [ ] Document decision in PROGRESS.md

### 8.5 Phase 7 Exit Criteria
- [ ] Jira import creates entities with correct mapping
- [ ] Remediation tasks create with approval
- [ ] Confluence linking works
- [ ] Scenario reports store and retrieve
- [ ] Rovo Agent functional with 3 actions
- [ ] All permission checks enforced

---

## 9. Phase 8 — Product Polish

### 9.1 UI Refinement
- [ ] Consistent spacing, typography, color system
- [ ] Loading skeletons for all async operations
- [ ] Error boundaries with user-friendly messages
- [ ] Empty states with guidance
- [ ] Keyboard navigation
- [ ] Screen reader support (ARIA labels)
- [ ] Focus management

### 9.2 Performance
- [ ] Graph virtualization for 500+ nodes
- [ ] Memoization of expensive computations
- [ ] Code splitting by route
- [ ] Bundle size optimization

### 9.3 Onboarding
- [ ] First-run tutorial overlay
- [ ] Demo data reset button
- [ ] Contextual help tooltips
- [ ] Keyboard shortcuts reference

### 9.4 Documentation
- [ ] User guide (Confluence or in-app)
- [ ] API documentation (resolver signatures)
- [ ] Architecture decision log
- [ ] Deployment guide

### 9.5 Phase 8 Exit Criteria
- [ ] UI feels polished and responsive
- [ ] Accessibility audit passes (WCAG 2.1 AA)
- [ ] Performance targets met
- [ ] Documentation complete

---

## 10. Phase 9 — Testing & Deployment

### 10.1 Test Execution
- [ ] `npm run test` all packages pass
- [ ] `npm run lint` all packages pass
- [ ] `npm run typecheck` all packages pass
- [ ] Integration tests against dev site
- [ ] Rovo action tests
- [ ] NVIDIA integration tests (with mock fallback)

### 10.2 Forge Deployment
- [ ] `forge deploy` succeeds
- [ ] `forge install` on developer site
- [ ] Verify all modules load
- [ ] Test with demo data
- [ ] Test with real Jira/Confluence data (if available)

### 10.3 Demo Preparation
- [ ] 4-minute demo script rehearsed
- [ ] Baseline + 3 scenarios configured
- [ ] Rovo questions prepared
- [ ] Jira task creation demoed
- [ ] Fallback for offline/demo mode

### 10.4 Competition Submission
- [ ] App listing prepared
- [ ] Screenshots/video recorded
- [ ] Documentation packaged
- [ ] Submission before deadline

### 10.5 Phase 9 Exit Criteria
- [ ] All tests pass
- [ ] App deploys and runs on Forge
- [ ] Demo executes flawlessly
- [ ] Competition submission complete

---

## 11. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Forge Custom Entity Store limits too restrictive | Medium | High | Monitor usage; fallback to Forge SQL if needed |
| NVIDIA NIM API changes/rate limits | Medium | Medium | Provider abstraction; mock fallback; cache responses |
| Rovo Agent APIs change | Low | Medium | Build on documented GA features only |
| Graph performance with 100+ nodes | Medium | Medium | Virtualization, level-of-detail, memoization |
| Simulation complexity exceeds 25s timeout | Low | High | Optimize algorithms; async events if needed |
| Team member availability | Medium | Medium | Pair programming; knowledge sharing; documentation |
| Codegeist deadline immovable | Certain | Critical | Prioritize MVP features; cut scope early if needed |

---

## 12. Scope Management

### Must Have (MVP for Codegeist)
1. Organization Twin with interactive graph
2. 3 parallel scenarios with copy-on-write
3. Deterministic simulation with provenance
4. Scenario comparison with adjustable weights
5. NVIDIA AI: NL→Scenario, Explanation, Recommendations
6. Jira import + remediation tasks
7. Confluence link + reports
8. Rovo Agent with 3 actions
9. Aurelia demo data
10. Dark-first control room UI

### Nice to Have (Post-Codegeist)
- Teamwork Graph integration
- Monte Carlo probabilistic simulation
- Real-time collaboration
- Custom entity types via UI
- Advanced reporting/export
- Mobile responsive layouts
- Audit log UI
- Multi-baseline support

### Explicitly Out of Scope
- Chatbot interface (Rovo covers this)
- Jira dashboard replacement
- General-purpose project management
- Real-time data sync (batch import only)
- Predictive ML (deterministic only)

---

## 13. Next Immediate Actions (Phase 1 Completion)

1. [ ] Create `packages/engine` skeleton with `package.json`, `tsconfig.json`, `vitest.config.ts`
2. [ ] Implement core type definitions and Zod schemas
3. [ ] Add Vitest with placeholder tests
4. [ ] Run `npm run lint`, `npm run typecheck`, `npm test` in engine package
5. [ ] Update root `package.json` with engine workspace
6. [ ] Commit all Phase 1 files
7. [ ] Update PROGRESS.md
8. [ ] Present Phase 1 summary for approval