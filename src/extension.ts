import * as vscode from 'vscode';
import { MockoonEditorProvider } from './mockoonEditorProvider';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      MockoonEditorProvider.viewType,
      new MockoonEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mockoonEditor.open', async (uri?: vscode.Uri) => {
      const target = uri ?? vscode.window.activeTextEditor?.document.uri;

      if (!target) {
        vscode.window.showInformationMessage('Open a Mockoon JSON file first.');
        return;
      }

      await vscode.commands.executeCommand('vscode.openWith', target, MockoonEditorProvider.viewType);
    })
  );
}

export function deactivate() {}
