import { Message } from '../../shared/Message'

const vscode = acquireVsCodeApi()

window.addEventListener('message', event => {
  const message: Message = event.data
  switch (message.command) {
    case 'update.fsPath':
      vscode.setState({
        fsPath: message.payload,
      })
      break
    case 'update.content':
      document.body.innerHTML = message.payload
      break
    default:
      throw new Error(`unknown command ${message.command}`)
  }
})
