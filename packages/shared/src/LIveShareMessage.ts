import * as vscode from 'vscode'

export interface LiveShareMessage {
  visible: boolean
  fsPath: string | undefined
  viewColumn: vscode.ViewColumn | undefined
  content: string
}
