import React, { useState, useMemo, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import {
  GitBranch, SlidersHorizontal, RefreshCw, ChevronLeft, ChevronRight,
  Minus, Plus, TrendingUp, TrendingDown, Minimize2, Maximize2,
  AlertTriangle, CheckCircle, AlertCircle, Info, ArrowUpRight, ArrowDownRight,
  BarChart2, DollarSign, Zap, Shield, RotateCcw, Cpu, Network, FileText,
  Settings, MoreHorizontal, Eye, EyeOff, Download, Share2
} from 'lucide-react';
import styles from './CompareFutures.module.css';

interface ComparisonDimension {
  id: string;
  name: string;
  description: string;
  weight: number;
  higherIsBetter: boolean;
}

interface DimensionScore {
  dimensionId: string;
  rawValue: number | 'unknown';
  normalizedScore: number | 'unknown';
  label: string;
  provenance: any;
}

interface ScenarioScore {
  scenarioId: string;
  scenarioName: string;
  dimensionScores: DimensionScore[];
  weightedTotal: number | 'unknown';
}

interface ScenarioDifference {
  dimensionId: string;
  baselineValue: number | 'unknown';
  scenarioValues: { scenarioId: string; value: number | 'unknown' }[];
  absoluteDifferences: { scenarioId: string; difference: number }[];
  percentDifferences: { scenarioId: string; difference: number }[];
  significance: 'negligible' | 'minor' | 'moderate' | 'major' | 'critical';
}

interface ComparisonResult {
  id: string;
  baselineScenarioId: string;
  comparedScenarioIds: string[];
  dimensions: ComparisonDimension[];
  scenarioScores: ScenarioScore[];
  differences: ScenarioDifference[];
  generatedAt: number;
}

const DIMENSION_CONFIG: Record<string, { icon: any; color: string; unit: string }> = {
  operating_cost: { icon: DollarSign, color: '#f59e0b', unit: 'USD' },
  budget_variance: { icon: Minus, color: '#f97316', unit: '%' },
  resource_utilization: { icon: Cpu, color: '#06b6d4', unit: '%' },
  project_delivery: { icon: CheckCircle, color: '#22c55e', unit: '%' },
  operational_resilience: { icon: Shield, color: '#8b5cf6', unit: '%' },
  process_continuity: { icon: RotateCcw, color: '#06b6d4', unit: '%' },
  dependency_risk: { icon: AlertTriangle, color: '#ef4444', unit: '%' },
  risk_exposure: { icon: AlertCircle, color: '#f97316', unit: '%' },
  implementation_complexity: { icon: Settings, color: '#64748b', unit: '%' },
};

const SIGNIFICANCE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  negligible: { label: 'Negligible', color: '#64748b', icon: Info },
  minor: { label: 'Minor', color: '#06b6d4', icon: Info },
  moderate: { label: 'Moderate', color: '#f59e0b', icon: AlertTriangle },
  major: { label: 'Major', color: '#f97316', icon: AlertTriangle },
  critical: { label: 'Critical', color: '#ef4444', icon: AlertCircle },
};

const DEMO_SCENARIOS = [
  { id: 'baseline', name: 'Baseline', description: 'Current state', color: '#64748b' },
  { id: 'scenario-a', name: 'Future A \u2014 Cost Optimization', description: 'Cut OpEx by 15%', color: '#f59e0b' },
  { id: 'scenario-b', name: 'Future B \u2014 Global Expansion', description: 'Add 2 locations, new depts', color: '#22c55e' },
  { id: 'scenario-c', name: 'Future C \u2014 Tech Transformation', description: 'Replace core system', color: '#a855f7' },
];

function generateMockComparison(customWeights?: Record<string, number>): ComparisonResult {
  const dimensions: ComparisonDimension[] = [
    { id: 'operating_cost', name: 'Operating Cost', description: 'Total projected OPEX', weight: customWeights?.operating_cost ?? 1.0, higherIsBetter: false },
    { id: 'budget_variance', name: 'Budget Variance', description: 'Deviation from baseline budget', weight: customWeights?.budget_variance ?? 1.0, higherIsBetter: false },
    { id: 'resource_utilization', name: 'Resource Utilization', description: 'Average resource utilization efficiency', weight: customWeights?.resource_utilization ?? 1.0, higherIsBetter: true },
    { id: 'project_delivery', name: 'Project Delivery', description: 'On-time delivery probability', weight: customWeights?.project_delivery ?? 1.0, higherIsBetter: true },
    { id: 'operational_resilience', name: 'Operational Resilience', description: 'Ability to withstand disruptions', weight: customWeights?.operational_resilience ?? 1.0, higherIsBetter: true },
    { id: 'process_continuity', name: 'Process Continuity', description: 'Business process uptime', weight: customWeights?.process_continuity ?? 1.0, higherIsBetter: true },
    { id: 'dependency_risk', name: 'Dependency Risk', description: 'Critical dependency exposure', weight: customWeights?.dependency_risk ?? 1.0, higherIsBetter: false },
    { id: 'risk_exposure', name: 'Risk Exposure', description: 'Aggregate risk score', weight: customWeights?.risk_exposure ?? 1.0, higherIsBetter: false },
    { id: 'implementation_complexity', name: 'Implementation Complexity', description: 'Effort to execute scenario', weight: customWeights?.implementation_complexity ?? 1.0, higherIsBetter: false },
  ];

  const baselineValues = {
    operating_cost: 23_000_000,
    budget_variance: 0,
    resource_utilization: 0.68,
    project_delivery: 0.78,
    operational_resilience: 0.85,
    process_continuity: 0.92,
    dependency_risk: 0.15,
    risk_exposure: 0.12,
    implementation_complexity: 0.1,
  };

  const scenarioAValues = {
    operating_cost: 19_550_000,
    budget_variance: 0.15,
    resource_utilization: 0.82,
    project_delivery: 0.45,
    operational_resilience: 0.55,
    process_continuity: 0.65,
    dependency_risk: 0.35,
    risk_exposure: 0.42,
    implementation_complexity: 0.25,
  };

  const scenarioBValues = {
    operating_cost: 28_750_000,
    budget_variance: 0.25,
    resource_utilization: 0.62,
    project_delivery: 0.88,
    operational_resilience: 0.75,
    process_continuity: 0.85,
    dependency_risk: 0.25,
    risk_exposure: 0.28,
    implementation_complexity: 0.55,
  };

  const scenarioCValues = {
    operating_cost: 25_300_000,
    budget_variance: 0.10,
    resource_utilization: 0.71,
    project_delivery: 0.65,
    operational_resilience: 0.72,
    process_continuity: 0.78,
    dependency_risk: 0.45,
    risk_exposure: 0.55,
    implementation_complexity: 0.85,
  };

  const normalize = (dim: ComparisonDimension, value: number, baseline: number): number => {
    if (baseline === 0) return 50;
    const ratio = value / baseline;
    if (dim.higherIsBetter) {
      return Math.max(0, Math.min(100, (ratio - 0.5) * 100));
    } else {
      return Math.max(0, Math.min(100, 150 - ratio * 100));
    }
  };

  const calculateScores = (values: any, isBaseline = false): ScenarioScore => {
    const dimScores: DimensionScore[] = dimensions.map(dim => {
      const value = isBaseline ? baselineValues[dim.id as keyof typeof baselineValues] : values[dim.id as keyof typeof values];
      const baseline = baselineValues[dim.id as keyof typeof baselineValues];
      const normalized = isBaseline ? 50 : normalize(dim, value, baseline);
      return {
        dimensionId: dim.id,
        rawValue: value,
        normalizedScore: normalized,
        label: formatLabel(dim.id, value),
        provenance: {
          triggeringDecision: '',
          affectedEntity: '' as any,
          dependencyPath: [],
          formula: `Normalized ${dim.name}`,
          assumptions: [],
          deterministic: true,
          estimated: false,
          confidence: 1.0,
          calculatedAt: Date.now(),
        },
      };
    });

    let weightedSum = 0;
    let totalWeight = 0;
    for (const dim of dimensions) {
      const ds = dimScores.find(d => d.dimensionId === dim.id);
      if (typeof ds?.normalizedScore === 'number') {
        weightedSum += ds.normalizedScore * dim.weight;
        totalWeight += dim.weight;
      }
    }

    return {
      scenarioId: isBaseline ? 'baseline' : '',
      scenarioName: isBaseline ? 'Baseline' : '',
      dimensionScores: dimScores,
      weightedTotal: totalWeight > 0 ? weightedSum / totalWeight : 'unknown',
    };
  };

  const scoresA = calculateScores(scenarioAValues);
  scoresA.scenarioId = 'scenario-a';
  scoresA.scenarioName = 'Future A \u2014 Cost Optimization';
  const scoresB = calculateScores(scenarioBValues);
  scoresB.scenarioId = 'scenario-b';
  scoresB.scenarioName = 'Future B \u2014 Global Expansion';
  const scoresC = calculateScores(scenarioCValues);
  scoresC.scenarioId = 'scenario-c';
  scoresC.scenarioName = 'Future C \u2014 Tech Transformation';

  const differences: ScenarioDifference[] = dimensions.map(dim => {
    const baselineVal = baselineValues[dim.id as keyof typeof baselineValues];
    const scenarioVals = [
      { scenarioId: 'scenario-a', value: scenarioAValues[dim.id as keyof typeof scenarioAValues] },
      { scenarioId: 'scenario-b', value: scenarioBValues[dim.id as keyof typeof scenarioBValues] },
      { scenarioId: 'scenario-c', value: scenarioCValues[dim.id as keyof typeof scenarioCValues] },
    ];
    const absoluteDiffs = scenarioVals.map(sv => ({
      scenarioId: sv.scenarioId,
      difference: sv.value - baselineVal,
    }));
    const percentDiffs = scenarioVals.map(sv => ({
      scenarioId: sv.scenarioId,
      difference: baselineVal !== 0 ? ((sv.value - baselineVal) / baselineVal) * 100 : 0,
    }));
    const maxAbsDiff = Math.max(...absoluteDiffs.map(d => Math.abs(d.difference)), 0);
    const significance = classifySignificance(maxAbsDiff, dim.id);

    return {
      dimensionId: dim.id,
      baselineValue: baselineVal,
      scenarioValues: scenarioVals,
      absoluteDifferences: absoluteDiffs,
      percentDifferences: percentDiffs,
      significance,
    };
  });

  return {
    id: crypto.randomUUID(),
    baselineScenarioId: 'baseline',
    comparedScenarioIds: ['scenario-a', 'scenario-b', 'scenario-c'],
    dimensions,
    scenarioScores: [scoresA, scoresB, scoresC],
    differences,
    generatedAt: Date.now(),
  };
}

function classifySignificance(maxDiff: number, dimensionId: string): ScenarioDifference['significance'] {
  const thresholds: Record<string, { minor: number; moderate: number; major: number; critical: number }> = {
    operating_cost: { minor: 500_000, moderate: 2_000_000, major: 5_000_000, critical: 10_000_000 },
    budget_variance: { minor: 0.05, moderate: 0.15, major: 0.3, critical: 0.5 },
    resource_utilization: { minor: 0.05, moderate: 0.1, major: 0.2, critical: 0.3 },
    project_delivery: { minor: 0.05, moderate: 0.1, major: 0.2, critical: 0.3 },
    operational_resilience: { minor: 0.05, moderate: 0.1, major: 0.2, critical: 0.3 },
    process_continuity: { minor: 0.05, moderate: 0.1, major: 0.2, critical: 0.3 },
    dependency_risk: { minor: 0.05, moderate: 0.1, major: 0.2, critical: 0.3 },
    risk_exposure: { minor: 0.05, moderate: 0.1, major: 0.2, critical: 0.3 },
    implementation_complexity: { minor: 0.1, moderate: 0.2, major: 0.4, critical: 0.6 },
  };
  const t = thresholds[dimensionId] || { minor: 0.1, moderate: 0.2, major: 0.4, critical: 0.6 };
  if (maxDiff >= t.critical) return 'critical';
  if (maxDiff >= t.major) return 'major';
  if (maxDiff >= t.moderate) return 'moderate';
  if (maxDiff >= t.minor) return 'minor';
  return 'negligible';
}

function formatLabel(dimensionId: string, value: number): string {
  switch (dimensionId) {
    case 'operating_cost':
      if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
      return `$${value.toLocaleString()}`;
    case 'resource_utilization':
    case 'project_delivery':
    case 'operational_resilience':
    case 'process_continuity':
    case 'dependency_risk':
    case 'risk_exposure':
    case 'implementation_complexity':
      return `${(value * 100).toFixed(0)}%`;
    case 'budget_variance':
      return `${(value * 100).toFixed(0)}%`;
    default:
      return value.toFixed(2);
  }
}

function formatValue(value: number, unit?: string): string {
  if (unit === 'USD') {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  }
  if (unit === '%') {
    return `${(value * 100).toFixed(1)}%`;
  }
  return value.toLocaleString();
}

function getInsight(dimensionId: string, dimScore: DimensionScore, absDiff: { difference: number }, pctDiff: { difference: number }): string {
  if (typeof dimScore.normalizedScore !== 'number') return 'Insufficient data for analysis.';
  
  const score = dimScore.normalizedScore;
  const isPositive = pctDiff?.difference > 0;
  const magnitude = Math.abs(pctDiff?.difference || 0);
  
  const insights: Record<string, string> = {
    operating_cost: isPositive 
      ? `Cost increased by ${magnitude.toFixed(1)}% \u2014 budget pressure expected`
      : `Cost reduced by ${magnitude.toFixed(1)}% \u2014 savings opportunity`,
    budget_variance: magnitude > 20 
      ? `High variance (${magnitude.toFixed(1)}%) \u2014 budget control needed`
      : `Variance within acceptable range (${magnitude.toFixed(1)}%)`,
    resource_utilization: score > 80 
      ? `High utilization (${score.toFixed(0)}/100) \u2014 capacity constraints likely`
      : score < 40 
        ? `Low utilization (${score.toFixed(0)}/100) \u2014 underutilized resources`
        : `Utilization in optimal range (${score.toFixed(0)}/100)`,
    project_delivery: score < 40 
      ? `High delivery risk \u2014 ${score.toFixed(0)}/100 on-time probability`
      : score > 70 
        ? `Strong delivery confidence \u2014 ${score.toFixed(0)}/100 on-time`
        : `Moderate delivery risk \u2014 monitor closely`,
    operational_resilience: score < 40 
      ? `Low resilience \u2014 vulnerable to disruptions`
      : `Good resilience posture`,
    process_continuity: score < 40 
      ? `Process continuity at risk`
      : `Processes running smoothly`,
    dependency_risk: score < 40 
      ? `Critical dependencies exposed`
      : `Dependencies well managed`,
    risk_exposure: score < 40 
      ? `High aggregate risk \u2014 mitigation recommended`
      : `Risk exposure controlled`,
    implementation_complexity: score < 40 
      ? `High complexity \u2014 phased approach recommended`
      : `Manageable complexity`,
  };
  
  return insights[dimensionId] || `${dimensionId}: ${score.toFixed(0)}/100`;
}

export function CompareFutures() {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showBaseline, setShowBaseline] = useState(true);

  const runComparison = () => {
    setLoading(true);
    try {
      const mockComparison = generateMockComparison(Object.keys(weights).length > 0 ? weights : undefined);
      setComparison(mockComparison);
    } catch (err) {
      console.error('Comparison failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (dimensionId: string, value: number) => {
    setWeights(prev => ({ ...prev, [dimensionId]: Math.max(0, Math.min(3, value)) }));
  };

  const resetWeights = () => {
    setWeights({});
    runComparison();
  };

  useEffect(() => {
    runComparison();
  }, []);

  if (!comparison) {
    return (
      <div className={styles.compareLoading}>
        <div className={styles.loadingSpinner} />
        <p>Loading comparison...</p>
      </div>
    );
  }

  const baseline = DEMO_SCENARIOS.find(s => s.id === comparison.baselineScenarioId);
  const scenarios = comparison.comparedScenarioIds
    .map(id => DEMO_SCENARIOS.find(s => s.id === id))
    .filter(Boolean);

  return (
    <div className={styles.comparePage}>
      <div className={styles.compareHeader}>
        <div className={styles.compareTitle}>
          <h2>
            <BarChart2 size={24} />
            Compare Futures
          </h2>
          <p>Side-by-side scenario comparison across 9 dimensions with adjustable weights</p>
        </div>
        <div className={styles.compareActions}>
          <div className={styles.weightControls}>
            <label>
              <Settings size={16} />
              Weights
              <select
                value={Object.keys(weights).length > 0 ? 'custom' : 'default'}
                onChange={(e) => {
                  if (e.target.value === 'default') resetWeights();
                }}
              >
                <option value="default">Default (Equal)</option>
                <option value="custom">Custom</option>
                <option value="cost-focus">Cost Focused</option>
                <option value="risk-focus">Risk Focused</option>
                <option value="delivery-focus">Delivery Focused</option>
              </select>
            </label>
          </div>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.active : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'cards' ? styles.active : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="6" y1="8" x2="18" y2="8" />
                <line x1="6" y1="12" x2="14" y2="12" />
                <line x1="6" y1="16" x2="18" y2="16" />
              </svg>
            </button>
          </div>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={runComparison} disabled={loading}>
            <RefreshCw size={18} className={loading ? styles.spin : ''} />
            Re-run
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`}>
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      <div className={styles.scenarioSelector}>
        <div className={styles.scenarioChip} style={{ borderColor: baseline?.color }}>
          <span className={styles.chipDot} style={{ background: baseline?.color }} />
          <span className={styles.chipLabel}>Baseline</span>
          <span className={styles.chipName}>{baseline?.name}</span>
        </div>
        <div className={styles.scenarioChips}>
          {scenarios.map(scenario => (
            <div key={scenario?.id} className={styles.scenarioChip} style={{ borderColor: scenario?.color }}>
              <span className={styles.chipDot} style={{ background: scenario?.color }} />
              <span className={styles.chipName}>{scenario?.name}</span>
            </div>
          ))}
        </div>
      </div>

      {Object.keys(weights).length > 0 && (
        <div className={styles.weightSliders}>
          <h4>Dimension Weights</h4>
          <div className={styles.slidersGrid}>
            {comparison.dimensions.map(dim => {
              const Icon = DIMENSION_CONFIG[dim.id]?.icon || BarChart2;
              return (
                <div key={dim.id} className={styles.sliderItem}>
                  <label className={styles.sliderLabel}>
                    <span className={styles.sliderName} style={{ color: DIMENSION_CONFIG[dim.id]?.color }}>
                      <Icon size={14} />
                      {dim.name}
                    </span>
                    <span className={styles.sliderValue}>{weights[dim.id] ?? dim.weight}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={weights[dim.id] ?? dim.weight}
                    onChange={(e) => handleWeightChange(dim.id, parseFloat(e.target.value))}
                    className={styles.slider}
                    style={{ accentColor: DIMENSION_CONFIG[dim.id]?.color }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.summaryScorecards}>
        {comparison.scenarioScores.map(score => {
          const scenarioInfo = DEMO_SCENARIOS.find(s => s.id === score.scenarioId);
          const isBaseline = score.scenarioId === comparison.baselineScenarioId;
          return (
            <div key={score.scenarioId} className={`${styles.scorecard} ${isBaseline ? styles.baseline : ''}`} style={{ borderColor: scenarioInfo?.color }}>
              <div className={styles.scorecardHeader}>
                <div className={styles.scorecardInfo}>
                  <div className={styles.scorecardNameRow}>
                    <span className={styles.scorecardBadge} style={{ background: scenarioInfo?.color }}>
                      {isBaseline ? 'Baseline' : 'Scenario'}
                    </span>
                    <span className={styles.scorecardName}>{score.scenarioName}</span>
                  </div>
                  <div className={styles.scorecardTotal}>
                    {typeof score.weightedTotal === 'number' ? (
                      <>
                        <span className={styles.totalScore}>{score.weightedTotal.toFixed(0)}</span>
                        <span className={styles.totalLabel}>/100</span>
                      </>
                    ) : (
                      <span className={`${styles.totalScore} ${styles.unknown}`}>N/A</span>
                    )}
                  </div>
                </div>
                <div className={styles.scorecardTrend}>
                  {typeof score.weightedTotal === 'number' && (
                    <TrendingUp size={32} style={{ color: score.weightedTotal >= 60 ? '#22c55e' : score.weightedTotal >= 40 ? '#f59e0b' : '#ef4444' }} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.dimensionDetails}>
        {comparison.dimensions.map(dimension => {
          const diff = comparison.differences.find(d => d.dimensionId === dimension.id);
          const config = DIMENSION_CONFIG[dimension.id];
          const Icon = config?.icon || BarChart2;
          const isExpanded = expandedDimensions.has(dimension.id);

          return (
            <div key={dimension.id} className={styles.dimensionCard}>
              <button
                className={styles.dimensionHeader}
                onClick={() => setExpandedDimensions(prev => {
                  const next = new Set(prev);
                  if (next.has(dimension.id)) next.delete(dimension.id);
                  else next.add(dimension.id);
                  return next;
                })}
              >
                <div className={styles.dimensionIcon} style={{ background: `${config?.color}20`, color: config?.color }}>
                  <Icon size={20} />
                </div>
                <div className={styles.dimensionInfo}>
                  <div className={styles.dimensionNameRow}>
                    <h3>{dimension.name}</h3>
                    <span className={styles.dimensionWeight}>Weight: {weights[dimension.id] ?? dimension.weight}</span>
                  </div>
                  <p className={styles.dimensionDesc}>{dimension.description}</p>
                </div>
                <div className={styles.dimensionScores}>
                  {comparison.scenarioScores.map(score => {
                    const dimScore = score.dimensionScores.find(ds => ds.dimensionId === dimension.id);
                    const scenarioInfo = DEMO_SCENARIOS.find(s => s.id === score.scenarioId);
                    return (
                      <div key={score.scenarioId} className={styles.scenarioMiniScore} style={{ borderLeftColor: scenarioInfo?.color }}>
                        <span className={styles.miniLabel}>{scenarioInfo?.name.split(' \u2014 ')[0]}</span>
                        <span className={`${styles.miniScore} ${typeof dimScore?.normalizedScore !== 'number' ? styles.unknown : ''}`}>
                          {typeof dimScore?.normalizedScore === 'number' ? dimScore.normalizedScore.toFixed(0) : '\u2014'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.dimensionSignificance}>
                  {diff && (() => {
                    const SigConfig = SIGNIFICANCE_CONFIG[diff.significance];
                    const SigIcon = SigConfig?.icon || Info;
                    return (
                      <span className={`${styles.significanceBadge} ${diff.significance}`} style={{ borderColor: SigConfig?.color }}>
                        <SigIcon size={12} />
                        {SigConfig?.label}
                      </span>
                    );
                  })()}
                </div>
                <ChevronRight size={20} className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''}`} />
              </button>

              {isExpanded && diff && (
                <div className={styles.dimensionExpanded}>
                  <div className={styles.expandedGrid}>
                    <div className={styles.expandedSection}>
                      <h4>Scenario Values</h4>
                      <table className={styles.compareTable}>
                        <thead>
                          <tr>
                            <th>Scenario</th>
                            <th>Raw Value</th>
                            <th>Normalized</th>
                            <th>vs Baseline</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className={styles.baselineRow}>
                            <td>
                              <span className={`${styles.scenarioBadge} ${styles.baseline}`}>Baseline</span>
                              {baseline?.name}
                            </td>
                            <td>{formatValue(diff.baselineValue as number, config?.unit)}</td>
                            <td><span className={styles.scoreNeutral}>50</span></td>
                            <td>\u2014</td>
                          </tr>
                          {comparison.scenarioScores.map(score => {
                            const scenarioInfo = DEMO_SCENARIOS.find(s => s.id === score.scenarioId);
                            const dimScore = score.dimensionScores.find(ds => ds.dimensionId === dimension.id);
                            const scenarioVal = diff?.scenarioValues.find(sv => sv.scenarioId === score.scenarioId);
                            const absDiff = diff?.absoluteDifferences.find(ad => ad.scenarioId === score.scenarioId);
                            const pctDiff = diff?.percentDifferences.find(pd => pd.scenarioId === score.scenarioId);
                            return (
                              <tr key={score.scenarioId} style={{ borderLeftColor: scenarioInfo?.color }}>
                                <td>
                                  <span className={styles.scenarioBadge} style={{ background: scenarioInfo?.color }}>
                                    {scenarioInfo?.name.split(' \u2014 ')[0]}
                                  </span>
                                </td>
                                <td>{scenarioVal && scenarioVal.value !== 'unknown' ? formatValue(scenarioVal.value as number, config?.unit) : '\u2014'}</td>
                                <td>
                                  {typeof dimScore?.normalizedScore === 'number' ? (
                                    <span className={`${styles.scoreBadge} ${dimension.higherIsBetter ? (dimScore.normalizedScore >= 60 ? styles.good : dimScore.normalizedScore >= 40 ? styles.warning : styles.bad) : (dimScore.normalizedScore <= 40 ? styles.good : dimScore.normalizedScore <= 60 ? styles.warning : styles.bad)}`}>
                                      {dimScore.normalizedScore.toFixed(0)}
                                    </span>
                                  ) : (
                                    <span className={styles.scoreUnknown}>\u2014</span>
                                  )}
                                </td>
                                <td>
                                  {absDiff && pctDiff && (
                                    <span className={`${styles.diffValue} ${absDiff.difference > 0 ? styles.positive : absDiff.difference < 0 ? styles.negative : styles.neutral}`}>
                                      {absDiff.difference > 0 ? '+' : ''}{formatValue(absDiff.difference, config?.unit)}
                                      ({pctDiff.difference > 0 ? '+' : ''}{pctDiff.difference.toFixed(1)}%)
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className={styles.expandedSection}>
                      <h4>Difference Analysis</h4>
                      <div className={styles.analysisCards}>
                        {comparison.scenarioScores.map(score => {
                          const scenarioInfo = DEMO_SCENARIOS.find(s => s.id === score.scenarioId);
                          const dimScore = score.dimensionScores.find(ds => ds.dimensionId === dimension.id);
                          const absDiff = diff?.absoluteDifferences.find(ad => ad.scenarioId === score.scenarioId);
                          const pctDiff = diff?.percentDifferences.find(pd => pd.scenarioId === score.scenarioId);
                          
                          if (!absDiff || !pctDiff) return null;
                          
                          const isBetter = dimension.higherIsBetter 
                            ? (typeof dimScore?.normalizedScore === 'number' && dimScore.normalizedScore > 50)
                            : (typeof dimScore?.normalizedScore === 'number' && dimScore.normalizedScore < 50);
                          
                          return (
                            <div key={score.scenarioId} className={`${styles.analysisCard} ${isBetter ? styles.positive : styles.negative}`} style={{ borderColor: scenarioInfo?.color }}>
                              <div className={styles.analysisHeader}>
                                <span className={styles.analysisTitle}>{scenarioInfo?.name.split(' \u2014 ')[0]}</span>
                                <span className={`${styles.analysisVerdict} ${isBetter ? styles.better : styles.worse}`}>
                                  {isBetter ? 'Better' : 'Worse'}
                                </span>
                              </div>
                              <div className={styles.analysisMetrics}>
                                <div className={styles.metric}>
                                  <span className={styles.metricLabel}>Absolute</span>
                                  <span className={styles.metricValue}>{absDiff.difference > 0 ? '+' : ''}{formatValue(absDiff.difference, config?.unit)}</span>
                                </div>
                                <div className={styles.metric}>
                                  <span className={styles.metricLabel}>Percent</span>
                                  <span className={styles.metricValue}>{pctDiff.difference > 0 ? '+' : ''}{pctDiff.difference.toFixed(1)}%</span>
                                </div>
                                <div className={styles.metric}>
                                  <span className={styles.metricLabel}>Score</span>
                                  <span className={styles.metricValue}>{typeof dimScore?.normalizedScore === 'number' ? dimScore.normalizedScore.toFixed(0) : '\u2014'}/100</span>
                                </div>
                              </div>
                              <div className={styles.analysisInsight}>
                                {getInsight(dimension.id, dimScore!, absDiff, pctDiff)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.tradeoffSummary}>
        <h3>
          <ArrowUpRight size={20} />
          Trade-off Analysis
        </h3>
        <div className={styles.tradeoffGrid}>
          {scenarios.map(scenario => {
            const score = comparison.scenarioScores.find(s => s.scenarioId === scenario?.id);
            if (!score) return null;
            
            const strengths = score.dimensionScores
              .filter(ds => typeof ds.normalizedScore === 'number' && ds.normalizedScore >= 60)
              .sort((a, b) => (b.normalizedScore as number) - (a.normalizedScore as number))
              .slice(0, 3);
            
            const weaknesses = score.dimensionScores
              .filter(ds => typeof ds.normalizedScore === 'number' && ds.normalizedScore < 40)
              .sort((a, b) => (a.normalizedScore as number) - (b.normalizedScore as number))
              .slice(0, 3);

            return (
              <div key={scenario?.id} className={styles.tradeoffCard} style={{ borderColor: scenario?.color }}>
                <div className={styles.tradeoffHeader}>
                  <span className={styles.tradeoffBadge} style={{ background: scenario?.color }}>
                    {scenario?.name.split(' \u2014 ')[0]}
                  </span>
                  <span className={styles.tradeoffTotal}>{typeof score.weightedTotal === 'number' ? score.weightedTotal.toFixed(0) : 'N/A'}/100</span>
                </div>
                <div className={styles.tradeoffSection}>
                  <h4>
                    <TrendingUp size={14} style={{ color: '#22c55e' }} />
                    Strengths
                  </h4>
                  <ul className={styles.tradeoffList}>
                    {strengths.map(s => (
                      <li key={s.dimensionId}>
                        <span className={styles.tradeoffItem}>
                          <span className={styles.tradeoffItemName}>{comparison.dimensions.find(d => d.id === s.dimensionId)?.name}</span>
                          <span className={`${styles.tradeoffItemScore} ${styles.good}`}>{(s.normalizedScore as number).toFixed(0)}</span>
                        </span>
                      </li>
                    ))}
                    {strengths.length === 0 && <li className={styles.empty}>No significant strengths</li>}
                  </ul>
                </div>
                <div className={styles.tradeoffSection}>
                  <h4>
                    <TrendingDown size={14} style={{ color: '#ef4444' }} />
                    Risks
                  </h4>
                  <ul className={styles.tradeoffList}>
                    {weaknesses.map(s => (
                      <li key={s.dimensionId}>
                        <span className={styles.tradeoffItem}>
                          <span className={styles.tradeoffItemName}>{comparison.dimensions.find(d => d.id === s.dimensionId)?.name}</span>
                          <span className={`${styles.tradeoffItemScore} ${styles.bad}`}>{(s.normalizedScore as number).toFixed(0)}</span>
                        </span>
                      </li>
                    ))}
                    {weaknesses.length === 0 && <li className={styles.empty}>No significant risks</li>}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CompareFutures;