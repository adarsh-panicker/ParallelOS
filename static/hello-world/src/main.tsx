import { setupMockBridge } from './services/mockBridge';

// Initialize mock bridge for standalone browser testing (outside Atlassian Forge iframe)
setupMockBridge();

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
