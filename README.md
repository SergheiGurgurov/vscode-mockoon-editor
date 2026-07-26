# Mockoon Editor

Edit [Mockoon](https://mockoon.com/) environment JSON files directly inside VS Code, without opening the standalone Mockoon app.

## Features

Open a `mockoon.json`, `mock.json`, `*.mockoon.json`, or `*.mock.json` file with **Open in Mockoon Editor** from the editor title bar or the Explorer context menu. The custom editor supports:

- Global `port` and `latency` edits
- Route browsing
- Response label, status, latency, body, and header edits
- Adding responses to existing routes
- Selecting the default response for a route

Route creation/deletion, OpenAPI import/export, and starting mock servers are intentionally out of scope.

## Usage

1. Open a folder containing a Mockoon environment file.
2. Right-click the file in the Explorer, or use the icon in the editor title bar, and choose **Open in Mockoon Editor**.
3. Edit routes, responses, headers, and body content using the visual editor.
4. Changes are saved back to the underlying JSON file.
