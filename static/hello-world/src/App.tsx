import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import { 
  Layout, Home, GitBranch, BarChart2, History, Settings, Menu, X, ChevronRight, 
  Building2, Building, Handshake, Server, Database 
} from 'lucide-react';
import { OrganizationTwin } from './pages/OrganizationTwin';
import { CompareFutures } from './pages/CompareFutures';
import './index.css';

type Page = 'overview' | 'twin' | 'scenario' | 'compare' | 'history' | 'integrations' | 'settings';

interface HealthCheckResult {
  status: string;
  timestamp: number;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('twin');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await invoke<HealthCheckResult>('healthCheck');
      const data = 'body' in response ? response.body : response;
      setHealth(data);
    } catch (err) {
      console.error('Health check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const pages: { id: Page; label: string; icon: React.ComponentType<{ size?: number | string }> }[] = [
    { id: 'overview', label: 'Overview', icon: Home as any },
    { id: 'twin', label: 'Organization Twin', icon: Building2 as any },
    { id: 'scenario', label: 'Scenario Lab', icon: GitBranch as any },
    { id: 'compare', label: 'Compare Futures', icon: BarChart2 as any },
    { id: 'history', label: 'Simulation History', icon: History as any },
    { id: 'integrations', label: 'Integrations', icon: Settings as any },
    { id: 'settings', label: 'Settings', icon: Layout as any },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'twin':
        return <OrganizationTwin />;
      case 'overview':
        return <OverviewPage health={health} />;
      case 'scenario':
        return <PlaceholderPage title="Scenario Lab" description="Create and manage parallel scenarios" />;
      case 'compare':
        return <CompareFutures />;
      case 'history':
        return <PlaceholderPage title="Simulation History" description="Historical simulation runs and results" />;
      case 'integrations':
        return <PlaceholderPage title="Integrations" description="Jira, Confluence, Rovo, NVIDIA NIM connections" />;
      case 'settings':
        return <PlaceholderPage title="Settings" description="Application configuration and preferences" />;
      default:
        return <OverviewPage health={health} />;
    }
  };

  return (
    <div className="app">
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{ transform: mobileMenuOpen ? 'translateX(0)' : undefined }}
      >
        <div className="sidebar-header">
          <div className="logo">
            <Building2 size={28} />
            <span className={sidebarOpen ? '' : 'hidden'}>ParallelOS</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronRight size={18} /> : <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {pages.map(page => (
            <button
              key={page.id}
              className={`nav-item ${currentPage === page.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentPage(page.id);
                if (window.innerWidth < 768) setMobileMenuOpen(false);
              }}
            >
              <page.icon size={20} />
              <span className={sidebarOpen ? '' : 'hidden'}>{page.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info" style={{ display: sidebarOpen ? 'flex' : 'none' }}>
            <div className="user-avatar">DA</div>
            <div className="user-details">
              <span className="user-name">Demo Admin</span>
              <span className="user-role">Aurelia Global Technologies</span>
            </div>
          </div>
          <div className="health-status" style={{ display: sidebarOpen ? 'block' : 'none' }}>
            {health && (
              <div className="health-badge">
                <span className="health-dot"></span>
                <span>Forge Connected</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="main-content" style={{ marginLeft: sidebarOpen ? '280px' : '72px' }}>
        <header className="top-bar">
          <div className="page-title">
            <h1>{pages.find(p => p.id === currentPage)?.label}</h1>
          </div>
          <div className="top-bar-actions">
            <button className="icon-btn" title="Refresh" onClick={() => window.location.reload()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
            <button className="icon-btn" title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <div className="user-menu">
              <div className="user-avatar-small">DA</div>
            </div>
          </div>
        </header>

        <div className="page-content">
          {renderPage()}
        </div>
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }
        
        .app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #0f172a;
          color: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Mobile Menu Button */
        .mobile-menu-btn {
          display: none;
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 1100;
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: #111827;
          border: 1px solid #1e293b;
          color: #f8fafc;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex;
          }
        }

        /* Mobile Overlay */
        .mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 950;
        }

        @media (max-width: 768px) {
          .mobile-overlay.mobile-open {
            display: block;
          }
        }

        /* Sidebar */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          height: 100vh;
          background: #0a1120;
          border-right: 1px solid #1e293b;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          transition: width 0.3s ease, transform 0.3s ease;
        }

        .sidebar.collapsed {
          width: 72px;
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            width: 280px;
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
        }

        .sidebar-header {
          display: flex;
          alignItems: center;
          justifyContent: space-between;
          padding: 16px;
          borderBottom: '1px solid #1e293b';
        }

        .logo {
          display: flex;
          alignItems: center;
          gap: 12px;
          color: #3b82f6;
        }

        .logo span {
          fontSize: '20px';
          fontWeight: 700;
          transition: opacity 0.2s;
        }

        .hidden {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }

        .sidebar-toggle {
          width: 32px;
          height: 32px;
          borderRadius: 8px;
          background: transparent;
          border: '1px solid #1e293b';
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          alignItems: center;
          justifyContent: center;
          transition: all 0.2s;
        }

        .sidebar-toggle:hover {
          background: #1e293b;
          color: #f8fafc;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
        }

        .nav-item {
          width: 100%;
          display: flex;
          alignItems: center;
          gap: 12px;
          padding: 12px 14px;
          borderRadius: 10px;
          background: transparent;
          border: none;
          color: #94a3b8;
          fontSize: '14px';
          fontWeight: 500;
          cursor: pointer;
          textAlign: left;
          transition: all 0.15s;
          whiteSpace: nowrap;
          overflow: hidden;
        }

        .nav-item:hover {
          background: #1e293b;
          color: #f8fafc;
        }

        .nav-item.active {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          borderLeft: '3px solid #3b82f6';
        }

        .nav-item svg {
          flexShrink: 0;
        }

        .sidebar-footer {
          padding: 16px;
          borderTop: '1px solid #1e293b';
        }

        .user-info {
          display: flex;
          alignItems: center;
          gap: 12px;
          padding: 8px;
          borderRadius: 10px;
          background: #111827;
          border: '1px solid #1e293b';
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          borderRadius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          alignItems: center;
          justifyContent: center;
          fontWeight: 600;
          fontSize: 14px;
          color: white;
        }

        .user-details {
          flex: 1;
          display: flex;
          flexDirection: column;
          minWidth: 0;
        }

        .user-name {
          fontSize: '14px';
          fontWeight: 600;
          color: #f8fafc;
          whiteSpace: nowrap;
          overflow: hidden;
          textOverflow: ellipsis;
        }

        .user-role {
          fontSize: '12px';
          color: #64748b;
          whiteSpace: nowrap;
          overflow: hidden;
          textOverflow: ellipsis;
        }

        .health-badge {
          display: flex;
          alignItems: center;
          gap: 8px;
          marginTop: 12px;
          padding: 8px 12px;
          background: rgba(34, 197, 94, 0.1);
          border: '1px solid rgba(34, 197, 94, 0.3)';
          borderRadius: 8px;
          fontSize: '12px';
          color: #22c55e;
        }

        .health-dot {
          width: '8px';
          height: '8px';
          borderRadius: '50%';
          background: '#22c55e';
          animation: 'pulse 2s infinite';
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .sidebar {
            width: 280px;
            transform: translateX(-100%);
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          .sidebar.collapsed {
            width: 280px;
          }
        }

        /* Top Bar */
        .top-bar {
          position: sticky;
          top: 0;
          height: 64px;
          background: #0a1120;
          borderBottom: '1px solid #1e293b';
          display: flex;
          alignItems: center;
          justifyContent: space-between;
          padding: 0 24px;
          zIndex: 100;
        }

        .page-title h1 {
          fontSize: '24px';
          fontWeight: 600;
          margin: 0;
          letterSpacing: '-0.02em';
        }

        .top-bar-actions {
          display: flex;
          alignItems: center;
          gap: 8px;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          borderRadius: 10px;
          background: transparent;
          border: '1px solid #1e293b';
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          alignItems: center;
          justifyContent: center;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: #1e293b;
          color: #f8fafc;
        }

        .user-menu {
          marginLeft: 8px;
        }

        .user-avatar-small {
          width: 32px;
          height: 32px;
          borderRadius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          alignItems: center;
          justifyContent: center;
          fontWeight: 600;
          fontSize: 12px;
          color: white;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          transition: margin-left 0.3s ease;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
          }
        }

        .page-content {
          padding: 24px;
          maxWidth: '100%';
        }

        /* Placeholder Page Styles */
        .placeholder-page {
          display: flex;
          flexDirection: column;
          alignItems: center;
          justifyContent: center;
          height: '100%';
          minHeight: '500px';
          textAlign: center;
          padding: 48px;
        }

        .placeholder-icon {
          width: 100px;
          height: 100px;
          borderRadius: 50%;
          background: #1e3a5f;
          border: '2px solid #3b82f6';
          display: flex;
          alignItems: center;
          justifyContent: center;
          margin: '0 auto 32px';
        }

        .placeholder-page h2 {
          margin: '0 0 16px 0';
          fontSize: '28px';
          fontWeight: 600;
        }

        .placeholder-page p {
          margin: '0 0 32px 0';
          color: #94a3b8;
          maxWidth: '480px';
          lineHeight: 1.6;
        }

        .placeholder-stats {
          display: flex;
          gap: 32px;
          marginTop: 24px;
        }

        .stat-item {
          textAlign: center;
        }

        .stat-value {
          fontSize: '32px';
          fontWeight: 700;
          color: #3b82f6;
          fontFamily: 'monospace';
        }

        .stat-label {
          fontSize: '13px';
          color: #64748b;
          marginTop: 4px;
        }

        /* Overview Page */
        .overview-grid {
          display: grid;
          gridTemplateColumns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          marginTop: 24px;
        }

        .overview-card {
          background: #111827;
          border: '1px solid #1e293b';
          borderRadius: 16px;
          padding: 24px;
          transition: all 0.2s;
        }

        .overview-card:hover {
          borderColor: #334155;
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)';
        }

        .card-header {
          display: flex;
          alignItems: center;
          gap: 16px;
          marginBottom: 16px;
        }

        .card-icon {
          width: 56px;
          height: 56px;
          borderRadius: 14px;
          display: flex;
          alignItems: center;
          justifyContent: center;
        }

        .card-title {
          fontSize: '18px';
          fontWeight: 600;
          margin: 0;
        }

        .card-desc {
          color: #94a3b8;
          margin: '0 0 24px 0';
          lineHeight: 1.6;
        }

        .card-stats {
          display: flex;
          flexDirection: column;
          gap: 12px;
        }

        .stat-row {
          display: flex;
          justifyContent: space-between;
          alignItems: center;
          padding: '12px 16px';
          background: #0a1120;
          borderRadius: 10px;
          border: '1px solid #1e293b';
        }

        .stat-label {
          fontSize: '13px';
          color: #94a3b8;
        }

        .stat-value {
          fontSize: '16px';
          fontWeight: 600;
          fontFamily: 'monospace';
        }

        .card-actions {
          display: flex;
          gap: 12px;
          marginTop: 24px;
          paddingTop: 16px;
          borderTop: '1px solid #1e293b';
        }

        .btn {
          padding: '10px 20px';
          borderRadius: 8px;
          fontWeight: 500;
          fontSize: '13px';
          cursor: pointer;
          transition: all 0.15s;
          border: none;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #1e293b;
          color: #cbd5e1;
          border: '1px solid #334155';
        }

        .btn-secondary:hover {
          background: #334155;
        }

        .status-connected {
          color: #22c55e;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

// Placeholder Page Component
const PlaceholderPage: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="placeholder-page">
    <div className="placeholder-icon">
      <Building2 size={48} style={{ color: '#3b82f6' }} />
    </div>
    <h2>{title}</h2>
    <p>{description}</p>
    <div className="placeholder-stats">
      <div className="stat-item">
        <div className="stat-value">—</div>
        <div className="stat-label">Entities</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">—</div>
        <div className="stat-label">Relationships</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">—</div>
        <div className="stat-label">Scenarios</div>
      </div>
    </div>
  </div>
);

// Overview Page
const OverviewPage: React.FC<{ health: any }> = ({ health }) => (
  <div>
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.02em' }}>
        Organization Overview
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '16px', maxWidth: '600px' }}>
        Aurelia Global Technologies — Technology Consulting
      </p>
    </div>

    <div className="overview-grid">
      <div className="overview-card">
        <div className="card-header">
          <div className="card-icon" style={{ background: '#1e3a5f', border: '2px solid #3b82f6' }}>
            <Building2 size={28} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <h3 className="card-title">Organization</h3>
            <p className="card-desc">Aurelia Global Technologies — 38 employees across 3 locations</p>
          </div>
        </div>
        <div className="card-stats">
          <div className="stat-row">
            <span className="stat-label">Industry</span>
            <span className="stat-value">Technology Consulting</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Annual Revenue</span>
            <span className="stat-value">$50M</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Headquarters</span>
            <span className="stat-value">San Francisco</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn btn-primary">View Details</button>
          <button className="btn btn-secondary">Edit</button>
        </div>
      </div>

      <div className="overview-card">
        <div className="card-header">
          <div className="card-icon" style={{ background: '#1e4d3b', border: '2px solid #22c55e' }}>
            <Building size={28} style={{ color: '#22c55e' }} />
          </div>
          <div>
            <h3 className="card-title">Departments</h3>
            <p className="card-desc">6 departments with 38 total employees</p>
          </div>
        </div>
        <div className="card-stats">
          <div className="stat-row">
            <span className="stat-label">Engineering</span>
            <span className="stat-value">12 employees</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Sales</span>
            <span className="stat-value">8 employees</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Operations</span>
            <span className="stat-value">6 employees</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Marketing</span>
            <span className="stat-value">5 employees</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Finance</span>
            <span className="stat-value">4 employees</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Human Resources</span>
            <span className="stat-value">3 employees</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn btn-primary">Manage Departments</button>
        </div>
      </div>

      <div className="overview-card">
        <div className="card-header">
          <div className="card-icon" style={{ background: '#0c4a6e', border: '2px solid #06b6d4' }}>
            <GitBranch size={28} style={{ color: '#06b6d4' }} />
          </div>
          <div>
            <h3 className="card-title">Active Scenarios</h3>
            <p className="card-desc">3 parallel futures from baseline</p>
          </div>
        </div>
        <div className="card-stats">
          <div className="stat-row">
            <span className="stat-label">Future A — Cost Optimization</span>
            <span className="stat-value" style={{ color: '#f59e0b' }}>Draft</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Future B — Global Expansion</span>
            <span className="stat-value" style={{ color: '#22c55e' }}>Active</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Future C — Tech Transformation</span>
            <span className="stat-value" style={{ color: '#a855f7' }}>Planned</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn btn-primary">Open Scenario Lab</button>
        </div>
      </div>

      <div className="overview-card">
        <div className="card-header">
          <div className="card-icon" style={{ background: '#92400e', border: '2px solid #f59e0b' }}>
            <Server size={28} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h3 className="card-title">Systems & Infrastructure</h3>
            <p className="card-desc">12 business systems, 18 IT assets across 3 locations</p>
          </div>
        </div>
        <div className="card-stats">
          <div className="stat-row">
            <span className="stat-label">Critical Systems</span>
            <span className="stat-value">4</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Redundancy Coverage</span>
            <span className="stat-value">75%</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Cloud Resources</span>
            <span className="stat-value">AWS + GCP</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn btn-primary">View Architecture</button>
        </div>
      </div>

      <div className="overview-card">
        <div className="card-header">
          <div className="card-icon" style={{ background: '#7c2d12', border: '2px solid #f97316' }}>
            <GitBranch size={28} style={{ color: '#f97316' }} />
          </div>
          <div>
            <h3 className="card-title">Projects</h3>
            <p className="card-desc">9 active and planned projects across departments</p>
          </div>
        </div>
        <div className="card-stats">
          <div className="stat-row">
            <span className="stat-label">Active</span>
            <span className="stat-value">4</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Planned</span>
            <span className="stat-value">5</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Total Budget</span>
            <span className="stat-value">$18.2M</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn btn-primary">View Projects</button>
        </div>
      </div>

      <div className="overview-card">
        <div className="card-header">
          <div className="card-icon" style={{ background: '#7f1d1d', border: '2px solid #ef4444' }}>
            <Handshake size={28} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <h3 className="card-title">Vendors & Partners</h3>
            <p className="card-desc">5 key vendors with enterprise SLAs</p>
          </div>
        </div>
        <div className="card-stats">
          <div className="stat-row">
            <span className="stat-label">Enterprise Tier</span>
            <span className="stat-value">4/5</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Annual Spend</span>
            <span className="stat-value">$4.8M</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">SLA Compliance</span>
            <span className="stat-value">99.2%</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn btn-primary">Vendor Management</button>
        </div>
      </div>
    </div>

    {/* Health & Connection Status */}
    <div className="overview-grid" style={{ marginTop: '32px' }}>
      <div className="overview-card">
        <div className="card-header">
          <div className="card-icon" style={{ background: '#0c4a6e', border: '2px solid #06b6d4' }}>
            <Server size={28} style={{ color: '#06b6d4' }} />
          </div>
          <div>
            <h3 className="card-title">Forge Connection</h3>
            <p className="card-desc">Real-time connection to Atlassian Forge platform</p>
          </div>
        </div>
        <div className="card-stats">
          <div className="stat-row">
            <span className="stat-label">Status</span>
            <span className="stat-value status-connected">● Connected</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Last Check</span>
            <span className="stat-value">{health ? new Date(health.timestamp).toLocaleTimeString() : '—'}</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Refresh Connection</button>
        </div>
      </div>

      <div className="overview-card">
        <div className="card-header">
          <div className="card-icon" style={{ background: '#1e3a5f', border: '2px solid #3b82f6' }}>
            <Database size={28} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <h3 className="card-title">Storage</h3>
            <p className="card-desc">Custom Entity Store for entities and relationships</p>
          </div>
        </div>
        <div className="card-stats">
          <div className="stat-row">
            <span className="stat-label">Entities Stored</span>
            <span className="stat-value">—</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Relationships Stored</span>
            <span className="stat-value">—</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Storage Used</span>
            <span className="stat-value">—</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn btn-secondary">Initialize Demo Data</button>
        </div>
      </div>
    </div>
  </div>
);

export default App;