import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@forge/bridge';
import {
  History, RotateCcw, Download, Trash2, Eye, Zap, BarChart2,
  Filter, Search, ChevronDown, ChevronUp, Calendar, Clock,
  AlertTriangle, X, Loader2
} from 'lucide-react';

interface SimulationHistoryEntry {
  id: string;
  scenarioId: string;
  scenarioName: string;
  decisions: { type: string; description: string }[];
  affectedEntitiesCount: number;
  budgetDeltaTotal: number;
  projectImpactsCount: number;
  processDisruptionsCount: number;
  resourceShortagesCount: number;
  executionTimeMs: number;
  deterministic: boolean;
  executedAt: number;
  status: 'completed' | 'failed' | 'running';
}

export function SimulationHistory() {
  const [history, setHistory] = useState<SimulationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<SimulationHistoryEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'running'>('all');
  const [sortBy, setSortBy] = useState<'executedAt' | 'executionTimeMs' | 'affectedEntitiesCount'>('executedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const demoHistory: SimulationHistoryEntry[] = [
    {
      id: 'sim-1',
      scenarioId: 'scenario-a',
      scenarioName: 'Future A \u2014 Cost Optimization',
      decisions: [
        { type: 'budget_change', description: 'Reduce engineering budget by 15%' },
        { type: 'restructure_department', description: 'Consolidate marketing and sales operations' },
      ],
      affectedEntitiesCount: 27,
      budgetDeltaTotal: -1200000,
      projectImpactsCount: 3,
      processDisruptionsCount: 2,
      resourceShortagesCount: 1,
      executionTimeMs: 145,
      deterministic: true,
      executedAt: Date.now() - 3600000,
      status: 'completed',
    },
    {
      id: 'sim-2',
      scenarioId: 'scenario-b',
      scenarioName: 'Future B \u2014 Global Expansion',
      decisions: [
        { type: 'add_location', description: 'Add London office (200 capacity)' },
        { type: 'add_location', description: 'Add Singapore office (150 capacity)' },
        { type: 'budget_change', description: 'Increase operations budget by 25%' },
        { type: 'reallocate_resources', description: 'Move compute resources to new locations' },
      ],
      affectedEntitiesCount: 42,
      budgetDeltaTotal: 5750000,
      projectImpactsCount: 2,
      processDisruptionsCount: 1,
      resourceShortagesCount: 0,
      executionTimeMs: 287,
      deterministic: true,
      executedAt: Date.now() - 7200000,
      status: 'completed',
    },
    {
      id: 'sim-3',
      scenarioId: 'scenario-c',
      scenarioName: 'Future C \u2014 Tech Transformation',
      decisions: [
        { type: 'replace_system', description: 'Replace legacy ERP with cloud-native platform' },
        { type: 'system_outage', description: 'Simulate 4-hour migration outage' },
        { type: 'reallocate_resources', description: 'Reallocate senior engineers to migration' },
      ],
      affectedEntitiesCount: 35,
      budgetDeltaTotal: 2300000,
      projectImpactsCount: 4,
      processDisruptionsCount: 3,
      resourceShortagesCount: 2,
      executionTimeMs: 412,
      deterministic: false,
      executedAt: Date.now() - 10800000,
      status: 'completed',
    },
    {
      id: 'sim-4',
      scenarioId: 'scenario-a',
      scenarioName: 'Future A \u2014 Cost Optimization (Re-run)',
      decisions: [
        { type: 'budget_change', description: 'Reduce engineering budget by 15%' },
      ],
      affectedEntitiesCount: 18,
      budgetDeltaTotal: -1200000,
      projectImpactsCount: 2,
      processDisruptionsCount: 1,
      resourceShortagesCount: 1,
      executionTimeMs: 98,
      deterministic: true,
      executedAt: Date.now() - 14400000,
      status: 'completed',
    },
    {
      id: 'sim-5',
      scenarioId: 'scenario-test',
      scenarioName: 'Test Scenario',
      decisions: [
        { type: 'system_outage', description: 'Simulate 24-hour core system outage' },
      ],
      affectedEntitiesCount: 0,
      budgetDeltaTotal: 0,
      projectImpactsCount: 0,
      processDisruptionsCount: 0,
      resourceShortagesCount: 0,
      executionTimeMs: 0,
      deterministic: false,
      executedAt: Date.now() - 18000000,
      status: 'failed',
    },
  ];

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 300));
      setHistory(demoHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredHistory = history
    .filter(h => {
      if (searchQuery && !h.scenarioName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter !== 'all' && h.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === 'executedAt') { aVal = a.executedAt; bVal = b.executedAt; }
      else if (sortBy === 'executionTimeMs') { aVal = a.executionTimeMs; bVal = b.executionTimeMs; }
      else { aVal = a.affectedEntitiesCount; bVal = b.affectedEntitiesCount; }
      return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
      failed: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
      running: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    };
    const c = colors[status as keyof typeof colors] || colors.completed;
    return (
      <span className="status-badge" style={{ background: c.bg, color: c.text, borderColor: c.border }}>
        {status}
      </span>
    );
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="history-page" role="main" aria-label="Simulation History">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <History size={28} />
            Simulation History
          </h1>
          <p>View and re-run past simulation executions</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={loadHistory}>
            <RotateCcw size={18} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="toolbar">
        <div className="search-filter">
          <label htmlFor="history-search" className="visually-hidden">Search history</label>
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              id="history-search"
              type="search"
              placeholder="Search by scenario name..."
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
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
          </select>
          <div className="sort-controls">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              aria-label="Sort by"
            >
              <option value="executedAt">Execution Time</option>
              <option value="executionTimeMs">Duration</option>
              <option value="affectedEntitiesCount">Entities Affected</option>
            </select>
            <button
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              aria-label={sortDir === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              {sortDir === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        <div className="history-stats">
          <span>{history.filter(h => h.status === 'completed').length} completed</span>
          <span>{history.filter(h => h.status === 'failed').length} failed</span>
          <span>Total: {history.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state" role="status" aria-label="Loading history">
          <Loader2 className="spin" size={32} />
          <p>Loading simulation history...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="empty-state">
          <History size={64} />
          <h2>No simulation history</h2>
          <p>Run your first simulation from the Scenario Lab or Compare Futures</p>
        </div>
      ) : (
        <div className="history-table-container">
          <table className="history-table" role="table">
            <thead>
              <tr>
                <th scope="col">Scenario</th>
                <th scope="col">Status</th>
                <th scope="col">Decisions</th>
                <th scope="col">Entities Affected</th>
                <th scope="col">Budget Impact</th>
                <th scope="col">Duration</th>
                <th scope="col">Deterministic</th>
                <th scope="col">Executed</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map(entry => (
                <tr key={entry.id}>
                  <td>
                    <div className="scenario-cell">
                      <strong>{entry.scenarioName}</strong>
                      <span className="scenario-id">{entry.scenarioId}</span>
                    </div>
                  </td>
                  <td>{getStatusBadge(entry.status)}</td>
                  <td>
                    <span className="decision-count">{entry.decisions.length} decision{entry.decisions.length !== 1 ? 's' : ''}</span>
                  </td>
                  <td>{entry.affectedEntitiesCount.toLocaleString()}</td>
                  <td className={entry.budgetDeltaTotal >= 0 ? 'positive' : 'negative'}>
                    {entry.budgetDeltaTotal >= 0 ? '+' : ''}{(entry.budgetDeltaTotal / 1e6).toFixed(1)}M
                  </td>
                  <td>{formatDuration(entry.executionTimeMs)}</td>
                  <td>
                    <span className={entry.deterministic ? 'deterministic-yes' : 'deterministic-no'}>
                      {entry.deterministic ? 'Yes' : 'Partial'}
                    </span>
                  </td>
                  <td>{formatDate(entry.executedAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="icon-btn" aria-label="View details" onClick={() => setSelectedEntry(entry)}>
                        <Eye size={16} />
                      </button>
                      <button className="icon-btn" aria-label="Re-run simulation">
                        <RotateCcw size={16} />
                      </button>
                      <button className="icon-btn" aria-label="Download results">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedEntry && (
        <div className="modal-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="detail-title">
            <header className="modal-header">
              <h2 id="detail-title">Simulation Details</h2>
              <button onClick={() => setSelectedEntry(null)} aria-label="Close">
                <X size={20} />
              </button>
            </header>
            <div className="modal-content">
              <section className="detail-section">
                <h3>Overview</h3>
                <dl className="detail-grid">
                  <div><dt>Simulation ID</dt><dd>{selectedEntry.id}</dd></div>
                  <div><dt>Scenario</dt><dd>{selectedEntry.scenarioName}</dd></div>
                  <div><dt>Status</dt><dd>{getStatusBadge(selectedEntry.status)}</dd></div>
                  <div><dt>Deterministic</dt><dd>{selectedEntry.deterministic ? 'Yes' : 'Partial (estimated values used)'}</dd></div>
                  <div><dt>Executed</dt><dd>{formatDate(selectedEntry.executedAt)}</dd></div>
                  <div><dt>Duration</dt><dd>{formatDuration(selectedEntry.executionTimeMs)}</dd></div>
                </dl>
              </section>
              <section className="detail-section">
                <h3>Decisions Applied</h3>
                <ul className="decision-list">
                  {selectedEntry.decisions.map((d, i) => (
                    <li key={i}>
                      <strong>{d.type.replace('_', ' ')}</strong>: {d.description}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="detail-section">
                <h3>Impact Summary</h3>
                <div className="impact-grid">
                  <div className="impact-card">
                    <Zap size={24} style={{ color: '#22c55e' }} />
                    <div>
                      <div className="impact-value">{selectedEntry.affectedEntitiesCount}</div>
                      <div className="impact-label">Entities Affected</div>
                    </div>
                  </div>
                  <div className="impact-card">
                    <BarChart2 size={24} style={{ color: '#3b82f6' }} />
                    <div>
                      <div className="impact-value">{selectedEntry.budgetDeltaTotal >= 0 ? '+' : ''}{(selectedEntry.budgetDeltaTotal / 1e6).toFixed(1)}M</div>
                      <div className="impact-label">Budget Impact</div>
                    </div>
                  </div>
                  <div className="impact-card">
                    <Zap size={24} style={{ color: '#f59e0b' }} />
                    <div>
                      <div className="impact-value">{selectedEntry.projectImpactsCount}</div>
                      <div className="impact-label">Projects Impacted</div>
                    </div>
                  </div>
                  <div className="impact-card">
                    <Zap size={24} style={{ color: '#ef4444' }} />
                    <div>
                      <div className="impact-value">{selectedEntry.processDisruptionsCount}</div>
                      <div className="impact-label">Process Disruptions</div>
                    </div>
                  </div>
                  <div className="impact-card">
                    <Zap size={24} style={{ color: '#06b6d4' }} />
                    <div>
                      <div className="impact-value">{selectedEntry.resourceShortagesCount}</div>
                      <div className="impact-label">Resource Shortages</div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <footer className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedEntry(null)}>Close</button>
            </footer>
          </div>
        </div>
      )}

      
    </div>
  );
}

export default SimulationHistory;