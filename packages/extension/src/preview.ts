/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-parameter-properties */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
import * as vscode from 'vscode'
import * as path from 'path'
import memoizeOne from 'memoize-one'
import * as config from './config'
import { Message, Command } from '../../shared/src/Message'
import { State } from '../../shared/src/State'
import { shouldOpenTextDocument } from './util'

const rootPath = '../../'
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

export interface PreviewPanel extends vscode.WebviewPanelSerializer {
  deserializeWebviewPanel: (
    webviewPanel: vscode.WebviewPanel,
    state: State
  ) => Promise<void>

  /**
   * The content of the currently previewed file
   */
  content: string

  /**
   * The file system path of the currently previewed file
   */
  fsPath: string
}

/**
 * Create a preview panel.
 */
export function createPreviewPanel(
  context: vscode.ExtensionContext
): PreviewPanel {
  /**
   * The webview panel.
   */
  let _panel: vscode.WebviewPanel | undefined

  /**
   * The file system path of the currently previewed file.
   */
  let _fsPath: string | undefined

  /**
   * The latest message that could not be sent because the webview was hidden.
   */
  const _postponedMessages = new Map<Command, string>()

  /**
   * Post a message to the webview.
   */
  const postMessage = (message: Message): void => {
    if (_panel.visible) {
      _panel.webview.postMessage(message)
    } else {
      _postponedMessages.set(message.command, message.payload)
    }
  }

  /**
   * This method is called when a webview panel has been created.
   */
  const onDidCreatePanel = async (
    webViewPanel: vscode.WebviewPanel
  ): Promise<void> => {
    _panel = webViewPanel
    context.subscriptions.push(
      _panel.onDidDispose(() => {
        _panel = undefined
        _fsPath = undefined
      })
    )
    context.subscriptions.push(
      _panel.onDidChangeViewState(event => {
        if (event.webviewPanel.visible) {
          for (const [command, payload] of _postponedMessages) {
            postMessage({ command, payload })
          }
          _postponedMessages.clear()
        }
      })
    )
    context.subscriptions.push(
      _panel.webview.onDidReceiveMessage((message: any) => {
        // TODO
        vscode.window.showInformationMessage(message.command)
      })
    )
    console.log(getPreviewHTML(context.extensionPath))
    _panel.webview.html = getPreviewHTML(context.extensionPath)
  }

  return {
    set fsPath(value) {
      _fsPath = value
      const title = `Preview ${path.basename(value)}`
      if (!_panel) {
        onDidCreatePanel(
          vscode.window.createWebviewPanel(
            config.webViewPanelType,
            title,
            {
              viewColumn: vscode.ViewColumn.Beside,
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
        _panel.title = title
      }
      postMessage({
        command: 'update.fsPath',
        payload: value,
      })
    },
    get fsPath() {
      return _fsPath
    },
    set content(value: string) {
      console.log('SET CONTENT')
      setImmediate(() => {
        postMessage({
          command: 'update.content',
          payload: value,
        })
      })
    },
    async deserializeWebviewPanel(webviewPanel, state) {
      const didCreatePanelPromise = onDidCreatePanel(webviewPanel)
      if (
        vscode.window.activeTextEditor &&
        shouldOpenTextDocument(
          vscode.window.activeTextEditor.document,
          undefined
        ) &&
        vscode.window.activeTextEditor.document.uri.fsPath !== state.fsPath
      ) {
        this.fsPath = vscode.window.activeTextEditor.document.uri.fsPath
        await didCreatePanelPromise
        this.content = vscode.window.activeTextEditor.document.getText()
      } else {
        _fsPath = state.fsPath
      }
    },
  }
}
