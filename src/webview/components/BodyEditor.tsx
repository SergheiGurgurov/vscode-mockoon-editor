import type { MockoonResponse, MockoonRoute } from '../../types';
import type { VsCodeApi } from '../types';

interface BodyEditorProps {
  route: MockoonRoute;
  response: MockoonResponse;
  vscode: VsCodeApi;
  onFormat(): void;
}

export function BodyEditor({ route, response, vscode, onFormat }: BodyEditorProps) {
  return (
    <section className="editor-section d-grid gap-2 mt-4">
      <header className="d-flex align-items-center justify-content-between gap-2">
        <h3 className="section-title mb-0">Body</h3>
        <button className="btn btn-secondary btn-sm" onClick={onFormat}>Format JSON</button>
      </header>
      <textarea
        className="form-control body-editor"
        rows={16}
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
