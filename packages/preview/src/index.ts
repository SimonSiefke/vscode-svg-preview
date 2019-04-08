import { usePan, CleanUp } from '../../pan-and-zoom/src/panAndZoom'
import { PreviewState } from '../../shared/src/PreviewState'
import { Message } from '../../shared/src/Message'

const vscode = acquireVsCodeApi()
const state: PreviewState = vscode.getState() || {}
function invalidateState(): void {
  vscode.setState(state)
}
function invalidateContent(): void {
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
if (state.content !== undefined) {
  invalidateContent()
}
window.addEventListener('message', event => {
  const message: Message = event.data
  switch (message.command) {
    case 'update.fsPath':
      state.fsPath = message.payload
      state.pointerOffset = undefined
      invalidatePan()
      invalidateState()
      break
    case 'update.content':
      state.content = message.payload
      invalidateContent()
      invalidateState()
      break
    default:
      // @ts-ignore
      throw new Error(`unknown command ${message.command}`)
  }
})
