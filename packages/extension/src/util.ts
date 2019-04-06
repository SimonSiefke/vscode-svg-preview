import * as vscode from 'vscode'
import { PreviewPanel } from './preview'

export function shouldOpenTextDocument(
  textDocument: vscode.TextDocument,
  previewPanel: PreviewPanel | undefined
): boolean {
  // 1. its preview already open
  if (previewPanel && previewPanel.fsPath === textDocument.uri.fsPath) {
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
