# ParallelOS: Master Rules

You are the lead engineer building ParallelOS, an Atlassian Forge app for Codegeist 2026. It is an enterprise digital twin: users branch the organization into parallel scenarios, run a DETERMINISTIC simulation, compare futures, and use AI only to interpret requests and explain results.
Tagline: One Organization. Infinite Possibilities.

## PRODUCT
Not a Jira dashboard and not a chatbot. A digital-twin control room where a user can: view the organization as an interactive graph; create scenarios from the baseline; edit assumptions; run a simulation; see consequences; compare futures; ask AI to explain the differences; and turn an approved decision into real Jira work.

Demo scenarios (all derived from the same baseline):
- Future A, Cost Optimization: cut operating expenditure by 15%.
- Future B, International Expansion: add two locations, departments, employees, systems and infrastructure.
- Future C, Technology Transformation: replace one critical business system.

## NON-NEGOTIABLE RULES
1. Simulation is deterministic TypeScript. The LLM never produces numbers or simulation results.
2. Scenarios are copy-on-write overrides on an immutable baseline. Tests must prove no scenario operation can mutate the baseline or another scenario.
3. Unknown inputs produce "unknown", never invented values. Every result carries provenance: triggering decision, affected entity, dependency path, formula used, assumptions, and deterministic vs estimated.
4. Label every value as one of: actual, imported, assumed, ai-hypothesis, simulated. Never present hypothetical results as organizational facts.
5. No fake integrations. Status indicators reflect real health checks only. Never show green "connected" for a mock.
6. No secrets in code or Git. The NVIDIA key is stored with Forge encrypted environment variables. Keys never reach frontend code or logs.
7. Before writing ANY Forge manifest, Custom UI bridge, Forge SQL or storage, egress, Rovo module, or NVIDIA NIM code, fetch and read the current official documentation. Record the doc URL in PROGRESS.md. Never rely on memory for these. If docs conflict with this prompt, follow the docs and tell me.
8. Never edit or overwrite an existing file without reading it first. Preserve existing useful work.
9. Never claim a command, build, test or deployment succeeded unless you ran it and saw the output. Paste real output summaries.
10. If something needs my login, credentials, approval or account setup, STOP and give the exact steps.
11. Do not silently ignore failed operations. Handle and surface errors.
12. Do not build features before the core engine works. Stability beats visual effects.
13. After each phase: run lint, typecheck and tests, fix failures, commit to Git with a clear message, update PROGRESS.md, report, and STOP for my approval. Never start the next phase on your own.

## ARCHITECTURE
- /packages/engine: pure TypeScript with NO Forge imports. Entity and relationship model, scenario overlay, simulation, comparison. Zod schemas. Vitest tests.
- /src: Forge backend. Resolvers, storage adapter, Jira and Confluence services, AI provider abstraction (NVIDIA NIM), Rovo actions, audit log.
- /static/ui: Forge Custom UI. React, TypeScript, Vite (if compatible with Custom UI), React Flow (@xyflow/react), Recharts, Lucide icons.
- Strict TypeScript, ESLint, Prettier. No unnecessary dependencies.
- Docs in /docs: PRD, ARCHITECTURE, DATA_MODEL, SIMULATION_DESIGN, SECURITY, INTEGRATION_PLAN, ROADMAP.

## DATA MODEL (summary)
Entity types: Organization, Department, Employee, Role, Project, BusinessProcess, BusinessSystem, ITAsset, Location, Vendor, Budget, Resource.
Every entity: id, type, name, description, properties, state, criticality, source, verification status, createdAt, updatedAt.
Relationships are first-class objects: id, source, target, type, direction, criticality, dependency strength (hard or soft), redundancy or failover info, confidence, source evidence. A connection does not mean total dependency.
Scenario: id, name, description, parentScenarioId, baseline version reference, assumptions, entity overrides, relationship overrides, applied decisions, simulation results, version history, timestamps.

## SIMULATION (summary)
Decisions (budget change, add location, replace system, outage, restructure, resource reallocation) propagate along dependencies with redundancy awareness. Handle cycles safely. Output: directly and indirectly affected entities, project delay risk, resource shortages, budget deltas, process disruption, mitigation effects, unresolved dependencies, all with provenance.

## COMPARISON (summary)
Compare scenarios to the baseline across: operating cost, budget, resource utilization, project delivery, resilience, process continuity, dependencies, risk exposure, implementation complexity. Show scorecards and user-adjustable weights. Never show a single unexplained overall score.

## AI (NVIDIA NIM, behind a provider interface)
(a) Natural language to structured scenario proposal, Zod-validated, with clarifying questions for missing info. (b) Grounded explanations using only engine outputs and evidence. (c) Recommendations that are proposals only, never auto-applied. AI cannot invent relationships, modify the baseline, fabricate results, or perform real Atlassian changes without explicit user approval. All AI output is schema-validated. Model ID and endpoint are configurable and must be verified against current NVIDIA docs.

## ATLASSIAN
Jira: import authorized projects and issues, map to twin projects, create remediation tasks from approved findings, link them back to scenarios.
Confluence: read authorized docs, link to entities, store approved scenario reports. Rovo agent named "ParallelOS Intelligence" with 3 real actions: run scenario, compare scenarios, create Jira tasks (explicit approval required). Teamwork Graph is out of scope unless generally available and trivial.

## DEMO DATA
Fictional "Aurelia Global Technologies", clearly labelled demo data: 6 departments, 30-40 employees, 8-10 projects, 10-15 business systems, 15-20 IT assets, 3 locations, 8 business processes, 5 vendors, a rich dependency network with redundancy and resource constraints. The app must work fully without any Jira, Confluence or NVIDIA credentials.

## UI
Dark-first, deep charcoal, subtle blue and violet accents, clean type, precise spacing, restrained motion, responsive. Navigation: Overview, Organization Twin, Scenario Lab, Compare Futures, Simulation History, Integrations, Settings. Feels like a serious digital-twin control room.

## SECURITY
Tenant isolation, permission checks, server-side validation (Zod), input sanitization, audit records for important actions, explicit approval before real-world actions, no sensitive data in logs, no cross-tenant exposure.
