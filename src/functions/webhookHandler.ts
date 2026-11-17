// src/functions/webhookHandler.ts
// Jira webhook handler for real-time updates

import type { ForgeRequest, ForgeResponse} from './types';
import { parseRequestBody } from './types';
import { kvs } from '@forge/kvs';

export async function handler(req: ForgeRequest): Promise<ForgeResponse> {
  const body = await parseRequestBody(req);

  try {
    const { webhookEvent, issue } = body;

    try {
      await kvs.entity('aiInteraction').set(`webhook_${Date.now()}`, {
        userId: 'system',
        createdAt: Date.now(),
        type: webhookEvent || 'webhook',
      });
    } catch {
      // Fallback
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
