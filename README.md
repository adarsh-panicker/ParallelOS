# ParallelOS

> **One Organization. Infinite Possibilities.**  
> *Enterprise Digital Twin Control Room built for Atlassian Codegeist 2026*  
> **Architected & Built by Adarsh Panicker**

---

## 🌟 Overview

**ParallelOS** is an enterprise digital twin control room built for Atlassian Cloud (Forge Custom UI). It enables leaders, architects, and engineering managers to branch their organization into parallel scenarios, run deterministic simulations across cascading dependencies, compare counterfactual futures, and turn approved decisions directly into real Jira work.

- **Not a Jira dashboard and not a chatbot**: A visual control room where users navigate an interactive organizational dependency graph (React Flow), edit assumptions, execute simulations, evaluate multi-dimensional impact scorecards, and consult grounded AI to explain trade-offs.
- **Strictly Deterministic**: The simulation engine is 100% deterministic TypeScript. The LLM never invents numbers or calculates outcomes.
- **Copy-on-Write Scenario Branching**: Baseline organizational data is strictly immutable. Scenarios overlay entity and relationship modifications with complete provenance tracking.
- **Grounded AI Interpretation**: AI (NVIDIA NIM) only interprets natural-language requests into validated structured proposals and explains engine-computed diffs.

---

## 🏢 Reference Organization: Aurelia Global Technologies

ParallelOS includes an enterprise-scale baseline dataset: **Aurelia Global Technologies** (38 employees across 3 locations, 6 departments, 12 business systems, 18 IT assets, 9 projects, and 5 key vendors).

Derive and simulate three pre-modeled parallel futures:
1. **Future A — Cost Optimization**: Cut operating expenditure by 15% through budget reductions and resource reallocation.
2. **Future B — International Expansion**: Add London and Singapore regional offices, departments, new hires, cloud systems, and infrastructure.
3. **Future C — Technology Transformation**: Replace a mission-critical legacy business system, calculating migration downtime, service disruption, and SLA breach risks.

---

## 🏛️ Architecture

```
ParallelOS/
├── packages/engine/             # Pure TypeScript core engine (Zero Forge dependencies)
│   ├── src/
│   │   ├── entities/            # 12 Entity schemas (Organization, Department, Employee, System, etc.)
│   │   ├── relationships/       # 15 Relationship schemas with redundancy & failover metrics
│   │   ├── scenario/            # Copy-on-write overlay engine with versioning & isolation
│   │   ├── simulation/          # BFS propagation, cycle safety, domain calculators, provenance
│   │   ├── comparison/          # 9-dimension comparative scorecard with adjustable weights
│   │   ├── ai/                  # Grounded AI provider abstraction (NVIDIA NIM & mock)
│   │   ├── services/            # Jira, Confluence, and Rovo Agent integrations
│   │   └── demo/                # Aurelia Global Technologies verified demo model
│   └── tests/                   # 125 Vitest unit tests (100% passing)
├── src/                         # Forge Backend Resolvers & Functions
│   ├── index.ts                 # Forge resolver bridge handlers
│   └── functions/               # Async functions, Jira webhook, scheduled sync, cleanup
└── static/hello-world/          # Forge Custom UI (React 18 + TypeScript + Vite)
    ├── src/
    │   ├── components/          # Logo, React Flow custom nodes/edges, SidePanel, Toolbar
    │   ├── pages/               # Overview, OrganizationTwin, ScenarioLab, CompareFutures, Settings
    │   ├── services/            # Bridge API with local browser preview fallback
    │   └── index.css            # Dark charcoal theme with radiant orange & emerald green glow
```

---

## 🧪 Verification & Testing

Every layer is rigorously verified and tested:

```bash
# 1. Run engine unit tests (125/125 passing across 8 suites)
npm --prefix packages/engine test

# 2. Typecheck backend & resolvers
npx tsc --noEmit

# 3. Lint codebase (0 errors)
npm run lint

# 4. Build Custom UI production bundle
npm --prefix static/hello-world run build
```

---

## 🚀 Quickstart

### 1. Instant Local Browser Preview (No Atlassian account needed)

```bash
# Clone the repository
git clone https://github.com/adarsh-panicker/ParallelOS.git
cd ParallelOS

# Install dependencies
npm install
npm --prefix static/hello-world install

# Start local preview server
npm --prefix static/hello-world run dev
```
Open [http://localhost:5173](http://localhost:5173) to interact with the full UI.

---

### 2. Atlassian Forge Cloud Deployment

```bash
# Log in to Forge CLI with your Atlassian API token
forge login

# Register & deploy
forge register
forge deploy

# Install onto your Jira Cloud site
forge install --site your-subdomain.atlassian.net --product jira

# Run hot-reloading tunnel for development
forge tunnel
```

---

## 🛡️ Non-Negotiable Core Principles

1. **Deterministic TypeScript Simulation**: Simulation results are derived mathematically. The LLM never invents numbers.
2. **Copy-on-Write Immutability**: No scenario operation can mutate the baseline or another scenario.
3. **Explicit Provenance**: Every metric carries provenance: triggering decision, affected entity, dependency path, formula used, and assumptions.
4. **Data Classification**: Values are labeled as `actual`, `imported`, `assumed`, `ai-hypothesis`, or `simulated`.
5. **Real Integrations & Health Checks**: Status indicators reflect real platform connectivity. Never show mock data as connected.
6. **No Secrets in Code or Git**: Secure credentials use Forge encrypted environment variables and never touch frontend logs or Git.

---

## 👨‍💻 Author

**Adarsh Panicker**  
*Lead Architect & Full-Stack Engineer*  
Built with passion for the **Atlassian Codegeist 2026 Hackathon**.
