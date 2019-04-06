import * as vscode from 'vscode'
import * as config from './config'
import { createPreviewPanel, PreviewPanel } from './preview'
import { shouldOpenTextDocument } from './util'

/**
 * The preview panel.
 */
let previewPanel: PreviewPanel

/**
 * Activate the extension.
 */
export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  console.log('activate')
  previewPanel = createPreviewPanel(context)
  const options = {
    get autoOpen() {
      return vscode.workspace
        .getConfiguration('svgPreview')
        .get<boolean>('autoOpen')
    },
  }
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'svgPreview.showPreview',
      textEditor => {
        const textDocument = textEditor.document
        if (shouldOpenTextDocument(textDocument, previewPanel.fsPath)) {
          previewPanel.viewColumn = vscode.ViewColumn.Active
          previewPanel.fsPath = textDocument.uri.fsPath
          previewPanel.content = textDocument.getText()
        }
      }
    )
  )
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'svgPreview.showPreviewToSide',
      textEditor => {
        const textDocument = textEditor.document
        if (shouldOpenTextDocument(textDocument, previewPanel.fsPath)) {
          previewPanel.viewColumn = vscode.ViewColumn.Beside
          previewPanel.fsPath = textDocument.uri.fsPath
          previewPanel.content = textDocument.getText()
        }
      }
    )
  )
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(textEditor => {
      if (!options.autoOpen && !previewPanel.fsPath) {
        return
      }
      const textDocument = textEditor.document
      if (shouldOpenTextDocument(textDocument, previewPanel.fsPath)) {
        previewPanel.viewColumn = vscode.ViewColumn.Beside
        previewPanel.fsPath = textDocument.uri.fsPath
        previewPanel.content = textDocument.getText()
      }
    })
  )
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      const shouldUpdateTextDocument =
        event.contentChanges.length > 0 &&
        event.document.uri.fsPath === previewPanel.fsPath
      if (shouldUpdateTextDocument) {
        previewPanel.content = event.document.getText()
      }
    })
  )
  context.subscriptions.push(
    vscode.window.registerWebviewPanelSerializer(
      config.webViewPanelType,
      previewPanel
    )
  )
}

/**
 * Deactivate the extension.
 */
export function deactivate(): void {}
