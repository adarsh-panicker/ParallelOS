import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@forge/bridge';
import {
  GitBranch, Plus, Trash2, Edit, Play, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Search, Filter, Download, Settings,
  HelpCircle, Info, X, Check, Loader2, Zap, BarChart2
} from 'lucide-react';
import { DecisionType, EntityId } from '@parallelos/engine';
import styles from './styles/ScenarioLab.module.css';

interface ScenarioSummary {
  id: string;
  name: string;
  description: string;
  parentScenarioId?: string;
  baselineVersion: string;
  assumptionCount: number;
  entityOverrideCount: number;
  relationshipOverrideCount: number;
  decisionCount: number;
  hasSimulationResults: boolean;
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'active' | 'archived';
}

interface ScenarioFormData {
  name: string;
  description: string;
  parentScenarioId?: string;
}

const DECISION_TYPES: { type: DecisionType; label: string; description: string; params: string[] }[] = [
  { type: DecisionType.BudgetChange, label: 'Budget Change', description: 'Modify a budget by percentage', params: ['budgetId', 'percentChange'] },
  { type: DecisionType.AddLocation, label: 'Add Location', description: 'Add a new office/location', params: ['name', 'address', 'timezone', 'capacity'] },
  { type: DecisionType.ReplaceSystem, label: 'Replace System', description: 'Replace a business system', params: ['currentSystemId', 'newSystemName', 'newSystemVendorId', 'migrationDurationDays'] },
  { type: DecisionType.SystemOutage, label: 'System Outage', description: 'Simulate a system outage', params: ['systemId', 'durationHours'] },
  { type: DecisionType.RestructureDepartment, label: 'Restructure Department', description: 'Restructure a department', params: ['departmentId'] },
  { type: DecisionType.ReallocateResources, label: 'Reallocate Resources', description: 'Move resources between entities', params: ['fromResourceId', 'toResourceId', 'amount'] },
];

export function ScenarioLab() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioSummary | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDecisionBuilder, setShowDecisionBuilder] = useState(false);
  const [formData, setFormData] = useState<ScenarioFormData>({ name: '', description: '', parentScenarioId: undefined });
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created'>('updated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const demoScenarios: ScenarioSummary[] = [
    {
      id: 'scenario-baseline',
      name: 'Baseline (Current State)',
      description: 'Aurelia Global Technologies - Current organizational state',
      baselineVersion: 'baseline-v1',
      assumptionCount: 0,
      entityOverrideCount: 0,
      relationshipOverrideCount: 0,
      decisionCount: 0,
      hasSimulationResults: false,
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now() - 86400000 * 2,
      status: 'active',
    },
    {
      id: 'scenario-a',
      name: 'Future A \u2014 Cost Optimization',
      description: 'Cut operating expenditure by 15% through budget reductions and resource optimization',
      parentScenarioId: 'scenario-baseline',
      baselineVersion: 'baseline-v1',
      assumptionCount: 5,
      entityOverrideCount: 12,
      relationshipOverrideCount: 3,
      decisionCount: 2,
      hasSimulationResults: true,
      createdAt: Date.now() - 86400000 * 10,
      updatedAt: Date.now() - 86400000 * 1,
      status: 'active',
    },
    {
      id: 'scenario-b',
      name: 'Future B \u2014 Global Expansion',
      description: 'Add London and Singapore locations with new departments, employees, and infrastructure',
      parentScenarioId: 'scenario-baseline',
      baselineVersion: 'baseline-v1',
      assumptionCount: 8,
      entityOverrideCount: 24,
      relationshipOverrideCount: 7,
      decisionCount: 4,
      hasSimulationResults: true,
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 0.5,
      status: 'draft',
    },
    {
      id: 'scenario-c',
      name: 'Future C \u2014 Tech Transformation',
      description: 'Replace legacy ERP system with modern cloud-native platform',
      parentScenarioId: 'scenario-baseline',
      baselineVersion: 'baseline-v1',
      assumptionCount: 6,
      entityOverrideCount: 18,
      relationshipOverrideCount: 5,
      decisionCount: 3,
      hasSimulationResults: true,
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 3600000,
      status: 'draft',
    },
  ];

  const loadScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 500));
      setScenarios(demoScenarios);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  const filteredScenarios = scenarios
    .filter(s => {
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !s.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === 'name') { aVal = a.name; bVal = b.name; }
      else if (sortBy === 'updated') { aVal = a.updatedAt; bVal = b.updatedAt; }
      else { aVal = a.createdAt; bVal = b.createdAt; }
      return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      const newScenario: ScenarioSummary = {
        id: `scenario-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        parentScenarioId: formData.parentScenarioId,
        baselineVersion: 'baseline-v1',
        assumptionCount: 0,
        entityOverrideCount: 0,
        relationshipOverrideCount: 0,
        decisionCount: 0,
        hasSimulationResults: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'draft',
      };
      setScenarios(prev => [newScenario, ...prev]);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', parentScenarioId: undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scenario');
    } finally {
      setCreating(false);
    }
  };

  const handleRunSimulation = async (scenarioId: string) => {
    setSelectedScenario(s => s?.id === scenarioId ? { ...s!, hasSimulationResults: true } : s);
  };

  const handleDelete = async (scenarioId: string) => {
    if (!window.confirm('Delete this scenario? This cannot be undone.')) return;
    try {
      setScenarios(prev => prev.filter(s => s.id !== scenarioId));
      if (selectedScenario?.id === scenarioId) setSelectedScenario(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete scenario');
    }
  };

  const getStatusBadge = (status: string) => (
    <span className={`${styles.statusBadge} ${status}`}>{status}</span>
  );

  const statusColors = {
    draft: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    active: { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
    archived: { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' },
  };

  return (
    <div className={styles.scenarioLab} role="main" aria-label="Scenario Lab">
      <div className={styles.pageHeader}>
        <div className="header-content">
          <h1>
            <GitBranch size={28} />
            Scenario Lab
          </h1>
          <p>Create, manage, and simulate parallel organizational futures</p>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> New Scenario
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.searchFilter}>
          <label htmlFor="scenario-search" className="visually-hidden">Search scenarios</label>
          <div className={styles.searchInputWrapper}>
            <Search size={18} />
            <input
              id="scenario-search"
              type="search"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <div className={styles.sortControls}>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              aria-label="Sort by"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Created Date</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              aria-label={sortDir === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              {sortDir === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        <div className={styles.scenarioStats}>
          <span>{scenarios.filter(s => s.status === 'active').length} active</span>
          <span>{scenarios.filter(s => s.status === 'draft').length} draft</span>
          <span>{scenarios.filter(s => s.hasSimulationResults).length} simulated</span>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.searchFilter}>
          <label htmlFor="scenario-search" className="visually-hidden">Search scenarios</label>
          <div className={styles.searchInputWrapper}>
            <Search size={18} />
            <input
              id="scenario-search"
              type="search"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <div className={styles.sortControls}>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              aria-label="Sort by"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Created Date</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              aria-label={sortDir === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              {sortDir === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        <div className={styles.scenarioStats}>
          <span>{scenarios.filter(s => s.status === 'active').length} active</span>
          <span>{scenarios.filter(s => s.status === 'draft').length} draft</span>
          <span>{scenarios.filter(s => s.hasSimulationResults).length} simulated</span>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.searchFilter}>
          <label htmlFor="scenario-search" className="visually-hidden">Search scenarios</label>
          <div className={styles.searchInputWrapper}>
            <Search size={18} />
            <input
              id="scenario-search"
              type="search"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <div className={styles.sortControls}>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              aria-label="Sort by"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Created Date</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              aria-label={sortDir === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              {sortDir === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        <div className={styles.scenarioStats}>
          <span>{scenarios.filter(s => s.status === 'active').length} active</span>
          <span>{scenarios.filter(s => s.status === 'draft').length} draft</span>
          <span>{scenarios.filter(s => s.hasSimulationResults).length} simulated</span>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState} role="status" aria-label="Loading scenarios">
          <Loader2 className={styles.spin} size={32} />
          <p>Loading scenarios...</p>
        </div>
      ) : filteredScenarios.length === 0 ? (
        <div className={styles.emptyState}>
          <GitBranch size={64} />
          <h2>No scenarios found</h2>
          <p>{searchQuery || statusFilter !== 'all' 
            ? 'Try adjusting your search or filters'
            : 'Create your first parallel scenario to explore organizational futures'}</p>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> Create First Scenario
          </button>
        </div>
      ) : (
        <div className={styles.scenarioGrid} role="list" aria-label="Scenarios">
          {filteredScenarios.map(scenario => {
            const colors = statusColors[scenario.status];
            return (
              <article
                key={scenario.id}
                className={styles.scenarioCard}
                role="listitem"
                aria-selected={selectedScenario?.id === scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                style={{ borderColor: colors.border }}
              >
                <div className={styles.cardHeader}>
                  <div className="scenario-info">
                    <h3>{scenario.name}</h3>
                    <p>{scenario.description}</p>
                  </div>
                  <div style={{ background: colors.bg, color: colors.text }}>
                    {getStatusBadge(scenario.status)}
                  </div>
                </div>
                <div className={styles.scenarioMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Version</span>
                    <span className={styles.metaValue}>{scenario.baselineVersion}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Assumptions</span>
                    <span className={styles.metaValue}>{scenario.assumptionCount}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Overrides</span>
                    <span className={styles.metaValue}>{scenario.entityOverrideCount + scenario.relationshipOverrideCount}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Decisions</span>
                    <span className={styles.metaValue}>{scenario.decisionCount}</span>
                  </div>
                </div>
                <div className={styles.scenarioActions}>
                  {scenario.id !== 'scenario-baseline' && (
                    <>
                      <button
                        className={styles.iconBtn}
                        onClick={e => { e.stopPropagation(); setSelectedScenario(scenario); setShowEditModal(true); }}
                        aria-label={`Edit ${scenario.name}`}
                      >
                        <Edit size={16} />
                      </button>
                      {scenario.hasSimulationResults && (
                        <button
                          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                          onClick={e => { e.stopPropagation(); handleRunSimulation(scenario.id); }}
                        >
                          <Zap size={14} /> Re-run
                        </button>
                      )}
                      <button
                        className={`${styles.iconBtn} ${styles.danger}`}
                        onClick={e => { e.stopPropagation(); handleDelete(scenario.id); }}
                        aria-label={`Delete ${scenario.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  {scenario.id === 'scenario-baseline' && (
                    <span className={styles.baselineBadge} title="Baseline scenario cannot be modified">
                      <Info size={14} /> Baseline
                    </span>
                  )}
                </div>
                {scenario.hasSimulationResults && (
                  <div className={styles.simulationIndicator}>
                    <Zap size={12} style={{ color: '#22c55e' }} />
                    <span>Simulation results available</span>
                    <BarChart2 size={12} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {(showCreateModal || showEditModal) && (
        <div className={styles.modalOverlay} onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <header className={styles.modalHeader}>
              <h2 id="modal-title">{showCreateModal ? 'Create New Scenario' : 'Edit Scenario'}</h2>
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} aria-label="Close">
                <X size={20} />
              </button>
            </header>
            <form onSubmit={handleCreate}>
              <div className={styles.formGroup}>
                <label htmlFor="scenario-name">Name *</label>
                <input
                  id="scenario-name"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g., Future D \u2014 Market Expansion"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="scenario-description">Description</label>
                <textarea
                  id="scenario-description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Describe the organizational future this scenario explores..."
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="parent-scenario">Parent Scenario</label>
                <select
                  id="parent-scenario"
                  value={formData.parentScenarioId || ''}
                  onChange={e => setFormData(prev => ({ ...prev, parentScenarioId: e.target.value || undefined }))}
                >
                  <option value="">None (baseline)</option>
                  {scenarios.filter(s => s.id !== 'scenario-baseline').map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <footer className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
                  Cancel
                </button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={creating}>
                  {creating ? <Loader2 className={styles.spin} size={16} /> : (showCreateModal ? 'Create Scenario' : 'Save Changes')}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {selectedScenario && (
        <div className={styles.detailPanel} role="complementary" aria-label="Scenario details">
          <header className={styles.panelHeader}>
            <h3>{selectedScenario.name}</h3>
            <button onClick={() => setSelectedScenario(null)} aria-label="Close panel">
              <X size={20} />
            </button>
          </header>
          <div className={styles.panelContent}>
            <section className={styles.detailSection}>
              <h4>Description</h4>
              <p>{selectedScenario.description}</p>
            </section>
            <section className={styles.detailSection}>
              <h4>Properties</h4>
              <dl className={styles.propertyList}>
                <div><dt>ID</dt><dd>{selectedScenario.id}</dd></div>
                <div><dt>Status</dt><dd>{getStatusBadge(selectedScenario.status)}</dd></div>
                <div><dt>Baseline Version</dt><dd>{selectedScenario.baselineVersion}</dd></div>
                <div><dt>Parent</dt><dd>{selectedScenario.parentScenarioId || 'Baseline'}</dd></div>
                <div><dt>Created</dt><dd>{new Date(selectedScenario.createdAt).toLocaleString()}</dd></div>
                <div><dt>Updated</dt><dd>{new Date(selectedScenario.updatedAt).toLocaleString()}</dd></div>
              </dl>
            </section>
            <section className={styles.detailSection}>
              <h4>Composition</h4>
              <div className={styles.statGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{selectedScenario.assumptionCount}</span>
                  <span className={styles.statLabel}>Assumptions</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{selectedScenario.entityOverrideCount}</span>
                  <span className={styles.statLabel}>Entity Overrides</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{selectedScenario.relationshipOverrideCount}</span>
                  <span className={styles.statLabel}>Relationship Overrides</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{selectedScenario.decisionCount}</span>
                  <span className={styles.statLabel}>Decisions</span>
                </div>
              </div>
            </section>
            {selectedScenario.id !== 'scenario-baseline' && (
              <section className={`${styles.detailSection} ${styles.actions}`}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleRunSimulation(selectedScenario.id)}>
                  <Zap size={18} /> Run Simulation
                </button>
                <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => { setShowEditModal(true); }}>
                  <Edit size={18} /> Edit Scenario
                </button>
              </section>
            )}
            <section className={styles.detailSection}>
              <h4>Available Decision Types</h4>
              <div className={styles.decisionTypes}>
                {DECISION_TYPES.map(dt => (
                  <div key={dt.type} className={styles.decisionTypeCard}>
                    <strong>{dt.label}</strong>
                    <span>{dt.description}</span>
                    <small>Params: {dt.params.join(', ')}</small>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScenarioLab;