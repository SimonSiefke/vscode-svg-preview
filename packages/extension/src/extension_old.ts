import * as path from 'path'
import * as vscode from 'vscode'
import * as fs from 'fs'

const cats = {
  'Coding Cat': 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
  'Compiling Cat': 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
  'Testing Cat': 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif',
}
let c: vscode.ExtensionContext

export function activate(context: vscode.ExtensionContext) {
  c = context
  context.subscriptions.push(
    vscode.commands.registerCommand('catCoding.start', () => {
      CatCodingPanel.createOrShow(context.extensionPath)
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('catCoding.doRefactor', () => {
      if (CatCodingPanel.currentPanel) {
        CatCodingPanel.currentPanel.doRefactor()
      }
    })
  )

  if (vscode.window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    vscode.window.registerWebviewPanelSerializer(CatCodingPanel.viewType, {
      async deserializeWebviewPanel(
        webviewPanel: vscode.WebviewPanel,
        state: any
      ) {
        console.log(`Got state: ${state}`)
        CatCodingPanel.revive(webviewPanel, context.extensionPath)
      },
    })
  }
}

/**
 * Get the absolute path for relative path.
 *
 * @example
 * ```js
 * getPath(context, './preview-src/index.css')
 * ```
 */
function getPath(context: vscode.ExtensionContext, file: string): vscode.Uri {
  return vscode.Uri.file(context.asAbsolutePath(file)).with({
    scheme: 'vscode-resource',
  })
}

/**
 * Get the html for the svg preview panel.
 */
function getPreviewHTML(): string {
  const html = fs.readFileSync(
    path.join(__dirname, '../../preview/dist/index.html'),
    'utf-8'
  )
  /**
   * The base url for links inside the html file.
   */
  const base = getPath(c, '../preview/dist')
  /**
   * The things that will be replaced inside the html, e.g. `<!-- base -->` will be replaced with the actual `base` tag and `<!-- svg -->` will be replaced with the actual `svg`.
   */
  const replaceMap = {
    '<!-- insert base here -->': `<base href="${base}/">`,
  }
  const regExp = new RegExp(Object.keys(replaceMap).join('|'), 'gi')
  return html.replace(regExp, matched => replaceMap[matched])
}

/**
 * Manages cat coding webview panels
 */
class CatCodingPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: CatCodingPanel | undefined

  public static readonly viewType = 'catCoding'

  private readonly _panel: vscode.WebviewPanel

  private readonly _extensionPath: string

  private _disposables: vscode.Disposable[] = []

  public static createOrShow(extensionPath: string) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (CatCodingPanel.currentPanel) {
      CatCodingPanel.currentPanel._panel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      CatCodingPanel.viewType,
      'Cat Coding',
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          vscode.Uri.file(path.join(extensionPath, '../preview/dist')),
        ],
      }
    )

    CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionPath)
  }

  public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
    CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionPath)
  }

  private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
    this._panel = panel
    this._extensionPath = extensionPath

    // Set the webview's initial html content
    this._update()

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      e => {
        if (this._panel.visible) {
          this._update()
        }
      },
      null,
      this._disposables
    )

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'alert':
            vscode.window.showErrorMessage(message.text)
        }
      },
      null,
      this._disposables
    )
  }

  public doRefactor() {
    // Send a message to the webview webview.
    // You can send any JSON serializable data.
    this._panel.webview.postMessage({ command: 'refactor' })
  }

  public dispose() {
    CatCodingPanel.currentPanel = undefined

    // Clean up our resources
    this._panel.dispose()

    while (this._disposables.length) {
      const x = this._disposables.pop()
      if (x) {
        x.dispose()
      }
    }
  }

  private _update() {
    const z = 1 + 2
    // Vary the webview's content based on where it is located in the editor.
    switch (this._panel.viewColumn) {
      case vscode.ViewColumn.Two:
        this._updateForCat('Compiling Cat')
        return

      case vscode.ViewColumn.Three:
        this._updateForCat('Testing Cat')
        return

      case vscode.ViewColumn.One:
      default:
        this._updateForCat('Coding Cat')
    }
  }

  private _updateForCat(catName: keyof typeof cats) {
    this._panel.title = catName
    this._panel.webview.html = getPreviewHTML()
  }
}
