// src/functions/jiraImport.ts
// Jira import function handler

import { ForgeRequest, ForgeResponse } from '@forge/api';

export async function handler(req: ForgeRequest): Promise<ForgeResponse> {
  const body = await req.json();
  const { projectKeys, includeArchived = false, maxIssuesPerProject = 100 } = body;

  try {
    // In production, this would call Jira REST API
    // For now, return mock response
    return {
      status: 200,
      body: {
        entitiesCreated: 0,
        relationshipsCreated: 0,
        projectsMapped: projectKeys.map(key => ({
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