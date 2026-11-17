// src/functions/jiraImport.ts
// Jira import function handler

import type { ForgeRequest, ForgeResponse} from './types';
import { parseRequestBody } from './types';

export async function handler(req: ForgeRequest): Promise<ForgeResponse> {
  const body = await parseRequestBody(req);
  const { projectKeys = [], includeArchived: _includeArchived = false, maxIssuesPerProject: _maxIssuesPerProject = 100 } = body;

  try {
    return {
      status: 200,
      body: {
        entitiesCreated: 0,
        relationshipsCreated: 0,
        projectsMapped: (projectKeys as string[]).map((key: string) => ({
          projectKey: key,
          projectName: `Project ${key}`,
          projectId: `proj-${key}`,
        })),
        issuesMapped: [],
        usersMapped: [],
        errors: [],
      },
    };
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : 'Import failed' },
    };
  }
}
