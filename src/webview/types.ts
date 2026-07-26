import type { MockoonEnvironment } from '../types';

export interface VsCodeApi {
  postMessage(message: unknown): void;
}

export type EditorState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; environment: MockoonEnvironment };

export type HostMessage =
  | { type: 'state'; environment: MockoonEnvironment }
  | { type: 'error'; error: string };
