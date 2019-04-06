/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-parameter-properties */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
import * as fs from 'fs'
import * as vscode from 'vscode'
import * as path from 'path'
import * as util from 'util'
import * as PCancelable from 'p-cancelable'
import * as config from './config'
import { Message, Command } from '../../shared/Message'

const readFile = util.promisify(fs.readFile)
const rootPath = '../../'
const previewPath = 'packages/preview/dist'
/**
 * Get the absolute path for relative path from the root of this project.
 *
 * @example
 * ```js
 * getPath(context, 'packages/preview/dist/index.css')
 * ```
 */

function getPath(extensionPath: string, relativePath: string): string {
  return path.join(extensionPath, rootPath, relativePath)
}

/**
 * Get the html for the svg preview panel. TODO: cache.
 */
async function getPreviewHTML(extensionPath: string): Promise<string> {
  const html = await readFile(
    getPath(extensionPath, 'packages/preview/dist/index.html'),
    'utf-8'
  )
  /**
   * The base url for links inside the html file.
   */
  const base = vscode.Uri.file(getPath(extensionPath, previewPath)).with({
    scheme: 'vscode-resource',
  })

  /**
   * The things that will be replaced inside the html, e.g. `<!-- base -->` will be replaced with the actual `base` tag and `<!-- svg -->` will be replaced with the actual `svg`.
   */
  const replaceMap = {
    '<!-- insert base here -->': `<base href="${base}/">`,
  }
  const regExp = new RegExp(Object.keys(replaceMap).join('|'), 'gi')
  return html.replace(regExp, matched => replaceMap[matched])
}

export interface PreviewPanel extends vscode.WebviewPanelSerializer {
  /**
   * Show the svg preview.
   */

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
   * A cancelable promise that indicates that the panel is currently being restored.
   */
  let _restorePromise: PCancelable<void> | undefined

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
      console.log(
        'POST MESSAGE TO VISIBLE',
        message.command,
        message.payload.slice(0, 5)
      )
      _panel.webview.postMessage(message)
    } else {
      console.log('post message to invisible')
      _postponedMessages.set(message.command, message.payload)
      console.log('size', _postponedMessages.size)
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
      })
    )
    context.subscriptions.push(
      _panel.onDidChangeViewState(event => {
        console.log(
          'change view state to',
          event.webviewPanel.visible,
          _postponedMessages
        )
        if (event.webviewPanel.visible) {
          console.log('send out', _postponedMessages.size, 'messages')
          for (const [command, payload] of _postponedMessages) {
            postMessage({ command, payload })
          }
          _postponedMessages.clear()
        }
      })
    )
    context.subscriptions.push(
      _panel.webview.onDidReceiveMessage((message: any) => {
        console.log('received message', message)
        vscode.window.showInformationMessage(message.command)
      })
    )
    _panel.webview.html = await getPreviewHTML(context.extensionPath)
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
      if (_restorePromise) {
        _restorePromise.cancel()
        _restorePromise = undefined
      }
      setImmediate(() => {
        postMessage({
          command: 'update.content',
          payload: value,
        })
      })
    },
    async deserializeWebviewPanel(webviewPanel, state) {
      const PCancelable = await import('p-cancelable')
      onDidCreatePanel(webviewPanel)
      const { fsPath } = state
      this.fsPath = fsPath
      // we need make sure that the preview panel has always the latest content so when the user opens another file while we are reading we must cancel reading the file and setting the content afterwards because that would not be the latest content anymore. The `_restorePromise` is cancel as soon as the user opens a new file while we are restoring the content.
      _restorePromise = new PCancelable(async (resolve, reject, onCancel) => {
        // eslint-disable-next-line no-param-reassign
        onCancel.shouldReject = false
        try {
          // The previewed file is closed, so we read the content from the file system without opening it
          const content = await readFile(fsPath, 'utf-8')
          this.content = content
          resolve()
        } catch {
          reject()
        }
      })
      try {
        await _restorePromise
      } catch {
        vscode.window.showErrorMessage(
          `[svg preview] failed to restore preview for "${fsPath}"`
        )
      }
    },
  }
}
