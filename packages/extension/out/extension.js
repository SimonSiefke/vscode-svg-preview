"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const fs = require("fs");
const cats = {
    'Coding Cat': 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
    'Compiling Cat': 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
    'Testing Cat': 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif',
};
let c;
function activate(context) {
    c = context;
    context.subscriptions.push(vscode.commands.registerCommand('catCoding.start', () => {
        CatCodingPanel.createOrShow(context.extensionPath);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('catCoding.doRefactor', () => {
        if (CatCodingPanel.currentPanel) {
            CatCodingPanel.currentPanel.doRefactor();
        }
    }));
    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode.window.registerWebviewPanelSerializer(CatCodingPanel.viewType, {
            deserializeWebviewPanel(webviewPanel, state) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log(`Got state: ${state}`);
                    CatCodingPanel.revive(webviewPanel, context.extensionPath);
                });
            },
        });
    }
}
exports.activate = activate;
/**
 * Get the absolute path for relative path.
 *
 * @example
 * ```js
 * getPath(context, './preview-src/index.css')
 * ```
 */
function getPath(context, file) {
    return vscode.Uri.file(context.asAbsolutePath(file)).with({
        scheme: 'vscode-resource',
    });
}
/**
 * Get the html for the svg preview panel.
 */
function getPreviewHTML() {
    const html = fs.readFileSync(path.join(__dirname, '../preview-src/index.html'), 'utf-8');
    /**
     * The base url for links inside the html file.
     */
    const base = getPath(c, 'preview-src');
    /**
     * The things that will be replaced inside the html, e.g. `<!-- base -->` will be replaced with the actual `base` tag and `<!-- svg -->` will be replaced with the actual `svg`.
     */
    const replaceMap = {
        '<!-- insert base here -->': `<base href="${base}/"`,
    };
    const regExp = new RegExp(Object.keys(replaceMap).join('|'), 'gi');
    return html.replace(regExp, matched => replaceMap[matched]);
}
/**
 * Manages cat coding webview panels
 */
class CatCodingPanel {
    constructor(panel, extensionPath) {
        this._disposables = [];
        this._panel = panel;
        this._extensionPath = extensionPath;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Update the content based on view changes
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this._update();
            }
        }, null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
    }
    static createOrShow(extensionPath) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (CatCodingPanel.currentPanel) {
            CatCodingPanel.currentPanel._panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(CatCodingPanel.viewType, 'Cat Coding', column || vscode.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true,
        });
        CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionPath);
    }
    static revive(panel, extensionPath) {
        CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionPath);
    }
    doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }
    dispose() {
        CatCodingPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update() {
        const z = 1 + 2;
        // Vary the webview's content based on where it is located in the editor.
        switch (this._panel.viewColumn) {
            case vscode.ViewColumn.Two:
                this._updateForCat('Compiling Cat');
                return;
            case vscode.ViewColumn.Three:
                this._updateForCat('Testing Cat');
                return;
            case vscode.ViewColumn.One:
            default:
                this._updateForCat('Coding Cat');
                return;
        }
    }
    _updateForCat(catName) {
        this._panel.title = catName;
        this._panel.webview.html = getPreviewHTML();
    }
    _getHtmlForWebview(catGif) {
        // Local path to main script run in the webview
        const htmlPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, '../../packages', 'media', 'index.html'));
        // And the uri we use to load this script in the webview
        const scriptUri = htmlPathOnDisk.with({ scheme: 'vscode-resource' });
        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();
        return fs.readFileSync(htmlPathOnDisk.fsPath, 'utf-8');
    }
}
CatCodingPanel.viewType = 'catCoding';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=extension.js.map