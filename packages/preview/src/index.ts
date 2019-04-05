import { Message } from '../../shared/Message'

const vscode = acquireVsCodeApi()
window.addEventListener('message', event => {
  console.log('got message', event.data)
  const message: Message = event.data
  switch (message.command) {
    case 'update.fsPath':
      vscode.setState({
        fsPath: message.data,
      })
      break
    case 'update.content':
      document.body.innerHTML = message.data
      break
    default:
      throw new Error(`unknown command ${message.command}`)
  }
})
