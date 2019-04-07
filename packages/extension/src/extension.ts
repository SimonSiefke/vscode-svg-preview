import * as vscode from 'vscode'
import { previewPanel } from './preview'
import { shouldOpenTextDocument } from './util'
import { webViewPanelType } from './constants'
import { configuration } from './configuration'

// eslint-disable-next-line import/no-mutable-exports
export let context: vscode.ExtensionContext

/**
 * Activate the extension.
 */
export async function activate(c: vscode.ExtensionContext): Promise<void> {
  context = c
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
      if (
        !previewPanel.fsPath &&
        !configuration.get('autoOpen', textEditor.document.uri)
      ) {
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
    vscode.window.registerWebviewPanelSerializer(webViewPanelType, previewPanel)
  )
}

/**
 * Deactivate the extension.
 */
export function deactivate(): void {}
