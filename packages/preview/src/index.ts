import { usePan, CleanUp } from '../../pan-and-zoom/src/panAndZoom'
import { PreviewState } from '../../shared/src/PreviewState'
import { Message } from '../../shared/src/Message'
import './index.css'

console.log('init')
const vscode = acquireVsCodeApi()
const state: PreviewState = vscode.getState() || {}
function invalidateState(): void {
  vscode.setState(state)
}
function invalidateContent(): void {
  console.log('update content')
  document.body.innerHTML = state.content
}
let cleanUpPan: CleanUp | undefined
function invalidatePan(): void {
  if (cleanUpPan) {
    cleanUpPan()
  }
  cleanUpPan = usePan({
    initialPointerOffset: state.pointerOffset,
    onPointerOffsetChange(pointerOffset) {
      state.pointerOffset = pointerOffset
      invalidateState()
    },
  })
}
invalidatePan()
function invalidateBackground(): void {
  document.body.style.background = state.background
}
invalidateBackground()
window.addEventListener('message', event => {
  const messages: Message[] = event.data
  for (const message of messages) {
    switch (message.command) {
      case 'reset.pan':
        state.pointerOffset = undefined
        invalidatePan()
        invalidateState()
        break
      case 'update.fsPath':
        state.fsPath = message.payload
        invalidateState()
        break
      case 'update.content':
        state.content = message.payload
        invalidateContent()
        invalidateState()
        break
      case 'update.background':
        state.background = message.payload
        invalidateBackground()
        invalidateState()
        break
      default:
        // @ts-ignore
        throw new Error(`unknown command ${message.command}`)
    }
  }
})
