import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

let configured = false;

export function getConfiguredMonaco() {
  if (!configured) {
    configured = true;
    self.MonacoEnvironment = {
      getWorker() {
        return new Worker(window.mockoonEditorWorkerUri);
      }
    };
  }

  return monaco;
}
