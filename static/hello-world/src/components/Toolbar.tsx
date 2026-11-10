// Toolbar Component for Graph Controls

import React from 'react';
import { 
  Search, Filter, ZoomIn, ZoomOut, RotateCcw, 
  Download, Maximize2
} from 'lucide-react';
import type { EntityType, ENTITY_TYPE_COLORS } from '../types';

interface ToolbarProps {
  selectedTypes: EntityType[];
  onTypeToggle: (type: EntityType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (query: string) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onResetLayout: () => void;
  onToggleFilters: () => void;
  showFilters: boolean;
  nodeCount: number;
  edgeCount: number;
  onExportImage: () => void;
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  organization: 'Organizations',
  department: 'Departments',
  employee: 'Employees',
  role: 'Roles',
  project: 'Projects',
  business_process: 'Processes',
  business_system: 'Systems',
  it_asset: 'Assets',
  location: 'Locations',
  vendor: 'Vendors',
  budget: 'Budgets',
  resource: 'Resources',
};

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedTypes,
  onTypeToggle,
  searchQuery,
  onSearchChange,
  onSearch,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetLayout,
  onToggleFilters,
  showFilters,
  nodeCount,
  edgeCount,
  onExportImage,
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      right: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      zIndex: 100,
      flexWrap: 'wrap',
    }}>
      {/* Left: Search and Filters */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        flex: 1,
        minWidth: 0,
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
          <svg style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#64748b', 
            width: 18, 
            height: 18
          }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="23" y2="23"/>
          </svg>
          <input
            type="text"
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch(e.currentTarget.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: '#111827',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#1e293b'}
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={onToggleFilters}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: showFilters ? '#3b82f6' : '#111827',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            color: showFilters ? '#ffffff' : '#cbd5e1',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => !showFilters && (e.currentTarget.style.background = '#1e293b')}
          onMouseOut={(e) => !showFilters && (e.currentTarget.style.background = '#111827')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 12.46 2 21 10 12.46 10 12.46 22 21 10 12.46 10 12.46 14 3"/></svg>
          <span>Filters</span>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 600,
          }}>
            {/* selectedTypes.length is not available here, will be passed as prop */}
            <span id="filter-count">0</span>/12
          </span>
        </button>

        {/* Filter Panel */}
        {showFilters && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            zIndex: 200,
            minWidth: '200px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { type: 'organization', label: 'Organizations' },
                { type: 'department', label: 'Departments' },
                { type: 'employee', label: 'Employees' },
                { type: 'role', label: 'Roles' },
                { type: 'project', label: 'Projects' },
                { type: 'business_process', label: 'Processes' },
                { type: 'business_system', label: 'Systems' },
                { type: 'it_asset', label: 'Assets' },
                { type: 'location', label: 'Locations' },
                { type: 'vendor', label: 'Vendors' },
                { type: 'budget', label: 'Budgets' },
                { type: 'resource', label: 'Resources' },
              ].map(({ type, label }) => {
                const colors = {
                  organization: { bg: '#1e3a5f', border: '#3b82f6' },
                  department: { bg: '#1e4d3b', border: '#22c55e' },
                  employee: { bg: '#4c1d95', border: '#a855f7' },
                  role: { bg: '#7c2d12', border: '#f97316' },
                  project: { bg: '#92400e', border: '#f59e0b' },
                  business_process: { bg: '#0c4a6e', border: '#06b6d4' },
                  business_system: { bg: '#1e3a5f', border: '#3b82f6' },
                  it_asset: { bg: '#374151', border: '#6b7280' },
                  location: { bg: '#14532d', border: '#22c55e' },
                  vendor: { bg: '#7f1d1d', border: '#ef4444' },
                  budget: { bg: '#92400e', border: '#f59e0b' },
                  resource: { bg: '#4c1d95', border: '#a855f7' },
                }[type] || { bg: '#1e293b', border: '#6b7280' };

                const isSelected = false; // Will be handled by parent
                return (
                  <label
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'}
                  >
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => {}}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#3b82f6',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: '#1e3a5f',
                      border: `2px solid #3b82f6`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                    </span>
                    <span style={{ fontSize: '13px', color: '#e2e8f0', flex: 1 }}>
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right: Stats and Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Stats */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          padding: '8px 12px',
          background: '#0a1120',
          border: '1px solid #1e293b',
          borderRadius: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Nodes</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', fontFamily: 'monospace' }}>
              {nodeCount}
            </span>
          </div>
          <div style={{ width: '1px', height: '20px', background: '#1e293b' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Edges</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', fontFamily: 'monospace' }}>
              {edgeCount}
            </span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={onZoomOut}
            style={iconButtonStyle}
            title="Zoom Out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="23" y2="23"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <div style={{ 
            padding: '0 12px', 
            fontSize: '12px', 
            fontWeight: 600, 
            color: '#f8fafc',
            minWidth: '50px',
            textAlign: 'center',
            fontFamily: 'monospace',
          }}>
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={onZoomIn}
            style={iconButtonStyle}
            title="Zoom In"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="23" y2="23"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>
          </button>
          <button
            onClick={onFitView}
            style={iconButtonStyle}
            title="Fit View"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
          </button>
        </div>

        {/* Layout & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={onResetLayout}
            style={iconButtonStyle}
            title="Reset Layout"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M21 12a9 9 0 1 1-9 9 9.75 9.75 0 0 1 6.74-2.74L21 16"/></svg>
          </button>
          <button
            onClick={onExportImage}
            style={iconButtonStyle}
            title="Export Image"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const iconButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  background: 'transparent',
  border: 'none',
  borderRadius: '6px',
  color: '#94a3b8',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

export default Toolbar;