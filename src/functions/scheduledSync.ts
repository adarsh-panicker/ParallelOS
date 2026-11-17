// src/functions/scheduledSync.ts
// Daily sync scheduled trigger handler

import type { ForgeRequest, ForgeResponse } from './types';
import { kvs } from '@forge/kvs';

export async function handler(_req?: ForgeRequest): Promise<ForgeResponse> {
  try {
    console.log('Starting daily sync...');

    const syncResults = {
      jiraProjectsSynced: 0,
      jiraIssuesSynced: 0,
      confluencePagesSynced: 0,
      scenariosReEvaluated: 0,
      errors: [],
    };

    try {
      await kvs.entity('aiInteraction').set(`sync_daily_${Date.now()}`, {
        userId: 'system',
        createdAt: Date.now(),
        type: 'daily-sync',
      });
    } catch {
      // Fallback
    }

    return { status: 200, body: { success: true, results: syncResults } };
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : 'Sync failed' },
    };
  }
}
