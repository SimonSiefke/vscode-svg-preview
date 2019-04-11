import memoizeOne from 'memoize-one'
import * as path from 'path'
import * as vscode from 'vscode'
import { Message } from '../../shared/src/Message'
import { PreviewState } from '../../shared/src/PreviewState'
import { shouldOpenTextDocument } from './util'
import { webViewPanelType } from './constants'
import { context } from './extension'

const rootPath = ROOT
const previewPath = 'packages/preview/dist'

/**
 * Get the absolute path for relative path from the root of this project.
 *
 * @example
 * ```js
 * getPath(context.extensionPath, 'packages/preview/dist/index.css')
 * ```
 */
function getPath(extensionPath: string, relativePath: string): string {
  return path.join(extensionPath, rootPath, relativePath)
}

/**
 * Get the html for the svg preview panel.
 */
const getPreviewHTML = memoizeOne(
  (extensionPath: string): string => {
    /**
     * The base url for links inside the html file.
     */
    const base = vscode.Uri.file(getPath(extensionPath, previewPath)).with({
      scheme: 'vscode-resource',
    })
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src vscode-resource: https:; style-src 'unsafe-inline' vscode-resource:; script-src vscode-resource:;"
    />

    <base href="${base}/" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="index.css" />
  </head>

  <body>
    <script src="index.js"></script>
  </body>
</html>
`
  }
)

interface PreviewPanel extends vscode.WebviewPanelSerializer {
  deserializeWebviewPanel: (
    webviewPanel: vscode.WebviewPanel,
    state: PreviewState
  ) => Promise<void>
  /**
   * The file system path of the currently previewed file
   */
  fsPath: string

  /**
   * Show the webview panel.
   */
  show: ({
    viewColumn,
    fsPath,
  }: {
    viewColumn?: vscode.ViewColumn
    fsPath: string
  }) => void

  /**
   * The content of the currently previewed file
   */
  content: string
}

interface State {
  /**
   * The webview panel.
   */
  panel?: vscode.WebviewPanel
  /**
   *  The file system path of the currently previewed file.
   */
  fsPath?: string
  /**
   * The view column of the webview panel.
   */
  viewColumn?: vscode.ViewColumn
  /**
   * The content of the currently previewed file
   */
  content?: string

  /**
   * The latest messages that could not be sent because the webview was hidden.
   */
  postponedMessages: Map<Message['command'], Message>
}

const state: State = {
  postponedMessages: new Map(),
}

let immediate: NodeJS.Immediate

function sendPostponedMessages(): void {
  const postponedMessages = [...state.postponedMessages.values()]
  if (postponedMessages.length > 0) {
    state.panel.webview.postMessage([...state.postponedMessages.values()])
    state.postponedMessages.clear()
  }
}

/**
 * Post a message to the webview.
 */
const postMessage = (message: Message): void => {
  state.postponedMessages.set(message.command, message)
  if (immediate) {
    return
  }
  immediate = setImmediate(() => {
    immediate = undefined
    if (state.panel && state.panel.visible) {
      sendPostponedMessages()
    }
  })
}

function invalidateContent(): void {
  postMessage({
    command: 'update.content',
    payload: state.content,
  })
}

function invalidateFsPath(): void {
  state.postponedMessages.clear()
  postMessage({
    command: 'update.fsPath',
    payload: state.fsPath,
  })
}

function invalidatePan(): void {
  postMessage({
    command: 'reset.pan',
    payload: undefined,
  })
}

/**
 * This method is called when a webview panel has been created.
 */
const onDidCreatePanel = (webViewPanel: vscode.WebviewPanel): void => {
  state.panel = webViewPanel
  context.subscriptions.push(
    state.panel.onDidDispose(() => {
      state.panel = undefined
      state.fsPath = undefined
    })
  )
  context.subscriptions.push(
    state.panel.onDidChangeViewState(event => {
      if (event.webviewPanel.visible) {
        invalidateContent()
        sendPostponedMessages()
      }
    })
  )
  if (DEVELOPMENT) {
    // TODO
    context.subscriptions.push(
      state.panel.webview.onDidReceiveMessage((message: any) => {
        vscode.window.showInformationMessage(message)
      })
    )
  }
  state.panel.webview.html = getPreviewHTML(context.extensionPath)
  // postMessage({
  //   command: 'update.background',
  //   payload: 'red',
  // })
}

/**
 * The preview panel.
 */
export const previewPanel: PreviewPanel = {
  show({ viewColumn, fsPath }) {
    state.fsPath = fsPath
    const title = `Preview ${path.basename(fsPath)}`
    if (!state.panel) {
      onDidCreatePanel(
        vscode.window.createWebviewPanel(
          webViewPanelType,
          title,
          {
            viewColumn,
            preserveFocus: true,
          },
          {
            enableCommandUris: true,
            localResourceRoots: [
              vscode.Uri.file(
                getPath(context.extensionPath, 'packages/preview/dist')
              ),
            ],
            enableScripts: true,
          }
        )
      )
    } else {
      state.panel.title = title
    }
    invalidateFsPath()
    invalidatePan()
  },
  set fsPath(value: string) {
    state.fsPath = value
    const title = `Preview ${path.basename(value)}`
    state.panel.title = title
    invalidateFsPath()
  },
  get fsPath() {
    return state.fsPath
  },
  set content(value: string) {
    state.content = value
    invalidateContent()
  },
  async deserializeWebviewPanel(webviewPanel, deserializedState) {
    if (
      deserializedState &&
      vscode.window.activeTextEditor &&
      shouldOpenTextDocument(vscode.window.activeTextEditor.document) &&
      vscode.window.activeTextEditor.document.uri.fsPath !==
        deserializedState.fsPath
    ) {
      state.fsPath = vscode.window.activeTextEditor.document.uri.fsPath
      onDidCreatePanel(webviewPanel)
      this.show({ fsPath: state.fsPath })
      state.content = vscode.window.activeTextEditor.document.getText()
      invalidateContent()
    } else {
      state.fsPath = deserializedState.fsPath
      onDidCreatePanel(webviewPanel)
      state.content = deserializedState.content
      invalidateContent()
    }
  },
}
