// src/functions/confluenceLink.ts
// Confluence document linking function handler

import type { ForgeRequest, ForgeResponse} from './types';
import { parseRequestBody } from './types';

export async function handler(req: ForgeRequest): Promise<ForgeResponse> {
  const body = await parseRequestBody(req);
  const { entityId, pageId, linkedBy } = body;

  try {
    return {
      status: 200,
      body: {
        entityId,
        pageId,
        title: 'Confluence Page',
        url: `https://your-domain.atlassian.net/wiki/spaces/SPACE/pages/${pageId}`,
        excerpt: 'Page excerpt...',
        relevance: 'primary',
        linkedAt: Date.now(),
        linkedBy,
      },
    };
  } catch (error) {
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : 'Linking failed' },
    };
  }
}
