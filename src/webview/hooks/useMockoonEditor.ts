import { useEffect, useMemo, useState } from 'react';
import type { MockoonResponse, MockoonRoute } from '../../types';
import type { EditorState, HostMessage, VsCodeApi } from '../types';

export function useMockoonEditor(vscode: VsCodeApi) {
  const [state, setState] = useState<EditorState>({ status: 'loading' });
  const [selectedRouteId, setSelectedRouteId] = useState<string>();
  const [selectedResponseId, setSelectedResponseId] = useState<string>();
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    const listener = (event: MessageEvent<HostMessage>) => {
      const message = event.data;

      if (message.type === 'state') {
        setState({ status: 'ready', environment: message.environment });
        return;
      }

      if (message.type === 'error') {
        setState({ status: 'error', error: message.error });
      }
    };

    window.addEventListener('message', listener);
    vscode.postMessage({ type: 'ready' });

    return () => window.removeEventListener('message', listener);
  }, [vscode]);

  const environment = state.status === 'ready' ? state.environment : undefined;
  const selectedRoute = useMemo<MockoonRoute | undefined>(() => {
    return environment?.routes.find((route) => route.uuid === selectedRouteId) ?? environment?.routes[0];
  }, [environment, selectedRouteId]);

  const selectedResponse = useMemo<MockoonResponse | undefined>(() => {
    return selectedRoute?.responses.find((response) => response.uuid === selectedResponseId)
      ?? selectedRoute?.responses.find((response) => response.default)
      ?? selectedRoute?.responses[0];
  }, [selectedRoute, selectedResponseId]);

  useEffect(() => {
    if (!selectedRoute) {
      return;
    }

    if (selectedRoute.uuid !== selectedRouteId) {
      setSelectedRouteId(selectedRoute.uuid);
    }

    if (selectedResponse && selectedResponse.uuid !== selectedResponseId) {
      setSelectedResponseId(selectedResponse.uuid);
    }
  }, [selectedRoute, selectedRouteId, selectedResponse, selectedResponseId]);

  useEffect(() => {
    if (!status) {
      return;
    }

    const timeout = window.setTimeout(() => setStatus(undefined), 2400);
    return () => window.clearTimeout(timeout);
  }, [status]);

  return {
    state,
    selectedRoute,
    selectedResponse,
    selectedRouteId,
    selectedResponseId,
    setSelectedRouteId,
    setSelectedResponseId,
    status,
    setStatus
  };
}
