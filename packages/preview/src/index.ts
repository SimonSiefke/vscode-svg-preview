import { Message } from '../../shared/src/Message'
import { usePan, useZoom } from '../../pan-and-zoom/src/panAndZoom'

const vscode = acquireVsCodeApi()

let panningCleanUp: (() => void) | undefined
let zoomingCleanup: (() => void) | undefined

const state = new Proxy<PreviewState>(
  {},
  {
    set(target, key: keyof PreviewState, value) {
      if (target[key] === value) {
        vscode.postMessage({ command: `unnecessary update "${key}${value}"` })
        return true
      }
      switch (key) {
        case 'content':
          document.body.innerHTML = value
          break
        case 'fsPath':
          break
        case 'panningEnabled':
          if (value && !panningCleanUp) {
            panningCleanUp = usePan()
          }
          if (!value && panningCleanUp) {
            panningCleanUp()
            panningCleanUp = undefined
          }
          break
        case 'zoomingEnabled':
          if (value && !zoomingCleanup) {
            zoomingCleanup = useZoom()
          }
          if (!value && zoomingCleanup) {
            zoomingCleanup()
            zoomingCleanup = undefined
          }
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
    case 'update.panningEnabled':
      state.panningEnabled = message.payload
      break
    case 'update.zoomingEnabled':
      state.zoomingEnabled = message.payload
      break
    default:
      // @ts-ignore
      throw new Error(`unknown command ${message.command}`)
  }
})
