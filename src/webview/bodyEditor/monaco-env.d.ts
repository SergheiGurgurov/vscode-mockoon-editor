declare global {
  interface Window {
    MonacoEnvironment?: unknown;
    mockoonEditorWorkerUri: string;
  }

  var MonacoEnvironment: unknown;
}

export {};
