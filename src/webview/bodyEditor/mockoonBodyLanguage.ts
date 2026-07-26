import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';

export type BodyMode = 'json' | 'mockoon-template-json' | 'text';

const templateLanguageId = 'mockoon-template-json';
let languageRegistered = false;

export function detectBodyMode(body: string): BodyMode {
  if (body.includes('{{')) {
    return looksLikeJson(body) ? 'mockoon-template-json' : 'text';
  }

  try {
    JSON.parse(body || 'null');
    return 'json';
  } catch {
    return looksLikeJson(body) ? 'json' : 'text';
  }
}

export function languageIdForMode(mode: BodyMode): string {
  if (mode === 'json' || mode === 'mockoon-template-json') {
    return templateLanguageId;
  }

  return 'plaintext';
}

export function describeMode(mode: BodyMode): string {
  if (mode === 'mockoon-template-json') {
    return 'Template JSON';
  }

  return mode === 'json' ? 'JSON' : 'Text';
}

export function canFormat(mode: BodyMode): boolean {
  return mode === 'json';
}

export function formatBody(body: string, mode: BodyMode): { ok: true; body: string } | { ok: false; message: string } {
  if (mode !== 'json') {
    return {
      ok: false,
      message: mode === 'mockoon-template-json'
        ? 'Template bodies are not formatted yet because Mockoon block helpers can produce JSON fragments.'
        : 'Only JSON response bodies can be formatted.'
    };
  }

  try {
    return { ok: true, body: JSON.stringify(JSON.parse(body || 'null'), null, 2) };
  } catch (error) {
    return { ok: false, message: `Body is not valid JSON: ${error instanceof Error ? error.message : 'unknown parse error'}.` };
  }
}

export function registerMockoonBodyLanguage(monaco: typeof Monaco): void {
  if (languageRegistered) {
    return;
  }

  languageRegistered = true;
  monaco.languages.register({ id: templateLanguageId });
  monaco.languages.setLanguageConfiguration(templateLanguageId, {
    brackets: [['{', '}'], ['[', ']']],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  });

  monaco.languages.setMonarchTokensProvider(templateLanguageId, {
    tokenizer: {
      root: [
        [/{{\s*#\s*[\w.-]+/, 'mockoon-template-block'],
        [/{{\s*\/\s*[\w.-]+\s*}}/, 'mockoon-template-block'],
        [/{{\s*[\w.-]+/, 'mockoon-template-helper'],
        [/}}/, 'mockoon-template-helper'],
        [/"([^"\\]|\\.)*"(?=\s*:)/, 'string.key'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/-?\d+(\.\d+)?([eE][+-]?\d+)?/, 'number'],
        [/\b(true|false|null)\b/, 'keyword'],
        [/[{}[\],:]/, 'delimiter'],
        [/[^{}[\],:"'\s]+/, 'identifier']
      ]
    }
  });
}

export function configureMonacoTheme(monaco: typeof Monaco): void {
  const styles = getComputedStyle(document.documentElement);
  const background = cleanColor(styles.getPropertyValue('--vscode-editor-background'), '#1e1e1e');
  const foreground = cleanColor(styles.getPropertyValue('--vscode-foreground'), '#d4d4d4');
  const lineHighlight = cleanColor(styles.getPropertyValue('--vscode-editor-lineHighlightBackground'), '#2a2d2e');
  const selection = cleanColor(styles.getPropertyValue('--vscode-editor-selectionBackground'), '#264f78');
  const border = cleanColor(styles.getPropertyValue('--vscode-panel-border'), '#3c3c3c');

  monaco.editor.defineTheme('mockoon-vscode', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'mockoon-template-helper', foreground: 'dcdcaa', fontStyle: 'bold' },
      { token: 'mockoon-template-block', foreground: '4ec9b0', fontStyle: 'bold' },
      { token: 'string.key', foreground: '9cdcfe' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'number', foreground: 'b5cea8' },
      { token: 'keyword', foreground: '569cd6' }
    ],
    colors: {
      'editor.background': background,
      'editor.foreground': foreground,
      'editor.lineHighlightBackground': lineHighlight,
      'editor.selectionBackground': selection,
      'editorWidget.border': border,
      'focusBorder': cleanColor(styles.getPropertyValue('--vscode-focusBorder'), border)
    }
  });
}

function looksLikeJson(body: string): boolean {
  const trimmed = body.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

function cleanColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith('#') ? trimmed : fallback;
}
