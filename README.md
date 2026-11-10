# ParallelOS — Phase 0 Vertical Slice

Minimal Forge app proving the end-to-end pipeline:
- **Custom UI**: React 18 + TypeScript + Vite (dark theme)
- **Resolver**: TypeScript with @forge/resolver
- **Storage**: Custom Entity Store (@forge/kvs) with Zod validation

## Prerequisites

- Node.js 24.x LTS (or 22.x)
- npm 10+
- Git
- Forge CLI: `npm install -g @forge/cli@latest`
- Atlassian account with developer site

## Setup

```bash
# Clone and install dependencies
git clone <repo-url>
cd parallelos

# Install root dependencies
npm install

# Install UI dependencies
cd static/hello-world
npm install
cd ../..
```

## Forge Login

```bash
# Create API token at: https://id.atlassian.com/manage-profile/security/api-tokens
# Select "Forge" as the app, copy token
forge login
# Enter email and API token
```

## Create/Register App

```bash
# Option 1: Create new app (generates manifest.yml with app ID)
forge create

# Option 2: Register existing app (if manifest already has app ID)
forge register
```

## Development

```bash
# Build UI
cd static/hello-world && npm run build && cd ../..

# Deploy to Forge
forge deploy

# Install on your site
forge install
# Or for demo site:
forge install --demo-site

# For live development with hot reload
forge tunnel
```

## Project Structure

```
parallelos/
├── manifest.yml              # Forge manifest
├── package.json              # Root package.json
├── tsconfig.json             # TypeScript config (backend)
├── .eslintrc.cjs             # ESLint config (backend)
├── .gitignore
├── src/
│   └── index.ts              # Resolver functions
└── static/hello-world/
    ├── package.json          # UI dependencies
    ├── tsconfig.json         # TypeScript config (UI)
    ├── tsconfig.node.json
    ├── vite.config.ts        # Vite config
    ├── public/
    │   └── index.html
    └── src/
        ├── main.tsx          # React entry point
        ├── App.tsx           # Main app component
        └── index.css         # Dark theme styles
```

## Resolver Functions

| Function | Description |
|----------|-------------|
| `healthCheck` | Returns `{ status: 'ok', timestamp }` |
| `writeTestValue` | Stores a value in Custom Entity Store |
| `readTestValue` | Reads the stored value |
| `listTestEntities` | Lists all test entities |

## Storage Schema

Entity: `parallelos_test`
- Key: `phase0-test`
- Attributes: `id` (string), `value` (string), `timestamp` (number)

## Verification Checklist

- [ ] `forge lint` passes
- [ ] `npm run build` in static/hello-world succeeds
- [ ] `forge deploy` succeeds
- [ ] `forge install` succeeds on your site
- [ ] App opens in Jira/Confluence
- [ ] Health check returns "ok"
- [ ] Write → Read round trip works
- [ ] List entities shows stored data
- [ ] No secrets in Git history

## Next Steps (Phase 1)

- Create documentation in `/docs`
- Build engine package skeleton with Zod schemas
- Set up Vitest for testing
- Define data model, simulation design, architecture