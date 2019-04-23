import * as vscode from 'vscode'
import * as path from 'path'
import { context } from './extension'

export function shouldOpenUri(uri: vscode.Uri, fsPath?: string): boolean {
  // 1. its preview already open
  if (fsPath === uri.fsPath) {
    return false
  }
  // 2. its preview is not open and its not an svg
  if (!uri.fsPath.endsWith('.svg')) {
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
  return path.join(context.extensionPath, ROOT, relativePath)
}

interface Context {
  svgPreviewIsOpen: boolean
  svgPreviewIsFocused: boolean
}

export function setContext(
  key: keyof Context,
  value: Context[typeof key]
): Thenable<void> {
  return vscode.commands.executeCommand('setContext', key, value)
}
