import memoizeOne from 'memoize-one'
import * as path from 'path'
import * as vscode from 'vscode'
import { Message } from '../../shared/src/Message'
import { PreviewState } from '../../shared/src/PreviewState'
import { shouldOpenTextDocument } from './util'
import { webViewPanelType } from './constants'
import { context } from './extension'
import { configuration } from './configuration'

interface PreviewPanel extends vscode.WebviewPanelSerializer {
  deserializeWebviewPanel: (
    webviewPanel: vscode.WebviewPanel,
    state: PreviewState
  ) => Promise<void>

  /**
   * The content of the currently previewed file
   */
  content: string

  /**
   * The file system path of the currently previewed file
   */
  fsPath: string

  /**
   * The view column of the preview panel.
   */
  viewColumn: vscode.ViewColumn
}

const rootPath = '../../'
const previewPath = 'packages/preview/dist'

/**
 * The webview panel.
 */
let panel: vscode.WebviewPanel | undefined

/**
 * The file system path of the currently previewed file. TODO: confusing: fsPath, set fsPath and state.fsPath
 */
let fsPath: string | undefined

/**
 * The latest message that could not be sent because the webview was hidden.
 */
const postponedMessages = new Map<Message['command'], Message['payload']>()

/**
 * The view column of the preview panel.
 */
let viewColumn: vscode.ViewColumn

/**
 * Post a message to the webview.
 */
const postMessage = (message: Message): void => {
  if (panel && panel.visible) {
    panel.webview.postMessage(message)
  } else {
    postponedMessages.set(message.command, message.payload)
  }
}

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

const state = new Proxy<PreviewState>(
  {},
  {
    set(target, key: keyof PreviewState, value) {
      // if (target[key] === value) {
      //   return true
      // }
      switch (key) {
        case 'content':
          postMessage({
            command: 'update.content',
            payload: value,
          })
          break
        case 'fsPath':
          postMessage({
            command: 'update.fsPath',
            payload: value,
          })
          break
        default:
          throw new Error(`invalid key "${key}"`)
      }
      // eslint-disable-next-line no-param-reassign
      target[key] = value
      return true
    },
    get(target, key) {
      return target[key]
    },
  }
)

/**
 * This method is called when a webview panel has been created.
 */
const onDidCreatePanel = (
  webViewPanel: vscode.WebviewPanel,
  uri: vscode.Uri
): void => {
  panel = webViewPanel
  context.subscriptions.push(
    panel.onDidDispose(() => {
      panel = undefined
      fsPath = undefined
    })
  )
  context.subscriptions.push(
    panel.onDidChangeViewState(event => {
      if (event.webviewPanel.visible) {
        for (const [command, payload] of postponedMessages) {
          // @ts-ignore TODO:
          postMessage({ command, payload })
        }
        postponedMessages.clear()
      }
    })
  )

  if (DEVELOPMENT) {
    // TODO
    context.subscriptions.push(
      panel.webview.onDidReceiveMessage((message: any) => {
        vscode.window.showInformationMessage(message.command)
      })
    )
  }
  panel.webview.html = getPreviewHTML(context.extensionPath)
}

/**
 * The preview panel.
 */
export const previewPanel: PreviewPanel = {
  get viewColumn() {
    return viewColumn
  },
  set viewColumn(value) {
    viewColumn = value
  },
  set fsPath(value) {
    fsPath = value
    const title = `Preview ${path.basename(value)}`
    if (!panel) {
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
        ),
        vscode.Uri.file(value)
      )
    } else {
      panel.title = title
    }
    state.fsPath = value
  },
  get fsPath() {
    return fsPath
  },
  set content(value: string) {
    setImmediate(() => {
      state.content = value
    })
  },
  async deserializeWebviewPanel(webviewPanel, deserializedState) {
    if (
      deserializedState &&
      vscode.window.activeTextEditor &&
      shouldOpenTextDocument(vscode.window.activeTextEditor.document) &&
      vscode.window.activeTextEditor.document.uri.fsPath !==
        deserializedState.fsPath
    ) {
      this.fsPath = vscode.window.activeTextEditor.document.uri.fsPath
      onDidCreatePanel(webviewPanel, vscode.Uri.file(fsPath))
      this.content = vscode.window.activeTextEditor.document.getText()
    } else {
      fsPath = deserializedState.fsPath
      onDidCreatePanel(webviewPanel, vscode.Uri.file(fsPath))
    }
  },
}
