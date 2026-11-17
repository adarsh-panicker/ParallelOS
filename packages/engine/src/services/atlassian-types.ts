// packages/engine/src/services/atlassian-types.ts

import { EntityId, ScenarioId, SimulationId, DecisionType, VersionId } from '../entities/types';
import { SimulationResult, SimulationDecision } from '../simulation/types';

/**
 * Atlassian configuration
 */
export interface AtlassianConfig {
  baseUrl: string; // e.g., https://your-domain.atlassian.net
  email: string;
  apiToken: string;
}

/**
 * Jira Project mapping
 */
export interface JiraProjectMapping {
  projectKey: string;
  projectName: string;
  projectId: string;
  entityId?: EntityId; // Mapped twin entity ID
}

/**
 * Jira Issue mapping
 */
export interface JiraIssueMapping {
  issueKey: string; // e.g., PROJ-123
  issueId: string;
  summary: string;
  description: string;
  issueType: 'Epic' | 'Story' | 'Task' | 'Bug' | 'Sub-task';
  status: string;
  assigneeId?: string;
  projectKey: string;
  entityId?: EntityId; // Mapped twin entity ID
}

/**
 * Jira User mapping
 */
export interface JiraUserMapping {
  accountId: string;
  displayName: string;
  emailAddress: string;
  entityId?: EntityId; // Mapped twin Employee entity ID
}

/**
 * Import options for Jira
 */
export interface JiraImportOptions {
  projectKeys: string[];
  includeArchived?: boolean;
  maxIssuesPerProject?: number;
  importIssues?: boolean;
  importUsers?: boolean;
}

/**
 * Import result
 */
export interface ImportResult {
  entitiesCreated: number;
  relationshipsCreated: number;
  projectsMapped: JiraProjectMapping[];
  issuesMapped: JiraIssueMapping[];
  usersMapped: JiraUserMapping[];
  errors: ImportError[];
}

export interface ImportError {
  type: 'project' | 'issue' | 'user' | 'relationship';
  key: string;
  message: string;
  severity: 'warning' | 'error';
}

/**
 * Remediation task proposal
 */
export interface TaskProposal {
  summary: string;
  description: string;
  projectKey: string;
  issueType: 'Task' | 'Story' | 'Epic';
  assigneeId?: string;
  labels: string[];
  customFields?: Record<string, unknown>;
  scenarioReference: {
    scenarioId: ScenarioId;
    simulationResultId: string;
    findingId: string; // e.g., "project-impact-proj-123"
    findingType: 'project_impact' | 'resource_shortage' | 'process_disruption' | 'budget_delta' | 'unresolved_dependency';
  };
  priority?: 'Lowest' | 'Low' | 'Medium' | 'High' | 'Highest';
}

/**
 * Created Jira issue result
 */
export interface CreatedIssue {
  issueKey: string;
  issueId: string;
  url: string;
  proposal: TaskProposal;
}

/**
 * Create remediation tasks input
 */
export interface CreateRemediationTasksInput {
  scenarioId: ScenarioId;
  simulationResultId: string;
  taskProposals: TaskProposal[];
  approvalToken: string; // Exact phrase user must confirm
}

/**
 * Confluence page link
 */
export interface ConfluenceLink {
  entityId: EntityId;
  pageId: string;
  spaceKey: string;
  title: string;
  url: string;
  excerpt: string;
  relevance: 'primary' | 'supporting' | 'reference';
  linkedAt: number;
  linkedBy: string;
}

/**
 * Confluence search result
 */
export interface ConfluenceSearchResult {
  pageId: string;
  spaceKey: string;
  title: string;
  url: string;
  excerpt: string;
  lastModified: number;
  relevanceScore: number;
}

/**
 * Store scenario report input
 */
export interface StoreScenarioReportInput {
  scenarioId: ScenarioId;
  comparisonId?: string;
  title: string;
  content: string; // Atlassian Document Format (ADF)
  spaceKey: string;
  parentPageId?: string;
  labels: string[];
}

/**
 * Stored report result
 */
export interface StoredReport {
  pageId: string;
  url: string;
  title: string;
  spaceKey: string;
}

/**
 * Rovo Agent action types
 */
export type RovoActionType = 'runScenario' | 'compareScenarios' | 'createJiraTasks';

/**
 * Rovo action: runScenario
 */
export interface RunScenarioInput {
  scenarioId: string;
  decisions?: SimulationDecision[]; // Optional: override scenario decisions
}

export interface RunScenarioOutput {
  simulationId: string;
  status: 'completed' | 'failed';
  summary: string;
  keyFindings: string[];
  affectedEntitiesCount: number;
  criticalRisks: string[];
}

/**
 * Rovo action: compareScenarios
 */
export interface CompareScenariosInput {
  baselineScenarioId: string;
  scenarioIds: string[];
  dimensions?: string[];
}

export interface CompareScenariosOutput {
  comparisonId: string;
  summary: string;
  scenarioScores: { scenarioId: string; name: string; score: number }[];
  topDifferences: { dimension: string; insight: string }[];
  recommendation: string;
}

/**
 * Rovo action: createJiraTasks
 */
export interface CreateJiraTasksInput {
  scenarioId: string;
  taskProposals: TaskProposal[];
  approvalConfirmation: string; // Exact phrase: "Yes, create these tasks"
}

export interface CreateJiraTasksOutput {
  createdIssues: { key: string; url: string; summary: string }[];
  failedProposals: { proposal: TaskProposal; error: string }[];
}

/**
 * Rovo Agent prompt templates
 */
export const ROVO_PROMPT_TEMPLATES = [
  "What happens if we reduce the IT budget by 15%?",
  "Compare our three organizational futures.",
  "Which systems are most critical to our operations?",
  "What are the consequences of expanding into two countries?",
  "Explain why Future B has a higher operational cost.",
  "Which assumptions have the greatest impact on our results?",
  "Create Jira tasks for the approved remediation recommendations.",
];

/**
 * Error types for Atlassian operations
 */
export class AtlassianError extends Error {
  constructor(
    message: string,
    public readonly code: 'auth' | 'not_found' | 'permission_denied' | 'rate_limit' | 'validation' | 'network' | 'api_error',
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AtlassianError';
  }
}

export class JiraError extends AtlassianError {
  constructor(message: string, code: AtlassianError['code'], statusCode?: number, originalError?: Error) {
    super(message, code, statusCode, originalError);
    this.name = 'JiraError';
  }
}

export class ConfluenceError extends AtlassianError {
  constructor(message: string, code: AtlassianError['code'], statusCode?: number, originalError?: Error) {
    super(message, code, statusCode, originalError);
    this.name = 'ConfluenceError';
  }
}

export class RovoError extends AtlassianError {
  constructor(message: string, code: AtlassianError['code'], originalError?: Error) {
    super(message, code, undefined, originalError);
    this.name = 'RovoError';
  }
}

/**
 * Forge context for Atlassian API calls
 */
export interface ForgeContext {
  accountId: string;
  userKey?: string;
  environmentId: string;
  installationId: string;
}