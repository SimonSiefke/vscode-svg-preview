import * as vscode from 'vscode'
import { previewPanel } from './preview/preview'
import { isSvgFile, tryToGetSvgInsideTextEditor } from './util'
import { configuration } from './configuration'

// eslint-disable-next-line import/no-mutable-exports
export let context: vscode.ExtensionContext

/**
 * Activate the extension.
 */
export async function activate(c: vscode.ExtensionContext): Promise<void> {
  context = c
  let isSvg: boolean
  let svgInside: string | undefined
  /**
   * Whether or not the last text editor event was a close event or not.
   */
  let lastEventWasClose = false
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'svgPreview.showPreview',
      async (uri: vscode.Uri) => {
        const actualUri = uri || vscode.window.activeTextEditor.document.uri
        isSvg = isSvgFile(actualUri)
        svgInside = tryToGetSvgInsideTextEditor(vscode.window.activeTextEditor)
        if (!isSvg && !svgInside) {
          return
        }
        previewPanel.show({
          viewColumn: vscode.ViewColumn.Active,
          fsPath: actualUri.fsPath,
        })
        const textDocument = await vscode.workspace.openTextDocument(actualUri)
        if (isSvg) {
          previewPanel.content = textDocument.getText()
        } else {
          previewPanel.content = svgInside
        }
      }
    )
  )
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'svgPreview.showPreviewToSide',
      textEditor => {
        const textDocument = textEditor.document
        isSvg = isSvgFile(textDocument.uri, previewPanel.fsPath)
        svgInside = tryToGetSvgInsideTextEditor(textEditor)
        if (!isSvg && !svgInside) {
          return
        }
        previewPanel.show({
          viewColumn: vscode.ViewColumn.Beside,
          fsPath: textDocument.uri.fsPath,
        })
        if (isSvg) {
          previewPanel.content = textDocument.getText()
        } else {
          previewPanel.content = svgInside
        }
      }
    )
  )
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'svgPreview.reloadPreview',
      previewPanel.reload
    )
  )
  const onDidChangeActiveTextEditor: (
    textEditor: vscode.TextEditor
  ) => void = textEditor => {
    // there is nothing to open
    if (!textEditor) {
      return
    }
    // don't open when a tab was closed, but still update when the preview panel is visible
    if (lastEventWasClose && !previewPanel.visible) {
      lastEventWasClose = false
      return
    }
    isSvg = isSvgFile(textEditor.document.uri, previewPanel.fsPath)
    svgInside = tryToGetSvgInsideTextEditor(textEditor)
    // don't open if it's not an svg
    if (!isSvg && !svgInside) {
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
      if (previewPanel.fsPath !== textEditor.document.uri.fsPath) {
        previewPanel.fsPath = textEditor.document.uri.fsPath
      }
    } else if (previewPanel.fsPath !== textEditor.document.uri.fsPath) {
      previewPanel.show({
        viewColumn: vscode.ViewColumn.Beside,
        fsPath: textEditor.document.uri.fsPath,
      })
    }
    const content = isSvg ? textEditor.document.getText() : svgInside
    if (content !== previewPanel.content) {
      previewPanel.content = content
    }
  }
  // TODO this may collide with deserialized webview panel, but the timeout with 100ms works for the most part
  if (vscode.window.activeTextEditor) {
    setTimeout(() => {
      if (
        vscode.window.activeTextEditor &&
        ['xml', 'svg'].includes(
          vscode.window.activeTextEditor.document.languageId
        ) &&
        !previewPanel.visible
      ) {
        onDidChangeActiveTextEditor(vscode.window.activeTextEditor)
      }
    }, 100)
  }
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(onDidChangeActiveTextEditor)
  )
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
      const shouldUpdate =
        event.contentChanges.length > 0 &&
        event.document.uri.fsPath === previewPanel.fsPath
      if (!shouldUpdate) {
        return
      }
      const content = isSvg
        ? vscode.window.activeTextEditor.document.getText()
        : svgInside
      if (content !== previewPanel.content) {
        previewPanel.content = content
      }
    })
  )
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(event => {
      const shouldUpdate =
        event.textEditor.document.uri.fsPath === previewPanel.fsPath
      if (!shouldUpdate) {
        return
      }
      svgInside = tryToGetSvgInsideTextEditor(event.textEditor)
      if (svgInside !== previewPanel.content) {
        previewPanel.content = svgInside
      }
    })
  )
  context.subscriptions.push(
    vscode.window.registerWebviewPanelSerializer('svgPreview', previewPanel)
  )
}

/**
 * Deactivate the extension.
 */
export function deactivate(): void {
  configuration.dispose()
  previewPanel.dispose()
}
