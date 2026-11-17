import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import { 
  Layout, Home, GitBranch, BarChart2, History, Settings, Menu, X, ChevronRight, 
  Building2, Building, Handshake, Server, Database, Sparkles, Award
} from 'lucide-react';
import { OrganizationTwin } from './pages/OrganizationTwin';
import { CompareFutures } from './pages/CompareFutures';
import { ScenarioLab } from './pages/ScenarioLab';
import { SimulationHistory } from './pages/SimulationHistory';
import { SettingsPage } from './pages/Settings';
import { Logo } from './components/Logo';
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
        return <ScenarioLab />;
      case 'compare':
        return <CompareFutures />;
      case 'history':
        return <SimulationHistory />;
      case 'settings':
        return <SettingsPage />;
      case 'integrations':
        return <PlaceholderPage title="Integrations" description="Jira, Confluence, Rovo, NVIDIA NIM connections" />;
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
          <div className="logo" onClick={() => setCurrentPage('overview')} style={{ cursor: 'pointer' }}>
            <Logo size={sidebarOpen ? 30 : 26} showText={sidebarOpen} />
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
          <div className="creator-credit" style={{ display: sidebarOpen ? 'block' : 'none' }}>
            <div className="creator-badge-inner">
              <span className="creator-sparkle">✦</span>
              <div className="creator-meta">
                <span className="creator-by">Made by</span>
                <span className="creator-name">Adarsh Panicker</span>
              </div>
            </div>
          </div>
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
          <div className="page-title-container">
            <Logo size={24} showText={false} />
            <div className="page-title">
              <h1>{pages.find(p => p.id === currentPage)?.label}</h1>
            </div>
          </div>
          <div className="top-bar-actions">
            <div className="creator-pill" title="ParallelOS Architect & Lead Engineer">
              <Award size={14} className="creator-pill-icon" />
              <span>Made by <strong>Adarsh Panicker</strong></span>
            </div>
            <button className="icon-btn" title="Refresh" onClick={() => window.location.reload()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
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
          border-bottom: 1px solid rgba(249, 115, 22, 0.2);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #f97316;
          user-select: none;
        }

        .logo span {
          font-size: 20px;
          font-weight: 700;
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
          border-radius: 8px;
          background: transparent;
          border: 1px solid rgba(249, 115, 22, 0.2);
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .sidebar-toggle:hover {
          background: rgba(249, 115, 22, 0.1);
          color: #f8fafc;
          border-color: rgba(249, 115, 22, 0.4);
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
        }

        .nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
          white-space: nowrap;
          overflow: hidden;
        }

        .nav-item:hover {
          background: rgba(249, 115, 22, 0.08);
          color: #f8fafc;
        }

        .nav-item.active {
          background: linear-gradient(90deg, rgba(249, 115, 22, 0.18) 0%, rgba(16, 185, 129, 0.1) 100%);
          color: #fb923c;
          border-left: 3px solid #f97316;
          box-shadow: inset 2px 0 8px rgba(249, 115, 22, 0.2);
        }

        .nav-item svg {
          flex-shrink: 0;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(249, 115, 22, 0.2);
          background: rgba(10, 16, 25, 0.6);
        }

        .creator-credit {
          margin-bottom: 12px;
          padding: 10px 12px;
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%);
          border: 1px solid rgba(249, 115, 22, 0.25);
          border-radius: 10px;
          box-shadow: inset 0 0 12px rgba(249, 115, 22, 0.08);
        }

        .creator-badge-inner {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .creator-sparkle {
          color: #f97316;
          font-size: 14px;
          animation: pulse 2s infinite;
        }

        .creator-meta {
          display: flex;
          flex-direction: column;
        }

        .creator-by {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
        }

        .creator-name {
          font-size: 12px;
          font-weight: 600;
          color: #34d399;
        }

        .creator-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%);
          border: 1px solid rgba(249, 115, 22, 0.35);
          border-radius: 9999px;
          font-size: 12px;
          color: #fed7aa;
          box-shadow: 0 0 15px rgba(249, 115, 22, 0.2);
          transition: all 0.2s ease;
        }

        .creator-pill strong {
          color: #34d399;
          font-weight: 600;
        }

        .creator-pill:hover {
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
          transform: translateY(-1px);
        }

        .creator-pill-icon {
          color: #f97316;
        }

        .page-title-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 10px;
          background: #111827;
          border: 1px solid #1e293b;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #10b981);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 13px;
          color: white;
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.4);
        }

        .user-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: #f8fafc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 11px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .health-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          padding: 6px 10px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          border-radius: 8px;
          font-size: 11px;
          color: #34d399;
        }

        .health-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
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
          background: rgba(10, 16, 25, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(249, 115, 22, 0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 100;
        }

        .page-title h1 {
          font-size: 22px;
          font-weight: 600;
          margin: 0;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .top-bar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(17, 24, 39, 0.8);
          border: 1px solid rgba(249, 115, 22, 0.2);
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: rgba(249, 115, 22, 0.15);
          border-color: rgba(249, 115, 22, 0.4);
          color: #f97316;
        }

        .user-menu {
          margin-left: 4px;
        }

        .user-avatar-small {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #10b981);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
          color: white;
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.35);
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
          max-width: 100%;
        }

        /* Placeholder Page Styles */
        .placeholder-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 500px;
          text-align: center;
          padding: 48px;
        }

        .placeholder-icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(249, 115, 22, 0.12);
          border: 2px solid #f97316;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 32px;
          box-shadow: 0 0 30px rgba(249, 115, 22, 0.25);
        }

        .placeholder-page h2 {
          margin: 0 0 16px 0;
          font-size: 28px;
          font-weight: 600;
        }

        .placeholder-page p {
          margin: 0 0 32px 0;
          color: #94a3b8;
          max-width: 480px;
          line-height: 1.6;
        }

        .placeholder-stats {
          display: flex;
          gap: 32px;
          margin-top: 24px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #f97316;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }

        .stat-label {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }

        /* Overview Page Hero Banner */
        .overview-hero {
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(16, 185, 129, 0.08) 50%, rgba(10, 16, 25, 0.95) 100%);
          border: 1px solid rgba(249, 115, 22, 0.3);
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(249, 115, 22, 0.15);
          position: relative;
          overflow: hidden;
        }

        .overview-hero::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-content {
          flex: 1;
          max-width: 780px;
        }

        .hero-badge-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: rgba(249, 115, 22, 0.18);
          border: 1px solid rgba(249, 115, 22, 0.4);
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
          color: #fb923c;
        }

        .hero-author-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.18) 0%, rgba(16, 185, 129, 0.18) 100%);
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-radius: 9999px;
          font-size: 12px;
          color: #e2e8f0;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
        }

        .hero-author-pill strong {
          color: #34d399;
          font-weight: 600;
        }

        .hero-title {
          font-size: 34px;
          font-weight: 800;
          margin: 0 0 6px 0;
          letter-spacing: -0.03em;
          display: flex;
          align-items: baseline;
          gap: 12px;
          flex-wrap: wrap;
        }

        .gradient-text-orange {
          background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .gradient-text-green {
          background: linear-gradient(135deg, #34d399 0%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle-tag {
          font-size: 16px;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .hero-tagline {
          font-size: 18px;
          font-weight: 500;
          color: #fdba74;
          margin: 0 0 12px 0;
        }

        .hero-description {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.6;
          margin: 0 0 20px 0;
          max-width: 680px;
        }

        .hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tech-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
        }

        .orange-badge {
          background: rgba(249, 115, 22, 0.12);
          border: 1px solid rgba(249, 115, 22, 0.3);
          color: #fed7aa;
        }

        .green-badge {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #a7f3d0;
        }

        .hero-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(10, 16, 25, 0.8);
          border: 1px solid rgba(249, 115, 22, 0.3);
          border-radius: 20px;
          box-shadow: 0 0 30px rgba(249, 115, 22, 0.2);
        }

        @media (max-width: 900px) {
          .overview-hero {
            flex-direction: column;
            align-items: flex-start;
          }
          .hero-visual {
            align-self: center;
          }
        }

        /* Overview Grid */
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .overview-card {
          background: rgba(14, 22, 32, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(249, 115, 22, 0.2);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.25s ease;
          position: relative;
        }

        .overview-card:hover {
          border-color: rgba(249, 115, 22, 0.45);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(249, 115, 22, 0.15);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .card-icon {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: #f8fafc;
        }

        .card-desc {
          color: #94a3b8;
          margin: 4px 0 0 0;
          font-size: 13px;
          line-height: 1.5;
        }

        .card-stats {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: rgba(10, 16, 25, 0.7);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .stat-label {
          font-size: 13px;
          color: #94a3b8;
        }

        .stat-value {
          font-size: 15px;
          font-weight: 600;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          color: #f1f5f9;
        }

        .card-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .btn {
          padding: 9px 18px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 45%, #10b981 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #ea580c 0%, #c2410c 45%, #059669 100%);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.5);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: rgba(15, 23, 42, 0.8);
          color: #cbd5e1;
          border: 1px solid rgba(249, 115, 22, 0.25);
        }

        .btn-secondary:hover {
          background: rgba(30, 41, 59, 0.9);
          border-color: rgba(16, 185, 129, 0.4);
          color: #f8fafc;
        }

        .status-connected {
          color: #34d399;
          text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
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
      <Logo size={56} showText={false} />
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
    {/* Hero Banner with Orange and Green Glow & Author Attribution */}
    <div className="overview-hero">
      <div className="hero-content">
        <div className="hero-badge-row">
          <div className="hero-pill">
            <span className="hero-sparkle">✦</span>
            <span>Atlassian Codegeist 2026</span>
          </div>
          <div className="hero-author-pill">
            <Award size={14} style={{ color: '#f97316' }} />
            <span>Architected & Built by <strong>Adarsh Panicker</strong></span>
          </div>
        </div>

        <h1 className="hero-title">
          <span className="gradient-text-orange">Parallel</span><span className="gradient-text-green">OS</span>
          <span className="hero-subtitle-tag">Control Room</span>
        </h1>
        
        <p className="hero-tagline">
          One Organization. Infinite Possibilities.
        </p>

        <p className="hero-description">
          An enterprise digital twin for organizational decision making. Branch real-world operations into parallel copy-on-write scenarios, execute deterministic simulations across cascading dependencies, and explain strategic impacts with grounded AI intelligence.
        </p>

        <div className="hero-badges">
          <span className="tech-badge orange-badge">Deterministic Simulation</span>
          <span className="tech-badge green-badge">Copy-on-Write Overlays</span>
          <span className="tech-badge orange-badge">Provenance Verification</span>
          <span className="tech-badge green-badge">Grounded NVIDIA NIM AI</span>
          <span className="tech-badge orange-badge">Atlassian Forge Custom UI</span>
        </div>
      </div>

      <div className="hero-visual">
        <Logo size={110} showText={false} />
      </div>
    </div>

    <div className="overview-grid">
      <div className="overview-card">
        <div className="card-header">
          <div className="card-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', border: '2px solid #f97316' }}>
            <Building2 size={28} style={{ color: '#f97316' }} />
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
            <span className="stat-value" style={{ color: '#34d399' }}>$50M</span>
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
          <div className="card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10b981' }}>
            <Building size={28} style={{ color: '#10b981' }} />
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
          <div className="card-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', border: '2px solid #f97316' }}>
            <GitBranch size={28} style={{ color: '#f97316' }} />
          </div>
          <div>
            <h3 className="card-title">Active Scenarios</h3>
            <p className="card-desc">3 parallel futures branched from baseline</p>
          </div>
        </div>
        <div className="card-stats">
          <div className="stat-row">
            <span className="stat-label">Future A — Cost Optimization</span>
            <span className="stat-value" style={{ color: '#fb923c' }}>Draft</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Future B — Global Expansion</span>
            <span className="stat-value" style={{ color: '#34d399' }}>Active</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Future C — Tech Transformation</span>
            <span className="stat-value" style={{ color: '#a78bfa' }}>Planned</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn btn-primary">Open Scenario Lab</button>
        </div>
      </div>

      <div className="overview-card">
        <div className="card-header">
          <div className="card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10b981' }}>
            <Server size={28} style={{ color: '#10b981' }} />
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
            <span className="stat-value" style={{ color: '#34d399' }}>75%</span>
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
          <div className="card-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', border: '2px solid #f97316' }}>
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
            <span className="stat-value" style={{ color: '#34d399' }}>4</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Planned</span>
            <span className="stat-value">5</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Total Budget</span>
            <span className="stat-value" style={{ color: '#fb923c' }}>$18.2M</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn btn-primary">View Projects</button>
        </div>
      </div>

      <div className="overview-card">
        <div className="card-header">
          <div className="card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10b981' }}>
            <Handshake size={28} style={{ color: '#10b981' }} />
          </div>
          <div>
            <h3 className="card-title">Vendors & Partners</h3>
            <p className="card-desc">5 key enterprise vendors with contractual SLAs</p>
          </div>
        </div>
        <div className="card-stats">
          <div className="stat-row">
            <span className="stat-label">Enterprise Tier</span>
            <span className="stat-value">4/5</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Annual Spend</span>
            <span className="stat-value" style={{ color: '#fb923c' }}>$4.8M</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">SLA Compliance</span>
            <span className="stat-value" style={{ color: '#34d399' }}>99.2%</span>
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
          <div className="card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10b981' }}>
            <Server size={28} style={{ color: '#10b981' }} />
          </div>
          <div>
            <h3 className="card-title">Forge Connection</h3>
            <p className="card-desc">Live status check with Atlassian Forge bridge & resolvers</p>
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
          <div className="card-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', border: '2px solid #f97316' }}>
            <Database size={28} style={{ color: '#f97316' }} />
          </div>
          <div>
            <h3 className="card-title">Storage & Engine</h3>
            <p className="card-desc">Immutable baseline with copy-on-write scenario layer</p>
          </div>
        </div>
        <div className="card-stats">
          <div className="stat-row">
            <span className="stat-label">Baseline Entities</span>
            <span className="stat-value" style={{ color: '#fb923c' }}>68 loaded</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Baseline Relationships</span>
            <span className="stat-value" style={{ color: '#34d399' }}>176 verified</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Engine Integrity</span>
            <span className="stat-value" style={{ color: '#34d399' }}>100% Deterministic</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn btn-secondary">Inspect Model</button>
        </div>
      </div>
    </div>
  </div>
);

export default App;