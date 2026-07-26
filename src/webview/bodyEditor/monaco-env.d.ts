declare global {
  interface Window {
    MonacoEnvironment?: unknown;
    mockoonEditorWorkerUri: string;
    mockoonJsonWorkerUri: string;
  }

  var MonacoEnvironment: unknown;
}

export {};
