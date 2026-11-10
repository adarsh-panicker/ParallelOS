# ParallelOS - Codegeist 2026 Demo Script

## 4-Minute Demo Script

### 0:00-0:30 - Introduction & Organization Twin
**Narrator**: "Welcome to ParallelOS - One Organization, Infinite Possibilities. We're Aurelia Global Technologies, a fictional tech consulting firm with 38 employees across 3 locations. This is our Organization Twin - a living digital twin of our entire organization."

**Actions**:
- Show Organization Twin graph with 100+ entities, 200+ relationships
- Navigate: departments, employees, projects, systems, locations
- Click on Engineering department → show side panel with details
- Highlight: real-time graph, search, filter, zoom

### 0:30-1:15 - Scenario Lab: Creating Parallel Futures
**Narrator**: "Now let's create parallel scenarios. We'll model three strategic futures from the same baseline."

**Actions**:
- Navigate to Scenario Lab
- Show baseline scenario (current state)
- Create "Future A - Cost Optimization": 15% budget cut
- Create "Future B - Global Expansion": Add London + Singapore offices
- Create "Future C - Tech Transformation": Replace legacy ERP
- Show decision builder with 6 decision types
- Highlight: copy-on-write isolation, versioning

### 1:15-2:15 - Deterministic Simulation Engine
**Narrator**: "Now we run deterministic simulations. Same inputs, same outputs - every time."

**Actions**:
- Run simulation on Future A (Cost Optimization)
- Show propagation: budget cut → department → projects → resources
- Show results: 27 entities affected, $1.2M budget reduction, 3 projects delayed
- Highlight: provenance tracking, 'unknown' values never invented
- Run simulation on Future B (Global Expansion)
- Show different impact pattern: budget increase, new resources, lower risk

### 2:15-3:00 - Compare Futures: Side-by-Side Analysis
**Narrator**: "Now let's compare all futures across 9 dimensions with adjustable weights."

**Actions**:
- Navigate to Compare Futures
- Show 9 dimensions: Operating Cost, Budget Variance, Resource Utilization, Project Delivery, Operational Resilience, Process Continuity, Dependency Risk, Risk Exposure, Implementation Complexity
- Adjust weights: Cost Focus → Future A wins; Risk Focus → Future B wins
- Show trade-off analysis: strengths/risks per scenario
- Export comparison report

### 3:00-3:30 - AI Assistant: Natural Language to Scenario
**Narrator**: "Now let's use AI to create scenarios from natural language."

**Actions**:
- Open AI Assistant
- Type: "What happens if we expand to Germany and reduce marketing budget by 20%?"
- Show AI-generated scenario proposal with decisions, assumptions, clarifying questions
- Show AI explanation of simulation results
- Show AI recommendations for "reduce operational risk"

### 3:30-4:00 - Atlassian Integration: From Insight to Action
**Narrator**: "Finally, let's turn insights into real Jira tasks with Rovo."

**Actions**:
- Ask Rovo: "Create Jira tasks for the approved remediation recommendations"
- Show Rovo generating task proposals from simulation findings
- Show approval flow: "Yes, create these tasks"
- Show created Jira tasks linked back to simulation findings
- Show Confluence report storage

**Closing**: "ParallelOS - One Organization, Infinite Possibilities. Thank you!"

---

## Demo Data Configuration

### Baseline Organization (Aurelia Global Technologies)
- **6 Departments**: Engineering (12), Sales (8), Operations (6), Marketing (5), Finance (4), HR (3)
- **3 Locations**: San Francisco (HQ), London, Singapore
- **9 Projects**: Apollo, Hermes, Athena, Zeus, Orion, Helios, Atlas, Poseidon, Artemis
- **12 Business Systems**: Core Banking, CRM, ERP, HRIS, CI/CD, Monitoring, Analytics, Reporting, Artifact Registry, Email, VPN, File Storage
- **18 IT Assets**: Servers, databases, clusters, repositories
- **8 Business Processes**: Order-to-Cash, Procure-to-Pay, Hire-to-Retire, Incident Management, Change Management, Release Management, Budget Planning, Compliance Reporting
- **5 Vendors**: AWS, Microsoft, Atlassian, GitHub, Datadog
- **Budgets**: $23M total across 7 budgets
- **Resources**: Compute, Storage, Network, Senior Engineers, Sales Licenses
- **200+ Relationships**: funds, depends_on, runs_on, hosts, connects_to, supplied_by, located_at, serves, allocates, manages, owns, belongs_to

### Scenario Configurations

#### Future A - Cost Optimization
- **Decisions**: 
  1. Budget Change: Engineering budget -15% (budget-eng)
  2. Restructure Department: Consolidate Marketing & Sales (dept-marketing, dept-sales)
- **Expected Results**: $1.2M savings, 3 projects delayed, resource utilization 85%, 2 critical dependencies

#### Future B - Global Expansion
- **Decisions**:
  1. Add Location: London Office (200 capacity, Europe/London)
  2. Add Location: Singapore Office (150 capacity, Asia/Singapore)
  3. Budget Change: Operations +25% (budget-ops)
  4. Reallocate Resources: Move compute to new locations
- **Expected Results**: $5.75M budget increase, 2 new locations, resource utilization 62%, improved resilience

#### Future C - Tech Transformation
- **Decisions**:
  1. Replace System: Legacy ERP → Cloud ERP (sys-erp, vendor-sap, 90 days)
  2. System Outage: 4-hour migration window (sys-erp)
  3. Reallocate Resources: Senior engineers to migration
- **Expected Results**: $2.3M budget increase, 4 projects impacted, 3 process disruptions, high implementation complexity

---

## Rovo Agent Prompt Templates

1. "What happens if we reduce the IT budget by 15%?"
2. "Compare our three organizational futures."
3. "Which systems are most critical to our operations?"
4. "What are the consequences of expanding into two countries?"
5. "Explain why Future B has a higher operational cost."
6. "Which assumptions have the greatest impact on our results?"
7. "Create Jira tasks for the approved remediation recommendations."

---

## Fallback Mode (Offline Demo)

If network/Forge unavailable:
1. Static demo data pre-loaded in browser
2. All simulations run client-side (WASM or JS)
3. AI responses use mock provider
4. Jira/Confluence actions show mock responses
5. Demo still fully functional offline

---

## Technical Requirements for Demo

### Pre-Requisites
- [ ] Forge app deployed to developer site
- [ ] Jira project "PAR" created with issues
- [ ] Confluence space "PAR" created
- [ ] NVIDIA NIM API key configured (or mock mode)
- [ ] Forge environment variables set:
  - NVIDIA_NIM_ENDPOINT
  - NVIDIA_NIM_MODEL_ID
  - NVIDIA_NIM_API_KEY

### Browser Setup
- Chrome/Edge latest
- DevTools open for console logs
- Network tab open for API calls

### Backup Plan
- Recorded video of demo (2 min)
- Screenshots of all key screens
- Static HTML export of demo