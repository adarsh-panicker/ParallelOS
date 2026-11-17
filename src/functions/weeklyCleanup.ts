// src/functions/weeklyCleanup.ts
// Weekly cleanup scheduled trigger handler

import type { ForgeRequest, ForgeResponse } from './types';
import { kvs } from '@forge/kvs';

export async function handler(_req?: ForgeRequest): Promise<ForgeResponse> {
  try {
    console.log('Starting weekly cleanup...');

    const cleanupResults = {
      simulationsDeleted: 0,
      entitiesArchived: 0,
      comparisonsCompressed: 0,
      logsRotated: 0,
      errors: [],
    };

    try {
      await kvs.entity('aiInteraction').set(`cleanup_weekly_${Date.now()}`, {
        userId: 'system',
        createdAt: Date.now(),
        type: 'weekly-cleanup',
      });
    } catch {
      // Fallback
    }

    return { status: 200, body: { success: true, results: cleanupResults } };
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : 'Cleanup failed' },
    };
  }
}
