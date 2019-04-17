import * as vscode from 'vscode'
import { previewPanel } from './preview/preview'
import { shouldOpenUri } from './util'
import { webViewPanelType } from './constants'
import { configuration } from './configuration'
import { configureLiveShare } from './liveshare/configureLiveShare'

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
    vscode.commands.registerCommand(
      'svgPreview.showPreview',
      async (uri: vscode.Uri) => {
        const actualUri = uri || vscode.window.activeTextEditor.document.uri
        if (!shouldOpenUri(actualUri)) {
          return
        }
        previewPanel.show({
          viewColumn: vscode.ViewColumn.Active,
          fsPath: actualUri.fsPath,
        })
        const textDocument = await vscode.workspace.openTextDocument(actualUri)
        previewPanel.content = textDocument.getText()
      }
    )
  )
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'svgPreview.showPreviewToSide',
      textEditor => {
        const textDocument = textEditor.document
        if (!shouldOpenUri(textDocument.uri, previewPanel.fsPath)) {
          return
        }
        previewPanel.show({
          viewColumn: vscode.ViewColumn.Beside,
          fsPath: textDocument.uri.fsPath,
        })
        previewPanel.content = textDocument.getText()
      }
    )
  )
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'svgPreview.resetPreview',
      previewPanel.reset
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
      if (!shouldOpenUri(textEditor.document.uri, previewPanel.fsPath)) {
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
      if (previewPanel.visible) {
        // TODO need to check if there is a webview that can be restored, otherwise there will be 2 open previews at the same time which should not happen, probably need to wait for https://github.com/Microsoft/vscode/issues/15178
        previewPanel.fsPath = textEditor.document.uri.fsPath
      } else {
        previewPanel.show({
          viewColumn: vscode.ViewColumn.Beside,
          fsPath: textEditor.document.uri.fsPath,
        })
      }
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
  configureLiveShare()
}

/**
 * Deactivate the extension.
 */
export function deactivate(): void {
  configuration.dispose()
}
