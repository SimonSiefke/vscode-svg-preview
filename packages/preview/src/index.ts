/* eslint-disable @typescript-eslint/no-use-before-define */
import { usePan, CleanUp, useZoom } from '../../pan-and-zoom/src/panAndZoom'
import { PreviewState } from '../../shared/src/PreviewState'
import { Message } from '../../shared/src/Message'
import './index.css'
import { StyleConfiguration } from '../../shared/src/StyleConfiguration'

const vscode = acquireVsCodeApi()
if (DEVELOPMENT) {
  window.addEventListener('error', event => {
    console.error(event)
    vscode.postMessage({ command: 'error', payload: event.message })
  })
}
const { port } = document.body.dataset
const state: PreviewState = vscode.getState() || {}
const $image = document.querySelector('img')
const $style = document.querySelector('#custom-style')
function invalidateState(): void {
  vscode.setState(state)
}
function invalidateContent(): void {
  invalidateScaleToFit()
  $image.setAttribute(
    'src',
    `data:image/svg+xml,${encodeURIComponent(state.content)}`
  )
}
invalidateContent()
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
  for (const [selector, value] of Object.entries(styleObject)) {
    const right = Object.entries(value).reduce(
      (styleString, [propName, propValue]) =>
        `${styleString}${propName}:${propValue};`,
      ''
    )
    style = `${style}${selector}{${right}}`
  }
  return style
}
function invalidateStyle(): void {
  if (state.style) {
    $style.textContent = createStyleString(state.style)
  }
}
invalidateStyle()
function invalidateScaleToFit(): void {
  if (state.scaleToFit) {
    $image.style.height = ''
    $image.style.width = ''
  } else {
    const parser = new DOMParser()
    const $svgDocument = parser.parseFromString(state.content, 'image/svg+xml')
    const $svg = $svgDocument.querySelector('svg')
    if (!$svg) {
      if (DEVELOPMENT) {
        console.warn('no svg')
      }
      return
    }
    let newWidth = $svg.width.baseVal.valueAsString
    // when there is no unit specified, we use pixel
    if ($svg.width.baseVal.unitType === 1) {
      newWidth += 'px'
    }
    let newHeight = $svg.height.baseVal.valueAsString
    // when there is no unit specified, we use pixel
    if ($svg.height.baseVal.unitType === 1) {
      newHeight += 'px'
    }
    if ($svg.getAttribute('width') && $svg.getAttribute('height')) {
      $image.style.width = newWidth
      $image.style.height = newHeight
    } else if ($svg.getAttribute('width') && !$svg.getAttribute('height')) {
      $image.style.width = newWidth
      $image.style.height = ''
    } else if (!$svg.getAttribute('width') && $svg.getAttribute('height')) {
      $image.style.width = ''
      $image.style.height = newHeight
    } else {
      // set width and height based on viewBox when not width or height was given
      const { width, height } = $svg.viewBox.baseVal
      $image.style.width = `${width}px`
      $image.style.height = `${height}px`
    }
  }
}
const ws = new WebSocket(`ws://localhost:${port}`)
ws.addEventListener('message', event => {
  const messages: Message[] = JSON.parse(event.data)
  for (const message of messages) {
    switch (message.command) {
      case 'update.pan':
        state.pointerOffset = undefined
        invalidatePan()
        invalidateState()
        break
      case 'update.zoom':
        state.zoom = undefined
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
      case 'update.scaleToFit':
        state.scaleToFit = message.payload
        invalidateScaleToFit()
        invalidateState()
        break
      default:
        // @ts-ignore
        throw new Error(`unknown command ${message.command}`)
    }
  }
})
