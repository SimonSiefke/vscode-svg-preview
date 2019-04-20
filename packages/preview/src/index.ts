import { usePan, CleanUp, useZoom } from '../../pan-and-zoom/src/panAndZoom'
import { PreviewState } from '../../shared/src/PreviewState'
import { Message } from '../../shared/src/Message'
import './index.css'
import { StyleConfiguration } from '../../shared/src/StyleConfiguration'
import { vscode } from './vscode'

if (DEVELOPMENT) {
  window.addEventListener('error', event => {
    console.error(event)
    vscode.postMessage({ command: 'error', payload: event.message })
  })
}
const state: PreviewState = vscode.getState() || {}
const $image = document.querySelector('img')
const $style = document.querySelector('#custom-style')
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
function createStyleString(styleObject: StyleConfiguration): string {
  let style = ``
  for (const [key, value] of Object.entries(styleObject)) {
    const left = key
    const right = Object.entries(value).reduce(
      (styleString, [propName, propValue]) =>
        `${styleString}${propName}:${propValue};`,
      ''
    )
    style = `${style}${left}{${right}}`
  }
  return style
}
function invalidateStyle(): void {
  if (state.style) {
    $style.textContent = createStyleString(state.style)
  }
}
invalidateStyle()
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
      case 'update.style':
        state.style = message.payload
        invalidateStyle()
        invalidateState()
        break
      default:
        // @ts-ignore
        throw new Error(`unknown command ${message.command}`)
    }
  }
})
