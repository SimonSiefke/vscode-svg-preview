// const vscode = acquireVsCodeApi()

// console.log('INDEX')
// // Handle messages sent from the extension to the webview
// window.addEventListener('message', event => {
//   const message = event.data // The json data that the extension sent
//   switch (message.command) {
//     case 'update.fsPath':
//       vscode.setState({
//         message,
//       })
//       break
//     case 'update':
//       vscode.setState({
//         message,
//       })
//       break
//     default:
//       throw new Error(`unknown command ${message.command}`)
//   }
// })
