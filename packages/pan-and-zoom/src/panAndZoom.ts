import { Transform, createTransform } from './createTransform/createTransform'

export type CleanUp = () => void

interface Point {
  x: number
  y: number
}

/**
 * The current zoom
 */
let zoom = 1

/**
 *  This variable will contain the original coordinates when the user start pressing the mouse or touching the screen.
 */
const pointerOrigin: Point = {
  x: 0,
  y: 0,
}

/**
 * Current pan offset.
 */
const pointerOffset: Point = {
  x: 0,
  y: 0,
}

/**
 * Use pan functionality.
 */
export function usePan({
  initialPointerOffset,
  onPointerOffsetChange = () => {},
}: {
  onPointerOffsetChange?: (pointerOffset: Point) => void
  initialPointerOffset?: Point
} = {}): CleanUp {
  if (initialPointerOffset) {
    pointerOffset.x = initialPointerOffset.x
    pointerOffset.y = initialPointerOffset.y
  } else {
    pointerOffset.x = 0
    pointerOffset.y = 0
  }
  console.log('transform', pointerOffset)
  document.body.style.transform = `${createTransform().translate(
    pointerOffset.x,
    pointerOffset.y
  )}`

  /**
   *  This variable will be used later for move events to check if pointer is down or not
   */
  let isPointerDown = false

  /**
   * Function called by the event listeners when user start pressing.
   */
  function onPointerDown(event: PointerEvent): void {
    isPointerDown = true
    // We get the pointer position on click so we can get the value once the user starts to drag
    pointerOrigin.x = event.clientX
    pointerOrigin.y = event.clientY
  }

  /**
   * Function called by the event listeners when user starts moving/dragging.
   */
  function onPointerMove(event: PointerEvent): void {
    // Only run this function if the pointer is down
    if (!isPointerDown) {
      return
    }
    // This prevents the user to do a selection on the page
    event.preventDefault()
    // Update the transform coordinates with the distance from origin and current position
    const x = event.clientX + pointerOffset.x - pointerOrigin.x
    const y = event.clientY + pointerOffset.y - pointerOrigin.y
    const transform = createTransform().translate(x / zoom, y / zoom)
    document.body.style.transform = `${transform}`
  }

  function onPointerUp(event: PointerEvent): void {
    if (!isPointerDown) {
      return
    }
    isPointerDown = false
    pointerOffset.x += event.clientX - pointerOrigin.x
    pointerOffset.y += event.clientY - pointerOrigin.y
    onPointerOffsetChange(pointerOffset)
  }

  document.documentElement.addEventListener('pointerdown', onPointerDown) // Pointer is pressed
  document.documentElement.addEventListener('pointerup', onPointerUp) // Releasing the pointer
  document.documentElement.addEventListener('pointerleave', onPointerUp) // Pointer gets out of the document.documentElement area
  document.documentElement.addEventListener('pointermove', onPointerMove) // Pointer is moving

  return () => {
    document.documentElement.removeEventListener('pointerdown', onPointerDown)
    document.documentElement.removeEventListener('pointerup', onPointerUp)
    document.documentElement.removeEventListener('pointerleave', onPointerUp)
    document.documentElement.removeEventListener('pointermove', onPointerMove)
  }
}

/**
 * Use zoom functionality.
 */
export function useZoom(): CleanUp {
  const minScale = 0.1
  const maxScale = Infinity
  // const scaleFactor = 2
  const scaleFactor = 1.3

  function setTransform(transform: Transform): void {
    document.documentElement.style.transform = `${transform}`
  }

  function handleWheel(event: WheelEvent): void {
    const direction = event.deltaY < 0 ? 'up' : 'down'
    if (direction === 'up') {
      zoom = Math.min(zoom * scaleFactor, maxScale)
    } else {
      zoom = Math.max(zoom / scaleFactor, minScale)
    }
    const transform = createTransform()
      .translate(event.clientX, event.clientY)
      .scale(zoom)
      .translate(-event.clientX, -event.clientY)
    setTransform(transform)
  }
  document.documentElement.addEventListener('wheel', handleWheel)
  return () => {
    document.documentElement.removeEventListener('wheel', handleWheel)
  }
}
