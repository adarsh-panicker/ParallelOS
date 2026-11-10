# ParallelOS — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-11-10  
**Status:** Phase 1 — Architecture & Foundation

---

## 1. Executive Summary

ParallelOS is an enterprise digital twin and parallel scenario simulation platform built as an Atlassian Forge application for Codegeist 2026. It enables organizations to create structured digital representations of themselves, branch into independent parallel scenarios, run deterministic simulations, compare possible futures, and use AI only to interpret requests and explain results—never to generate simulation numbers.

**Tagline:** One Organization. Infinite Possibilities.

---

## 2. Problem Statement

Organizations make high-stakes decisions (budget cuts, expansions, technology transformations) based on spreadsheets, intuition, or isolated analyses that cannot capture cross-functional dependencies. There is no safe way to "try out" organizational changes before committing real resources.

**Current gaps:**
- No unified organizational model connecting people, projects, systems, processes, and infrastructure
- Scenario planning is manual, disconnected, and error-prone
- Dependency propagation across departments/systems is invisible
- AI assistants hallucinate numbers instead of explaining computed results
- No bridge from simulated decisions to trackable Atlassian work items

---

## 3. Product Vision

ParallelOS creates a **digital twin control room** where users can:

1. **View** the organization as an interactive dependency graph
2. **Branch** the baseline into independent scenarios (copy-on-write, immutable baseline)
3. **Model** decisions as structured assumptions and overrides
4. **Simulate** consequences deterministically (TypeScript engine, no LLM math)
5. **Compare** scenarios side-by-side across cost, risk, resilience, delivery, complexity
6. **Explain** differences using grounded AI that cites simulation provenance
7. **Act** by converting approved findings into Jira tasks with explicit user approval

---

## 4. Target Users

| Persona | Needs |
|---------|-------|
| **CTO / VP Engineering** | Compare technology transformation scenarios, understand system migration risks |
| **COO / Operations Lead** | Model cost optimization vs. operational resilience trade-offs |
| **Program Manager** | See project impact of resource/budget changes across dependencies |
| **Enterprise Architect** | Visualize system dependencies, redundancy, failure propagation |
| **Strategy / Finance** | Compare OPEX scenarios with evidence-backed assumptions |

---

## 5. Core Features (MVP Scope for Codegeist 2026)

### 5.1 Organization Twin (Module A)
- Interactive graph of entities: Organization, Department, Employee, Role, Project, BusinessProcess, BusinessSystem, ITAsset, Location, Vendor, Budget, Resource
- First-class relationships with dependency strength, redundancy, confidence, evidence
- Filter, search, zoom, pan, entity inspection panel
- Demo data: "Aurelia Global Technologies" (6 depts, 30-40 employees, 8-10 projects, 10-15 systems, 15-20 assets, 3 locations, 8 processes, 5 vendors)

### 5.2 Scenario Engine (Module B)
- Create/duplicate/rename/archive/reset scenarios
- Copy-on-write entity & relationship overrides on immutable baseline
- Scenario versioning with history
- Scenario isolation guarantees (tested)

### 5.3 Deterministic Simulation Engine (Module C)
- Decision types: budget change, add location, replace system, outage, restructure, resource reallocation
- Dependency propagation with redundancy awareness
- Cycle-safe graph traversal
- Outputs: affected entities, project delays, resource shortages, budget deltas, process disruption, mitigation effects, unresolved dependencies
- **Provenance on every result:** triggering decision, affected entity, dependency path, formula, assumptions, deterministic vs. estimated
- Unknown inputs → "unknown" (never invented)

### 5.4 Scenario Comparison Engine (Module D)
- Compare against baseline: operating cost, budget, resource utilization, project delivery, resilience, process continuity, dependencies, risk exposure, implementation complexity
- Side-by-side views, difference analysis, scorecards with adjustable weights
- No single unexplained overall score

### 5.5 NVIDIA AI Intelligence Layer (Module E)
- **NL → Scenario:** Natural language to structured Zod-validated proposal with clarifying questions
- **Explanation:** Grounded in simulation outputs + evidence only
- **Recommendations:** Proposals only, never auto-applied
- **Safeguards:** No invented relationships, no baseline modification, no fabricated results, evidence/assumption distinction, uncertainty explanation, no real Atlassian changes without approval, schema-validated output
- Server-side only, provider abstraction, configurable model/endpoint

### 5.6 Atlassian Integration (Module F)
- **Jira:** Import authorized projects/issues → twin projects; create remediation tasks from approved findings; link back to scenarios
- **Confluence:** Read authorized docs → link to entities; store approved scenario reports
- **Rovo Agent:** "ParallelOS Intelligence" with 3 actions: run scenario, compare scenarios, create Jira tasks (explicit approval)
- Teamwork Graph: out of scope unless GA and trivial

---

## 6. Non-Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| **Determinism** | Same inputs → same outputs; no LLM in simulation path |
| **Isolation** | Scenario changes never affect baseline or other scenarios |
| **Provenance** | Every result traces to decision, entity, path, formula, assumptions |
| **Labeling** | Every value: actual / imported / assumed / ai-hypothesis / simulated |
| **Security** | Tenant isolation, permission checks, server-side validation, audit log, no secrets in code/logs/frontend |
| **Performance** | Graph rendering ≤ 500 nodes smooth; simulation < 5s for demo org |
| **Offline Demo** | Full demo works without Jira/Confluence/NVIDIA credentials |
| **Accessibility** | WCAG 2.1 AA baseline |

---

## 7. Demo Scenarios (Signature Demonstration)

**Baseline:** Aurelia Global Technologies current state

| Scenario | Decision | Key Outputs |
|----------|----------|-------------|
| **Future A — Cost Optimization** | Reduce OPEX 15% | Budget adjustments, resource changes, project delays, critical trade-offs |
| **Future B — Global Expansion** | Add 2 international locations | New depts, employees, infra, systems, budget increase, new dependencies |
| **Future C — Technology Transformation** | Replace 1 critical business system | Affected processes, dependent projects, migration needs, transition risks |

**Demo Flow (4 min):**
1. Show baseline Organization Twin
2. Create 3 scenarios in Scenario Lab
3. Run simulations
4. Compare Futures side-by-side
5. Ask Rovo: "Which future balances growth, cost, resilience?"
6. Approve recommendation → create Jira task

---

## 8. Success Criteria (Codegeist 2026)

- [ ] Forge app installs and runs on developer site
- [ ] Organization Twin renders interactive graph with demo data
- [ ] Three scenarios create, simulate, compare without baseline mutation
- [ ] Simulation produces provenance-rich results (not hardcoded)
- [ ] Comparison shows dimensional trade-offs with adjustable weights
- [ ] Rovo Agent invokes real actions and returns actual results
- [ ] NVIDIA NIM integration works server-side with provider abstraction
- [ ] No hardcoded secrets; encrypted env vars for NVIDIA key
- [ ] All lint, typecheck, tests pass
- [ ] Dark-first enterprise UI feels like a control room

---

## 9. Out of Scope (MVP)

- Teamwork Graph integration (unless GA)
- Real-time collaborative editing
- Advanced ML-based forecasting
- Multi-tenant admin console
- Custom entity types via UI
- Mobile-specific layouts
- Audit log UI (backend only for MVP)

---

## 10. Dependencies & Risks

| Dependency | Risk | Mitigation |
|------------|------|------------|
| Forge Custom Entity Store limits (20 entities, 50 attrs) | May constrain demo data model | Use efficient schema; evaluate Forge SQL if needed |
| Forge egress permissions | NVIDIA API domain must be declared | Verified in manifest |
| NVIDIA NIM model availability | Model IDs/endpoints change | Provider abstraction; verify before lock-in |
| Rovo Agent module stability | Preview APIs may change | Build on documented GA features only |
| Graph performance (React Flow) | Large graphs may lag | Virtualization, memoization, level-of-detail |

---

## 11. Acceptance Criteria for Phase 1

- [ ] PRD.md, ARCHITECTURE.md, DATA_MODEL.md, SIMULATION_DESIGN.md, INTEGRATION_PLAN.md, SECURITY.md, ROADMAP.md created
- [ ] Engine package skeleton with Zod schemas compiles
- [ ] Vitest configured with passing placeholder tests
- [ ] AGENTS.md updated with Phase 1 decisions
- [ ] PROGRESS.md updated
- [ ] Git commit with clear message