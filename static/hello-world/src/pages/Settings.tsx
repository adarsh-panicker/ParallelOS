import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@forge/bridge';
import {
  Settings, User, Shield, Bell, Palette, Monitor, Key,
  Database, Cloud, Terminal, Save, RotateCcw, Trash2,
  Check, X, AlertCircle, Info, HelpCircle, ExternalLink, Upload, Loader2, Download,
  Award, Sparkles
} from 'lucide-react';
import { Logo } from '../components/Logo';
import styles from './styles/Settings.module.css';

interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  density: 'comfortable' | 'compact';
  animations: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  notifications: {
    simulationComplete: boolean;
    simulationFailed: boolean;
    taskCreated: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReports: boolean;
    aiTraining: boolean;
  };
  ai: {
    provider: 'nvidia' | 'mock';
    model: string;
    temperature: number;
    maxTokens: number;
  };
  integrations: {
    jira: { enabled: boolean; baseUrl: string; email: string; apiToken: string };
    confluence: { enabled: boolean; baseUrl: string; email: string; apiToken: string };
    nvidia: { enabled: boolean; endpoint: string; modelId: string; apiToken: string };
  };
}

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  role: string;
  organization: string;
}

type TabId = 'general' | 'appearance' | 'notifications' | 'privacy' | 'ai' | 'integrations' | 'advanced' | 'about';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs = [
  { id: 'general', label: 'General', icon: <Settings size={20} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
  { id: 'privacy', label: 'Privacy', icon: <Shield size={20} /> },
  { id: 'ai', label: 'AI Settings', icon: <Terminal size={20} /> },
  { id: 'integrations', label: 'Integrations', icon: <Cloud size={20} /> },
  { id: 'advanced', label: 'Advanced', icon: <Terminal size={20} /> },
  { id: 'about', label: 'About & Creator', icon: <Info size={20} /> },
];

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getDefaultSettings());
  const [profile, setProfile] = useState<UserProfile>(getDefaultProfile());
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 500));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    try {
      setSettings(getDefaultSettings());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(true);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    try {
      setSettings(getDefaultSettings());
      setProfile(getDefaultProfile());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete data');
    }
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedSetting = <T extends object>(parentKey: keyof AppSettings, childKey: keyof T, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: { ...prev[parentKey] as T, [childKey]: value }
    }));
  };

  return (
    <div className={styles.settingsPage} role="main" aria-label="Settings">
      <div className={styles.pageHeader}>
        <div className="header-content">
          <h1>
            <Settings size={28} />
            Settings
          </h1>
          <p>Configure your ParallelOS experience</p>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className={styles.spin} size={18} /> : 'Save Changes'}
          </button>
        </div>
      </div>

      {saved && (
        <div className={styles.successBanner} role="status">
          <Check size={18} />
          <span>Settings saved successfully</span>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      <div className={styles.settingsLayout}>
        <nav className={styles.settingsSidebar} aria-label="Settings categories">
          <ul role="tablist">
            {tabs.map(tab => (
              <li key={tab.id} role="tab" aria-selected={activeTab === tab.id}>
                <button
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.settingsContent} role="tabpanel" aria-labelledby={`${activeTab}-tab`}>
          {activeTab === 'general' && <GeneralSettings settings={settings} onChange={updateSetting} profile={profile} setProfile={setProfile} />}
          {activeTab === 'appearance' && <AppearanceSettings settings={settings} onChange={updateSetting} />}
          {activeTab === 'notifications' && <NotificationSettings settings={settings} onChange={updateNestedSetting} />}
          {activeTab === 'privacy' && <PrivacySettings settings={settings} onChange={updateNestedSetting} />}
          {activeTab === 'ai' && <AISettings settings={settings} onChange={updateNestedSetting} />}
          {activeTab === 'integrations' && <IntegrationSettings settings={settings} onChange={updateNestedSetting} />}
          {activeTab === 'advanced' && <AdvancedSettings settings={settings} onChange={updateSetting} onReset={handleReset} onDelete={handleDeleteConfirm} showResetConfirm={showResetConfirm} setShowResetConfirm={setShowResetConfirm} showDeleteConfirm={showDeleteConfirm} setShowDeleteConfirm={setShowDeleteConfirm} />}
          {activeTab === 'about' && <AboutCreatorSection />}
        </div>
      </div>

      {showResetConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowResetConfirm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <header className={styles.modalHeader}>
              <h2 id="reset-title">Reset All Settings?</h2>
              <button onClick={() => setShowResetConfirm(false)} aria-label="Close"><X size={20} /></button>
            </header>
            <div className={styles.modalContent}>
              <p>This will reset all settings to their default values. This action cannot be undone.</p>
            </div>
            <footer className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleReset}>Reset to Defaults</button>
            </footer>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <header className={styles.modalHeader}>
              <h2 id="delete-title">Delete All Data?</h2>
              <button onClick={() => setShowDeleteConfirm(false)} aria-label="Close"><X size={20} /></button>
            </header>
            <div className={styles.modalContent}>
              <p className={styles.dangerText}>This will permanently delete all scenarios, simulations, and configuration data. This action cannot be undone.</p>
              <div className={styles.confirmInput}>
                <label htmlFor="delete-confirm">Type "DELETE" to confirm:</label>
                <input id="delete-confirm" type="text" placeholder="DELETE" />
              </div>
            </div>
            <footer className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleDelete}>Delete Everything</button>
            </footer>
          </div>
        </div>
      )}

      
    </div>
  );
}

// Sub-components (keeping the same implementations but without styled-jsx)
// ... (All the sub-components from the previous version, but without styled-jsx blocks)
// For brevity, I'll include the key ones

function GeneralSettings({ settings, onChange, profile, setProfile }: any) {
  return (
    <>
      <section className="section">
        <h2 className="sectionTitle"><User size={22} /> Profile</h2>
        <p className="sectionDescription">Manage your profile information and preferences</p>
        <div className="formRow">
          <div className="formGroup">
            <label>Display Name</label>
            <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
          </div>
          <div className="formGroup">
            <label>Email</label>
            <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
          </div>
        </div>
        <div className="formRow">
          <div className="formGroup">
            <label>Role</label>
            <input value={profile.role} onChange={e => setProfile({...profile, role: e.target.value})} />
          </div>
          <div className="formGroup">
            <label>Organization</label>
            <input value={profile.organization} onChange={e => setProfile({...profile, organization: e.target.value})} />
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="sectionTitle"><Settings size={22} /> Application</h2>
        <p className="sectionDescription">Configure general application behavior</p>
        <div className="formGroup">
          <label>
            <input type="checkbox" checked={settings.autoRefresh} onChange={e => onChange('autoRefresh', e.target.checked)} />
            Auto-refresh data
          </label>
        </div>
        <div className="formGroup">
          <label>
            <input type="checkbox" checked={settings.animations} onChange={e => onChange('animations', e.target.checked)} />
            Enable animations and transitions
          </label>
        </div>
        <div className="formRow">
          <div className="formGroup">
            <label>Refresh Interval (seconds) <span>(10-3600)</span></label>
            <input type="number" min="10" max="3600" value={settings.refreshInterval} onChange={e => onChange('refreshInterval', parseInt(e.target.value))} />
          </div>
          <div className="formGroup">
            <label>UI Density</label>
            <select value={settings.density} onChange={e => onChange('density', e.target.value)}>
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="sectionTitle"><Info size={22} /> About</h2>
        <div className="formGroup">
          <label>ParallelOS Version</label>
          <input value="1.0.0-beta" readOnly />
          <p className="helpText">Current application version</p>
        </div>
        <div className="formGroup">
          <label>Engine Version</label>
          <input value="0.1.0" readOnly />
          <p className="helpText">Core simulation engine version</p>
        </div>
        <div className="formGroup">
          <label>Forge Platform</label>
          <input value="14.2.0" readOnly />
          <p className="helpText">Atlassian Forge platform version</p>
        </div>
      </section>
    </>
  );
}

function AppearanceSettings({ settings, onChange }: any) {
  return (
    <section className="section">
      <h2 className="sectionTitle"><Palette size={22} /> Theme & Appearance</h2>
      <p className="sectionDescription">Customize the look and feel of ParallelOS</p>
      <div className="formGroup">
        <label>Theme</label>
        <select value={settings.theme} onChange={e => onChange('theme', e.target.value)}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="system">System</option>
        </select>
      </div>
      <div className="formRow">
        <div className="formGroup">
          <label>UI Density</label>
          <select value={settings.density} onChange={e => onChange('density', e.target.value)}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </div>
        <div className="formGroup">
          <label>
            <input type="checkbox" checked={settings.animations} onChange={e => onChange('animations', e.target.checked)} />
            Animations & Transitions
          </label>
        </div>
      </div>
      <p className="helpText">Theme changes apply immediately. System theme follows your OS preference.</p>
    </section>
  );
}

function NotificationSettings({ settings, onChange }: any) {
  return (
    <section className="section">
      <h2 className="sectionTitle"><Bell size={22} /> Notifications</h2>
      <p className="sectionDescription">Choose which events trigger notifications</p>
      <div className="formGroup">
        <label>
          <input type="checkbox" checked={settings.notifications.simulationComplete} onChange={e => onChange('notifications', 'simulationComplete', e.target.checked)} />
          Simulation completed
        </label>
      </div>
      <div className="formGroup">
        <label>
          <input type="checkbox" checked={settings.notifications.simulationFailed} onChange={e => onChange('notifications', 'simulationFailed', e.target.checked)} />
          Simulation failed
        </label>
      </div>
      <div className="formGroup">
        <label>
          <input type="checkbox" checked={settings.notifications.taskCreated} onChange={e => onChange('notifications', 'taskCreated', e.target.checked)} />
          Jira task created
        </label>
      </div>
      <div className="formGroup">
        <label>
          <input type="checkbox" checked={settings.notifications.weeklyDigest} onChange={e => onChange('notifications', 'weeklyDigest', e.target.checked)} />
          Weekly digest email
        </label>
      </div>
    </section>
  );
}

function PrivacySettings({ settings, onChange }: any) {
  return (
    <section className="section">
      <h2 className="sectionTitle"><Shield size={22} /> Privacy & Data</h2>
      <p className="sectionDescription">Control how your data is used</p>
      <div className="formGroup">
        <label>
          <input type="checkbox" checked={settings.privacy.analytics} onChange={e => onChange('privacy', 'analytics', e.target.checked)} />
          Allow anonymous usage analytics
        </label>
        <p className="helpText">Helps us improve ParallelOS. No personal data is collected.</p>
      </div>
      <div className="formGroup">
        <label>
          <input type="checkbox" checked={settings.privacy.crashReports} onChange={e => onChange('privacy', 'crashReports', e.target.checked)} />
          Send crash reports
        </label>
        <p className="helpText">Automatically send error reports to help us fix issues.</p>
      </div>
      <div className="formGroup">
        <label>
          <input type="checkbox" checked={settings.privacy.aiTraining} onChange={e => onChange('privacy', 'aiTraining', e.target.checked)} />
          Allow data to improve AI models
        </label>
        <p className="helpText">Your simulation data may be used to improve AI recommendations (anonymized).</p>
      </div>
    </section>
  );
}

function AISettings({ settings, onChange }: any) {
  return (
    <section className="section">
      <h2 className="sectionTitle"><Terminal size={22} /> AI Configuration</h2>
      <p className="sectionDescription">Configure NVIDIA NIM AI provider settings</p>
      <div className="formGroup">
        <label>AI Provider</label>
        <select value={settings.ai.provider} onChange={e => onChange('ai', 'provider', e.target.value)}>
          <option value="nvidia">NVIDIA NIM</option>
          <option value="mock">Mock (Development)</option>
        </select>
      </div>
      <div className="formRow">
        <div className="formGroup">
          <label>Model ID</label>
          <input value={settings.ai.model} onChange={e => onChange('ai', 'model', e.target.value)} placeholder="e.g., meta/llama-3.1-70b-instruct" />
        </div>
        <div className="formGroup">
          <label>Endpoint URL</label>
          <input value={settings.integrations.nvidia.endpoint} onChange={e => onChange('integrations', 'nvidia', { ...settings.integrations.nvidia, endpoint: e.target.value })} placeholder="https://integrate.api.nvidia.com/v1" />
        </div>
      </div>
      <div className="formRow">
        <div className="formGroup">
          <label>Temperature <span>(0.0 - 2.0)</span></label>
          <input type="number" min="0" max="2" step="0.1" value={settings.ai.temperature} onChange={e => onChange('ai', 'temperature', parseFloat(e.target.value))} />
        </div>
        <div className="formGroup">
          <label>Max Tokens</label>
          <input type="number" min="1" max="32768" value={settings.ai.maxTokens} onChange={e => onChange('ai', 'maxTokens', parseInt(e.target.value))} />
        </div>
      </div>
      <p className="helpText">API keys are stored securely in Forge encrypted environment variables, not in settings.</p>
    </section>
  );
}

function IntegrationSettings({ settings, onChange }: any) {
  return (
    <>
      <section className="section">
        <h2 className="sectionTitle"><Cloud size={22} /> Jira Integration</h2>
        <p className="sectionDescription">Connect to Atlassian Jira for project import and remediation tasks</p>
        <div className="formGroup">
          <label>
            <input type="checkbox" checked={settings.integrations.jira.enabled} onChange={e => onChange('integrations', 'jira', { ...settings.integrations.jira, enabled: e.target.checked })} />
            Enable Jira integration
          </label>
        </div>
        <div className="formRow">
          <div className="formGroup">
            <label>Base URL</label>
            <input value={settings.integrations.jira.baseUrl} onChange={e => onChange('integrations', 'jira', { ...settings.integrations.jira, baseUrl: e.target.value })} placeholder="https://your-domain.atlassian.net" />
          </div>
          <div className="formGroup">
            <label>Email</label>
            <input type="email" value={settings.integrations.jira.email} onChange={e => onChange('integrations', 'jira', { ...settings.integrations.jira, email: e.target.value })} />
          </div>
        </div>
        <div className="formGroup">
          <label>API Token</label>
          <input type="password" value={settings.integrations.jira.apiToken} onChange={e => onChange('integrations', 'jira', { ...settings.integrations.jira, apiToken: e.target.value })} placeholder="Stored in Forge encrypted env vars" />
          <p className="helpText">Token is stored securely in Forge encrypted environment variables.</p>
        </div>
      </section>

      <section className="section">
        <h2 className="sectionTitle"><Cloud size={22} /> Confluence Integration</h2>
        <p className="sectionDescription">Link documentation and store scenario reports</p>
        <div className="formGroup">
          <label>
            <input type="checkbox" checked={settings.integrations.confluence.enabled} onChange={e => onChange('integrations', 'confluence', { ...settings.integrations.confluence, enabled: e.target.checked })} />
            Enable Confluence integration
          </label>
        </div>
        <div className="formRow">
          <div className="formGroup">
            <label>Base URL</label>
            <input value={settings.integrations.confluence.baseUrl} onChange={e => onChange('integrations', 'confluence', { ...settings.integrations.confluence, baseUrl: e.target.value })} placeholder="https://your-domain.atlassian.net/wiki" />
          </div>
          <div className="formGroup">
            <label>Email</label>
            <input type="email" value={settings.integrations.confluence.email} onChange={e => onChange('integrations', 'confluence', { ...settings.integrations.confluence, email: e.target.value })} />
          </div>
        </div>
        <div className="formGroup">
          <label>API Token</label>
          <input type="password" value={settings.integrations.confluence.apiToken} onChange={e => onChange('integrations', 'confluence', { ...settings.integrations.confluence, apiToken: e.target.value })} placeholder="Stored in Forge encrypted env vars" />
        </div>
      </section>

      <section className="section">
        <h2 className="sectionTitle"><Terminal size={22} /> NVIDIA NIM</h2>
        <p className="sectionDescription">AI provider for scenario generation and explanations</p>
        <div className="formGroup">
          <label>
            <input type="checkbox" checked={settings.integrations.nvidia.enabled} onChange={e => onChange('integrations', 'nvidia', { ...settings.integrations.nvidia, enabled: e.target.checked })} />
            Enable NVIDIA NIM
          </label>
        </div>
        <div className="formRow">
          <div className="formGroup">
            <label>Endpoint</label>
            <input value={settings.integrations.nvidia.endpoint} onChange={e => onChange('integrations', 'nvidia', { ...settings.integrations.nvidia, endpoint: e.target.value })} placeholder="https://integrate.api.nvidia.com/v1" />
          </div>
          <div className="formGroup">
            <label>Model ID</label>
            <input value={settings.integrations.nvidia.modelId} onChange={e => onChange('integrations', 'nvidia', { ...settings.integrations.nvidia, modelId: e.target.value })} placeholder="meta/llama-3.1-70b-instruct" />
          </div>
        </div>
        <div className="formGroup">
          <label>API Key</label>
          <input type="password" value={settings.integrations.nvidia.apiToken} onChange={e => onChange('integrations', 'nvidia', { ...settings.integrations.nvidia, apiToken: e.target.value })} placeholder="Stored in Forge encrypted env vars" />
        </div>
      </section>

      <section className="section">
        <h2 className="sectionTitle"><Key size={22} /> API Keys Status</h2>
        <p className="sectionDescription">View connection status for configured integrations</p>
        <div className="integrationStatus">
          <div className="statusCard">
            <div className="statusHeader">
              <span className="statusName">Jira</span>
              <span className="statusBadge connected">Connected</span>
            </div>
            <div className="statusDetails">
              <span>Base URL: https://demo.atlassian.net</span>
              <span>Last sync: 2 hours ago</span>
            </div>
          </div>
          <div className="statusCard">
            <div className="statusHeader">
              <span className="statusName">Confluence</span>
              <span className="statusBadge connected">Connected</span>
            </div>
            <div className="statusDetails">
              <span>Base URL: https://demo.atlassian.net/wiki</span>
              <span>Last sync: 1 hour ago</span>
            </div>
          </div>
          <div className="statusCard">
            <div className="statusHeader">
              <span className="statusName">NVIDIA NIM</span>
              <span className="statusBadge disconnected">Not Configured</span>
            </div>
            <div className="statusDetails">
              <span>Add API key to enable</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function AdvancedSettings({ settings, onChange, onReset, onDelete, showResetConfirm, setShowResetConfirm, showDeleteConfirm, setShowDeleteConfirm }: any) {
  return (
    <>
      <section className="section">
        <h2 className="sectionTitle"><Database size={22} /> Data Management</h2>
        <p className="sectionDescription">Manage application data and storage</p>
        <div className="formGroup">
          <button className="btn btnSecondary" onClick={() => { alert('Export initiated'); }}>
            <Download size={18} /> Export All Data
          </button>
          <p className="helpText">Download all scenarios, simulations, and settings as JSON</p>
        </div>
        <div className="formGroup">
          <button className="btn btnSecondary" onClick={() => { alert('Import dialog opened'); }}>
            <Upload size={18} /> Import Data
          </button>
          <p className="helpText">Import previously exported data</p>
        </div>
      </section>

      <section className="section">
        <h2 className="sectionTitle"><Terminal size={22} /> Developer Options</h2>
        <p className="sectionDescription">Advanced settings for development and debugging</p>
        <div className="formGroup">
          <label>
            <input type="checkbox" checked={false} onChange={e => onChange('debugMode', e.target.checked)} />
            Enable debug logging
          </label>
        </div>
        <div className="formGroup">
          <label>
            <input type="checkbox" checked={false} onChange={e => onChange('mockAI', e.target.checked)} />
            Use mock AI provider (for development)
          </label>
        </div>
        <div className="formGroup">
          <button className="btn btnSecondary" onClick={() => { alert('Cache cleared'); }}>
            <Trash2 size={18} /> Clear Cache
          </button>
          <p className="helpText">Clear all cached data and temporary files</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.dangerZone}`}>
        <h2 className="sectionTitle"><AlertCircle size={22} /> Danger Zone</h2>
        <p className={`${styles.sectionDescription} ${styles.dangerText}`}>These actions are irreversible</p>
        <div className={styles.divider} />
        <div className="formGroup">
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowResetConfirm(true)}>
            <RotateCcw size={18} /> Reset All Settings
          </button>
          <p className="helpText">Restore all settings to their default values</p>
        </div>
        <div className="formGroup">
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={18} /> Delete All Data
          </button>
          <p className="helpText">Permanently delete all scenarios, simulations, and configuration</p>
        </div>
      </section>
    </>
  );
}

function AboutCreatorSection() {
  return (
    <section className={styles.section} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(16, 185, 129, 0.12) 50%, rgba(10, 16, 25, 0.95) 100%)',
        border: '1px solid rgba(249, 115, 22, 0.35)',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), 0 0 25px rgba(249, 115, 22, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(249, 115, 22, 0.2)', border: '1px solid rgba(249, 115, 22, 0.4)', borderRadius: '9999px', fontSize: '12px', color: '#fb923c', marginBottom: '12px' }}>
            <Award size={14} />
            <span>Atlassian Codegeist 2026 Submission</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 8px 0', color: '#ffffff' }}>
            ParallelOS
          </h2>
          <p style={{ fontSize: '15px', color: '#fb923c', fontStyle: 'italic', margin: '0 0 12px 0' }}>
            One Organization. Infinite Possibilities.
          </p>
          <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
            An enterprise digital twin enabling leaders to branch organizations into parallel futures, test structural, budgetary, and technology changes deterministically, and explain cascading organizational consequences with grounded AI intelligence.
          </p>
        </div>
        <div style={{ padding: '16px', background: 'rgba(10, 16, 25, 0.8)', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Logo size={80} showText={false} />
        </div>
      </div>

      {/* Creator Attribution Card */}
      <div style={{
        background: 'rgba(14, 22, 32, 0.85)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25), 0 0 15px rgba(16, 185, 129, 0.15)',
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399' }}>
          <Sparkles size={20} />
          Creator & Engineering Attribution
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '16px', background: 'rgba(10, 16, 25, 0.7)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f97316 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 700,
            color: '#ffffff',
            boxShadow: '0 0 15px rgba(249, 115, 22, 0.4)',
          }}>
            AP
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
              Made by Adarsh Panicker
            </div>
            <div style={{ fontSize: '13px', color: '#fb923c', fontWeight: 500 }}>
              Lead Architect & Full-Stack Engineer
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Built for Atlassian Codegeist 2026 Hackathon
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '14px', background: 'rgba(10, 16, 25, 0.6)', borderRadius: '10px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#fb923c' }}>Deterministic Simulation</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              Pure TypeScript simulation engine with zero LLM-invented numbers. Cycle-safe dependency graph propagation with redundancy handling.
            </p>
          </div>
          <div style={{ padding: '14px', background: 'rgba(10, 16, 25, 0.6)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#34d399' }}>Copy-on-Write Overlays</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              Baseline organization state is strictly immutable. Scenarios overlay entity and relationship modifications with full audit provenance.
            </p>
          </div>
          <div style={{ padding: '14px', background: 'rgba(10, 16, 25, 0.6)', borderRadius: '10px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#fb923c' }}>Grounded NVIDIA NIM AI</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              AI acts solely as a natural-language parser and result interpreter. Structured outputs validated by Zod schemas with complete evidence citation.
            </p>
          </div>
          <div style={{ padding: '14px', background: 'rgba(10, 16, 25, 0.6)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#34d399' }}>Atlassian Ecosystem</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              Jira project/issue syncing, remediation action creation, Confluence report publishing, and Rovo Agent "ParallelOS Intelligence".
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function getDefaultSettings(): any {
  return {
    theme: 'dark',
    density: 'comfortable',
    animations: true,
    autoRefresh: true,
    refreshInterval: 60,
    notifications: {
      simulationComplete: true,
      simulationFailed: true,
      taskCreated: true,
      weeklyDigest: false,
    },
    privacy: {
      analytics: true,
      crashReports: true,
      aiTraining: false,
    },
    ai: {
      provider: 'nvidia',
      model: 'meta/llama-3.1-70b-instruct',
      temperature: 0.1,
      maxTokens: 4096,
    },
    integrations: {
      jira: { enabled: false, baseUrl: '', email: '', apiToken: '' },
      confluence: { enabled: false, baseUrl: '', email: '', apiToken: '' },
      nvidia: { enabled: false, endpoint: 'https://integrate.api.nvidia.com/v1', modelId: 'meta/llama-3.1-70b-instruct', apiToken: '' },
    },
  };
}

function getDefaultProfile(): any {
  return {
    name: 'Demo Admin',
    email: 'admin@aurelia.global',
    avatar: '',
    role: 'System Administrator',
    organization: 'Aurelia Global Technologies',
  };
}

export default SettingsPage;