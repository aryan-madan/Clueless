import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import VConsole from 'vconsole';

// Initialize vConsole for on-device debugging
// This puts a floating green 'vConsole' button on your screen
new VConsole({ theme: 'dark' });

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);