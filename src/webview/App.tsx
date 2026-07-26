import React, { useEffect, useMemo, useState } from 'react';
import type { MockoonEnvironment, MockoonHeader, MockoonResponse, MockoonRoute } from '../types';

export interface VsCodeApi {
  postMessage(message: unknown): void;
}

type EditorState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; environment: MockoonEnvironment };

type HostMessage =
  | { type: 'state'; environment: MockoonEnvironment }
  | { type: 'error'; error: string };

interface AppProps {
  vscode: VsCodeApi;
}

export function App({ vscode }: AppProps) {
  const [state, setState] = useState<EditorState>({ status: 'loading' });
  const [selectedRouteId, setSelectedRouteId] = useState<string>();
  const [selectedResponseId, setSelectedResponseId] = useState<string>();
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    const listener = (event: MessageEvent<HostMessage>) => {
      const message = event.data;

      if (message.type === 'state') {
        setState({ status: 'ready', environment: message.environment });
        return;
      }

      if (message.type === 'error') {
        setState({ status: 'error', error: message.error });
      }
    };

    window.addEventListener('message', listener);
    vscode.postMessage({ type: 'ready' });

    return () => window.removeEventListener('message', listener);
  }, [vscode]);

  const environment = state.status === 'ready' ? state.environment : undefined;
  const selectedRoute = useMemo(() => {
    return environment?.routes.find((route) => route.uuid === selectedRouteId) ?? environment?.routes[0];
  }, [environment, selectedRouteId]);

  const selectedResponse = useMemo(() => {
    return selectedRoute?.responses.find((response) => response.uuid === selectedResponseId)
      ?? selectedRoute?.responses.find((response) => response.default)
      ?? selectedRoute?.responses[0];
  }, [selectedRoute, selectedResponseId]);

  useEffect(() => {
    if (!selectedRoute) {
      return;
    }

    if (selectedRoute.uuid !== selectedRouteId) {
      setSelectedRouteId(selectedRoute.uuid);
    }

    if (selectedResponse && selectedResponse.uuid !== selectedResponseId) {
      setSelectedResponseId(selectedResponse.uuid);
    }
  }, [selectedRoute, selectedRouteId, selectedResponse, selectedResponseId]);

  useEffect(() => {
    if (!status) {
      return;
    }

    const timeout = window.setTimeout(() => setStatus(undefined), 2400);
    return () => window.clearTimeout(timeout);
  }, [status]);

  if (state.status === 'loading') {
    return <main className="empty">Loading Mockoon editor...</main>;
  }

  if (state.status === 'error') {
    return (
      <main className="empty">
        <h1>Cannot open this Mockoon file</h1>
        <p>{state.error}</p>
      </main>
    );
  }

  return (
    <>
      <main className="layout">
        <EnvironmentBar environment={state.environment} vscode={vscode} />
        <RouteList
          routes={state.environment.routes}
          selectedRouteId={selectedRoute?.uuid}
          onSelect={(route) => {
            setSelectedRouteId(route.uuid);
            setSelectedResponseId(undefined);
          }}
        />
        <section className="detail">
          {selectedRoute ? (
            <RouteDetail
              route={selectedRoute}
              response={selectedResponse}
              selectedResponseId={selectedResponse?.uuid}
              vscode={vscode}
              onSelectResponse={setSelectedResponseId}
              onStatus={setStatus}
            />
          ) : (
            <p>No routes in this environment.</p>
          )}
        </section>
      </main>
      {status ? <div className="status">{status}</div> : null}
    </>
  );
}

function EnvironmentBar({ environment, vscode }: { environment: MockoonEnvironment; vscode: VsCodeApi }) {
  return (
    <section className="topbar">
      <div>
        <h1>{environment.name ?? 'Mockoon environment'}</h1>
        <span>{environment.routes.length} routes</span>
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

function RouteList({ routes, selectedRouteId, onSelect }: { routes: MockoonRoute[]; selectedRouteId?: string; onSelect: (route: MockoonRoute) => void }) {
  return (
    <aside className="routes">
      {routes.map((route) => (
        <button
          key={route.uuid}
          className={`route ${route.uuid === selectedRouteId ? 'selected' : ''}`}
          onClick={() => onSelect(route)}
        >
          <span className="method">{route.method.toUpperCase()}</span>
          <span className="endpoint">/{route.endpoint}</span>
          <small>{route.documentation ?? ''}</small>
          <em>{route.responses.length} response{route.responses.length === 1 ? '' : 's'}</em>
        </button>
      ))}
    </aside>
  );
}

interface RouteDetailProps {
  route: MockoonRoute;
  response?: MockoonResponse;
  selectedResponseId?: string;
  vscode: VsCodeApi;
  onSelectResponse(responseUuid: string): void;
  onStatus(text: string): void;
}

function RouteDetail({ route, response, selectedResponseId, vscode, onSelectResponse, onStatus }: RouteDetailProps) {
  if (!response) {
    return (
      <header className="detail-head">
        <div>
          <h2>/{route.endpoint}</h2>
          <p>No responses yet.</p>
        </div>
        <button onClick={() => vscode.postMessage({ type: 'addResponse', routeUuid: route.uuid })}>Add response</button>
      </header>
    );
  }

  const postResponseField = (field: 'label' | 'statusCode' | 'latency', value: string | number) => {
    vscode.postMessage({
      type: 'updateResponseField',
      routeUuid: route.uuid,
      responseUuid: response.uuid,
      field,
      value
    });
  };

  const formatBody = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(response.body || ''), null, 2);
      vscode.postMessage({ type: 'updateBody', routeUuid: route.uuid, responseUuid: response.uuid, body: formatted });
    } catch {
      onStatus('Body is not plain JSON, so it was left unchanged.');
    }
  };

  return (
    <>
      <header className="detail-head">
        <div>
          <h2><span>{route.method.toUpperCase()}</span> /{route.endpoint}</h2>
          <p>{route.documentation ?? ''}</p>
        </div>
        <button onClick={() => vscode.postMessage({ type: 'addResponse', routeUuid: route.uuid })}>Add response</button>
      </header>

      <nav className="responses">
        {route.responses.map((item) => (
          <button
            key={item.uuid}
            className={`response ${item.uuid === selectedResponseId ? 'selected' : ''}`}
            onClick={() => onSelectResponse(item.uuid)}
          >
            {item.default ? <span className="default-dot" /> : null}
            {item.label || item.statusCode}
          </button>
        ))}
      </nav>

      <section className="form-grid">
        <TextField label="Label" value={response.label} onCommit={(value) => postResponseField('label', value)} />
        <NumberField label="Status" value={response.statusCode} onCommit={(value) => postResponseField('statusCode', value)} />
        <NumberField label="Latency" value={response.latency} onCommit={(value) => postResponseField('latency', value)} />
        <button
          className="default-button"
          onClick={() => vscode.postMessage({ type: 'setDefaultResponse', routeUuid: route.uuid, responseUuid: response.uuid })}
        >
          Set default
        </button>
      </section>

      <HeaderEditor route={route} response={response} vscode={vscode} />
      <BodyEditor route={route} response={response} vscode={vscode} onFormat={formatBody} />
    </>
  );
}

function HeaderEditor({ route, response, vscode }: { route: MockoonRoute; response: MockoonResponse; vscode: VsCodeApi }) {
  return (
    <section className="headers-block">
      <header>
        <h3>Headers</h3>
        <button onClick={() => vscode.postMessage({ type: 'addHeader', routeUuid: route.uuid, responseUuid: response.uuid })}>Add header</button>
      </header>
      {response.headers.length === 0 ? <p className="muted">No headers.</p> : null}
      {response.headers.map((header, index) => (
        <HeaderRow
          key={`${response.uuid}-${index}`}
          header={header}
          index={index}
          route={route}
          response={response}
          vscode={vscode}
        />
      ))}
    </section>
  );
}

function HeaderRow({ header, index, route, response, vscode }: { header: MockoonHeader; index: number; route: MockoonRoute; response: MockoonResponse; vscode: VsCodeApi }) {
  const postHeader = (field: 'key' | 'value', value: string) => {
    vscode.postMessage({
      type: 'updateHeader',
      routeUuid: route.uuid,
      responseUuid: response.uuid,
      index,
      field,
      value
    });
  };

  return (
    <div className="header-row">
      <input defaultValue={header.key} placeholder="Header" onBlur={(event) => postHeader('key', event.currentTarget.value)} />
      <input defaultValue={header.value} placeholder="Value" onBlur={(event) => postHeader('value', event.currentTarget.value)} />
      <button
        title="Remove header"
        onClick={() => vscode.postMessage({ type: 'removeHeader', routeUuid: route.uuid, responseUuid: response.uuid, index })}
      >
        Remove
      </button>
    </div>
  );
}

function BodyEditor({ route, response, vscode, onFormat }: { route: MockoonRoute; response: MockoonResponse; vscode: VsCodeApi; onFormat(): void }) {
  return (
    <section className="body-block">
      <header>
        <h3>Body</h3>
        <button onClick={onFormat}>Format JSON</button>
      </header>
      <textarea
        key={`${response.uuid}:${response.body ?? ''}`}
        spellCheck={false}
        defaultValue={response.body ?? ''}
        onBlur={(event) => vscode.postMessage({
          type: 'updateBody',
          routeUuid: route.uuid,
          responseUuid: response.uuid,
          body: event.currentTarget.value
        })}
      />
    </section>
  );
}

function TextField({ label, value, onCommit }: { label: string; value: string; onCommit(value: string): void }) {
  return (
    <label>
      {label}
      <input defaultValue={value} onBlur={(event) => onCommit(event.currentTarget.value)} />
    </label>
  );
}

function NumberField({ label, value, min, max, onCommit }: { label: string; value: number; min?: number; max?: number; onCommit(value: number): void }) {
  return (
    <label>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        defaultValue={value}
        onBlur={(event) => onCommit(Number(event.currentTarget.value))}
      />
    </label>
  );
}
