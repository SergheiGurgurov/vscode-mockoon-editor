import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import { configureMonacoTheme, registerMockoonBodyLanguage } from './mockoonBodyLanguage';

let configured = false;

export function getConfiguredMonaco() {
  if (!configured) {
    configured = true;
    self.MonacoEnvironment = {
      getWorker(_workerId, label) {
        return new Worker(label === 'json' ? window.mockoonJsonWorkerUri : window.mockoonEditorWorkerUri);
      }
    };

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      trailingCommas: 'error'
    });

    registerMockoonBodyLanguage(monaco);
    configureMonacoTheme(monaco);
  }

  return monaco;
}
