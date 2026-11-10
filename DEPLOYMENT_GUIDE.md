# ParallelOS - Forge Deployment Guide

## Prerequisites

### 1. Atlassian Developer Account
- Create account at https://developer.atlassian.com
- Create API token at https://id.atlassian.com/manage-profile/security/api-tokens
- Select "Forge" as the app

### 2. Forge CLI Installation
```bash
npm install -g @forge/cli
forge login
```

### 3. NVIDIA NIM Access
- Register at https://build.nvidia.com
- Get API key from NGC
- Note endpoint (e.g., `https://integrate.api.nvidia.com/v1`)
- Choose model (e.g., `meta/llama-3.1-70b-instruct`)

## Environment Variables

Set these in Forge encrypted environment variables:

```bash
# Forge CLI
forge env:set NVIDIA_NIM_ENDPOINT "https://integrate.api.nvidia.com/v1"
forge env:set NVIDIA_NIM_MODEL_ID "meta/llama-3.1-70b-instruct"
forge env:set NVIDIA_NIM_API_KEY "your-nvidia-api-key"

# Optional: Jira/Confluence (if not using OAuth)
forge env:set JIRA_BASE_URL "https://your-domain.atlassian.net"
forge env:set JIRA_EMAIL "your-email@domain.com"
forge env:set JIRA_API_TOKEN "your-jira-api-token"

forge env:set CONFLUENCE_BASE_URL "https://your-domain.atlassian.net/wiki"
forge env:set CONFLUENCE_EMAIL "your-email@domain.com"
forge env:set CONFLUENCE_API_TOKEN "your-confluence-api-token"
```

## Build & Deploy

### 1. Build the UI
```bash
cd static/hello-world
npm install
npm run build
```

### 2. Build Engine Package
```bash
cd packages/engine
npm install
npm run build
```

### 3. Deploy to Forge
```bash
# From project root
forge deploy
```

### 4. Install on Developer Site
```bash
forge install
```

### 5. Verify Deployment
```bash
forge logs
forge tunnel  # For local development
```

## Configuration

### Forge Manifest
The `manifest.yml` defines:
- **Modules**: Jira global/project pages, Confluence space page, Rovo Agent, Webhooks, Scheduled triggers
- **Functions**: Resolver, Jira import, Jira tasks, Confluence link/report, Scenario CRUD, Simulation, Comparison, AI, Webhooks, Scheduled jobs
- **Storage**: 11 entity types with indexed fields
- **Permissions**: Jira read/write, Confluence read/write, Storage, External fetch (NVIDIA)
- **Rovo Agent**: 3 actions with prompt templates

### Storage Entities
1. **Scenario** - Parallel futures with overrides
2. **Entity** - Organization entities (depts, employees, projects, etc.)
3. **Relationship** - Dependencies between entities
4. **SimulationResult** - Deterministic simulation outputs
5. **ComparisonResult** - Scenario comparisons
6. **Assumption** - Explicit assumptions with sources
7. **EntityOverride** - Scenario-specific entity changes
8. **RelationshipOverride** - Scenario-specific relationship changes
8. **AppliedDecision** - Decisions applied in scenario
9. **ScenarioVersion** - Version history
10. **AIInteraction** - Audit log for AI interactions

## Post-Deployment Verification

### 1. Verify Custom UI Loads
- Navigate to Jira → Apps → ParallelOS
- Verify all 7 navigation tabs load: Overview, Organization Twin, Scenario Lab, Compare Futures, Simulation History, Integrations, Settings

### 2. Test Organization Twin
- Graph renders with 100+ entities
- Search, filter, zoom work
- Side panel shows entity details
- Relationships visible on click

### 3. Test Scenario Lab
- Create new scenario
- Add decisions (budget change, add location, etc.)
- Run simulation
- View results with provenance

### 4. Test Compare Futures
- Select baseline + 2 scenarios
- Adjust weights
- View trade-off analysis
- Export report

### 5. Test Rovo Agent
- Open Rovo chat
- Type: "What happens if we reduce IT budget by 15%?"
- Verify runScenario action
- Verify compareScenarios action
- Test createJiraTasks with approval flow

### 6. Test Jira Integration
- Import projects from Jira
- Create remediation tasks from simulation
- Verify tasks link back to simulation findings

### 6. Test Confluence Integration
- Link documents to entities
- Store scenario report
- Search documents

### 7. Test Scheduled Jobs
- Check Forge logs for daily sync
- Verify weekly cleanup runs

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Custom UI doesn't load | Check `forge logs`, verify `static/hello-world/build` exists |
| Functions timeout | Increase timeout in manifest, optimize queries |
| Storage quota exceeded | Check entity limits (20 entities, 50 attrs each) |
| NVIDIA API errors | Check API key, rate limits, model availability |
| Jira/Confluence auth fails | Verify API tokens, scopes, base URLs |
| Rovo agent not showing | Check manifest, re-deploy, restart Rovo |

### Debug Commands
```bash
forge logs --tail
forge tunnel
forge logs --function resolver
forge logs --function ai-service
```

## Rollback Procedure
```bash
forge deploy --version <previous-version-id>
```

## Monitoring
- **Forge Metrics**: Invocation count, duration, errors
- **Custom Logs**: Structured logging in functions
- **Alerts**: Set up on error rate > 5%

## Security Checklist
- [ ] All API keys in Forge encrypted env vars
- [ ] No secrets in code or Git history
- [ ] Egress domains declared in manifest
- [ ] Tenant isolation verified
- [ ] Audit logging enabled
- [ ] Input validation on all resolvers
- [ ] Approval flow for Jira task creation

## Performance Targets
- Simulation: < 2 seconds for demo org
- UI Load: < 3 seconds
- API Response: < 500ms
- Forge Function: < 25 seconds

## Rollout Plan
1. **Dev**: Deploy to personal dev site
2. **Staging**: Deploy to team dev site
3. **Demo**: Deploy to Codegeist demo site
4. **Production**: Submit to Marketplace

## Support Contacts
- Forge Support: developer.atlassian.com/support
- NVIDIA NIM: https://docs.nvidia.com/nim/
- Atlassian Developer Community: community.developer.atlassian.com