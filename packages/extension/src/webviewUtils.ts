import * as vscode from 'vscode'
import * as path from 'path'

const previewPath = 'packages/preview/dist'

export const getUri = ({
  context,
  relativePath,
}: {
  context: vscode.ExtensionContext
  relativePath: string
}): vscode.Uri =>
  vscode.Uri.file(path.join(context.extensionPath, ROOT, relativePath))

/**
 * The base for the preview files.
 */
export const getPreviewBaseWebview = ({
  webview,
  context,
}: {
  webview: vscode.Webview
  context: vscode.ExtensionContext
}): vscode.Uri =>
  webview.asWebviewUri(getUri({ context, relativePath: previewPath }))

export const getPreviewBase = ({ context }): vscode.Uri =>
  getUri({ context, relativePath: previewPath })

export const getNonce = (): number => Math.round(Math.random() * 2 ** 20)
