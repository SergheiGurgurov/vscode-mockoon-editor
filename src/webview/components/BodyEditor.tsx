import { useEffect, useRef, useState } from 'react';
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import type { MockoonResponse, MockoonRoute } from '../../types';
import { canFormat, describeMode, detectBodyMode, formatBody, languageIdForMode, validateBodyModel } from '../bodyEditor';
import { getConfiguredMonaco } from '../bodyEditor/monacoSetup';
import type { VsCodeApi } from '../types';

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
  const [mode, setMode] = useState(() => detectBodyMode(response.body ?? ''));

  useEffect(() => {
    currentTarget.current = { routeUuid: route.uuid, responseUuid: response.uuid };
  }, [route.uuid, response.uuid]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const monaco = getConfiguredMonaco();
    const editorFont = getEditorFont();
    const editor = monaco.editor.create(containerRef.current, {
      automaticLayout: true,
      fontFamily: editorFont.family,
      fontSize: editorFont.size,
      glyphMargin: true,
      lineHeight: Math.round(editorFont.size * 1.5),
      language: languageIdForMode(mode),
      minimap: { enabled: false },
      overviewRulerLanes: 3,
      padding: { top: 10, bottom: 10 },
      renderValidationDecorations: 'on',
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

    const blurSubscription = editor.onDidBlurEditorWidget(() => {
      const { routeUuid, responseUuid } = currentTarget.current;
      vscode.postMessage({ type: 'updateBody', routeUuid, responseUuid, body: editor.getValue() });
    });

    const changeSubscription = editor.onDidChangeModelContent(() => {
      const nextMode = detectBodyMode(editor.getValue());
      setMode(nextMode);

      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, languageIdForMode(nextMode));
        validateBodyModel(monaco, model, nextMode);
      }
    });

    const model = editor.getModel();
    if (model) {
      validateBodyModel(monaco, model, mode);
    }

    return () => {
      blurSubscription.dispose();
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
    const nextMode = detectBodyMode(body);
    const model = editor.getModel();

    setMode(nextMode);

    if (model) {
      const monaco = getConfiguredMonaco();
      monaco.editor.setModelLanguage(model, languageIdForMode(nextMode));

      if (model.getValue() !== body) {
        editor.setValue(body);
      }

      validateBodyModel(monaco, model, nextMode);
    }
  }, [response.uuid, response.body]);

  const handleFormat = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const result = formatBody(editor.getValue(), mode);

    if (!result.ok) {
      const monaco = getConfiguredMonaco();
      const model = editor.getModel();

      if (model) {
        validateBodyModel(monaco, model, mode);
      }

      onStatus(result.message);
      return;
    }

    editor.setValue(result.body);
    vscode.postMessage({ type: 'updateBody', routeUuid: route.uuid, responseUuid: response.uuid, body: result.body });
  };

  return (
    <section className="editor-section d-grid gap-2 mt-4">
      <header className="d-flex align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2">
          <h3 className="section-title mb-0">Body</h3>
          <span className="body-mode-badge">{describeMode(mode)}</span>
        </div>
        <button className="btn btn-secondary btn-sm" disabled={!canFormat(mode)} onClick={handleFormat} title={canFormat(mode) ? 'Format JSON body' : 'Formatting is only available for plain JSON bodies in this slice'}>
          Format
        </button>
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
