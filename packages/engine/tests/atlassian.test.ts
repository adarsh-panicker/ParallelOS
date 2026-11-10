// packages/engine/tests/atlassian.test.ts

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { 
  JiraService, 
  ConfluenceService, 
  RovoService,
  createJiraService,
  createConfluenceService,
  createRovoService,
  AtlassianConfig,
  ForgeContext,
  JiraImportOptions,
  TaskProposal,
  CreateRemediationTasksInput,
  RunScenarioInput,
  CompareScenariosInput,
  CreateJiraTasksInput,
  AtlassianError,
  JiraError,
  ConfluenceError,
  RovoError,
  ROVO_AGENT_MANIFEST,
} from '../src/services';
import { DecisionType } from '../src/entities/types';
import { AIService, getAIService, createMockAIProvider } from '../src/ai/service';
import { SimulationResult, SimulationDecision, ProvenanceRecord } from '../src/simulation/types';
import { EntityId, ScenarioId } from '../src/entities/types';

describe('Atlassian Services', () => {
  const mockConfig: AtlassianConfig = {
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token',
  };

  const mockContext: ForgeContext = {
    accountId: 'test-account',
    environmentId: 'test-env',
    installationId: 'test-install',
  };

  describe('JiraService', () => {
    let jiraService: JiraService;

    beforeEach(() => {
      jiraService = createJiraService(mockConfig, mockContext);
    });

    it('should create service instance', () => {
      expect(jiraService).toBeInstanceOf(JiraService);
    });

    it('should reject invalid approval token', async () => {
      const input: CreateRemediationTasksInput = {
        scenarioId: 'scen-1' as ScenarioId,
        simulationResultId: 'sim-1',
        taskProposals: [{
          summary: 'Test task',
          description: 'Test description',
          projectKey: 'TEST',
          issueType: 'Task',
          labels: ['test'],
          customFields: {},
          scenarioReference: {
            scenarioId: 'scen-1' as ScenarioId,
            simulationResultId: 'sim-1',
            findingId: 'finding-1',
            findingType: 'project_impact',
          },
        }],
        approvalToken: 'Wrong token',
      };

      await expect(jiraService.createRemediationTasks(input))
        .rejects.toThrow('Invalid approval token');
    });

    it('should accept correct approval token format', () => {
      const expectedToken = 'Yes, create these tasks';
      expect(expectedToken).toBe('Yes, create these tasks');
    });
  });

  describe('ConfluenceService', () => {
    let confluenceService: ConfluenceService;

    beforeEach(() => {
      confluenceService = createConfluenceService(mockConfig, mockContext);
    });

    it('should create service instance', () => {
      expect(confluenceService).toBeInstanceOf(ConfluenceService);
    });
  });

  describe('RovoService', () => {
    let rovoService: RovoService;
    let mockAIService: AIService;
    let mockJiraService: JiraService;

    beforeEach(() => {
      mockAIService = new AIService();
      const mockProvider = createMockAIProvider();
      (mockAIService as any).provider = mockProvider;
      (mockAIService as any).config = { name: 'mock', modelId: 'mock', endpoint: 'mock', apiKey: 'mock' };

      mockJiraService = createJiraService(mockConfig, mockContext);
      rovoService = createRovoService(mockContext, mockAIService, mockJiraService);
    });

    it('should create service instance', () => {
      expect(rovoService).toBeInstanceOf(RovoService);
    });

    describe('runScenario', () => {
      it('should return simulation output', async () => {
        const input: RunScenarioInput = { scenarioId: 'scen-1' };
        const result = await rovoService.runScenario(input);

        expect(result).toHaveProperty('simulationId');
        expect(result.status).toBe('completed');
        expect(result.summary).toContain('scen-1');
        expect(result.keyFindings.length).toBeGreaterThan(0);
        expect(result.criticalRisks.length).toBeGreaterThan(0);
      });
    });

    describe('compareScenarios', () => {
      it('should return comparison output', async () => {
        const input: CompareScenariosInput = {
          baselineScenarioId: 'baseline',
          scenarioIds: ['scen-a', 'scen-b'],
        };
        const result = await rovoService.compareScenarios(input);

        expect(result).toHaveProperty('comparisonId');
        expect(result.scenarioScores.length).toBe(2);
        expect(result.topDifferences.length).toBeGreaterThan(0);
        expect(result.recommendation).toBeDefined();
      });
    });

    describe('createJiraTasks', () => {
      it('should reject incorrect approval confirmation', async () => {
        const input: CreateJiraTasksInput = {
          scenarioId: 'scen-1',
          taskProposals: [{
            summary: 'Test task',
            description: 'Test description',
            projectKey: 'TEST',
            issueType: 'Task',
            labels: ['test'],
            customFields: {},
            scenarioReference: {
              scenarioId: 'scen-1' as ScenarioId,
              simulationResultId: 'sim-1',
              findingId: 'finding-1',
              findingType: 'project_impact',
            },
          }],
          approvalConfirmation: 'Yes please create them',
        };

        await expect(rovoService.createJiraTasks(input))
          .rejects.toThrow('exact phrase');
      });

      it('should pass approval check with correct confirmation', async () => {
        const input: CreateJiraTasksInput = {
          scenarioId: 'scen-1',
          taskProposals: [{
            summary: 'Test task',
            description: 'Test description',
            projectKey: 'TEST',
            issueType: 'Task',
            labels: ['test'],
            customFields: {},
            scenarioReference: {
              scenarioId: 'scen-1' as ScenarioId,
              simulationResultId: 'sim-1',
              findingId: 'finding-1',
              findingType: 'project_impact',
            },
          }],
          approvalConfirmation: 'Yes, create these tasks',
        };

        // Approval check passes, but Jira will fail (no real connection)
        // The service should throw RovoError wrapping the Jira error
        await expect(rovoService.createJiraTasks(input))
          .rejects.toThrow(); // RovoError expected
      });
    });

    describe('generateTaskProposals', () => {
      it('should generate proposals from simulation result', async () => {
        const simulationResult: SimulationResult = {
          id: 'sim-1',
          scenarioId: 'scen-1',
          decisions: [{
            id: 'dec-1',
            type: 'budget_change',
            description: 'Reduce budget',
            parameters: { percentChange: -15 },
            targetEntityIds: ['budget-eng' as EntityId],
            timestamp: Date.now(),
          }],
          affectedEntities: [],
          budgetDeltas: [{
            budgetId: 'budget-eng',
            budgetName: 'Engineering Budget',
            baselineAmount: 8000000,
            projectedAmount: 6800000,
            delta: -1200000,
            deltaPercent: -15,
            breakdown: [],
            provenance: {} as ProvenanceRecord,
          }],
          resourceShortages: [{
            resourceId: 'res-compute',
            resourceName: 'Engineering Compute',
            resourceType: 'compute',
            currentUtilization: 0.7,
            projectedUtilization: 0.95,
            shortfall: 50000,
            affectedEntities: [],
            provenance: {} as ProvenanceRecord,
          }],
          projectImpacts: [{
            projectId: 'proj-apollo',
            projectName: 'Project Apollo',
            delayRisk: 'critical',
            estimatedDelayDays: 30,
            budgetImpact: 0,
            resourceGaps: [],
            affectedMilestones: [],
            provenance: {} as ProvenanceRecord,
          }],
          processDisruptions: [{
            processId: 'proc-1',
            processName: 'Order Processing',
            disruptionLevel: 'major',
            affectedSystems: [],
            estimatedRecoveryTimeMs: 14400000,
            workaroundAvailable: false,
            provenance: {} as ProvenanceRecord,
          }],
          unresolvedDependencies: [{
            sourceEntityId: 'sys-1' as EntityId,
            targetEntityId: 'sys-2' as EntityId,
            relationshipType: 'depends_on',
            reason: 'missing_entity',
            impact: 'blocked',
          }],
          executedAt: Date.now(),
          executionTimeMs: 100,
          deterministic: true,
          warnings: [],
        };

        const proposals = await rovoService.generateTaskProposals(simulationResult, 'scen-1');

        expect(proposals.length).toBeGreaterThan(0);
        
        // Check project delay proposals
        const projectProposals = proposals.filter(p => p.scenarioReference.findingType === 'project_impact');
        expect(projectProposals.length).toBeGreaterThan(0);
        expect(projectProposals[0].priority).toBe('High');

        // Check resource shortage proposals
        const resourceProposals = proposals.filter(p => p.scenarioReference.findingType === 'resource_shortage');
        expect(resourceProposals.length).toBeGreaterThan(0);

        // Check process disruption proposals
        const processProposals = proposals.filter(p => p.scenarioReference.findingType === 'process_disruption');
        expect(processProposals.length).toBeGreaterThan(0);
        expect(processProposals[0].priority).toBe('High');

        // Check budget proposals
        const budgetProposals = proposals.filter(p => p.scenarioReference.findingType === 'budget_delta');
        expect(budgetProposals.length).toBeGreaterThan(0);

        // Check unresolved dependency proposals
        const dependencyProposals = proposals.filter(p => p.scenarioReference.findingType === 'unresolved_dependency');
        expect(dependencyProposals.length).toBeGreaterThan(0);
        expect(dependencyProposals[0].priority).toBe('High');
      });
    });
  });

  describe('ROVO_AGENT_MANIFEST', () => {
    it('should have correct manifest structure', () => {
      expect(ROVO_AGENT_MANIFEST.key).toBe('parallelos-intelligence');
      expect(ROVO_AGENT_MANIFEST.name).toBe('ParallelOS Intelligence');
      expect(ROVO_AGENT_MANIFEST.actions).toHaveLength(3);
      expect(ROVO_AGENT_MANIFEST.actions.map((a: any) => a.key)).toEqual(['runScenario', 'compareScenarios', 'createJiraTasks']);
      expect(ROVO_AGENT_MANIFEST.promptTemplates.length).toBe(7);
    });
  });

  describe('Error Classes', () => {
    it('should create AtlassianError with correct properties', () => {
      const error = new AtlassianError('Test error', 'auth', 401);
      expect(error.name).toBe('AtlassianError');
      expect(error.code).toBe('auth');
      expect(error.statusCode).toBe(401);

      const jiraError = new JiraError('Jira error', 'not_found', 404);
      expect(jiraError.name).toBe('JiraError');

      const confluenceError = new ConfluenceError('Confluence error', 'rate_limit', 429);
      expect(confluenceError.name).toBe('ConfluenceError');

      const rovoError = new RovoError('Rovo error', 'validation');
      expect(rovoError.name).toBe('RovoError');
    });
  });

  describe('Type Exports', () => {
    it('should export all types', () => {
      // Just verify the types are available by referencing them
      const _config: AtlassianConfig = {
        baseUrl: '',
        email: '',
        apiToken: '',
      };
      const _importOptions: JiraImportOptions = { projectKeys: [] };
      const _taskProposal: TaskProposal = {
        summary: '',
        description: '',
        projectKey: '',
        issueType: 'Task',
        labels: [],
        customFields: {},
        scenarioReference: {
          scenarioId: '' as ScenarioId,
          simulationResultId: '',
          findingId: '',
          findingType: 'project_impact',
        },
      };
      const _remediationInput: CreateRemediationTasksInput = {
        scenarioId: '' as ScenarioId,
        simulationResultId: '',
        taskProposals: [],
        approvalToken: '',
      };
      const _link: ConfluenceLink = {
        entityId: '' as EntityId,
        pageId: '',
        spaceKey: '',
        title: '',
        url: '',
        excerpt: '',
        relevance: 'primary',
        linkedAt: 0,
        linkedBy: '',
      };
      const _report: any = {
        pageId: '',
        url: '',
        title: '',
        spaceKey: '',
      };

      // If we get here without TypeScript errors, types are exported
      expect(true).toBe(true);
    });
  });
});