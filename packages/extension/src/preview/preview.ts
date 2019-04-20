import memoizeOne from 'memoize-one'
import * as path from 'path'
import * as vscode from 'vscode'
import { configuration, ConfigurationChangeEvent } from '../configuration'
import { Message } from '../../../shared/src/Message'
import { PreviewState } from '../../../shared/src/PreviewState'
import { shouldOpenUri, getPath, setContext } from '../util'
import { webViewPanelType } from '../constants'
import { context } from '../extension'
import { withInlineStyles } from './styles/withInlineStyles'
import { StyleConfiguration } from '../../../shared/src/StyleConfiguration'

const previewPath = 'packages/preview/dist'
const iconPath = 'packages/extension/images/bolt_original_yellow_optimized.svg'

interface PreviewPanel extends vscode.WebviewPanelSerializer {
  readonly deserializeWebviewPanel: (
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
  readonly show: ({
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
  readonly visible: boolean

  /**
   * Reset the panning and zooming of the preview.
   */
  readonly reset: () => void

  /**
   * The view column of the webview panel.
   */
  viewColumn: vscode.ViewColumn
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
  /**
   * Custom styles for the preview.
   */
  style?: StyleConfiguration
}

const state: State = {
  postponedMessages: new Map(),
}

/**
 * Get the html for the svg preview panel.
 */
const getPreviewHTML = memoizeOne(
  (): string => {
    /**
     * The base for the preview files.
     */
    const previewBase = vscode.Uri.file(getPath(previewPath)).with({
      scheme: 'vscode-resource',
    })

    /**
     * The base url of the opened document.
     */
    const base = vscode.Uri.file(state.fsPath).with({
      scheme: 'vscode-resource',
    })
    const nonce = Math.round(Math.random() * 2 ** 20)
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src 'self' data:; style-src vscode-resource: 'nonce-${nonce}'; script-src 'nonce-${nonce}';"
    >
    <base href="${base}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" >
    <link rel="stylesheet" href="${previewBase}/index.css" nonce="${nonce}" >
    <style id="custom-style" nonce="${nonce}"></style>
  </head>
  <body>
    <main>
      <img alt="">
    </main>
    <script src="${previewBase}/index.js" nonce="${nonce}"></script>
  </body>
</html>
`
  }
)

let immediate: NodeJS.Immediate

/**
 * Send all the messages that could not be send because the webview was hidden.
 */
function sendPostponedMessages(): void {
  const messages = [...state.postponedMessages.values()]
  if (messages.length > 0) {
    state.panel.webview.postMessage(messages)
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

function indexOfGroup(match, n): number {
  let { index } = match
  for (let i = 1; i < n; i++) {
    index += match[i].length
  }
  return index
}

async function getActualContent(): Promise<string> {
  let content = await withInlineStyles(
    path.dirname(state.fsPath),
    state.content
  )
  const match = /(<svg)([^>]*?)(>)/i.exec(content)
  if (match) {
    // insert xmlns if it doesn't exist
    const svgTagStart = indexOfGroup(match, 0)
    const svgTagEnd = indexOfGroup(match, 3)
    const svgTagContent = content.slice(svgTagStart, svgTagEnd)
    if (!/xmlns=/.test(svgTagContent)) {
      content = `${content.slice(
        0,
        svgTagStart + 4
      )} xmlns="http://www.w3.org/2000/svg" ${content.slice(svgTagStart + 4)}`
    }
  }
  return content
}

/**
 * Update the contents.
 */
async function invalidateContent(): Promise<void> {
  console.log('state content', state.content)
  postMessage({
    command: 'update.content',
    payload: await getActualContent(),
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
function invalidatePanAndZoom(): void {
  postMessage({
    command: 'reset.panAndZoom',
  })
}

function invalidateBackground(): void {
  postMessage({
    command: 'update.style',
    payload: state.style,
  })
}

function onDidChangeStyle(): void {
  state.style = configuration.get('style', vscode.Uri.file(state.fsPath))
  invalidateBackground()
}

function onMightHaveChangedStyle(event: ConfigurationChangeEvent): void {
  if (event.affectsConfiguration('style', vscode.Uri.file(state.fsPath))) {
    onDidChangeStyle()
  }
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
      setContext('svgPreviewIsFocused', event.webviewPanel.active)
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
        vscode.window.showInformationMessage(JSON.stringify(message))
      })
    )
  }
  state.panel.webview.html = getPreviewHTML()
  onDidChangeStyle()
  configuration.addChangeListener(onMightHaveChangedStyle)
}

/**
 * The preview panel.
 */
export const previewPanel: PreviewPanel = {
  reset: invalidatePanAndZoom,
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
    invalidatePanAndZoom()
  },
  set fsPath(value: string) {
    if (!value) {
      state.fsPath = undefined
      state.postponedMessages = new Map()
      if (state.panel) {
        state.panel.dispose()
      }
    }
    state.fsPath = value
    const title = `Preview ${path.basename(value)}`
    state.panel.title = title
    invalidateFsPath()
    invalidatePanAndZoom()
  },
  get fsPath() {
    return state.fsPath
  },
  get viewColumn() {
    if (state.panel) {
      return state.panel.viewColumn
    }
    return undefined
  },
  set content(value) {
    state.content = value
    invalidateContent()
  },
  get content() {
    return state.content
  },
  get visible() {
    return state.panel && state.panel.visible
  },
  async deserializeWebviewPanel(webviewPanel, deserializedState) {
    if (state.panel) {
      // TODO deserialized panel should already be disposed at this point
      // There is already an open preview
      webviewPanel.dispose()
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
    }
    // preview the saved file
    state.fsPath = deserializedState.fsPath
    onDidCreatePanel(webviewPanel)
    state.content = deserializedState.content
    invalidateContent()
  },
}
