import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import type { VsCodeApi } from './types';
import bootstrapStyles from 'bootstrap/dist/css/bootstrap.min.css';
import webviewStyles from './styles.css';

void bootstrapStyles;
void webviewStyles;

declare const acquireVsCodeApi: () => VsCodeApi;

const root = document.getElementById('app');

if (root) {
  createRoot(root).render(<App vscode={acquireVsCodeApi()} />);
}
