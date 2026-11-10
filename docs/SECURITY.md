# ParallelOS — Security Architecture

**Version:** 1.0  
**Date:** 2026-11-10  
**Status:** Phase 1 — Architecture & Foundation

---

## 1. Security Principles

1. **Zero Trust:** Never trust client input; validate server-side.
2. **Least Privilege:** Minimum scopes, minimum data access.
3. **Defense in Depth:** Validation at API boundary, resolver, storage, and UI.
4. **Auditability:** All sensitive operations logged with actor, timestamp, context.
5. **Secrets Hygiene:** No secrets in code, Git, logs, or frontend.
6. **Tenant Isolation:** Forge platform guarantees; reinforced by application logic.

---

## 2. Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|------------|--------|------------|
| Cross-tenant data access | Low | High | Forge platform isolation + app-level scoping |
| Injection (SQL/NoSQL) | Medium | High | Parameterized queries, Zod validation, no raw queries |
| XSS in Custom UI | Medium | High | React auto-escaping, CSP, no dangerouslySetInnerHTML |
| CSRF | Low | Medium | Forge bridge handles auth; no cookie-based auth |
| Secret leakage | Low | Critical | Encrypted env vars, no frontend access, secret scanning |
| Privilege escalation | Low | High | Permission checks on every resolver |
| Data tampering | Low | High | Immutable baseline, versioned overlays, audit log |
| AI prompt injection | Medium | Medium | Structured output schemas, input sanitization, no raw LLM output |
| Denial of Service | Medium | Medium | Forge invocation limits, input size validation, timeouts |

---

## 3. Authentication & Authorization

### 3.1 Forge Platform Authentication

- All resolver invocations authenticated via Forge bridge
- `context.user` provides Atlassian account ID
- `context.accountId` provides tenant identifier
- No custom auth needed

### 3.2 Authorization Checks

```typescript
// src/validation/authorization.ts

interface PermissionCheck {
  resource: 'entity' | 'scenario' | 'simulation' | 'jira' | 'confluence';
  action: 'read' | 'write' | 'delete' | 'execute';
  entityId?: EntityId;
  scenarioId?: ScenarioId;
}

async function checkPermission(
  context: ResolverContext,
  check: PermissionCheck
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Verify user is authenticated (Forge guarantees)
  // 2. Check tenant isolation (all entities scoped to accountId)
  // 3. For Jira/Confluence: verify product access via context.permissions
  // 4. For scenario operations: verify user owns or has access to scenario
  // 5. For simulation: verify scenario exists and user has read access
  
  return { allowed: true }; // Simplified - implement per resource
}
```

### 3.3 Resource-Level Permissions

| Resource | Read | Write | Delete | Execute |
|----------|------|-------|--------|---------|
| Baseline entities | All licensed users | Admins only | Admins only | N/A |
| Scenarios | Creator + shared | Creator only | Creator only | Creator only |
| Simulation results | Scenario readers | Simulation runner | N/A | Scenario runners |
| Comparison results | Scenario readers | N/A | N/A | N/A |
| Jira tasks | Project permissions | Project permissions | Project permissions | Approved users only |
| Confluence pages | Space permissions | Space permissions | Space permissions | N/A |

---

## 4. Input Validation & Sanitization

### 4.1 Resolver-Level Validation (Zod)

```typescript
// src/validation/schemas.ts

// All resolver inputs validated against strict schemas
const CreateScenarioInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
  baselineVersionId: z.string().uuid(),
  parentScenarioId: z.string().uuid().optional(),
  assumptions: z.array(AssumptionSchema).max(50).optional(),
});

const RunSimulationInputSchema = z.object({
  scenarioId: z.string().uuid(),
  decisions: z.array(SimulationDecisionSchema).min(1).max(20),
});

const CreateJiraTasksInputSchema = z.object({
  scenarioId: z.string().uuid(),
  taskProposals: z.array(TaskProposalSchema).min(1).max(50),
  approvalConfirmation: z.string().min(1), // Exact phrase match
});

// Sanitization: strip undefined, null prototype pollution protection
function sanitizeInput<T>(input: unknown, schema: z.ZodSchema<T>): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(result.error.flatten());
  }
  return result.data;
}
```

### 4.2 Storage-Level Validation

- All writes to Custom Entity Store validated against entity schemas
- Reads validated before returning to resolvers
- Batch operations validated individually

### 4.3 AI Output Validation

```typescript
// All AI responses parsed against strict Zod schemas
// Failed validation → retry with stricter prompt → fallback to template
// Never return raw LLM output to UI or storage
```

---

## 5. Secret Management

### 5.1 NVIDIA API Key

```yaml
# manifest.yml - NOT IN MANIFEST
# Set via: forge variables set NVIDIA_NIM_API_KEY <value> --encrypted
```

```typescript
// src/services/nvidia-provider.ts - Runtime retrieval
async function getNVIDIAConfig(): Promise<NVIDIAConfig> {
  // Forge injects encrypted env vars as process.env
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA_NIM_API_KEY not configured');
  }
  return {
    apiKey,
    endpoint: process.env.NVIDIA_NIM_ENDPOINT || 'https://integrate.api.nvidia.com/v1',
    modelId: process.env.NVIDIA_NIM_MODEL_ID || 'meta/llama-3.1-70b-instruct',
  };
}
```

**Rules:**
- ✅ Store in Forge encrypted environment variables
- ✅ Access only in backend resolvers/services
- ❌ Never in manifest.yml
- ❌ Never in frontend code
- ❌ Never in logs
- ❌ Never in Git history
- ❌ Never in error messages returned to client

### 5.2 Other Secrets

| Secret | Storage | Access |
|--------|---------|--------|
| NVIDIA API Key | Forge encrypted env var | Backend only |
| Future: Encryption keys | Forge encrypted env var | Backend only |
| Webhook secrets | Forge encrypted env var | Backend only |

---

## 6. Audit Logging

### 6.1 Audited Events

| Event | Data Logged |
|-------|-------------|
| Scenario created | scenarioId, userId, baselineVersion, timestamp |
| Scenario modified | scenarioId, userId, overrideSummary, timestamp |
| Simulation run | simulationId, scenarioId, userId, decisions, duration, timestamp |
| Comparison generated | comparisonId, userId, baselineId, scenarioIds, timestamp |
| Jira tasks created | issueKeys, scenarioId, userId, approvalToken, timestamp |
| Confluence page created | pageId, scenarioId, userId, timestamp |
| AI interpretation requested | scenarioId, userId, promptHash, timestamp |
| AI explanation requested | simulationId, userId, questionHash, timestamp |
| Data import (Jira/Conf) | entityCount, userId, source, timestamp |
| Permission denied | userId, resource, action, timestamp |

### 6.2 Audit Log Implementation

```typescript
// src/audit/logger.ts

interface AuditEntry {
  id: string;
  timestamp: number;
  actor: { accountId: string; displayName?: string };
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, unknown>;
  outcome: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  durationMs?: number;
}

async function auditLog(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
  const fullEntry: AuditEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  
  // Write to Custom Entity Store (append-only)
  await kvs.entity('parallelos_audit').set(fullEntry.id, fullEntry);
  
  // Also log to console for CloudWatch/Forge logs (no sensitive data)
  console.info('[AUDIT]', JSON.stringify({
    action: entry.action,
    resourceType: entry.resourceType,
    outcome: entry.outcome,
    actor: entry.actor.accountId,
  }));
}
```

### 6.3 Audit Log Retention

- Stored in Custom Entity Store (tenant-isolated)
- No automatic deletion (compliance)
- Admin can export via resolver
- Not accessible via UI in MVP

---

## 7. Data Protection

### 7.1 Data Classification

| Classification | Examples | Handling |
|----------------|----------|----------|
| Public | Demo data, documentation | No special handling |
| Internal | Organizational structure, assumptions | Tenant-isolated, access-controlled |
| Confidential | Employee PII, salaries, budgets | Encrypted at rest (Forge), minimal access |
| Restricted | NVIDIA API key, approval tokens | Encrypted env vars, backend-only |

### 7.2 PII Handling

- Employee data from Jira: `accountId`, `displayName`, `email` → stored as `imported` source
- Never sent to NVIDIA NIM (context sanitized)
- User can request deletion via GDPR/privacy resolver
- Demo data: synthetic, no real PII

### 7.3 Encryption

- **At rest:** Forge platform encryption (Custom Entity Store)
- **In transit:** HTTPS/TLS 1.2+ (Forge managed)
- **Application-level:** None required for MVP (platform handles)

---

## 8. Secure Development Practices

### 8.1 Code Security

- `npm audit` in CI pipeline
- Dependabot alerts enabled
- No `eval`, `Function` constructor, or dynamic code execution
- No `dangerouslySetInnerHTML` in React
- All external fetches use allowlisted domains

### 8.2 Git Hygiene

- `.gitignore` excludes `.env`, `*.forge/`, `node_modules/`, `dist/`
- Pre-commit hook: `npm run lint && npm run typecheck`
- No secrets in commit history (verify with `git log --all --full-history --oneline -- "**/*secret*"`)

### 8.3 Dependency Management

- Pin versions in `package-lock.json`
- Review new dependencies for security advisories
- Prefer Forge-provided APIs over direct HTTP calls
- Minimize dependencies (current: `@forge/api`, `@forge/resolver`, `@forge/kvs`, `zod`)

---

## 9. Forge-Specific Security

### 9.1 Manifest Security

```yaml
# manifest.yml security-relevant settings
app:
  runtime:
    name: nodejs24.x  # Latest LTS
permissions:
  scopes:
    - storage:app           # Required for Custom Entity Store
    - read:jira-work        # Minimum for import
    - write:jira-work       # Required for remediation tasks
    - read:confluence-content.all
    - write:confluence-content
    - read:me               # For user context
  external:
    fetch:
      backend:
        - 'api.atlassian.com'
        - '*.atlassian.net'
        - 'integrate.api.nvidia.com'
        - 'api.nvidia.com'
```

### 9.2 Function Timeouts

- Standard resolvers: 25s max (Forge limit)
- Rovo actions: 55s max
- Simulation must complete within 20s (buffer for response)
- Long-running: Use async events (900s) if needed later

### 9.3 Invocation Limits

- Payload: 5 MB request, 500 KB frontend request, 5 MB response
- Custom Entity Store: 4000 reads/writes per minute
- Design for batch operations where possible

---

## 10. Incident Response

### 10.1 Security Incident Types

| Type | Detection | Response |
|------|-----------|----------|
| Unauthorized data access | Audit log anomalies | Revoke app, rotate secrets, notify Atlassian |
| Secret leakage | Git scan, log review | Rotate key immediately, audit access |
| Injection attack | WAF alerts, error logs | Block IP, patch validation, deploy fix |
| AI misuse | Unusual prompt patterns | Rate limit, tighten schemas, review logs |

### 10.2 Response Procedures

1. **Detect:** Monitoring alerts, log review, user reports
2. **Contain:** Disable affected resolver, revoke credentials
3. **Assess:** Determine scope, data exposed, root cause
4. **Remediate:** Patch, rotate secrets, restore data
5. **Notify:** Atlassian security team, affected tenants (if required)
6. **Document:** Post-incident review, update procedures

---

## 11. Compliance Considerations

| Regulation | Applicability | Controls |
|------------|---------------|----------|
| GDPR | EU tenants | Data minimization, right to deletion, audit log |
| SOC 2 | Enterprise customers | Access control, audit logging, encryption |
| Atlassian Marketplace | All apps | Security self-assessment, penetration testing |

**MVP Scope:** Basic GDPR-ready (deletion resolver), audit logging, encryption via platform.

---

## 12. Security Checklist for Each Phase

### Phase 1 (Foundation)
- [x] AGENTS.md with security rules
- [x] Manifest scopes minimized
- [x] Egress domains declared
- [x] No secrets in code/Git
- [x] TypeScript strict mode
- [x] ESLint security rules

### Phase 2 (Engine)
- [ ] Zod schemas for all inputs
- [ ] Branded types for ID safety
- [ ] No dynamic code evaluation

### Phase 3 (Scenarios)
- [ ] Scenario isolation tests
- [ ] Override validation
- [ ] Version history immutability

### Phase 4 (Simulation)
- [ ] Provenance on all outputs
- [ ] Unknown handling (no invented values)
- [ ] Deterministic verification tests

### Phase 5 (Comparison)
- [ ] No single unexplained scores
- [ ] Weight validation

### Phase 6 (AI)
- [ ] Provider abstraction
- [ ] Output schema validation
- [ ] Prompt injection defenses
- [ ] No baseline modification by AI
- [ ] Secret management verified

### Phase 7 (Atlassian)
- [ ] Permission checks on all Jira/Confluence calls
- [ ] Rovo approval flow implemented
- [ ] Audit logging for all external writes

### Phase 8 (Polish)
- [ ] CSP headers (Forge managed)
- [ ] Error messages sanitized
- [ ] Loading states (no skeleton leaks)

### Phase 9 (Deploy)
- [ ] `forge lint` passes
- [ ] `npm audit` clean
- [ ] Penetration test (if time)
- [ ] Marketplace security questionnaire

---

## 13. Security Contacts

- **Atlassian Security:** security@atlassian.com
- **Forge Platform Issues:** https://developer.atlassian.com/platform/forge/getting-help/
- **NVIDIA Security:** https://www.nvidia.com/en-us/security/