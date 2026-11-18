// Fallback bridge for standalone browser testing (outside Atlassian Forge iframe)
if (typeof window !== 'undefined' && !(window as any).__bridge) {
  (window as any).__bridge = {
    callBridge: async (fn: string, payload: any) => {
      console.info('[Local Browser Mode] Bridge call:', fn, payload);
      if (fn === 'healthCheck') {
        return { status: 'local-preview', timestamp: Date.now() };
      }
      return { status: 200, body: {} };
    },
  };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);