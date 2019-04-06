import { Message } from '../../shared/Message'

const vscode = acquireVsCodeApi()

// let _message: any

// setInterval(() => {
//   vscode.postMessage({
//     command: _message.data,
//   })
// }, 1000)

window.addEventListener('message', event => {
  console.log('got message', event.data)
  // _message = event.data
  const message: Message = event.data
  switch (message.command) {
    case 'update.fsPath':
      vscode.setState({
        fsPath: message.payload,
      })
      break
    case 'update.content':
      vscode.postMessage({
        command: 'update content',
      })
      document.body.innerHTML = message.payload
      break
    default:
      throw new Error(`unknown command ${message.command}`)
  }
})
