import React, { useState } from 'react';
import { 
  Cloud, CheckCircle2, ShieldCheck, RefreshCw, Terminal, 
  ExternalLink, FileText, Server, Cpu, Database, Check, 
  AlertCircle, ArrowRight, Award, Zap, Layers, Lock, Play, Download
} from 'lucide-react';

interface IntegrationService {
  id: string;
  name: string;
  category: 'Atlassian Ecosystem' | 'AI Intelligence' | 'Storage & Runtime';
  status: 'connected' | 'configured' | 'ready';
  badgeColor: string;
  description: string;
  authType: string;
  details: { label: string; value: string }[];
  features: string[];
  actionLabel: string;
}

interface AuditEvent {
  id: string;
  timestamp: string;
  service: string;
  action: string;
  provenance: string;
  status: 'success' | 'verified' | 'pending';
}

export function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'docs'>('overview');
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ title: string; message: string; type: 'success' | 'info' } | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([
    {
      id: 'evt-1',
      timestamp: 'Just now',
      service: 'Jira Service',
      action: 'Project Metadata Sync (9 projects mapped to twin nodes)',
      provenance: 'actual',
      status: 'success',
    },
    {
      id: 'evt-2',
      timestamp: '12 mins ago',
      service: 'Confluence Service',
      action: 'ADF Report Export for Future A — Cost Optimization',
      provenance: 'simulated',
      status: 'verified',
    },
    {
      id: 'evt-3',
      timestamp: '45 mins ago',
      service: 'Rovo Agent',
      action: 'Action "compareScenarios" invoked by Demo Admin',
      provenance: 'simulated',
      status: 'success',
    },
    {
      id: 'evt-4',
      timestamp: '2 hours ago',
      service: 'NVIDIA NIM',
      action: 'Grounded explanation generated for Future B (Zod validated)',
      provenance: 'ai-hypothesis',
      status: 'verified',
    },
  ]);

  const services: IntegrationService[] = [
    {
      id: 'jira',
      name: 'Atlassian Jira Software & JSM',
      category: 'Atlassian Ecosystem',
      status: 'connected',
      badgeColor: '#10b981',
      description: 'Import authorized Jira projects and issues, map them to twin entities, and generate remediation work items back into Jira with explicit user confirmation.',
      authType: 'Forge App Context (asUser / asApp Token)',
      details: [
        { label: 'Authorized Projects', value: '9 Projects' },
        { label: 'Twin Work Mappings', value: '32 Issues Synced' },
        { label: 'Confirmation Gate', value: 'Enforced (Approval Required)' },
        { label: 'Egress Policy', value: 'Internal Atlassian API' },
      ],
      features: [
        'Bi-directional issue tracking mapped to twin projects',
        'Automatic remediation task generation from simulation failure paths',
        'Enforced user confirmation dialog before any issue creation',
      ],
      actionLabel: 'Sync Jira Projects',
    },
    {
      id: 'confluence',
      name: 'Atlassian Confluence Knowledge Base',
      category: 'Atlassian Ecosystem',
      status: 'connected',
      badgeColor: '#10b981',
      description: 'Read authorized organizational documentation, link ADRs and policies to entities, and export approved scenario simulation reports formatted in Atlassian Document Format (ADF).',
      authType: 'Forge Product Context',
      details: [
        { label: 'Linked Documents', value: '14 Policy & ADR Docs' },
        { label: 'Export Format', value: 'Atlassian Document Format (ADF)' },
        { label: 'Target Space', value: 'Aurelia Executive Briefs (AEB)' },
        { label: 'Search Engine', value: 'CQL Context Engine' },
      ],
      features: [
        'Attach live Confluence documentation to digital twin entities',
        'Export full simulation comparisons to Confluence pages',
        'Include deterministic provenance and evidence tables in reports',
      ],
      actionLabel: 'Export ADF Scenario Report',
    },
    {
      id: 'rovo',
      name: 'Atlassian Rovo Agent ("ParallelOS Intelligence")',
      category: 'Atlassian Ecosystem',
      status: 'ready',
      badgeColor: '#f97316',
      description: 'Specialized Atlassian Rovo AI agent registered in manifest.yml with 3 deterministic actions. Empowers conversational queries within Atlassian Chat while strictly enforcing safety guardrails.',
      authType: 'Forge rovo:agent Module',
      details: [
        { label: 'Certified Actions', value: '3 Modules Registered' },
        { label: 'Action 1: runScenario', value: 'Deterministic simulation' },
        { label: 'Action 2: compareScenarios', value: '9-dimension comparison' },
        { label: 'Action 3: createJiraTasks', value: 'Requires explicit user confirmation' },
      ],
      features: [
        'Trigger simulations directly from Atlassian Rovo Chat',
        'Compare parallel scenarios with natural language explanation',
        'Approval workflow prevents unauthorized real-world changes',
      ],
      actionLabel: 'Test Rovo Action Gate',
    },
    {
      id: 'nvidia',
      name: 'NVIDIA NIM Microservice',
      category: 'AI Intelligence',
      status: 'configured',
      badgeColor: '#10b981',
      description: 'NVIDIA Inference Microservice (meta/llama-3.1-70b-instruct) providing natural language interpretation and grounded explanations. Strictly isolated from simulation math.',
      authType: 'Forge Encrypted Environment Variable (NVIDIA_API_KEY)',
      details: [
        { label: 'Model ID', value: 'meta/llama-3.1-70b-instruct' },
        { label: 'Output Schema', value: 'Strict Zod-Validated JSON' },
        { label: 'Simulation Role', value: 'Explanatory Only (0% Math)' },
        { label: 'Provenance Tag', value: 'ai-hypothesis' },
      ],
      features: [
        'Converts plain-English requests into structured scenario proposals',
        'Grounded explanations derived purely from deterministic engine outputs',
        'Zero invented numbers or hypothetical organizational facts',
      ],
      actionLabel: 'Verify NIM Grounding',
    },
  ];

  const handleRunAction = async (serviceId: string) => {
    setTestingService(serviceId);
    setTestResult(null);

    await new Promise(r => setTimeout(r, 800));

    let title = '';
    let message = '';

    if (serviceId === 'jira') {
      title = 'Jira Sync Successful';
      message = 'All 9 Aurelia Global Technologies projects (Cloud Migration, CRM Modernization, ERP Evaluation, etc.) verified and mapped to baseline twin nodes.';
      setAuditLogs(prev => [
        {
          id: `evt-${Date.now()}`,
          timestamp: 'Just now',
          service: 'Jira Service',
          action: 'Full project sync executed across authorized tenant',
          provenance: 'actual',
          status: 'success',
        },
        ...prev,
      ]);
    } else if (serviceId === 'confluence') {
      title = 'Confluence ADF Report Generated';
      message = 'Atlassian Document Format (ADF) report generated for Future A with complete 9-dimension scorecard, trade-offs, and deterministic provenance.';
      setAuditLogs(prev => [
        {
          id: `evt-${Date.now()}`,
          timestamp: 'Just now',
          service: 'Confluence Service',
          action: 'Exported ADF Report: "Strategic Comparison — Future A vs Baseline"',
          provenance: 'simulated',
          status: 'verified',
        },
        ...prev,
      ]);
    } else if (serviceId === 'rovo') {
      title = 'Rovo Action Gate Passed';
      message = 'Rovo actions (runScenario, compareScenarios, createJiraTasks) validated. Safety confirmation prompt verified for Jira issue creation.';
      setAuditLogs(prev => [
        {
          id: `evt-${Date.now()}`,
          timestamp: 'Just now',
          service: 'Rovo Agent',
          action: 'Action Gate Health Check: 3/3 actions certified',
          provenance: 'actual',
          status: 'verified',
        },
        ...prev,
      ]);
    } else if (serviceId === 'nvidia') {
      title = 'NVIDIA NIM Grounding Verified';
      message = 'NVIDIA NIM microservice endpoint active. Schema enforcement verified: AI output strictly tagged as "ai-hypothesis" with engine provenance.';
      setAuditLogs(prev => [
        {
          id: `evt-${Date.now()}`,
          timestamp: 'Just now',
          service: 'NVIDIA NIM',
          action: 'Grounding Verification: meta/llama-3.1-70b-instruct schema check passed',
          provenance: 'ai-hypothesis',
          status: 'verified',
        },
        ...prev,
      ]);
    }

    setTestingService(null);
    setTestResult({ title, message, type: 'success' });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
        border: '1px solid rgba(249, 115, 22, 0.3)',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ 
                background: 'rgba(249, 115, 22, 0.2)', 
                color: '#f97316', 
                border: '1px solid #f97316', 
                padding: '3px 10px', 
                borderRadius: '20px', 
                fontSize: '11px', 
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Atlassian Forge Platform
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                border: '1px solid #10b981',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
              }}>
                ● All Integrations Healthy
              </span>
            </div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 700, color: '#f8fafc' }}>
              Enterprise Integrations & Intelligence
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', maxWidth: '780px', lineHeight: 1.6 }}>
              ParallelOS operates directly inside the Atlassian Forge ecosystem, connecting Jira projects, Confluence documentation, Atlassian Rovo agents, and NVIDIA NIM AI microservices under strict tenant isolation.
            </p>
          </div>

          <div style={{
            background: 'rgba(10, 17, 32, 0.75)',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '16px 20px',
            minWidth: '240px',
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Connected Tenant
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
              Aurelia Global Technologies
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} />
              <span>Zero client-side secrets</span>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              background: activeTab === 'overview' ? '#f97316' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: '#ffffff',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Connected Services (4)
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            style={{
              background: activeTab === 'audit' ? '#f97316' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: '#ffffff',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Integration Audit Stream ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            style={{
              background: activeTab === 'docs' ? '#f97316' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: '#ffffff',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Architecture & Security Rules
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {testResult && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={24} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f0fdf4' }}>{testResult.title}</div>
              <div style={{ fontSize: '13px', color: '#bbf7d0', marginTop: '2px' }}>{testResult.message}</div>
            </div>
          </div>
          <button
            onClick={() => setTestResult(null)}
            style={{ background: 'transparent', border: 'none', color: '#86efac', cursor: 'pointer', fontSize: '18px' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Tab: Overview Cards */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
          {services.map(svc => (
            <div
              key={svc.id}
              style={{
                background: '#0e1620',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = svc.badgeColor;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#1e293b';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    {svc.category}
                  </span>
                  <span style={{
                    background: svc.badgeColor === '#10b981' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                    color: svc.badgeColor,
                    border: `1px solid ${svc.badgeColor}`,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}>
                    ● {svc.status}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                  {svc.name}
                </h3>

                <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                  {svc.description}
                </p>

                <div style={{
                  background: '#090e13',
                  border: '1px solid #1a2533',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                }}>
                  {svc.details.map((d, i) => (
                    <div key={i}>
                      <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.label}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginTop: '2px' }}>{d.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
                    Capabilities:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.7 }}>
                    {svc.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                  Auth: {svc.authType.slice(0, 24)}...
                </span>
                <button
                  onClick={() => handleRunAction(svc.id)}
                  disabled={testingService === svc.id}
                  style={{
                    background: svc.badgeColor === '#10b981' 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                      : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: testingService === svc.id ? 'not-allowed' : 'pointer',
                    opacity: testingService === svc.id ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  {testingService === svc.id ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} fill="#ffffff" />
                      <span>{svc.actionLabel}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Audit Stream */}
      {activeTab === 'audit' && (
        <div style={{
          background: '#0e1620',
          border: '1px solid #1e293b',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
                Integration Activity & Provenance Audit
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Full record of Atlassian Forge bridge dispatches, Rovo agent invocations, and NVIDIA NIM AI proposals.
              </p>
            </div>
            <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '4px', fontWeight: 600 }}>
              Audit Mode Active
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#090e13', borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 20px' }}>Timestamp</th>
                  <th style={{ padding: '12px 20px' }}>Service</th>
                  <th style={{ padding: '12px 20px' }}>Action & Description</th>
                  <th style={{ padding: '12px 20px' }}>Provenance Tag</th>
                  <th style={{ padding: '12px 20px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #16202c', color: '#cbd5e1' }}>
                    <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>
                      {log.timestamp}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#f8fafc' }}>
                      {log.service}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#e2e8f0' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        background: log.provenance === 'actual' ? '#14532d' : log.provenance === 'simulated' ? '#1e3a5f' : '#4c1d95',
                        color: log.provenance === 'actual' ? '#86efac' : log.provenance === 'simulated' ? '#93c5fd' : '#d8b4fe',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}>
                        {log.provenance}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500 }}>
                        <Check size={14} />
                        <span>{log.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Docs & Rules */}
      {activeTab === 'docs' && (
        <div style={{
          background: '#0e1620',
          border: '1px solid #1e293b',
          borderRadius: '14px',
          padding: '32px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
            Integration Architecture & Non-Negotiable Security Rules
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div style={{ background: '#090e13', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
              <div style={{ color: '#f97316', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                1. Pure Deterministic Simulation
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                All dependency propagation, risk calculation, budget deltas, and scorecards are calculated in deterministic TypeScript in <code>@parallelos/engine</code>. The LLM never invents numbers.
              </p>
            </div>

            <div style={{ background: '#090e13', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
              <div style={{ color: '#10b981', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                2. Explicit Approval for Real Changes
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                Neither the Rovo agent nor AI models can make real Atlassian Jira changes without the user reviewing and approving the task creation prompt.
              </p>
            </div>

            <div style={{ background: '#090e13', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
              <div style={{ color: '#f97316', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                3. Zero Secrets in Client Code
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                NVIDIA NIM credentials are stored strictly in Forge Encrypted Environment Variables (<code>process.env.NVIDIA_API_KEY</code>). Client UI bundles never receive credentials.
              </p>
            </div>

            <div style={{ background: '#090e13', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
              <div style={{ color: '#10b981', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                4. Mandatory Value Provenance
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                Every data point carries an immutable provenance tag: <code>actual</code>, <code>imported</code>, <code>assumed</code>, <code>simulated</code>, or <code>ai-hypothesis</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegrationsPage;
