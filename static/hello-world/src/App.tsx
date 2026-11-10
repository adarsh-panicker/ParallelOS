import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

interface HealthCheckResult {
  status: string;
  timestamp: number;
}

interface WriteResult {
  success: boolean;
  entity?: {
    id: string;
    value: string;
    timestamp: number;
  };
  error?: string;
}

interface ReadResult {
  success: boolean;
  entity?: {
    id: string;
    value: string;
    timestamp: number;
  } | null;
  error?: string;
}

interface ListResult {
  entities: Array<{
    id: string;
    value: string;
    timestamp: number;
  }>;
  nextCursor?: string;
}

function App() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [writeResult, setWriteResult] = useState<WriteResult | null>(null);
  const [readResult, setReadResult] = useState<ReadResult | null>(null);
  const [listResult, setListResult] = useState<ListResult | null>(null);
  const [writeValue, setWriteValue] = useState('Hello from ParallelOS Phase 0!');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runHealthCheck = async () => {
    setLoading('healthCheck');
    setError(null);
    try {
      const response = await invoke<HealthCheckResult>('healthCheck');
      const data = 'body' in response ? response.body : response;
      setHealth(data);
    } catch (err) {
      setError(`Health check failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(null);
    }
  };

  const runWrite = async () => {
    setLoading('writeTestValue');
    setError(null);
    try {
      const response = await invoke<WriteResult>('writeTestValue', { value: writeValue });
      const data = 'body' in response ? response.body : response;
      setWriteResult(data);
      if (data.success) {
        // Auto-read after write
        await runRead();
      }
    } catch (err) {
      setError(`Write failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(null);
    }
  };

  const runRead = async () => {
    setLoading('readTestValue');
    setError(null);
    try {
      const response = await invoke<ReadResult>('readTestValue');
      const data = 'body' in response ? response.body : response;
      setReadResult(data);
    } catch (err) {
      setError(`Read failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(null);
    }
  };

  const runList = async () => {
    setLoading('listTestEntities');
    setError(null);
    try {
      const response = await invoke<ListResult>('listTestEntities');
      const data = 'body' in response ? response.body : response;
      setListResult(data);
    } catch (err) {
      setError(`List failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(null);
    }
  };

  // Run health check on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runHealthCheck();
  }, []);

  const formatJson = (obj: unknown): string => {
    return JSON.stringify(obj, null, 2);
  };

  const syntaxHighlight = (json: string): React.ReactNode => {
    const lines = json.split('\n');
    return (
      <pre style={{ margin: 0 }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex' }}>
            <span style={{ color: 'var(--text-muted)', marginRight: '12px', userSelect: 'none' }}>{i + 1}</span>
            <span>{highlightLine(line)}</span>
          </div>
        ))}
      </pre>
    );
  };

  const highlightLine = (line: string): React.ReactNode => {
    // Simple syntax highlighting
    const parts = line.split(/(".*?")|(:)|(true|false|null)|(\d+)/g).filter(Boolean);
    return parts.map((part, i) => {
      if (part.startsWith('"') && part.endsWith('"') && part.includes(':')) {
        return <span key={i} className="result-key">{part}</span>;
      }
      if (part.startsWith('"') && part.endsWith('"')) {
        return <span key={i} className="result-string">{part}</span>;
      }
      if (part === 'true' || part === 'false') {
        return <span key={i} className="result-boolean">{part}</span>;
      }
      if (part === 'null') {
        return <span key={i} className="result-null">{part}</span>;
      }
      if (/^\d+$/.test(part)) {
        return <span key={i} className="result-number">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-title">
          <div className="header-logo">P</div>
          <h1>ParallelOS</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Phase 0 — Vertical Slice</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {health && (
            <span className="status-badge status-success">
              ● Forge Connected
            </span>
          )}
        </div>
      </header>

      <main className="main">
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Phase 0: Vertical Slice Verification
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px' }}>
            This minimal app proves the Forge pipeline works end-to-end: Custom UI (React + TypeScript) → Resolver → Custom Entity Store.
          </p>
        </div>

        {/* Health Check Card */}
        <div className="card">
          <div className="card-title">Health Check</div>
          <div className="flex-row">
            <button
              className="button button-primary"
              onClick={runHealthCheck}
              disabled={loading === 'healthCheck'}
            >
              {loading === 'healthCheck' ? 'Checking...' : 'Run Health Check'}
            </button>
            {health && (
              <span className="status-badge status-success">
                Status: {health.status} at {new Date(health.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
          {health && (
            <div className="result-box" style={{ marginTop: '16px' }}>
              {syntaxHighlight(formatJson(health))}
            </div>
          )}
        </div>

        {/* Write to Storage Card */}
        <div className="card">
          <div className="card-title">Write to Custom Entity Store</div>
          <div className="flex-col" style={{ maxWidth: '500px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Value to store
              </label>
              <input
                type="text"
                className="input"
                value={writeValue}
                onChange={(e) => setWriteValue(e.target.value)}
                placeholder="Enter a value to store..."
              />
            </div>
            <div className="flex-row">
              <button
                className="button button-primary"
                onClick={runWrite}
                disabled={loading === 'writeTestValue' || !writeValue.trim()}
              >
                {loading === 'writeTestValue' ? 'Writing...' : 'Write Value'}
              </button>
            </div>
          </div>
          {writeResult && (
            <div className="result-box" style={{ marginTop: '16px' }}>
              {syntaxHighlight(formatJson(writeResult))}
            </div>
          )}
        </div>

        {/* Read from Storage Card */}
        <div className="card">
          <div className="card-title">Read from Custom Entity Store</div>
          <div className="flex-row">
            <button
              className="button button-secondary"
              onClick={runRead}
              disabled={loading === 'readTestValue'}
            >
              {loading === 'readTestValue' ? 'Reading...' : 'Read Value'}
            </button>
            <button
              className="button button-secondary"
              onClick={runList}
              disabled={loading === 'listTestEntities'}
            >
              {loading === 'listTestEntities' ? 'Listing...' : 'List All Entities'}
            </button>
          </div>
          {readResult && (
            <div className="result-box" style={{ marginTop: '16px' }}>
              {syntaxHighlight(formatJson(readResult))}
            </div>
          )}
          {listResult && (
            <div className="result-box" style={{ marginTop: '16px' }}>
              {syntaxHighlight(formatJson(listResult))}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="card" style={{ borderColor: 'var(--error)' }}>
            <div className="card-title" style={{ color: 'var(--error)' }}>
              Error
            </div>
            <div className="status-badge status-error" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
              {error}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="card">
          <div className="card-title">Architecture Verified</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--accent-blue)' }}>✓ Custom UI</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>React 18 + TypeScript + Vite</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--accent-blue)' }}>✓ Resolver</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>/src/index.ts with @forge/resolver</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--accent-blue)' }}>✓ Storage</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Custom Entity Store (@forge/kvs)</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--accent-blue)' }}>✓ Validation</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Zod schemas on read/write</div>
            </div>
          </div>
        </div>

        <div className="section-divider" />

        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          <p>ParallelOS — One Organization. Infinite Possibilities.</p>
          <p style={{ marginTop: '8px' }}>Codegeist 2026 | Atlassian Forge</p>
        </div>
      </main>
    </div>
  );
}

export default App;