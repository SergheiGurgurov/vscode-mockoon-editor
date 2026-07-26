import * as vscode from 'vscode';
import { createResponse, parseMockoonEnvironment, stringifyEnvironment } from './mockoonFile';
import { MockoonEnvironment, MockoonRoute } from './types';

type WebviewMessage =
  | { type: 'ready' }
  | { type: 'updateEnvironmentField'; field: 'port' | 'latency'; value: number }
  | { type: 'updateResponseField'; routeUuid: string; responseUuid: string; field: 'label' | 'statusCode' | 'latency'; value: string | number }
  | { type: 'updateBody'; routeUuid: string; responseUuid: string; body: string }
  | { type: 'addHeader'; routeUuid: string; responseUuid: string }
  | { type: 'updateHeader'; routeUuid: string; responseUuid: string; index: number; field: 'key' | 'value'; value: string }
  | { type: 'removeHeader'; routeUuid: string; responseUuid: string; index: number }
  | { type: 'addResponse'; routeUuid: string }
  | { type: 'setDefaultResponse'; routeUuid: string; responseUuid: string };

export class MockoonEditorProvider implements vscode.CustomTextEditorProvider {
  static readonly viewType = 'mockoonEditor.environmentEditor';

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): void {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'out')]
    };

    webviewPanel.webview.html = this.getHtml(webviewPanel.webview);

    const updateWebview = () => {
      const parsed = parseMockoonEnvironment(document.getText());
      webviewPanel.webview.postMessage(parsed.ok
        ? { type: 'state', environment: parsed.environment }
        : { type: 'error', error: parsed.error });
    };

    let pendingDocumentUpdate = Promise.resolve();

    const applyMessage = async (message: WebviewMessage) => {
      const parsed = parseMockoonEnvironment(document.getText());

      if (!parsed.ok) {
        webviewPanel.webview.postMessage({ type: 'error', error: parsed.error });
        return;
      }

      const changed = mutateEnvironment(parsed.environment, message);

      if (!changed) {
        return;
      }

      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, fullDocumentRange(document), stringifyEnvironment(parsed.environment));

      const applied = await vscode.workspace.applyEdit(edit);

      if (!applied) {
        vscode.window.showErrorMessage('Could not update the Mockoon environment document.');
      }
    };

    const messageSubscription = webviewPanel.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      if (message.type === 'ready') {
        updateWebview();
        return;
      }

      pendingDocumentUpdate = pendingDocumentUpdate.then(() => applyMessage(message), () => applyMessage(message));
      await pendingDocumentUpdate;
    });

    const changeSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });

    webviewPanel.onDidDispose(() => {
      changeSubscription.dispose();
      messageSubscription.dispose();
    });
    updateWebview();
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview.css'));
    const workerUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'editor.worker.js'));
    const nonce = String(Date.now());

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; worker-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>Mockoon Editor</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}">window.mockoonEditorWorkerUri = "${workerUri}";</script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function mutateEnvironment(environment: MockoonEnvironment, message: WebviewMessage): boolean {
  switch (message.type) {
    case 'updateEnvironmentField':
      environment[message.field] = cleanNumber(message.value, message.field === 'port' ? 1 : 0);
      return true;

    case 'updateResponseField': {
      const response = findResponse(environment, message.routeUuid, message.responseUuid);

      if (!response) {
        return false;
      }

      if (message.field === 'label') {
        response.label = String(message.value);
      } else if (message.field === 'statusCode') {
        response.statusCode = cleanNumber(Number(message.value), 0);
      } else {
        response.latency = cleanNumber(Number(message.value), 0);
      }

      return true;
    }

    case 'updateBody': {
      const response = findResponse(environment, message.routeUuid, message.responseUuid);

      if (!response) {
        return false;
      }

      response.body = message.body;
      return true;
    }

    case 'addHeader': {
      const response = findResponse(environment, message.routeUuid, message.responseUuid);

      if (!response) {
        return false;
      }

      response.headers = Array.isArray(response.headers) ? response.headers : [];
      response.headers.push({ key: '', value: '' });
      return true;
    }

    case 'updateHeader': {
      const response = findResponse(environment, message.routeUuid, message.responseUuid);
      const header = response?.headers?.[message.index];

      if (!header) {
        return false;
      }

      header[message.field] = message.value;
      return true;
    }

    case 'removeHeader': {
      const response = findResponse(environment, message.routeUuid, message.responseUuid);

      if (!response?.headers?.[message.index]) {
        return false;
      }

      response.headers.splice(message.index, 1);
      return true;
    }

    case 'addResponse': {
      const route = findRoute(environment, message.routeUuid);

      if (!route) {
        return false;
      }

      route.responses = Array.isArray(route.responses) ? route.responses : [];
      route.responses.push(createResponse(route.responses));
      return true;
    }

    case 'setDefaultResponse': {
      const route = findRoute(environment, message.routeUuid);

      if (!route) {
        return false;
      }

      route.responses.forEach((response) => {
        response.default = response.uuid === message.responseUuid;
      });
      return true;
    }

    case 'ready':
      return false;
  }
}

function findRoute(environment: MockoonEnvironment, routeUuid: string): MockoonRoute | undefined {
  return environment.routes.find((route) => route.uuid === routeUuid);
}

function findResponse(environment: MockoonEnvironment, routeUuid: string, responseUuid: string) {
  return findRoute(environment, routeUuid)?.responses.find((response) => response.uuid === responseUuid);
}

function fullDocumentRange(document: vscode.TextDocument): vscode.Range {
  const lastLine = document.lineAt(document.lineCount - 1);
  return new vscode.Range(new vscode.Position(0, 0), lastLine.range.end);
}

function cleanNumber(value: number, minimum: number): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.max(minimum, Math.trunc(value));
}
