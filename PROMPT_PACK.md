# ParallelOS: Antigravity Prompt Pack
One Organization. Infinite Possibilities.
A phase-by-phase prompt set for building ParallelOS (Atlassian Forge, Codegeist 2026) in Google Antigravity.

## How to use this pack
1. Create an empty folder for the project and open it in Antigravity.
2. Paste Part A (Master Rules) as your very first message. Antigravity will save it as AGENTS.md. You paste it only once.
3. Run the phases one at a time, in order. Paste one phase prompt, let it finish, then check the "Your checks before moving on" list.
4. Start a fresh conversation for each phase if the context gets long. AGENTS.md and PROGRESS.md carry the memory between sessions.
5. Do not start the next phase until the current one is committed and its checks pass.

Honest note: no prompt can guarantee a 100% result. Antigravity cannot log in to Atlassian for you, cannot approve installs, and can get Forge manifest or Rovo syntax wrong if it works from memory. This pack reduces that risk by forcing it to read current docs, prove each phase, and stop for review.
Manual things only you can do: forge login, creating a Forge developer site, installing the app, getting the NVIDIA API key, enabling Rovo on your site, and final demo testing.

---

## Part A: Master Rules
(See AGENTS.md)

---

## Part B: Phase prompts

### Phase 0: Vertical slice (prove Forge works end to end)
Read AGENTS.md and PROGRESS.md fully. Execute PHASE 0 ONLY.
Goal: prove the whole Forge pipeline works before building anything real.
Tasks:
1. Inspect the entire workspace. Report whether it is empty or has existing work. Preserve anything useful.
2. Check my environment (Windows 11): Node.js LTS version, npm, Git, and the Forge CLI. Report what is missing and give exact install commands.
3. Read the current official Forge docs (getting started, Custom UI, manifest, resolvers, storage options, Forge SQL vs Custom Entity Store, runtime and timeout limits, egress permissions). Summarize the limits that affect this project in PROGRESS.md with URLs. Recommend a storage option with reasons.
4. Create a minimal Forge app with a Custom UI (React + TypeScript) that:
   - shows a dark-themed page,
   - calls a resolver,
   - writes and reads one value from the chosen storage.
5. Run forge lint and the build. Fix errors.
6. STOP and give me the exact commands and clicks for the steps that need my account: forge login, forge register or create, forge deploy, forge install on my developer site, and how to open the app. Wait for me to confirm they worked. Do not pretend they did.
7. Create the Git repo with a sensible .gitignore (no secrets, no node_modules) and commit.
Report: files created or changed, commands run with real output, what works, what is broken, what I must do manually. Update PROGRESS.md. STOP.

Your checks before moving on:
- forge deploy and forge install succeeded on your site.
- The app opens in Jira or Confluence and the resolver and storage round trip works.
- Repo is committed, no secrets in it.

---

### Phase 1: Documentation, architecture and engine skeleton
Read AGENTS.md and PROGRESS.md. Execute PHASE 1 ONLY.
Tasks:
1. Create in /docs: PRD.md, ARCHITECTURE.md, DATA_MODEL.md, SIMULATION_DESIGN.md, INTEGRATION_PLAN.md, SECURITY.md, ROADMAP.md. Be specific and consistent with AGENTS.md and with what Phase 0 proved about Forge limits.
2. Define and justify:
   - the final architecture and module boundaries,
   - the data model (entities, relationships, scenarios),
   - the scenario versioning strategy (copy-on-write overlay on an immutable, versioned baseline),
   - the deterministic simulation approach (propagation rules, redundancy, cycle handling, unknown handling, provenance format),
   - the AI provider abstraction and the timeout strategy for Forge limits,
   - the Atlassian integration strategy and the exact scope of the Rovo agent,
   - the storage schema for the chosen Forge storage option.
3. Create the /packages/engine package skeleton: TypeScript strict, Vitest, Zod schemas for entities, relationships, scenarios, decisions, simulation results and provenance. No Forge imports.
4. Set up ESLint, Prettier, and npm scripts for lint, typecheck, test, build.
5. Write schema tests (valid and invalid inputs).
6. Verify everything builds and tests pass.
Do not implement the UI or simulation logic yet.
Report as in AGENTS.md rule 13. Commit. STOP.

Your checks before moving on:
- Read DATA_MODEL.md and SIMULATION_DESIGN.md. Fix anything you disagree with now, because every later phase depends on them.
- npm test and typecheck pass.

---

### Phase 2: Organization twin, demo data and graph UI
Read AGENTS.md, PROGRESS.md and /docs. Execute PHASE 2 ONLY.
Tasks:
1. Implement the entity and relationship model in /packages/engine using the Phase 1 schemas, including a validated in-memory graph with lookups, neighbors and dependency queries.
2. Create the demo dataset for Aurelia Global Technologies as typed seed data: 6 departments, 30-40 employees, 8-10 projects, 10-15 business systems, 15-20 IT assets, 3 locations, 8 business processes, 5 vendors, a meaningful dependency network with redundancy and failover pairs, and resource and budget constraints. Label every record as demo data. Validate it against the schemas in a test (no dangling references, no duplicate IDs).
3. Persist the baseline through the Forge storage adapter (verify it against the docs). Provide a "load demo data" resolver and make the app work with no credentials.
4. Build the Organization Twin screen in Custom UI:
   - large interactive React Flow graph with zoom and pan,
   - select entity, side panel with properties, source, verification status and relationships,
   - filter by entity type, search by name, highlight dependencies and connected entities,
   - dark enterprise styling and the main navigation shell,
   - loading, empty and error states.
5. Add the Overview screen with real counts (entities, relationships) read from stored data.
6. Tests: engine tests, graph query tests, and component tests with React Testing Library.
Run lint, typecheck, tests and the build. If the UI can be deployed, tell me the exact commands (forge deploy, then forge install --upgrade if needed) and what I should see. Report per AGENTS.md rule 13. Commit. STOP.

Your checks before moving on:
- The graph renders the demo organization in Jira or Confluence, with working filters and search.
- Graph stays smooth with the full demo dataset.

---

### Phase 3: Parallel scenario engine
Read AGENTS.md, PROGRESS.md and /docs. Execute PHASE 3 ONLY.
Tasks:
1. Implement scenarios in /packages/engine as copy-on-write overlays on an immutable, versioned baseline: entity overrides, relationship overrides, added and removed entities, assumptions, applied decisions.
2. Operations: create (from baseline or from another scenario), duplicate, rename, archive, reset, view history, and a function that materializes the effective state of a scenario without mutating anything.
3. Versioning: every change creates a new scenario version with a diff and timestamp. Scenario history is queryable and a previous version can be restored as a new version.
4. Persist scenarios through the Forge storage adapter with tenant-safe keys and validation of all input on the server.
5. Add an audit record for each scenario operation.
6. ISOLATION TESTS (critical): prove that
   - changing a scenario never changes the baseline,
   - changing one scenario never changes another,
   - frozen or deeply immutable baseline objects reject mutation,
   - duplicate scenarios are independent,
   - reset and restore behave correctly.
   Include property-style or randomized tests for isolation.
7. Build the Scenario Lab UI foundation: scenario list, create flow with baseline selection, structured assumption editor, a preview of proposed changes (diff) before applying, history view. Do not wire simulation yet.
Run lint, typecheck, tests and build. Report per rule 13. Commit. STOP.

Your checks before moving on:
- Isolation tests are present and passing. Open the test file and skim it yourself.
- Creating, duplicating and resetting a scenario works in the deployed app.

---

### Phase 4: Deterministic simulation engine
Read AGENTS.md, PROGRESS.md and /docs. Execute PHASE 4 ONLY.
Tasks:
1. Implement decision models in /packages/engine: budget change (percent or absolute, by department or global), resource reallocation, headcount change, add location, add department, system outage, system replacement with migration, infrastructure replacement, department restructuring.
2. Implement dependency propagation over the materialized scenario state:
   - respects dependency type, direction, criticality and hard vs soft strength,
   - redundancy and failover reduce or absorb impact (a single dependency failure does not automatically mean total failure),
   - safe cycle handling,
   - records the full dependency path.
3. Implement calculations: budget deltas, resource utilization and shortages, employee availability, project delay risk, business process disruption, migration effort and temporary resource demand, mitigation effects, unresolved dependencies.
4. Missing data yields "unknown" with a reason. Never invent numbers. Avoid false precision; use ranges or qualitative levels where inputs are estimates, and mark results deterministic or estimated.
5. Provenance on every result: triggering decision, affected entity, dependency path, formula, inputs, assumptions, deterministic or estimated.
6. The engine must be pure and deterministic: same input always gives the same output. Add a test for this.
7. Thorough unit tests: each rule, redundancy cases, cycles, missing data, empty scenarios, conflicting decisions, large graphs, and unexpected conditions.
8. Wire a "run simulation" resolver and show raw results in the Scenario Lab (results list with provenance expandable). Persist results with the scenario version they came from.
Run lint, typecheck, tests and build. Report test counts. Per rule 13, commit and STOP.

Your checks before moving on:
- Run the cost-cut decision yourself and click through a result's provenance. Does the dependency path make sense?
- No result appears without a formula and inputs.

---

### Phase 5: Comparison, history and the three demo scenarios
Read AGENTS.md, PROGRESS.md and /docs. Execute PHASE 5 ONLY.
Tasks:
1. Implement the comparison engine in /packages/engine: compare any set of scenarios against the baseline across operating cost, budget changes, resource utilization, project delivery, resilience, process continuity, dependency changes, risk exposure and implementation complexity.
2. Scorecards per dimension, difference analysis, change summaries and trade-off statements generated by rules (not AI). User-adjustable weights with a visible breakdown; never one unexplained overall score.
3. Create the three demo scenarios as real decisions applied to the baseline, not hardcoded results:
   - Future A: reduce operating expenditure by 15%.
   - Future B: add two international locations with departments, employees, infrastructure and systems.
   - Future C: replace one major business system with a migration plan.
   Provide a "create demo scenarios" action that builds and simulates them.
4. Build Compare Futures UI: side-by-side columns, budget and resource charts (Recharts), project impact, operational risk, dependency changes, impact graph, and clear labels for actual, assumed and simulated values.
5. Build Simulation History: list previous runs, open inputs and outputs, compare versions, re-run a scenario, show what changed.
6. Tests for comparison math, weighting and history.
Run lint, typecheck, tests and build. Report per rule 13. Commit. STOP.

Your checks before moving on:
- All three futures produce different, explainable results.
- Changing the weights visibly changes the ranking and the breakdown is shown.

---

### Phase 6: NVIDIA NIM AI layer
Read AGENTS.md, PROGRESS.md and /docs. Execute PHASE 6 ONLY.
Tasks:
1. Research first. Read the current NVIDIA NIM and build.nvidia.com docs: available models, the API endpoint, authentication, rate limits, structured output support. Choose a fast model that fits the Forge function timeout found in Phase 0 and record the choice, the alternatives and the doc URLs in PROGRESS.md. Do not use an unverified model ID.
2. Declare the external egress domain correctly in the Forge manifest (verify the syntax in the docs). Tell me about any Marketplace or "Runs on Atlassian" implications.
3. Implement an AI provider interface and a NVIDIA provider. Model ID and base URL are configurable. The API key is read from Forge encrypted environment variables. Give me the exact forge variables set --encrypt command to run. Never log keys or prompts containing sensitive data.
4. Implement three services with Zod-validated structured outputs:
   a. Interpretation: natural language to a scenario proposal using the engine decision schemas, with clarifying questions for missing information. A proposal is never applied automatically.
   b. Explanation: answers questions using ONLY engine results, provenance and evidence. It must cite result IDs, separate evidence from assumptions and state uncertainty. Reject or repair any output that mentions numbers not present in the engine output.
   c. Recommendation: alternative proposals, presented for user approval only.
5. Handle timeouts, rate limits, malformed output (retry once, then fail clearly), and provider outages. If no key is configured, the AI features show an honest "not configured" state and the rest of the app works.
6. Build the UI: scenario interpretation input in Scenario Lab, explanation panel in Compare Futures, and the Integrations screen showing NVIDIA status from a REAL health check (not configured, configured but failing, working).
7. Tests with a mocked provider: schema validation, grounding checks, error paths, missing key.
Run lint, typecheck, tests and build. Report per rule 13. Tell me exactly what I must set up (key, variables, deploy). Commit. STOP.

Your checks before moving on:
- With the key set, ask "Why does Future A show higher project delay risk?" The answer matches the engine's numbers.
- With the key removed, the app still works and the status is honest.

---

### Phase 7: Jira, Confluence and Rovo
Read AGENTS.md, PROGRESS.md and /docs. Execute PHASE 7 ONLY.
Tasks:
1. Research first. Read the current Forge docs for Jira and Confluence REST APIs from Forge (requestJira, requestConfluence), required OAuth scopes, the Rovo agent module and Rovo actions (manifest syntax, action schemas, permissions, supported contexts and site requirements). Record URLs in PROGRESS.md. Check whether Teamwork Graph is generally available; if it is preview-only, skip it and say so.
2. Jira: import authorized projects and issues the user can access, map them to twin Project entities with source labelled "imported", retrieve status and ownership. Create remediation tasks from approved findings with a confirmation step, and store the link between the created issue and its scenario and result.
3. Confluence: read authorized pages and link them to entities as evidence; create an approved scenario report page after explicit user approval.
4. Rovo agent "ParallelOS Intelligence" with exactly three real actions backed by real resolvers: run scenario, compare scenarios, create Jira tasks (requires explicit approval; the agent proposes, the user confirms). Add the suggested conversation starters from the spec.
5. Request the minimum scopes needed. Enforce permission checks and audit records for every Atlassian write.
6. Integrations screen: show Jira, Confluence and Rovo status from REAL checks only, and distinguish configured from operational.
7. Tests with mocked Atlassian APIs for the services. Then give me a manual test script for the real site: install or upgrade, accept scopes, import, create a task, publish a report, talk to the Rovo agent.
Run lint, typecheck, tests and build. Tell me exactly which commands and site settings I must do (forge deploy, forge install --upgrade for new scopes, Rovo enablement). Do not claim Rovo works until I confirm it on my site. Commit. STOP.

Your checks before moving on:
- Jira import and task creation work on your real site.
- The Rovo agent appears in Rovo chat and its actions return real scenario data.
- Report any Rovo problems back to Antigravity with the exact error text.

---

### Phase 8: Product polish
Read AGENTS.md, PROGRESS.md and /docs. Execute PHASE 8 ONLY.
Tasks:
1. UI polish: consistent design tokens, spacing, typography, transitions that are restrained, and a refined Overview with organization health summary, active scenarios, recent simulations, critical unresolved assumptions and a prominent "Create New Scenario" action.
2. Complete empty, loading and error states for every screen. No silent failures; every failed operation shows a clear message and retry.
3. Responsive layouts for narrow panels.
4. Graph performance: profile with the demo dataset and a larger synthetic one; fix slow renders (memoization, virtualization or level-of-detail as needed).
5. Accessibility: keyboard navigation, focus states, ARIA labels, color contrast, and a non-color-only way to read risk levels.
6. Onboarding: a first-run flow that loads demo data and walks through creating a scenario.
7. Settings screen: scoring weights, AI model configuration status, demo data reset (with confirmation).
8. In-app help text and a README with installation and usage.
9. Remove dead code and unused dependencies. Do not add new features.
Run lint, typecheck, tests and build. Report per rule 13. Commit. STOP.

Your checks before moving on:
- Click through every screen with no data, bad data and a failing integration. Nothing should crash or look broken.

---

### Phase 9: Final QA, deployment and demo
Read AGENTS.md, PROGRESS.md and /docs. Execute PHASE 9 ONLY.
Tasks:
1. Run the full suite: lint, typecheck, unit, integration and (if the environment allows) Playwright. Report real counts and fix failures.
2. Re-verify scenario isolation with the full test set and a manual attack list (try to make a scenario mutate the baseline through every API path).
3. Security review against SECURITY.md: secrets, scopes, input validation, tenant isolation, audit records, approval gates, log contents. List any gaps honestly.
4. Verify the manifest: minimum scopes, egress, Rovo module. Run forge lint.
5. Prepare deployment: forge deploy, install and upgrade steps, environment variables, and a clean-install test checklist for a fresh site.
6. Write INSTALL.md and a short user guide.
7. Write the 4-minute demo script following this story: start from the Aurelia baseline; create Futures A, B and C; run all three; compare; ask ParallelOS Intelligence "Which future offers the best balance between growth, cost and operational resilience?"; select a recommendation; create a Jira implementation task with approval. Include timings, what to click, what to say, and fallbacks if an integration fails. Everything shown must be live functionality.
8. Produce a Codegeist submission checklist: description, features, what is real vs demo data, setup requirements, known limitations.
9. Final honest status report: what works, what is partial, what is not done, and known risks.
Do not hide failures. Commit and STOP.

Your checks before moving on:
- Do a full dry run of the demo script on a fresh browser session, twice.
- Record a backup video of the working demo.

---

## Part C: Troubleshooting prompts
- When a phase partly fails:
  Read PROGRESS.md. The following failed: [paste exact error]. Do not rewrite unrelated files. Diagnose the root cause, check the current official docs for the feature involved, fix it, rerun the relevant checks, and report real output.
- When it claims success without proof:
  Show me the actual command output for the build, lint and tests you claim passed. If you did not run them, run them now.
- When context gets long or it starts drifting:
  Re-read AGENTS.md and PROGRESS.md. Summarize the current state in PROGRESS.md and list any rules you may have violated. Then continue the current phase only.
- When it tries to skip ahead:
  Stop. You are on Phase [N] only. Revert any work from later phases that is not needed for this phase and report what you reverted.
