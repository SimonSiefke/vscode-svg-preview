import * as vscode from 'vscode'
import { PreviewPanel, createPreviewPanel } from './preview'
import * as config from './config'

/**
 * The preview panel.
 */
let previewPanel: PreviewPanel

function shouldOpenTextDocument(textDocument: vscode.TextDocument): boolean {
  // 1. its preview already open
  if (previewPanel.fsPath === textDocument.uri.fsPath) {
    return false
  }
  // 2. its preview is not open and its not an svg
  if (
    textDocument.languageId !== 'xml' ||
    !textDocument.fileName.endsWith('.svg')
  ) {
    return false
  }
  // 3. its preview is not open and its an svg
  return true
}

/**
 * Activate the extension.
 */
export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  previewPanel = createPreviewPanel(context)
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('svgPreview.open', textEditor => {
      const textDocument = textEditor.document
      if (shouldOpenTextDocument(textDocument)) {
        previewPanel.fsPath = textDocument.uri.fsPath
        previewPanel.content = textDocument.getText()
      }
    })
  )
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(textEditor => {
      const textDocument = textEditor.document
      if (shouldOpenTextDocument(textDocument)) {
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
