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
    vscode.postMessage({ command: 'debugError', payload: event.message })
  })
}
const { port } = document.body.dataset
const state: PreviewState = vscode.getState() || {}
const $image = document.querySelector('img')
/**
 * Whether or not the image has been panned/zoomed.
 */
let moved = Boolean(state.pointerOffset || state.zoom)
$image.addEventListener('load', () => {
  if (state.error) {
    state.error = undefined
    invalidateState()
    vscode.postMessage({
      command: 'setError',
      payload: undefined,
    })
  }
})
$image.addEventListener('error', () => {
  if (state.error) {
    return
  }
  state.error = 'invalid image'
  invalidateState()
  vscode.postMessage({
    command: 'setError',
    payload: 'invalid image',
  })
})
const $style = document.querySelector('#custom-style')
const invalidateState = (): void => {
  vscode.setState(state)
}
const invalidateContent = (): void => {
  invalidateScaleToFit()
  const encodedImage = encodeURIComponent(state.content)
  $image.setAttribute('src', `data:image/svg+xml,${encodedImage}`)
}
let cleanUpPan: CleanUp | undefined
const invalidatePan = (): void => {
  if (cleanUpPan) {
    cleanUpPan()
  }
  cleanUpPan = usePan({
    initialPointerOffset: state.pointerOffset,
    onPointerOffsetChange(pointerOffset) {
      state.pointerOffset = pointerOffset
      invalidateState()
      if (!moved) {
        moved = true
        state.fixedSize = {
          width: parseInt(window.getComputedStyle($image).width, 10),
          height: parseInt(window.getComputedStyle($image).height, 10),
        }
        invalidateScaleToFit()
      }
    },
  })
}
invalidatePan()
let cleanUpZoom: CleanUp | undefined
const invalidateZoom = (): void => {
  if (cleanUpZoom) {
    cleanUpZoom()
  }
  cleanUpZoom = useZoom({
    initialZoom: state.zoom,
    onZoomChange(zoom, pointerOffset) {
      state.zoom = zoom
      state.pointerOffset = pointerOffset
      invalidateState()
      if (!moved) {
        moved = true
        state.fixedSize = {
          width: parseInt(window.getComputedStyle($image).width, 10),
          height: parseInt(window.getComputedStyle($image).height, 10),
        }
        invalidateScaleToFit()
      }
    },
  })
}
invalidateZoom()
const createStyleString = (styleObject: StyleConfiguration): string => {
  let style = ''
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
const invalidateStyle = (): void => {
  if (state.style) {
    $style.textContent = createStyleString(state.style)
  }
}
invalidateStyle()
const invalidateScaleToFit = (): void => {
  if (state.scaleToFit && !moved) {
    $image.style.height = ''
    $image.style.width = ''
  } else {
    if (state.fixedSize) {
      $image.style.width = `${state.fixedSize.width}px`
      $image.style.height = `${state.fixedSize.height}px`
      $image.style.maxWidth = 'none'
      return
    }
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
      state.fixedSize = {
        width,
        height,
      }
      invalidateState()
    }
  }
}
const ws = new WebSocket(`ws://localhost:${port}`)
ws.addEventListener('message', event => {
  const messages: Message[] = JSON.parse(event.data)
  let invalidScaleToFit = false
  let invalidPan = false
  let invalidState = false
  let invalidContent = false
  let invalidStyle = false
  let invalidZoom = false
  for (const message of messages) {
    switch (message.command) {
      case 'update.pan':
        state.pointerOffset = undefined
        state.fixedSize = undefined
        moved = false
        invalidScaleToFit = true
        invalidPan = true
        invalidState = true
        break
      case 'update.zoom':
        state.zoom = undefined
        state.fixedSize = undefined
        moved = false
        invalidScaleToFit = true
        invalidZoom = true
        invalidState = true
        break
      case 'update.fsPath':
        state.fsPath = message.payload
        invalidState = true
        break
      case 'update.content':
        state.content = message.payload
        invalidContent = true
        invalidState = true
        break
      case 'update.style':
        state.style = message.payload
        invalidStyle = true
        invalidState = true
        break
      case 'update.scaleToFit':
        state.scaleToFit = message.payload
        invalidScaleToFit = true
        invalidState = true
        break
      default:
        // @ts-ignore
        throw new Error(`unknown command ${message.command}`)
    }
  }

  if (invalidPan) {
    invalidatePan()
  }
  if (invalidScaleToFit) {
    invalidateScaleToFit()
  }
  if (invalidZoom) {
    invalidateZoom()
  }
  if (invalidContent) {
    invalidateContent()
  }
  if (invalidStyle) {
    invalidateStyle()
  }
  if (invalidState) {
    invalidateState()
  }
})
