import type { MockoonRoute } from '../../types';

interface RouteListProps {
  routes: MockoonRoute[];
  selectedRouteId?: string;
  onSelect(route: MockoonRoute): void;
}

export function RouteList({ routes, selectedRouteId, onSelect }: RouteListProps) {
  return (
    <aside className="routes overflow-auto p-2 border-end">
      <div className="list-group list-group-flush gap-1">
        {routes.map((route) => (
          <button
            key={route.uuid}
            className={`route-item list-group-item list-group-item-action border-0 rounded px-2 py-2 ${route.uuid === selectedRouteId ? 'active' : ''}`}
            onClick={() => onSelect(route)}
            title={`${route.method.toUpperCase()} /${route.endpoint}${route.documentation ? ` - ${route.documentation}` : ''}`}
          >
            <span className="method-badge fw-bold small text-uppercase">{route.method}</span>
            <span className="endpoint d-block text-truncate">/{route.endpoint}</span>
            <small className="d-block text-secondary text-truncate">{route.documentation ?? ''}</small>
            <span className="text-secondary small">{route.responses.length} response{route.responses.length === 1 ? '' : 's'}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
