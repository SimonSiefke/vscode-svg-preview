import memoizeOne from 'memoize-one'
import * as path from 'path'
import * as vscode from 'vscode'
import { configuration, ConfigurationChangeEvent } from '../configuration'
import { Message } from '../../../shared/src/Message'
import { PreviewState } from '../../../shared/src/PreviewState'
import { isSvgFile, getPath, setContext } from '../util'
import { context } from '../extension'
import { withInlineStyles } from './styles/withInlineStyles'
import { StyleConfiguration } from '../../../shared/src/StyleConfiguration'

const previewPath = 'packages/preview/dist'
const iconPathNormal =
  'packages/extension/images/bolt_original_yellow_optimized.svg'
const iconPathError =
  'packages/extension/images/bolt_original_red_optimized.svg'

/**
 * The type of the web view panel. Can be arbitrary, but must match with `onWebviewPanel:svgPreview` in `package.json`.
 */
const webViewPanelType = 'svgPreview'

interface PreviewPanel extends vscode.WebviewPanelSerializer {
  readonly deserializeWebviewPanel: (
    webviewPanel: vscode.WebviewPanel,
    state: PreviewState
  ) => Promise<void>
  /**
   * The file system path of the currently previewed file.
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
   * The content of the currently previewed file.
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
   * The current error, if there is any.
   */
  error?: string
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
   * The content of the currently previewed file.
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
  /**
   * Whether or not the svg should be scaled to fit the viewport or keep its original size.
   */
  scaleToFit?: boolean
}

const state: State = {
  error: undefined,
  postponedMessages: new Map(),
}

const getUri = memoizeOne(
  (relativePath: string): vscode.Uri => vscode.Uri.file(getPath(relativePath))
)

/**
 * Get the html for the svg preview panel.
 */
const getPreviewHTML = memoizeOne(
  (fsPath: string, port: number): string => {
    /**
     * The base for the preview files.
     */
    const previewBase = getUri(previewPath).with({
      scheme: 'vscode-resource',
    })
    /**
     * The base url of the opened document.
     */
    const base = vscode.Uri.file(fsPath).with({
      scheme: 'vscode-resource',
    })
    const nonce = Math.round(Math.random() * 2 ** 20)
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src 'self' data:; style-src vscode-resource: 'nonce-${nonce}'; script-src 'nonce-${nonce}';connect-src ws://localhost:${port}/;"
    >
    <base href="${base}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" >
    <link rel="stylesheet" href="${previewBase}/index.css" nonce="${nonce}" >
    <style id="custom-style" nonce="${nonce}"></style>
  </head>
  <body data-port="${port}">
    <img alt="">
    <script src="${previewBase}/index.js" nonce="${nonce}"></script>
  </body>
</html>
`
  }
)

let immediate: NodeJS.Immediate

let webSocketServer: import('../previewWebSocketServer').PreviewWebsocketServer

/**
 * Send all the messages that could not be send because the webview was hidden.
 */
function sendPostponedMessages(): void {
  const messages = [...state.postponedMessages.values()]
  if (messages.length > 0) {
    webSocketServer.broadcast(messages)
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
    sendPostponedMessages()
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

let lastContent: string

function setLastContent(): void {
  if (!lastContent) {
    return
  }
  postMessage({
    command: 'update.content',
    payload: lastContent,
  })
  lastContent = undefined
}

/**
 * Update the contents.
 */
async function invalidateContent(): Promise<void> {
  lastContent = await getActualContent()
  postMessage({
    command: 'update.content',
    payload: lastContent,
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
    command: 'update.pan',
    payload: {
      x: 0,
      y: 0,
    },
  })
  postMessage({
    command: 'update.zoom',
    payload: 1,
  })
}

function invalidateScaleToFit(): void {
  postMessage({
    command: 'update.scaleToFit',
    payload: state.scaleToFit,
  })
}

function invalidateStyle(): void {
  postMessage({
    command: 'update.style',
    payload: state.style,
  })
}

function onDidChangeStyle(): void {
  state.style = configuration.get('style', vscode.Uri.file(state.fsPath))
  invalidateStyle()
}

function onDidChangeScaleToFit(): void {
  state.scaleToFit = configuration.get(
    'scaleToFit',
    vscode.Uri.file(state.fsPath)
  )
  invalidateScaleToFit()
}

function onDidChangeConfiguration(event: ConfigurationChangeEvent): void {
  const uri = vscode.Uri.file(state.fsPath)
  if (event.affectsConfiguration('style', uri)) {
    onDidChangeStyle()
  }
  if (event.affectsConfiguration('scaleToFit', uri)) {
    onDidChangeScaleToFit()
  }
}

/**
 * This method is called when a webview panel has been created.
 */
const onDidCreatePanel = async (
  webViewPanel: vscode.WebviewPanel
): Promise<void> => {
  if (!webSocketServer) {
    webSocketServer = (await import('../previewWebSocketServer'))
      .previewWebSocketServer
    // TODO optimize order (first html then start server)
    await webSocketServer.start()
  }
  setContext('svgPreviewIsOpen', true)
  state.panel = webViewPanel
  state.panel.iconPath = state.error
    ? getUri(iconPathError)
    : getUri(iconPathNormal)
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
      if (event.webviewPanel.visible && !event.webviewPanel.webview.html) {
        setLastContent()
        sendPostponedMessages()
      }
    })
  )
  context.subscriptions.push(
    state.panel.webview.onDidReceiveMessage((message: any) => {
      if (message.command === 'setError') {
        const error = message.payload
        if (error) {
          state.panel.iconPath = getUri(iconPathError)
        } else {
          state.panel.iconPath = getUri(iconPathNormal)
        }
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
  state.panel.webview.html = getPreviewHTML(state.fsPath, webSocketServer.port)
  onDidChangeStyle()
  onDidChangeScaleToFit()
  configuration.addChangeListener(onDidChangeConfiguration)
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
            localResourceRoots: [getUri('packages/preview/dist')],
            enableScripts: true,
          }
        )
      )
    } else {
      state.panel.title = title
    }
    invalidateFsPath()
    invalidatePanAndZoom()
    invalidateStyle()
    invalidateScaleToFit()
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
    state.error = deserializedState.error
    if (state.panel) {
      // TODO deserialized panel should already be disposed at this point
      // There is already an open preview
      webviewPanel.dispose()
    } else {
      state.panel = webviewPanel
    }
    const openSvg = vscode.window.activeTextEditor &&
    isSvgFile(vscode.window.activeTextEditor.document.uri) &&
    vscode.window.activeTextEditor.document
    if (openSvg && openSvg.uri.fsPath !== deserializedState.fsPath) {
      // another svg file is currently open so we preview that instead of the one saved
      onDidCreatePanel(webviewPanel)
      this.show({ fsPath: vscode.window.activeTextEditor.document.uri.fsPath })
      state.content = vscode.window.activeTextEditor.document.getText()
      invalidateContent()
    } else {
      // preview the last viewed
      state.fsPath = deserializedState.fsPath
      onDidCreatePanel(webviewPanel)
      if(openSvg){
        state.content = openSvg.getText()
      } else {
        state.content = deserializedState.content
      }
      invalidateContent()
    }
  },
}
