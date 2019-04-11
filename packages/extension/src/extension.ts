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
  /**
   * Whether or not the last text editor event was a close event or not
   */
  let lastEventWasClose = false
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'svgPreview.showPreview',
      textEditor => {
        const textDocument = textEditor.document
        if (shouldOpenTextDocument(textDocument, previewPanel.fsPath)) {
          previewPanel.show({
            viewColumn: vscode.ViewColumn.Active,
            fsPath: textDocument.uri.fsPath,
          })
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
          previewPanel.show({
            viewColumn: vscode.ViewColumn.Beside,
            fsPath: textDocument.uri.fsPath,
          })
          previewPanel.content = textDocument.getText()
        }
      }
    )
  )
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(textEditor => {
      // there is nothing to open
      if (!textEditor) {
        return
      }
      // don't open when a tab was closed
      if (lastEventWasClose) {
        lastEventWasClose = false
        return
      }
      // don't open if it's not an svg
      if (!shouldOpenTextDocument(textEditor.document, previewPanel.fsPath)) {
        return
      }
      // don't open if auto-open setting isn't enabled
      if (
        !previewPanel.fsPath &&
        !configuration.get('autoOpen', textEditor.document.uri)
      ) {
        return
      }
      // open the preview
      previewPanel.show({
        viewColumn: vscode.ViewColumn.Beside,
        fsPath: textEditor.document.uri.fsPath,
      })
      previewPanel.content = textEditor.document.getText()
    })
  )
  if (DEVELOPMENT) {
    // This is still proposed api so it cannot be used in production at the moment
    context.subscriptions.push(
      vscode.workspace.onDidRenameFile(event => {
        if (previewPanel.fsPath !== event.oldUri.fsPath) {
          return
        }
        previewPanel.fsPath = event.newUri.fsPath
      })
    )
  }
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(() => {
      lastEventWasClose = false
    })
  )
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(() => {
      lastEventWasClose = true
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
