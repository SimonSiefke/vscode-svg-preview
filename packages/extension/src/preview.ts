import memoizeOne from 'memoize-one'
import * as path from 'path'
import * as vscode from 'vscode'
import { Message } from '../../shared/src/Message'
import { PreviewState } from '../../shared/src/PreviewState'
import { shouldOpenUri, getPath, setContext } from './util'
import { webViewPanelType } from './constants'
import { context } from './extension'

const previewPath = 'packages/preview/dist'
const iconPath = 'packages/extension/images/bolt_original_yellow_optimized.svg'

/**
 * Get the html for the svg preview panel.
 */
const getPreviewHTML = memoizeOne(
  (): string => {
    /**
     * The base url for links inside the html file.
     */
    const base = vscode.Uri.file(getPath(previewPath)).with({
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

  /**
   * Whether or not the panel is visible.
   */
  visible: boolean
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

/**
 * Send all the messages that could not be send because the webview was hidden.
 */
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
  // Use an immediate to send multiple messages at once (prevents flickering in the preview and is more efficient)
  immediate = setImmediate(() => {
    immediate = undefined
    if (state.panel && state.panel.visible) {
      sendPostponedMessages()
    }
  })
}

/**
 * Update the contents.
 */
function invalidateContent(): void {
  postMessage({
    command: 'update.content',
    payload: state.content,
  })
}

/**
 * Update the fs path.
 */
function invalidateFsPath(): void {
  state.postponedMessages.clear()
  postMessage({
    command: 'update.fsPath',
    payload: state.fsPath,
  })
}

/**
 * Reset the panning.
 */
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
  setContext('svgPreviewIsOpen', true)
  state.panel = webViewPanel
  state.panel.iconPath = vscode.Uri.file(getPath(iconPath))
  context.subscriptions.push(
    state.panel.onDidDispose(() => {
      state.panel = undefined
      state.fsPath = undefined
      setContext('svgPreviewIsOpen', false)
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
  state.panel.webview.html = getPreviewHTML()
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
              vscode.Uri.file(getPath('packages/preview/dist')),
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
  get visible() {
    return state.panel.visible
  },
  async deserializeWebviewPanel(webviewPanel, deserializedState) {
    if (state.panel) {
      // TODO deserialized panel should already be disposed at this point
      // There is already an open preview
      webviewPanel.dispose()
      return
    }
    if (
      deserializedState &&
      vscode.window.activeTextEditor &&
      shouldOpenUri(vscode.window.activeTextEditor.document.uri) &&
      vscode.window.activeTextEditor.document.uri.fsPath !==
        deserializedState.fsPath
    ) {
      // another svg file is currently open so we preview that instead of the one saved
      state.fsPath = vscode.window.activeTextEditor.document.uri.fsPath
      onDidCreatePanel(webviewPanel)
      this.show({ fsPath: state.fsPath })
      state.content = vscode.window.activeTextEditor.document.getText()
      invalidateContent()
      return
    }
    // preview the saved file
    state.fsPath = deserializedState.fsPath
    onDidCreatePanel(webviewPanel)
    state.content = deserializedState.content
    invalidateContent()
  },
}
