// src/functions/jiraWebhook.ts
// Jira webhook handler for real-time issue updates

import type { ForgeRequest, ForgeResponse} from './types';
import { parseRequestBody } from './types';
import { kvs } from '@forge/kvs';

export async function handler(req: ForgeRequest): Promise<ForgeResponse> {
  const body = await parseRequestBody(req);

  try {
    const { webhookEvent, issue, project: _project } = body;

    try {
      await kvs.entity('aiInteraction').set(`webhook_${Date.now()}`, {
        userId: 'system',
        createdAt: Date.now(),
        type: webhookEvent || 'jira:issue_updated',
      });
    } catch {
      // In-memory or fallback
    }

    console.log(`Issue ${issue?.key} ${webhookEvent}`);

    return { status: 200, body: { received: true } };
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : 'Webhook processing failed' },
    };
  }
}
