# Mockoon Editor

A small VS Code extension for editing Mockoon environment JSON files without opening the standalone Mockoon app.

## Run locally

```bash
npm install
npm run compile
```

Then press `F5` in VS Code and open `docs/mockoon.json` in the Extension Development Host.

## Use

Open a JSON file and choose **Open in Mockoon Editor** from the editor title bar or Explorer context menu. The custom editor supports:

- Global `port` and `latency` edits
- Route browsing
- Response label, status, latency, body, and header edits
- Adding responses to existing routes
- Selecting the default response for a route

Route creation/deletion, OpenAPI import/export, and starting mock servers are intentionally out of scope.

The extension host keeps file parsing and JSON edits in plain TypeScript. The Webview UI is built with React and VS Code theme variables.
