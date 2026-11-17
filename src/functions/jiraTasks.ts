// src/functions/jiraTasks.ts
// Jira task creation function handler

import type { ForgeRequest, ForgeResponse} from './types';
import { parseRequestBody } from './types';

export async function handler(req: ForgeRequest): Promise<ForgeResponse> {
  const body = await parseRequestBody(req);
  const { scenarioId: _scenarioId, simulationResultId: _simulationResultId, taskProposals = [], approvalToken } = body;

  const expectedToken = 'Yes, create these tasks';
  if (approvalToken !== expectedToken) {
    return {
      status: 400,
      body: { error: `Invalid approval token. Must confirm with exact phrase: "${expectedToken}"` },
    };
  }

  try {
    const createdIssues = [];
    const failedProposals = [];

    for (const proposal of taskProposals) {
      try {
        createdIssues.push({
          issueKey: `PROJ-${Date.now()}`,
          issueId: `issue-${Date.now()}`,
          url: `https://your-domain.atlassian.net/browse/PROJ-${Date.now()}`,
          proposal,
        });
      } catch (error) {
        failedProposals.push({
          proposal,
          error: error instanceof Error ? error.message : 'Failed to create issue',
        });
      }
    }

    return {
      status: 200,
      body: { createdIssues, failedProposals },
    };
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : 'Task creation failed' },
    };
  }
}
