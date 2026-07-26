import React from 'react';
import { createRoot } from 'react-dom/client';
import { App, VsCodeApi } from './App';
import './styles.css';

declare const acquireVsCodeApi: () => VsCodeApi;

const root = document.getElementById('app');

if (root) {
  createRoot(root).render(<App vscode={acquireVsCodeApi()} />);
}
