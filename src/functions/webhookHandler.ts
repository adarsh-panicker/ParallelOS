// src/functions/webhookHandler.ts
// Jira webhook handler for real-time updates

import { ForgeRequest, ForgeResponse } from '@forge/api';
import { storage } from '@forge/api';

export async function handler(req: ForgeRequest): Promise<ForgeResponse> {
  const body = await req.json();
  
  // Verify webhook secret if configured
  // const signature = req.headers.get('x-hub-signature');
  // if (!verifySignature(signature, JSON.stringify(body))) {
  //   return { status: 401, body: { error: 'Invalid signature' } };
  // }

  try {
    const { webhookEvent, issue, project, changelog } = body;

    // Store webhook event for audit
    await storage.set(`webhook:${Date.now()}`, {
      event: webhookEvent,
      issueKey: issue?.key,
      projectKey: project?.key,
      timestamp: Date.now(),
      payload: body,
    });

    // Handle different event types
    switch (webhookEvent) {
      case 'jira:issue_created':
      case 'jira:issue_updated':
        // Could trigger scenario re-evaluation
        console.log(`Issue ${issue?.key} ${webhookEvent}`);
        break;
      case 'jira:issue_deleted':
        console.log(`Issue ${issue?.key} deleted`);
        break;
    }

    return { status: 200, body: { received: true } };
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : 'Webhook processing failed' },
    };
  }
}