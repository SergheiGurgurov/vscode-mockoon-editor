import type { MockoonHeader, MockoonResponse, MockoonRoute } from '../../types';
import type { VsCodeApi } from '../types';

interface HeaderEditorProps {
  route: MockoonRoute;
  response: MockoonResponse;
  vscode: VsCodeApi;
}

export function HeaderEditor({ route, response, vscode }: HeaderEditorProps) {
  return (
    <section className="editor-section d-grid gap-2 mt-4">
      <header className="d-flex align-items-center justify-content-between gap-2">
        <h3 className="section-title mb-0">Headers</h3>
        <button className="btn btn-secondary btn-sm" onClick={() => vscode.postMessage({ type: 'addHeader', routeUuid: route.uuid, responseUuid: response.uuid })}>
          Add header
        </button>
      </header>
      {response.headers.length === 0 ? <p className="empty-note text-secondary mb-0">No headers yet. Add one to return custom metadata with this response.</p> : null}
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
    <div className="header-row d-grid gap-2">
      <input className="form-control form-control-sm" defaultValue={header.key} placeholder="Header" onBlur={(event) => postHeader('key', event.currentTarget.value)} />
      <input className="form-control form-control-sm" defaultValue={header.value} placeholder="Value" onBlur={(event) => postHeader('value', event.currentTarget.value)} />
      <button
        className="btn btn-outline-danger btn-sm"
        title="Remove header"
        onClick={() => vscode.postMessage({ type: 'removeHeader', routeUuid: route.uuid, responseUuid: response.uuid, index })}
      >
        Remove
      </button>
    </div>
  );
}
