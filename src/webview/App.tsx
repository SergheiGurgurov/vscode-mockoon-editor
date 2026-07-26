import { EnvironmentBar } from './components/EnvironmentBar';
import { RouteDetail } from './components/RouteDetail';
import { RouteList } from './components/RouteList';
import { StatusToast } from './components/StatusToast';
import { useMockoonEditor } from './hooks/useMockoonEditor';
import type { VsCodeApi } from './types';

interface AppProps {
  vscode: VsCodeApi;
}

export function App({ vscode }: AppProps) {
  const {
    state,
    selectedRoute,
    selectedResponse,
    selectedResponseId,
    setSelectedRouteId,
    setSelectedResponseId,
    status,
    setStatus
  } = useMockoonEditor(vscode);

  if (state.status === 'loading') {
    return <main className="empty">Loading Mockoon editor...</main>;
  }

  if (state.status === 'error') {
    return (
      <main className="empty">
        <h1 className="fs-5">Cannot open this Mockoon file</h1>
        <p className="text-secondary">{state.error}</p>
      </main>
    );
  }

  return (
    <>
      <main className="app-shell">
        <EnvironmentBar environment={state.environment} vscode={vscode} />
        <RouteList
          routes={state.environment.routes}
          selectedRouteId={selectedRoute?.uuid}
          onSelect={(route) => {
            setSelectedRouteId(route.uuid);
            setSelectedResponseId(undefined);
          }}
        />
        <section className="detail-pane overflow-auto p-3">
          {selectedRoute ? (
            <RouteDetail
              route={selectedRoute}
              response={selectedResponse}
              selectedResponseId={selectedResponseId}
              vscode={vscode}
              onSelectResponse={setSelectedResponseId}
              onStatus={setStatus}
            />
          ) : (
            <p className="text-secondary">No routes in this environment.</p>
          )}
        </section>
      </main>
      <StatusToast text={status} />
    </>
  );
}
