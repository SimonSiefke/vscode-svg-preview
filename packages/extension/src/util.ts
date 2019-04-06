import * as vscode from 'vscode'

export function shouldOpenTextDocument(
  textDocument: vscode.TextDocument,
  fsPath?: string
): boolean {
  // 1. its preview already open
  if (fsPath === textDocument.uri.fsPath) {
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
