// packages/engine/src/services/confluence.ts

import { 
  AtlassianConfig, 
  ConfluenceLink, 
  ConfluenceSearchResult, 
  StoreScenarioReportInput, 
  StoredReport,
  ForgeContext,
  ConfluenceError,
} from './atlassian-types';
import { EntityId } from '../entities/types';

/**
 * Confluence Service - Handles Confluence integration
 */
export class ConfluenceService {
  private config: AtlassianConfig;
  private context: ForgeContext;

  constructor(config: AtlassianConfig, context: ForgeContext) {
    this.config = config;
    this.context = context;
  }

  /**
   * Build auth header
   */
  private getAuthHeader(): string {
    return `Basic ${btoa(`${this.config.email}:${this.config.apiToken}`)}`;
  }

  /**
   * Build API URL
   */
  private buildUrl(path: string): string {
    return `${this.config.baseUrl.replace(/\/$/, '')}/wiki/api/v2${path}`;
  }

  /**
   * Make authenticated request
   */
  private async request<T>(
    path: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildUrl(path);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `Confluence API error: ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.message || errorMessage;
      } catch {
        errorMessage = await response.text() || errorMessage;
      }
      
      const code = this.mapStatusCode(response.status);
      throw new ConfluenceError(errorMessage, code, response.status);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private mapStatusCode(status: number): ConfluenceError['code'] {
    switch (status) {
      case 401: return 'auth';
      case 403: return 'permission_denied';
      case 404: return 'not_found';
      case 429: return 'rate_limit';
      case 400: return 'validation';
      default: return status >= 500 ? 'api_error' : 'validation';
    }
  }

  /**
   * Test connection
   */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.request('/spaces?limit=1');
      return { healthy: true, latencyMs: Date.now() - start };
    } catch {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }

  /**
   * Link a Confluence page to a twin entity
   */
  async linkDocumentToEntity(entityId: EntityId, pageId: string, linkedBy: string): Promise<ConfluenceLink> {
    const page = await this.request<any>(`/pages/${pageId}`);
    
    const excerpt = this.extractExcerpt(page.body?.storage?.value || page.body?.view?.value || '');
    
    const link: ConfluenceLink = {
      entityId,
      pageId: page.id,
      spaceKey: page.spaceKey,
      title: page.title,
      url: `${this.config.baseUrl}/wiki${page._links.webui}`,
      excerpt,
      relevance: 'primary',
      linkedAt: Date.now(),
      linkedBy,
    };

    // Store link as entity property (would be done via storage adapter in real implementation)
    return link;
  }

  /**
   * Search for relevant documents
   */
  async searchRelevantDocuments(
    query: string, 
    spaceKeys?: string[],
    limit = 10
  ): Promise<ConfluenceSearchResult[]> {
    let cql = `text ~ "${query}"`;
    if (spaceKeys && spaceKeys.length > 0) {
      cql += ` AND space in (${spaceKeys.map(k => `"${k}"`).join(',')})`;
    }
    cql += ` ORDER BY lastmodified DESC`;

    const response = await this.request<{ results: any[] }>(`/pages?cql=${encodeURIComponent(cql)}&limit=${limit}&body-format=storage`);

    return response.results.map(page => ({
      pageId: page.id,
      spaceKey: page.spaceKey,
      title: page.title,
      url: `${this.config.baseUrl}/wiki${page._links.webui}`,
      excerpt: this.extractExcerpt(page.body?.storage?.value || ''),
      lastModified: new Date(page.version.when).getTime(),
      relevanceScore: this.calculateRelevance(query, page.title, page.body?.storage?.value || ''),
    }));
  }

  /**
   * Extract plain text excerpt from storage format
   */
  private extractExcerpt(storage: string): string {
    if (!storage) return '';
    // Simple HTML tag stripping
    const text = storage.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.substring(0, 500) + (text.length > 500 ? '...' : '');
  }

  /**
   * Simple relevance scoring
   */
  private calculateRelevance(query: string, title: string, content: string): number {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    let score = 0;
    
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    for (const term of terms) {
      if (titleLower.includes(term)) score += 10;
      if (contentLower.includes(term)) score += 1;
    }
    
    return Math.min(100, score);
  }

  /**
   * Store scenario report as Confluence page
   */
  async storeScenarioReport(input: StoreScenarioReportInput): Promise<StoredReport> {
    const adfContent = this.convertToADF(input.content);
    
    const payload = {
      spaceId: input.spaceKey,
      title: input.title,
      status: 'current',
      body: {
        representation: 'storage',
        value: adfContent,
      },
      ...(input.parentPageId && { parentId: input.parentPageId }),
    };

    const page = await this.request<any>('/pages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Add labels
    if (input.labels.length > 0) {
      await this.addLabels(page.id, input.labels);
    }

    return {
      pageId: page.id,
      url: `${this.config.baseUrl}/wiki${page._links.webui}`,
      title: page.title,
      spaceKey: page.spaceKey,
    };
  }

  /**
   * Convert markdown/plain text to basic ADF storage format
   */
  private convertToADF(content: string): string {
    // Simple conversion - in production would use proper ADF builder
    const lines = content.split('\n');
    const blocks: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.startsWith('# ')) {
        blocks.push(`<h1>${this.escapeHtml(trimmed.substring(2))}</h1>`);
      } else if (trimmed.startsWith('## ')) {
        blocks.push(`<h2>${this.escapeHtml(trimmed.substring(3))}</h2>`);
      } else if (trimmed.startsWith('### ')) {
        blocks.push(`<h3>${this.escapeHtml(trimmed.substring(4))}</h3>`);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        blocks.push(`<ul><li>${this.escapeHtml(trimmed.substring(2))}</li></ul>`);
      } else if (trimmed.match(/^\d+\.\s/)) {
        blocks.push(`<ol><li>${this.escapeHtml(trimmed.replace(/^\d+\.\s/, ''))}</li></ol>`);
      } else {
        blocks.push(`<p>${this.escapeHtml(trimmed)}</p>`);
      }
    }
    
    return blocks.join('\n');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '\'');
  }

  /**
   * Add labels to page
   */
  private async addLabels(pageId: string, labels: string[]): Promise<void> {
    for (const label of labels) {
      try {
        await this.request(`/pages/${pageId}/labels`, {
          method: 'POST',
          body: JSON.stringify({ name: label }),
        });
      } catch {
        // Ignore label errors
      }
    }
  }

  /**
   * Get page by ID
   */
  async getPage(pageId: string): Promise<any> {
    return this.request<any>(`/pages/${pageId}?body-format=storage`);
  }

  /**
   * Update page content
   */
  async updatePage(pageId: string, title: string, content: string, version: number): Promise<any> {
    const adfContent = this.convertToADF(content);
    return this.request<any>(`/pages/${pageId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: pageId,
        status: 'current',
        title,
        body: { representation: 'storage', value: adfContent },
        version: { number: version + 1 },
      }),
    });
  }
}

/**
 * Factory function
 */
export function createConfluenceService(config: AtlassianConfig, context: ForgeContext): ConfluenceService {
  return new ConfluenceService(config, context);
}