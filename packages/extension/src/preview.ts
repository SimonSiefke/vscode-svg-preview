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
function getPath(
  context: vscode.ExtensionContext,
  relativePath: string
): vscode.Uri {
  return vscode.Uri.file(
    context.asAbsolutePath(path.join(rootPath, relativePath))
  ).with({
    scheme: 'vscode-resource',
  })
}

/**
 * Get the html for the svg preview panel. TODO: cache.
 */
async function getPreviewHTML(
  context: vscode.ExtensionContext
): Promise<string> {
  console.log(getPath(context, `${previewPath}/index.html`))
  const html = await readFile(
    getPath(context, `${previewPath}/index.html`).fsPath,
    'utf-8'
  )
  const base = getPath(context, previewPath).fsPath
  console.log('base is', base)
  return html.replace('<!-- insert base here -->', `<base href="${base}/">`)
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
   *
   */
  let _restorePromise: PCancelable<void> | undefined

  /**
   * The webview panel
   */
  let _panel: vscode.WebviewPanel | undefined

  /**
   * The file system path of the currently previewed file
   */
  let _fsPath: string | undefined

  /**
   * This method is called when a webview panel has been created.
   */
  const onDidCreatePanel = async (
    webViewPanel: vscode.WebviewPanel
  ): Promise<void> => {
    _panel = webViewPanel
    _panel.webview.html = await getPreviewHTML(context)
    context.subscriptions.push(
      _panel.onDidDispose(() => {
        _panel = undefined
      })
    )
  }

  return {
    set fsPath(value) {
      _fsPath = value
      const title = path.basename(value)
      if (!_panel) {
        onDidCreatePanel(
          vscode.window.createWebviewPanel(
            config.webViewPanelType,
            `Preview ${title}`,
            vscode.ViewColumn.Beside,
            {
              enableCommandUris: true,
              localResourceRoots: [getPath(context, previewPath)],
              enableScripts: true,
            }
          )
        )
      }
      _panel.title = title
      _panel.webview.postMessage({
        command: 'update.fsPath',
        data: value,
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
      _panel.webview.postMessage({
        command: 'update.content',
        data: value,
      })
    },
    async deserializeWebviewPanel(webviewPanel, state) {
      const PCancelable = await import('p-cancelable')
      onDidCreatePanel(webviewPanel)
      const { fsPath } = state
      this.fsPath = fsPath
      _restorePromise = new PCancelable(async (resolve, reject, onCancel) => {
        // eslint-disable-next-line no-param-reassign
        onCancel.shouldReject = false
        try {
          // The previewed file is closed, so we read the content from the file system
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
          `[svg preview] failed to restore preview of "${fsPath}"`
        )
      }
    },
  }
}