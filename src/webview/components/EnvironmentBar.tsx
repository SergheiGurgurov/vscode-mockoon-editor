import type { MockoonEnvironment } from '../../types';
import type { VsCodeApi } from '../types';
import { NumberField } from './Fields';

interface EnvironmentBarProps {
  environment: MockoonEnvironment;
  vscode: VsCodeApi;
}

export function EnvironmentBar({ environment, vscode }: EnvironmentBarProps) {
  return (
    <section className="topbar d-grid align-items-end gap-3 px-3 py-2 border-bottom">
      <div className="min-w-0">
        <h1 className="fs-6 fw-semibold mb-0 text-truncate">{environment.name ?? 'Mockoon environment'}</h1>
        <span className="text-secondary small">{environment.routes.length} routes</span>
      </div>
      <NumberField
        label="Port"
        min={1}
        max={65535}
        value={environment.port}
        onCommit={(value) => vscode.postMessage({ type: 'updateEnvironmentField', field: 'port', value })}
      />
      <NumberField
        label="Latency"
        min={0}
        value={environment.latency}
        onCommit={(value) => vscode.postMessage({ type: 'updateEnvironmentField', field: 'latency', value })}
      />
    </section>
  );
}
