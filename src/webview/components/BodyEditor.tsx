import { useEffect, useRef, useState } from 'react';
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import type { MockoonResponse, MockoonRoute } from '../../types';
import { canFormat, configureMonacoTheme, describeMode, detectBodyMode, formatBody, languageIdForMode, registerMockoonBodyLanguage } from '../bodyEditor';
import { getConfiguredMonaco } from '../bodyEditor/monacoSetup';
import type { VsCodeApi } from '../types';

let bodyEditorMonacoConfigured = false;

interface BodyEditorProps {
  route: MockoonRoute;
  response: MockoonResponse;
  vscode: VsCodeApi;
  onStatus(text: string): void;
}

export function BodyEditor({ route, response, vscode, onStatus }: BodyEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const currentTarget = useRef({ routeUuid: route.uuid, responseUuid: response.uuid });
  const isSyncingBody = useRef(false);
  const pendingBodyUpdate = useRef<{ routeUuid: string; responseUuid: string; body: string } | undefined>(undefined);
  const [mode, setMode] = useState(() => detectBodyMode(response.body ?? ''));

  useEffect(() => {
    currentTarget.current = { routeUuid: route.uuid, responseUuid: response.uuid };
  }, [route.uuid, response.uuid]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const monaco = getBodyEditorMonaco();
    const editorFont = getEditorFont();

    const editor = monaco.editor.create(containerRef.current, {
      automaticLayout: true,
      fontFamily: editorFont.family,
      fontSize: editorFont.size,
      lineHeight: Math.round(editorFont.size * 1.5),
      language: languageIdForMode(mode),
      minimap: { enabled: false },
      padding: { top: 10, bottom: 10 },
      scrollBeyondLastLine: false,
      tabSize: 2,
      theme: 'mockoon-vscode',
      value: response.body ?? '',
      wordWrap: 'on'
    });

    editorRef.current = editor;

    requestAnimationFrame(() => {
      editor.layout();
    });

    const changeSubscription = editor.onDidChangeModelContent(() => {
      const body = editor.getValue();
      const nextMode = detectBodyMode(body);
      setMode(nextMode);

      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, languageIdForMode(nextMode));
      }

      if (!isSyncingBody.current) {
        const { routeUuid, responseUuid } = currentTarget.current;
        pendingBodyUpdate.current = { routeUuid, responseUuid, body };
        vscode.postMessage({ type: 'updateBody', routeUuid, responseUuid, body });
      }
    });

    return () => {
      changeSubscription.dispose();
      editor.dispose();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const body = response.body ?? '';
    const pending = pendingBodyUpdate.current;

    if (pending && pending.routeUuid === route.uuid && pending.responseUuid === response.uuid) {
      if (body === pending.body) {
        pendingBodyUpdate.current = undefined;
      } else {
        return;
      }
    }

    const nextMode = detectBodyMode(body);
    const model = editor.getModel();

    setMode(nextMode);

    if (model) {
      const monaco = getBodyEditorMonaco();
      monaco.editor.setModelLanguage(model, languageIdForMode(nextMode));

      if (model.getValue() !== body) {
        isSyncingBody.current = true;

        try {
          editor.setValue(body);
        } finally {
          isSyncingBody.current = false;
        }
      }
    }
  }, [response.uuid, response.body]);

  const handleFormat = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const result = formatBody(editor.getValue(), mode);

    if (!result.ok) {
      onStatus(result.message);
      return;
    }

    editor.setValue(result.body);
  };

  const handleValidateTemplate = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    vscode.postMessage({
      type: 'validateTemplate',
      routeUuid: route.uuid,
      responseUuid: response.uuid,
      body: editor.getValue(),
      expectJson: mode === 'json' || mode === 'mockoon-template-json'
    });
  };

  return (
    <section className="editor-section d-grid gap-2 mt-4">
      <header className="body-editor-header d-flex align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2">
          <h3 className="section-title mb-0">Body</h3>
          <span className="body-mode-badge">{describeMode(mode)}</span>
        </div>
        <div className="body-editor-actions d-flex align-items-center gap-2">
          <button className="btn btn-primary btn-sm" disabled={response.disableTemplating} onClick={handleValidateTemplate} title={response.disableTemplating ? 'Templating is disabled for this response' : 'Render this body with Mockoon template helpers and validate the result'}>
            Validate template
          </button>
          <button className="btn btn-secondary btn-sm" disabled={!canFormat(mode)} onClick={handleFormat} title={canFormat(mode) ? 'Format JSON body' : 'Formatting is only available for plain JSON bodies in this slice'}>
            Format
          </button>
        </div>
      </header>
      <div className="body-editor" ref={containerRef} />
    </section>
  );
}

function getEditorFont() {
  const styles = getComputedStyle(document.documentElement);
  const family = styles.getPropertyValue('--vscode-editor-font-family').trim()
    || styles.getPropertyValue('--vscode-font-family').trim()
    || 'Consolas, "Courier New", monospace';
  const size = Number.parseInt(styles.getPropertyValue('--vscode-editor-font-size'), 10) || 13;

  return { family, size };
}

function getBodyEditorMonaco() {
  const monaco = getConfiguredMonaco();

  if (!bodyEditorMonacoConfigured) {
    bodyEditorMonacoConfigured = true;
    registerMockoonBodyLanguage(monaco);
    configureMonacoTheme(monaco);
  }

  return monaco;
}
