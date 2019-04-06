import { Message } from '../../shared/src/Message'

const vscode = acquireVsCodeApi()

const state = new Proxy<State>(
  {},
  {
    set(target, key: keyof State, value) {
      if (target[key] === value) {
        vscode.postMessage({ command: `unnecessary${key}${value}` })
        return true
      }
      switch (key) {
        case 'content':
          document.body.innerHTML = value
          break
        case 'fsPath':
          break
        default:
          throw new Error(`invalid key "${key}"`)
      }
      vscode.setState({ ...target, [key]: value })
      // eslint-disable-next-line no-param-reassign
      target[key] = value
      return true
    },
    get(target, key) {
      return target[key]
    },
  }
)

console.log('index')

const initialState = vscode.getState()
if (initialState && initialState.content) {
  for (const [key, value] of Object.entries(initialState)) {
    state[key] = value
  }
}

window.addEventListener('message', event => {
  const message: Message = event.data
  switch (message.command) {
    case 'update.fsPath':
      state.fsPath = message.payload
      break
    case 'update.content':
      state.content = message.payload
      break
    default:
      throw new Error(`unknown command ${message.command}`)
  }
})
