// packages/engine/src/services/jira.ts

import { 
  AtlassianConfig, 
  JiraImportOptions, 
  ImportResult, 
  JiraProjectMapping, 
  JiraIssueMapping, 
  JiraUserMapping,
  TaskProposal, 
  CreatedIssue, 
  CreateRemediationTasksInput,
  ForgeContext,
  AtlassianError,
  JiraError,
} from './atlassian-types';
import { EntityId, DecisionType } from '../entities/types';
import { SimulationResult } from '../simulation/types';

/**
 * Jira Service - Handles Jira integration
 */
export class JiraService {
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
    return `${this.config.baseUrl.replace(/\/$/, '')}/rest/api/3${path}`;
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
      let errorMessage = `Jira API error: ${response.status}`;
      try {
        const errorBody = (await response.json()) as any;
        errorMessage = errorBody.errorMessages?.join(', ') || errorMessage;
      } catch {
        errorMessage = (await response.text()) || errorMessage;
      }
      
      const code = this.mapStatusCode(response.status);
      throw new JiraError(errorMessage, code, response.status);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  private mapStatusCode(status: number): AtlassianError['code'] {
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
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; user?: string }> {
    const start = Date.now();
    try {
      const user = await this.request<{ accountId: string; displayName: string }>('/myself');
      return { healthy: true, latencyMs: Date.now() - start, user: user.displayName };
    } catch (error) {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }

  /**
   * Import Jira projects and issues as twin entities
   */
  async importProjects(options: JiraImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      entitiesCreated: 0,
      relationshipsCreated: 0,
      projectsMapped: [],
      issuesMapped: [],
      usersMapped: [],
      errors: [],
    };

    for (const projectKey of options.projectKeys) {
      try {
        // Get project details
        const project = await this.request<any>(`/project/${projectKey}`);
        
        const projectMapping: JiraProjectMapping = {
          projectKey: project.key,
          projectName: project.name,
          projectId: project.id,
        };
        result.projectsMapped.push(projectMapping);

        // Import issues if requested
        if (options.importIssues !== false) {
          const issues = await this.searchIssues(projectKey, options.maxIssuesPerProject);
          
          for (const issue of issues) {
            try {
              const issueMapping = await this.mapIssue(issue);
              result.issuesMapped.push(issueMapping);
            } catch (error) {
              result.errors.push({
                type: 'issue',
                key: issue.key,
                message: error instanceof Error ? error.message : String(error),
                severity: 'error',
              });
            }
          }
        }

        // Import users if requested
        if (options.importUsers !== false) {
          const users = await this.getProjectUsers(projectKey);
          for (const user of users) {
            const userMapping: JiraUserMapping = {
              accountId: user.accountId,
              displayName: user.displayName,
              emailAddress: user.emailAddress || '',
            };
            result.usersMapped.push(userMapping);
          }
        }

      } catch (error) {
        result.errors.push({
          type: 'project',
          key: projectKey,
          message: error instanceof Error ? error.message : String(error),
          severity: 'error',
        });
      }
    }

    return result;
  }

  /**
   * Search issues in a project
   */
  private async searchIssues(projectKey: string, maxResults = 100): Promise<any[]> {
    const jql = `project = ${projectKey} ORDER BY created DESC`;
    const response = await this.request<{ issues: any[] }>('/search', {
      method: 'POST',
      body: JSON.stringify({
        jql,
        maxResults,
        fields: ['summary', 'description', 'issuetype', 'status', 'assignee', 'project', 'components', 'customfield_*'],
      }),
    });
    return response.issues || [];
  }

  /**
   * Map Jira issue to twin entity mapping
   */
  private async mapIssue(issue: any): Promise<JiraIssueMapping> {
    return {
      issueKey: issue.key,
      issueId: issue.id,
      summary: issue.fields.summary,
      description: this.extractDescription(issue.fields.description),
      issueType: issue.fields.issuetype?.name || 'Task',
      status: issue.fields.status?.name || 'Unknown',
      assigneeId: issue.fields.assignee?.accountId,
      projectKey: issue.fields.project?.key,
    };
  }

  /**
   * Extract plain text from ADF description
   */
  private extractDescription(adf: any): string {
    if (!adf) return '';
    if (typeof adf === 'string') return adf;
    
    // Simple ADF text extraction
    const extractText = (node: any): string => {
      if (node.type === 'text') return node.text || '';
      if (node.content) {
        return node.content.map(extractText).join(' ');
      }
      return '';
    };
    return extractText(adf);
  }

  /**
   * Get project users
   */
  private async getProjectUsers(projectKey: string): Promise<any[]> {
    try {
      const response = await this.request<any[]>(`/user/assignable/search?project=${projectKey}&maxResults=50`);
      return response;
    } catch {
      return [];
    }
  }

  /**
   * Create remediation tasks from approved proposals
   */
  async createRemediationTasks(input: CreateRemediationTasksInput): Promise<CreatedIssue[]> {
    // Verify approval token
    const expectedToken = 'Yes, create these tasks';
    if (input.approvalToken !== expectedToken) {
      throw new JiraError(
        'Invalid approval token. Must confirm with exact phrase: "Yes, create these tasks"',
        'validation'
      );
    }

    const created: CreatedIssue[] = [];

    for (const proposal of input.taskProposals) {
      try {
        const issue = await this.createIssue(proposal);
        created.push(issue);
      } catch (error) {
        // Continue with other tasks, log error
        console.error(`Failed to create task for ${proposal.summary}:`, error);
      }
    }

    return created;
  }

  /**
   * Create a Jira issue from proposal
   */
  private async createIssue(proposal: TaskProposal): Promise<CreatedIssue> {
    const payload = {
      fields: {
        project: { key: proposal.projectKey },
        summary: proposal.summary,
        description: this.buildDescription(proposal),
        issuetype: { name: proposal.issueType },
        labels: ['parallelos', 'remediation', proposal.scenarioReference.findingType, ...proposal.labels],
        ...(proposal.assigneeId && { assignee: { accountId: proposal.assigneeId } }),
        ...(proposal.priority && { priority: { name: proposal.priority } }),
      },
    };

    const response = await this.request<{ id: string; key: string; self: string }>('/issue', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Add custom field linking to scenario
    await this.addScenarioLink(response.id, proposal.scenarioReference);

    return {
      issueKey: response.key,
      issueId: response.id,
      url: `${this.config.baseUrl}/browse/${response.key}`,
      proposal,
    };
  }

  /**
   * Build ADF description for issue
   */
  private buildDescription(proposal: TaskProposal): any {
    return {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: proposal.description }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '🔗 Linked to ParallelOS Scenario: ', marks: [{ type: 'strong' }] },
            { type: 'text', text: proposal.scenarioReference.scenarioId },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '📊 Finding: ', marks: [{ type: 'strong' }] },
            { type: 'text', text: `${proposal.scenarioReference.findingType} (${proposal.scenarioReference.findingId})` },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '🎯 Simulation Result: ', marks: [{ type: 'strong' }] },
            { type: 'text', text: proposal.scenarioReference.simulationResultId },
          ],
        },
      ],
    };
  }

  /**
   * Add scenario link as issue property
   */
  private async addScenarioLink(issueId: string, reference: TaskProposal['scenarioReference']): Promise<void> {
    await this.request(`/issue/${issueId}/properties/parallelos-scenario-reference`, {
      method: 'PUT',
      body: JSON.stringify(reference),
    });
  }

  /**
   * Get issue with scenario reference
   */
  async getIssueWithScenarioRef(issueKey: string): Promise<{ issue: any; scenarioRef?: any }> {
    const issue = await this.request<any>(`/issue/${issueKey}?properties=parallelos-scenario-reference`);
    return {
      issue,
      scenarioRef: issue.properties?.['parallelos-scenario-reference'],
    };
  }
}

/**
 * Factory function
 */
export function createJiraService(config: AtlassianConfig, context: ForgeContext): JiraService {
  return new JiraService(config, context);
}