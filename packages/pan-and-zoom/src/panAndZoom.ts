export type CleanUp = () => void

interface Point {
  x: number
  y: number
}

/**
 * The transformation matrix.
 */
const domMatrix = new DOMMatrix()

/**
 * Apply the domMatrix transformations.
 */
function applyTransform(): void {
  document.documentElement.style.transform = `${domMatrix}`
}

/**
 * Use pan functionality.
 */
export function usePan({
  initialPointerOffset = { x: 0, y: 0 },
  onPointerOffsetChange = () => {},
}: {
  onPointerOffsetChange?: (pointerOffset: Readonly<Point>) => void
  initialPointerOffset?: Point
} = {}): CleanUp {
  /**
   * Offset of the pointer.
   */
  const pointerOffset = initialPointerOffset
  domMatrix.e = pointerOffset.x
  domMatrix.f = pointerOffset.y
  applyTransform()

  /**
   *  This variable will be used later for move events to check if pointer is down or not
   */
  let isPointerDown = false

  /**
   * Function called by the event listeners when user start pressing.
   */
  function onPointerDown(event: PointerEvent): void {
    // ignore right clicks
    if (event.button !== 0) {
      return
    }
    isPointerDown = true
    // We get the pointer position on click so we can get the value once the user starts to drag
    pointerOffset.x = event.clientX
    pointerOffset.y = event.clientY
  }

  /**
   * Function called by the event listeners when user starts moving/dragging.
   */
  function onPointerMove(event: PointerEvent): void {
    // Only run this function if the pointer is down
    if (!isPointerDown) {
      return
    }
    // Update the transform coordinates with the distance from origin and current position
    const x = event.clientX - pointerOffset.x
    const y = event.clientY - pointerOffset.y
    domMatrix.e += x
    domMatrix.f += y
    applyTransform()
    pointerOffset.x += x
    pointerOffset.y += y
    // onPointerOffsetChange(pointerOffset)
  }
  function onPointerUp(event: PointerEvent): void {
    if (!isPointerDown) {
      return
    }
    isPointerDown = false
    pointerOffset.x += event.clientX - pointerOffset.x
    pointerOffset.y += event.clientY - pointerOffset.y
    onPointerOffsetChange({
      x: domMatrix.e,
      y: domMatrix.f,
    })
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
export function useZoom({
  initialZoom = 1,
  onZoomChange = () => {},
}: {
  onZoomChange?: (zoom: number) => void
  initialZoom?: number
} = {}): CleanUp {
  /**
   * The current zoom
   */
  let zoom = initialZoom
  function setZoom(): void {
    domMatrix.a = zoom
    domMatrix.d = zoom
  }
  setZoom()
  applyTransform()
  const minScale = 0.1
  const maxScale = 2 ** 20
  const scaleFactor = 2
  function handleWheel(event: WheelEvent): void {
    const direction = event.deltaY < 0 ? 'up' : 'down'
    if (direction === 'up') {
      zoom = Math.min(zoom * scaleFactor, maxScale)
    } else {
      zoom = Math.max(zoom / scaleFactor, minScale)
    }
    onZoomChange(zoom)
    domMatrix.translateSelf(event.clientX, event.clientY)
    setZoom()
    domMatrix.translateSelf(-event.clientX, -event.clientY)
    applyTransform()
  }
  document.documentElement.addEventListener('wheel', handleWheel)
  return () => {
    document.documentElement.removeEventListener('wheel', handleWheel)
  }
}
