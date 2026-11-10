# ParallelOS — Integration Plan

**Version:** 1.0  
**Date:** 2026-11-10  
**Status:** Phase 1 — Architecture & Foundation

---

## 1. Overview

This document defines the integration strategy for Atlassian (Jira, Confluence, Rovo) and NVIDIA NIM APIs. All integrations follow the provider abstraction pattern for testability and future flexibility.

---

## 2. Atlassian Integrations

### 2.1 Jira Integration

**Purpose:** Import projects/issues as digital twin entities, create remediation tasks from approved simulation findings.

#### 2.1.1 Required Scopes
```yaml
permissions:
  scopes:
    - read:jira-work
    - write:jira-work
    - read:jira-user
```

#### 2.1.2 Entity Mapping

| Jira Object | Twin Entity | Mapping Logic |
|-------------|-------------|---------------|
| Project | Project | Direct mapping; key → entity ID prefix |
| Issue (Epic) | Project | Epic → Project, children → milestones |
| Issue (Story/Task) | Project milestone | Status → progress, assignee → employee |
| User | Employee | Account ID → employee ID, profile → properties |
| Component | BusinessSystem | Component → system, issues → dependencies |
| Custom Field (Budget) | Budget | Custom field value → budget amount |

#### 2.1.3 Import Operations

```typescript
// src/services/jira.ts

interface JiraImportOptions {
  projectKeys: string[];
  includeArchived: boolean;
  maxIssuesPerProject: number;
}

interface ImportResult {
  entitiesCreated: number;
  relationshipsCreated: number;
  errors: ImportError[];
}

async function importJiraProjects(options: JiraImportOptions): Promise<ImportResult> {
  // 1. Fetch accessible projects via /rest/api/3/project/search
  // 2. For each project, fetch issues via /rest/api/3/search with JQL
  // 3. Map to engine entities (Project, Employee, BusinessSystem)
  // 4. Create relationships (owns, depends_on, allocated_to)
  // 5. Store via storage adapter with source=ValueSource.Imported
  // 6. Return import summary
}
```

#### 2.1.4 Remediation Task Creation

```typescript
interface CreateRemediationTasksInput {
  scenarioId: ScenarioId;
  simulationResultId: string;
  taskProposals: TaskProposal[];
  approvalToken: string; // User explicit approval
}

interface TaskProposal {
  summary: string;
  description: string;
  projectKey: string;
  issueType: 'Task' | 'Story' | 'Epic';
  assigneeId?: string;
  labels: string[];
  customFields: Record<string, any>;
  // Link back to scenario
  scenarioReference: {
    scenarioId: ScenarioId;
    simulationResultId: string;
    findingId: string; // e.g., "project-impact-proj-123"
  };
}

async function createRemediationTasks(input: CreateRemediationTasksInput): Promise<CreatedIssue[]> {
  // 1. Verify approvalToken matches recent user action (audit log)
  // 2. For each proposal, call POST /rest/api/3/issue
  // 3. Add webhook/property linking issue to scenario finding
  // 4. Return created issue keys
}
```

#### 2.1.5 API Endpoints Used

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Search projects | `/rest/api/3/project/search` | GET |
| Get project | `/rest/api/3/project/{key}` | GET |
| Search issues | `/rest/api/3/search` | POST |
| Get issue | `/rest/api/3/issue/{id}` | GET |
| Create issue | `/rest/api/3/issue` | POST |
| Update issue | `/rest/api/3/issue/{id}` | PUT |
| Get user | `/rest/api/3/user` | GET |
| Search users | `/rest/api/3/users/search` | GET |

---

### 2.2 Confluence Integration

**Purpose:** Read organizational documentation, link to entities, store approved scenario reports.

#### 2.2.1 Required Scopes
```yaml
permissions:
  scopes:
    - read:confluence-content.all
    - write:confluence-content
    - read:confluence-space.summary
```

#### 2.2.2 Document Linking

```typescript
// src/services/confluence.ts

interface ConfluenceLink {
  entityId: EntityId;
  pageId: string;
  spaceKey: string;
  title: string;
  url: string;
  excerpt: string;
  relevance: 'primary' | 'supporting' | 'reference';
  linkedAt: number;
  linkedBy: string;
}

async function linkDocumentToEntity(entityId: EntityId, pageId: string): Promise<ConfluenceLink> {
  // 1. Fetch page metadata via /wiki/api/v2/pages/{id}
  // 2. Extract excerpt (first 500 chars)
  // 3. Create link record with source=ValueSource.Imported
  // 4. Store in entity properties or separate link entity
}

async function searchRelevantDocuments(query: string, entityTypes: EntityType[]): Promise<ConfluenceLink[]> {
  // 1. CQL search: title ~ query OR text ~ query
  // 2. Filter by space permissions
  // 3. Rank by relevance
  // 4. Return top 10
}
```

#### 2.2.3 Scenario Report Storage

```typescript
interface StoreScenarioReportInput {
  scenarioId: ScenarioId;
  comparisonId?: string;
  title: string;
  content: string; // Atlassian Document Format (ADF)
  spaceKey: string;
  parentPageId?: string;
  labels: string[];
}

async function storeScenarioReport(input: StoreScenarioReportInput): Promise<{ pageId: string; url: string }> {
  // 1. Create page in specified space via /wiki/api/v2/pages
  // 2. Use ADF for rich content (tables, charts, diagrams)
  // 3. Add labels: parallelos, scenario-{id}, comparison-{id}
  // 4. Return page URL for UI linking
}
```

#### 2.2.4 API Endpoints Used

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Get page | `/wiki/api/v2/pages/{id}` | GET |
| Search pages | `/wiki/api/v2/pages` | GET (CQL) |
| Create page | `/wiki/api/v2/pages` | POST |
| Update page | `/wiki/api/v2/pages/{id}` | PUT |
| Get space | `/wiki/api/v2/spaces/{key}` | GET |

---

### 2.3 Rovo Agent Integration

**Purpose:** Expose ParallelOS capabilities as a Rovo Agent with 3 actions.

#### 2.3.1 Agent Manifest

```yaml
# manifest.yml additions
modules:
  rovo:agent:
    - key: parallelos-intelligence
      name: ParallelOS Intelligence
      description: |
        Run organizational simulations, compare parallel futures, and create 
        approved Jira tasks from simulation findings.
      avatar: https://example.com/parallelos-rovo-avatar.png
      actions:
        - runScenario
        - compareScenarios
        - createJiraTasks
      promptTemplates:
        - "What happens if we reduce the IT budget by 15%?"
        - "Compare our three organizational futures."
        - "Which systems are most critical to our operations?"
        - "What are the consequences of expanding into two countries?"
        - "Explain why Future B has a higher operational cost."
        - "Which assumptions have the greatest impact on our results?"
        - "Create Jira tasks for the approved remediation recommendations."
```

#### 2.3.2 Action Schemas

```typescript
// src/services/rovo-actions.ts

// Action 1: runScenario
interface RunScenarioInput {
  scenarioId: string;
  decisions?: SimulationDecision[]; // Optional: override scenario decisions
}

interface RunScenarioOutput {
  simulationId: string;
  status: 'completed' | 'failed';
  summary: string; // Human-readable summary for Rovo response
  keyFindings: string[];
  affectedEntitiesCount: number;
  criticalRisks: string[];
}

// Action 2: compareScenarios
interface CompareScenariosInput {
  baselineScenarioId: string;
  scenarioIds: string[];
  dimensions?: string[]; // Optional: specific dimensions to compare
}

interface CompareScenariosOutput {
  comparisonId: string;
  summary: string;
  scenarioScores: { scenarioId: string; name: string; score: number }[];
  topDifferences: { dimension: string; insight: string }[];
  recommendation: string;
}

// Action 3: createJiraTasks (REQUIRES EXPLICIT APPROVAL)
interface CreateJiraTasksInput {
  scenarioId: string;
  taskProposals: TaskProposal[]; // Pre-validated proposals
  approvalConfirmation: string; // Exact phrase user must say: "Yes, create these tasks"
}

interface CreateJiraTasksOutput {
  createdIssues: { key: string; url: string; summary: string }[];
  failedProposals: { proposal: TaskProposal; error: string }[];
}
```

#### 2.3.3 Implementation Notes

- All Rovo actions invoke existing resolver functions
- `createJiraTasks` requires `approvalConfirmation` exactly matching expected phrase
- Actions return structured data; Rovo formats for chat
- Agent prompt templates guide user interaction

---

### 2.4 Teamwork Graph (Out of Scope for MVP)

**Investigation Required:**
- Check GA status of Teamwork Graph APIs
- Evaluate if `read:teamwork-graph` scope provides useful org data
- Determine if it can enrich Employee/Department relationships
- **Decision:** Only implement if GA and trivial integration (< 2 days)

---

## 3. NVIDIA NIM Integration

### 3.1 Provider Abstraction

```typescript
// src/services/ai-provider.ts

interface AIProvider {
  readonly name: string;
  readonly modelId: string;
  readonly endpoint: string;
  
  // Core capabilities
  interpretNaturalLanguage(prompt: string, context: OrgContext): Promise<ScenarioProposal>;
  explainSimulation(question: string, results: SimulationResult[]): Promise<Explanation>;
  recommendDecisions(goals: string[], context: OrgContext): Promise<Recommendation[]>;
  
  // Health check
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;
}

interface OrgContext {
  entities: BaseEntity[];
  relationships: Relationship[];
  scenarios: Scenario[];
  recentSimulations: SimulationResult[];
}
```

### 3.2 NVIDIA NIM Implementation

```typescript
// src/services/nvidia-provider.ts

class NVIDIANIMProvider implements AIProvider {
  readonly name = 'NVIDIA NIM';
  readonly modelId: string; // From config, e.g., "meta/llama-3.1-70b-instruct"
  readonly endpoint: string; // From config, e.g., "https://integrate.api.nvidia.com/v1"
  
  private apiKey: string; // From Forge encrypted env vars
  
  constructor(config: NVIDIAConfig) {
    this.modelId = config.modelId;
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey; // Retrieved at runtime from Forge secrets
  }
  
  async interpretNaturalLanguage(prompt: string, context: OrgContext): Promise<ScenarioProposal> {
    const systemPrompt = this.buildInterpretationPrompt(context);
    const response = await this.callNIM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ], {
      response_format: { type: 'json_schema', schema: SCENARIO_PROPOSAL_SCHEMA },
      temperature: 0.1,
      max_tokens: 4096,
    });
    
    return this.validateProposal(response);
  }
  
  async explainSimulation(question: string, results: SimulationResult[]): Promise<Explanation> {
    const context = this.formatResultsForExplanation(results);
    const systemPrompt = `You are an expert organizational analyst. Explain simulation results using ONLY the provided data. Never invent facts. Mark uncertainty explicitly.`;
    
    const response = await this.callNIM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Simulation results:\n${context}\n\nQuestion: ${question}` },
    ], {
      temperature: 0.2,
      max_tokens: 2048,
    });
    
    return this.validateExplanation(response);
  }
  
  async recommendDecisions(goals: string[], context: OrgContext): Promise<Recommendation[]> {
    const systemPrompt = this.buildRecommendationPrompt(context);
    const response = await this.callNIM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Goals: ${goals.join(', ')}` },
    ], {
      response_format: { type: 'json_schema', schema: RECOMMENDATION_SCHEMA },
      temperature: 0.3,
      max_tokens: 4096,
    });
    
    return this.validateRecommendations(response);
  }
  
  private async callNIM(messages: ChatMessage[], options: CompletionOptions): Promise<any> {
    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.modelId,
        messages,
        ...options,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`NIM API error: ${response.status} ${await response.text()}`);
    }
    
    return response.json();
  }
}
```

### 3.3 Required Configuration (Forge Encrypted Env Vars)

| Variable | Description | Required |
|----------|-------------|----------|
| `NVIDIA_NIM_ENDPOINT` | API endpoint (e.g., `https://integrate.api.nvidia.com/v1`) | Yes |
| `NVIDIA_NIM_MODEL_ID` | Model identifier (e.g., `meta/llama-3.1-70b-instruct`) | Yes |
| `NVIDIA_NIM_API_KEY` | API key from NVIDIA NGC | Yes |

**Verification Required Before Implementation:**
- [ ] Current NVIDIA NIM model catalog and availability
- [ ] API endpoint stability (integrate.api.nvidia.com vs regional)
- [ ] Authentication method (Bearer token, API key format)
- [ ] Rate limits and quota
- [ ] Supported parameters (temperature, max_tokens, response_format)
- [ ] Structured output / JSON schema support

### 3.4 Output Schemas (Zod)

```typescript
// Shared schemas for AI output validation

const SCENARIO_PROPOSAL_SCHEMA = z.object({
  name: z.string(),
  description: z.string(),
  decisions: z.array(z.object({
    type: z.nativeEnum(DecisionType),
    description: z.string(),
    parameters: z.record(z.unknown()),
    targetEntityIds: z.array(z.string()),
  })),
  assumptions: z.array(z.object({
    key: z.string(),
    value: z.unknown(),
    description: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  clarifyingQuestions: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

const EXPLANATION_SCHEMA = z.object({
  answer: z.string(),
  evidence: z.array(z.object({
    findingId: z.string(),
    description: z.string(),
    provenance: z.string(),
  })),
  uncertainties: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

const RECOMMENDATION_SCHEMA = z.object({
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    decisions: z.array(z.object({
      type: z.nativeEnum(DecisionType),
      parameters: z.record(z.unknown()),
    })),
    expectedImpact: z.string(),
    risks: z.array(z.string()),
    confidence: z.number().min(0).max(1),
  })),
});
```

---

## 4. Egress Permissions (Manifest)

```yaml
permissions:
  external:
    fetch:
      backend:
        - 'api.atlassian.com'           # Jira/Confluence REST APIs
        - '*.atlassian.net'             # Customer tenant domains
        - 'integrate.api.nvidia.com'    # NVIDIA NIM primary
        - 'api.nvidia.com'              # NVIDIA NIM alternative
```

---

## 5. Error Handling & Resilience

| Scenario | Handling |
|----------|----------|
| Jira API rate limit | Exponential backoff, max 3 retries, surface to UI |
| Confluence permission denied | Log, return partial results, show accessible only |
| NVIDIA NIM timeout (25s Forge limit) | 20s client timeout, fallback to cached/template response |
| NVIDIA NIM invalid response | Schema validation failure → retry once with stricter prompt → fallback |
| Network failure | Circuit breaker pattern, degrade gracefully |

---

## 6. Testing Integration Points

| Integration | Test Approach |
|-------------|---------------|
| Jira import | Mock API responses, test entity mapping, verify provenance |
| Jira task creation | Mock API, verify approval flow, check issue links |
| Confluence search | Mock CQL responses, test relevance ranking |
| Confluence report | Mock page creation, verify ADF output |
| Rovo actions | Unit test action handlers with mocked resolvers |
| NVIDIA NIM | Mock HTTP responses, test schema validation, fallback paths |

---

## 7. Security Considerations

- **No credentials in code:** All API keys via Forge encrypted environment variables
- **Tenant isolation:** All API calls scoped to current tenant via Forge context
- **Permission validation:** Check user permissions before Jira/Confluence writes
- **Audit logging:** Log all external API calls with purpose, outcome, duration
- **Data minimization:** Only fetch required fields; no bulk exports without user action
- **PII handling:** Employee data from Jira treated as imported; never sent to NVIDIA

---

## 8. Implementation Priority

1. **Phase 6:** NVIDIA NIM provider abstraction + interpretation + explanation
2. **Phase 7:** Jira import + remediation tasks + Rovo actions
3. **Phase 7:** Confluence document linking + report storage
4. **Phase 7:** Teamwork Graph investigation (timeboxed)

---

## 9. Documentation References (To Verify)

| Topic | URL | Verified |
|-------|-----|----------|
| Forge Manifest Reference | https://developer.atlassian.com/platform/forge/manifest-reference/ | ✓ |
| Forge Egress Permissions | https://developer.atlassian.com/platform/forge/runtime-egress-permissions/ | ✓ |
| Jira REST API | https://developer.atlassian.com/cloud/jira/platform/rest/v3/ | ✓ |
| Confluence REST API v2 | https://developer.atlassian.com/cloud/confluence/rest/v2/ | ✓ |
| Rovo Agent Module | https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-agent/ | ✓ |
| Forge Custom Entity Store | https://developer.atlassian.com/platform/forge/storage-reference/entities/ | ✓ |
| Forge Encrypted Env Vars | https://developer.atlassian.com/platform/forge/environment-variables/ | |
| NVIDIA NIM API Docs | https://docs.nvidia.com/nim/ | |
| NVIDIA Model Catalog | https://build.nvidia.com/ | |

**Action Required:** Verify NVIDIA NIM documentation URLs and current model availability before Phase 6 implementation.