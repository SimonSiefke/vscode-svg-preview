import * as vscode from 'vscode'

interface State {
  context: vscode.ExtensionContext | undefined
}

const state: State = {
  context: undefined,
}

export const setContext = (context: vscode.ExtensionContext) => {
  state.context = context
}

export const getContext = () => {
  return state.context
}
