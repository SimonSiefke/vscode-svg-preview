import { usePan, CleanUp, useZoom } from '../../pan-and-zoom/src/panAndZoom'
import { PreviewState } from '../../shared/src/PreviewState'
import { Message } from '../../shared/src/Message'
import './index.css'

const vscode = acquireVsCodeApi()
if (DEVELOPMENT) {
  window.addEventListener('error', event => {
    console.error(event)
    vscode.postMessage({ command: 'error', payload: event.message })
  })
}

const state: PreviewState = vscode.getState() || {}
const $image = document.querySelector('img')
function invalidateState(): void {
  vscode.setState(state)
}
function invalidateContent(): void {
  $image.setAttribute(
    'src',
    `data:image/svg+xml,${encodeURIComponent(state.content)}`
  )
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
let cleanUpZoom: CleanUp | undefined
function invalidateZoom(): void {
  if (cleanUpZoom) {
    cleanUpZoom()
  }
  cleanUpZoom = useZoom({
    initialZoom: state.zoom,
    onZoomChange(zoom) {
      state.zoom = zoom
      invalidateState()
    },
  })
}
invalidateZoom()
function invalidateBackground(): void {
  document.body.dataset.background = state.background
}
invalidateBackground()
window.addEventListener('message', event => {
  const messages: Message[] = event.data
  for (const message of messages) {
    switch (message.command) {
      case 'reset.panAndZoom':
        state.pointerOffset = undefined
        state.zoom = undefined
        invalidatePan()
        invalidateZoom()
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
