// packages/engine/src/services/rovo.ts

import { 
  ForgeContext,
  RunScenarioInput, 
  RunScenarioOutput,
  CompareScenariosInput, 
  CompareScenariosOutput,
  CreateJiraTasksInput, 
  CreateJiraTasksOutput,
  RovoError,
  TaskProposal,
} from './atlassian-types';
import { SimulationResult, SimulationDecision } from '../simulation/types';
import { ComparisonResult } from '../comparison/types';
import { AIService } from '../ai/service';
import { JiraService } from './jira';
import { getAIService } from '../ai/service';
import { createJiraService } from './jira';

/**
 * Rovo Agent Service - Handles Rovo Agent actions
 */
export class RovoService {
  private context: ForgeContext;
  private aiService: AIService;
  private jiraService: JiraService;

  constructor(context: ForgeContext, aiService: AIService, jiraService: JiraService) {
    this.context = context;
    this.aiService = aiService;
    this.jiraService = jiraService;
  }

  /**
   * Action 1: Run a scenario simulation
   */
  async runScenario(input: RunScenarioInput): Promise<RunScenarioOutput> {
    try {
      // In a real implementation, this would:
      // 1. Get the scenario from storage
      // 2. Build simulation context
      // 3. Run simulation
      // 4. Return results
      
      // For now, return mock response
      return {
        simulationId: `sim-${Date.now()}`,
        status: 'completed',
        summary: `Simulation completed for scenario ${input.scenarioId}. The simulation analyzed the impact of the proposed changes across all organizational dimensions.`,
        keyFindings: [
          'Operating cost reduced by 15%',
          '3 projects at high delay risk',
          'Resource utilization increased to 85%',
          '2 critical dependencies identified',
        ],
        affectedEntitiesCount: 27,
        criticalRisks: [
          'Project Apollo delivery timeline at risk',
          'Engineering compute resources over-allocated',
        ],
      };
    } catch (error) {
      throw new RovoError(
        `Failed to run scenario: ${error instanceof Error ? error.message : String(error)}`,
        'api_error',
        error as Error
      );
    }
  }

  /**
   * Action 2: Compare scenarios
   */
  async compareScenarios(input: CompareScenariosInput): Promise<CompareScenariosOutput> {
    try {
      // In a real implementation, this would:
      // 1. Get baseline and scenario simulations
      // 2. Run comparison engine
      // 3. Return comparison result
      
      // For now, return mock response
      const scenarioScores = input.scenarioIds.map(id => ({
        scenarioId: id,
        name: `Scenario ${id}`,
        score: Math.floor(Math.random() * 40) + 50,
      }));

      return {
        comparisonId: `cmp-${Date.now()}`,
        summary: `Compared ${input.scenarioIds.length} scenarios against baseline ${input.baselineScenarioId}. Scenario ${scenarioScores.sort((a, b) => b.score - a.score)[0]?.scenarioId} scores highest overall.`,
        scenarioScores,
        topDifferences: [
          { dimension: 'operating_cost', insight: 'Scenario A reduces costs by 15% vs baseline' },
          { dimension: 'project_delivery', insight: 'Scenario B improves delivery confidence to 88%' },
          { dimension: 'risk_exposure', insight: 'Scenario C increases risk exposure by 45%' },
        ],
        recommendation: 'For cost optimization, choose Scenario A. For growth, choose Scenario B. Scenario C carries highest risk but potential for modernization.',
      };
    } catch (error) {
      throw new RovoError(
        `Failed to compare scenarios: ${error instanceof Error ? error.message : String(error)}`,
        'api_error',
        error as Error
      );
    }
  }

  /**
   * Action 3: Create Jira tasks from approved proposals (REQUIRES EXPLICIT APPROVAL)
   */
  async createJiraTasks(input: CreateJiraTasksInput): Promise<CreateJiraTasksOutput> {
    // Verify exact approval confirmation
    const expectedConfirmation = 'Yes, create these tasks';
    if (input.approvalConfirmation !== expectedConfirmation) {
      throw new RovoError(
        `Approval required. You must confirm with exact phrase: "${expectedConfirmation}"`,
        'validation'
      );
    }

    try {
      const createdIssues = await this.jiraService.createRemediationTasks({
        scenarioId: input.scenarioId,
        simulationResultId: '', // Would be passed in real implementation
        taskProposals: input.taskProposals,
        approvalToken: expectedConfirmation,
      });

      if (createdIssues.length === 0 && input.taskProposals.length > 0) {
        throw new RovoError(
          'All task proposals failed to create in Jira',
          'api_error'
        );
      }

      return {
        createdIssues: createdIssues.map(issue => ({
          key: issue.issueKey,
          url: issue.url,
          summary: issue.proposal.summary,
        })),
        failedProposals: [], // Would be populated in real implementation
      };
    } catch (error) {
      throw new RovoError(
        `Failed to create Jira tasks: ${error instanceof Error ? error.message : String(error)}`,
        'api_error',
        error as Error
      );
    }
  }

  /**
   * Generate task proposals from simulation results
   */
  async generateTaskProposals(
    simulationResult: SimulationResult,
    scenarioId: string
  ): Promise<TaskProposal[]> {
    const proposals: TaskProposal[] = [];

    // Project delay risks -> tasks
    for (const project of simulationResult.projectImpacts) {
      if (project.delayRisk === 'critical' || project.delayRisk === 'high') {
        proposals.push({
          summary: `Mitigate delay risk for ${project.projectName}`,
          description: `Project ${project.projectName} has ${project.delayRisk} delay risk (${project.estimatedDelayDays} days). Review resource allocation and dependencies.`,
          projectKey: 'PAR', // Would be determined from context
          issueType: 'Task',
          labels: ['parallelos', 'remediation', 'project_delay'],
          scenarioReference: {
            scenarioId,
            simulationResultId: simulationResult.id,
            findingId: `project-impact-${project.projectId}`,
            findingType: 'project_impact',
          },
          priority: project.delayRisk === 'critical' ? 'High' : 'Medium',
        });
      }
    }

    // Resource shortages -> tasks
    for (const shortage of simulationResult.resourceShortages) {
      proposals.push({
        summary: `Address ${shortage.resourceName} shortage`,
        description: `Resource ${shortage.resourceName} projected at ${(shortage.projectedUtilization * 100).toFixed(0)}% utilization with ${shortage.shortfall} shortfall. Consider procurement or reallocation.`,
        projectKey: 'PAR',
        issueType: 'Task',
        labels: ['parallelos', 'remediation', 'resource_shortage'],
        scenarioReference: {
          scenarioId,
          simulationResultId: simulationResult.id,
          findingId: `resource-shortage-${shortage.resourceId}`,
          findingType: 'resource_shortage',
        },
        priority: shortage.projectedUtilization > 0.95 ? 'High' : 'Medium',
      });
    }

    // Process disruptions -> tasks
    for (const disruption of simulationResult.processDisruptions) {
      if (disruption.disruptionLevel === 'critical' || disruption.disruptionLevel === 'major') {
        proposals.push({
          summary: `Improve resilience for ${disruption.processName}`,
          description: `Process ${disruption.processName} has ${disruption.disruptionLevel} disruption level. Review redundancy and recovery procedures.`,
          projectKey: 'PAR',
          issueType: 'Task',
          labels: ['parallelos', 'remediation', 'process_disruption'],
          scenarioReference: {
            scenarioId,
            simulationResultId: simulationResult.id,
            findingId: `process-disruption-${disruption.processId}`,
            findingType: 'process_disruption',
          },
          priority: disruption.disruptionLevel === 'critical' ? 'Highest' : 'High',
        });
      }
    }

    // Budget deltas -> tasks
    for (const delta of simulationResult.budgetDeltas) {
      if (Math.abs(delta.deltaPercent) > 10) {
        proposals.push({
          summary: `Review budget variance for ${delta.budgetName}`,
          description: `Budget ${delta.budgetName} shows ${delta.deltaPercent > 0 ? 'increase' : 'reduction'} of ${Math.abs(delta.deltaPercent).toFixed(1)}% (${delta.delta > 0 ? '+' : ''}${delta.delta.toLocaleString()}). Validate assumptions and adjust allocations.`,
          projectKey: 'PAR',
          issueType: 'Task',
          labels: ['parallelos', 'remediation', 'budget_delta'],
          scenarioReference: {
            scenarioId,
            simulationResultId: simulationResult.id,
            findingId: `budget-delta-${delta.budgetId}`,
            findingType: 'budget_delta',
          },
          priority: 'Medium',
        });
      }
    }

    // Unresolved dependencies -> tasks
    for (const unresolved of simulationResult.unresolvedDependencies) {
      proposals.push({
        summary: `Resolve missing dependency: ${unresolved.sourceEntityId} -> ${unresolved.targetEntityId}`,
        description: `Unresolved dependency detected: ${unresolved.relationshipType} between ${unresolved.sourceEntityId} and ${unresolved.targetEntityId}. Reason: ${unresolved.reason}. Impact: ${unresolved.impact}.`,
        projectKey: 'PAR',
        issueType: 'Task',
        labels: ['parallelos', 'remediation', 'unresolved_dependency'],
        scenarioReference: {
          scenarioId,
          simulationResultId: simulationResult.id,
          findingId: `unresolved-${unresolved.sourceEntityId}-${unresolved.targetEntityId}`,
          findingType: 'unresolved_dependency',
        },
        priority: unresolved.impact === 'blocked' ? 'High' : 'Medium',
      });
    }

    return proposals;
  }
}

/**
 * Factory function
 */
export function createRovoService(
  context: ForgeContext,
  aiService: AIService,
  jiraService: JiraService
): RovoService {
  return new RovoService(context, aiService, jiraService);
}

/**
 * Rovo Agent Manifest Configuration (for reference)
 */
export const ROVO_AGENT_MANIFEST = {
  key: 'parallelos-intelligence',
  name: 'ParallelOS Intelligence',
  description: 'Run organizational simulations, compare parallel futures, and create approved Jira tasks from simulation findings.',
  avatar: 'https://example.com/parallelos-rovo-avatar.png',
  actions: [
    {
      key: 'runScenario',
      name: 'Run Scenario',
      description: 'Execute a simulation for a specific scenario and return key findings',
      inputSchema: {
        type: 'object',
        properties: {
          scenarioId: { type: 'string', description: 'ID of the scenario to simulate' },
        },
        required: ['scenarioId'],
      },
    },
    {
      key: 'compareScenarios',
      name: 'Compare Scenarios',
      description: 'Compare multiple scenarios against a baseline across all dimensions',
      inputSchema: {
        type: 'object',
        properties: {
          baselineScenarioId: { type: 'string', description: 'Baseline scenario ID' },
          scenarioIds: { type: 'array', items: { type: 'string' }, description: 'Scenario IDs to compare' },
          dimensions: { type: 'array', items: { type: 'string' }, description: 'Optional: specific dimensions to compare' },
        },
        required: ['baselineScenarioId', 'scenarioIds'],
      },
    },
    {
      key: 'createJiraTasks',
      name: 'Create Jira Tasks',
      description: 'Create Jira tasks from approved remediation proposals (requires explicit approval)',
      inputSchema: {
        type: 'object',
        properties: {
          scenarioId: { type: 'string', description: 'Scenario ID' },
          taskProposals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                summary: { type: 'string' },
                description: { type: 'string' },
                projectKey: { type: 'string' },
                issueType: { type: 'string', enum: ['Task', 'Story', 'Epic'] },
                assigneeId: { type: 'string' },
                labels: { type: 'array', items: { type: 'string' } },
                scenarioReference: { type: 'object' },
              },
              required: ['summary', 'description', 'projectKey', 'issueType', 'scenarioReference'],
            },
          },
          approvalConfirmation: { 
            type: 'string', 
            description: 'Must be exactly: "Yes, create these tasks"' 
          },
        },
        required: ['scenarioId', 'taskProposals', 'approvalConfirmation'],
      },
    },
  ],
  promptTemplates: [
    'What happens if we reduce the IT budget by 15%?',
    'Compare our three organizational futures.',
    'Which systems are most critical to our operations?',
    'What are the consequences of expanding into two countries?',
    'Explain why Future B has a higher operational cost.',
    'Which assumptions have the greatest impact on our results?',
    'Create Jira tasks for the approved remediation recommendations.',
  ],
};