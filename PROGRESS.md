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

## Broken
- None (code builds and lints cleanly)

## Next
- User must complete manual steps:
  1. `forge login` (requires Atlassian API token with Forge scope)
  2. `forge create` (or `forge register` if using existing manifest app ID)
  3. `forge deploy`
  4. `forge install` (or `forge install --demo-site`)
  5. Open app in Jira/Confluence and verify:
     - Health check returns "ok"
     - Write → Read round trip works
     - List entities shows stored data
- Initialize Git repo and commit

## Manual steps needed
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
- No SQL migration complexity needed for Phase 0-2