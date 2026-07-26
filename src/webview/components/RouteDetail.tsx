import type { MockoonResponse, MockoonRoute } from '../../types';
import type { VsCodeApi } from '../types';
import { BodyEditor } from './BodyEditor';
import { NumberField, TextField } from './Fields';
import { HeaderEditor } from './HeaderEditor';

interface RouteDetailProps {
  route: MockoonRoute;
  response?: MockoonResponse;
  selectedResponseId?: string;
  vscode: VsCodeApi;
  onSelectResponse(responseUuid: string): void;
  onStatus(text: string): void;
}

export function RouteDetail({ route, response, selectedResponseId, vscode, onSelectResponse, onStatus }: RouteDetailProps) {
  if (!response) {
    return (
      <header className="d-flex justify-content-between gap-3 mb-3">
        <div>
          <h2 className="fs-5 mb-0">/{route.endpoint}</h2>
          <p className="text-secondary mb-0">No responses yet.</p>
        </div>
        <button className="btn btn-primary btn-sm align-self-start" onClick={() => vscode.postMessage({ type: 'addResponse', routeUuid: route.uuid })}>
          Add response
        </button>
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

  const selectedResponseIndex = route.responses.findIndex((item) => item.uuid === response.uuid);

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
      <header className="d-flex justify-content-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="fs-5 mb-0 text-truncate">
            <span className="method-badge me-2">{route.method.toUpperCase()}</span>/{route.endpoint}
          </h2>
          <p className="text-secondary mb-0 text-truncate" title={route.documentation ?? undefined}>{route.documentation ?? ''}</p>
        </div>
        <button className="btn btn-primary btn-sm align-self-start" onClick={() => vscode.postMessage({ type: 'addResponse', routeUuid: route.uuid })}>
          Add response
        </button>
      </header>

      <section className="response-strip mb-3">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
          <span className="text-secondary small">
            Response {selectedResponseIndex + 1} of {route.responses.length}
          </span>
          {response.default ? <span className="default-label small">Default response</span> : null}
        </div>
        <nav className="d-flex gap-2 flex-wrap">
          {route.responses.map((item) => (
            <button
              key={item.uuid}
              className={`response-tab btn btn-sm ${item.uuid === selectedResponseId ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onSelectResponse(item.uuid)}
              title={item.default ? `${item.label || item.statusCode} (default)` : String(item.label || item.statusCode)}
            >
              {item.default ? <span className="default-dot" aria-hidden="true" /> : null}
              <span className="text-truncate">{item.label || item.statusCode}</span>
            </button>
          ))}
        </nav>
      </section>

      <section className="response-form d-grid gap-2 align-items-end mb-3">
        <TextField label="Label" value={response.label} onCommit={(value) => postResponseField('label', value)} />
        <NumberField label="Status" value={response.statusCode} onCommit={(value) => postResponseField('statusCode', value)} />
        <NumberField label="Latency" value={response.latency} onCommit={(value) => postResponseField('latency', value)} />
        <button
          className="btn btn-secondary btn-sm"
          disabled={response.default}
          onClick={() => vscode.postMessage({ type: 'setDefaultResponse', routeUuid: route.uuid, responseUuid: response.uuid })}
        >
          {response.default ? 'Default' : 'Set default'}
        </button>
      </section>

      <HeaderEditor route={route} response={response} vscode={vscode} />
      <BodyEditor route={route} response={response} vscode={vscode} onFormat={formatBody} />
    </>
  );
}
