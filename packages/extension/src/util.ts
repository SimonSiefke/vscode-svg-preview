import * as vscode from 'vscode'
import * as path from 'path'
import { rootPath } from './constants'
import { context } from './extension'

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

/**
 * Get the absolute path for relative path from the root of this project.
 *
 * @example
 * ```js
 * getPath('packages/preview/dist/index.css')
 * ```
 */
export function getPath(relativePath: string): string {
  return path.join(context.extensionPath, rootPath, relativePath)
}

interface Context {
  svgPreviewIsOpen: boolean
}

export function setContext(
  key: keyof Context,
  value: Context[typeof key]
): Thenable<void> {
  return vscode.commands.executeCommand('setContext', key, value)
}
