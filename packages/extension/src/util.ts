/* eslint-disable no-cond-assign */
import * as vscode from 'vscode'
import * as path from 'path'
import { context } from './extension'

export function isSvgFile(uri: vscode.Uri, currentFsPath?: string): boolean {
  // 1. its preview already open
  if (currentFsPath === uri.fsPath) {
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

function tryToFindSvgAtOffset(
  text: string,
  offset: number
): [number, number] | undefined {
  let current: RegExpExecArray | null | undefined
  let start: RegExpExecArray | undefined
  const svgStartRE = /<svg[^>]*>/g
  while ((current = svgStartRE.exec(text)) !== null) {
    if (start && current.index >= offset) {
      break
    }
    start = current
  }
  if (!start) {
    return undefined
  }
  const svgEndRE = /<\/svg>/g
  const endText = text.slice(start.index)
  const end = svgEndRE.exec(endText)
  if (!end) {
    return undefined
  }
  return [start.index, end.index + start.index + +'</svg>'.length]
}

export function tryToGetSvgInsideTextEditor(
  textEditor: vscode.TextEditor | undefined
): string {
  if (!textEditor) {
    return ''
  }
  const { document, selection } = textEditor
  const selectionOffsetStart = document.offsetAt(selection.start)
  const selectionOffsetEnd = document.offsetAt(selection.end)
  const selectionOffset = (selectionOffsetStart + selectionOffsetEnd) / 2
  const svgOffsets = tryToFindSvgAtOffset(document.getText(), selectionOffset)
  if (!svgOffsets) {
    return ''
  }
  const [startOffset, endOffset] = svgOffsets
  const start = document.positionAt(startOffset)
  const end = document.positionAt(endOffset)
  const range = new vscode.Range(start, end)
  return document.getText(range)
}
