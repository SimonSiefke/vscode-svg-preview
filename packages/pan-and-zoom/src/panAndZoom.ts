export type CleanUp = () => void

interface Point {
  x: number
  y: number
}

const $root = document.documentElement
const $element = document.body

/**
 * The transformation matrix.
 */
let domMatrix = new DOMMatrix()

/**
 * Apply the domMatrix transformations.
 */
function applyTransform(): void {
  $element.style.transform = `${domMatrix}`
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
  $root.addEventListener('pointerdown', onPointerDown) // Pointer is pressed
  $root.addEventListener('pointerup', onPointerUp) // Releasing the pointer
  $root.addEventListener('pointerleave', onPointerUp) // Pointer gets out of the $root area
  $root.addEventListener('pointermove', onPointerMove) // Pointer is moving
  return () => {
    $root.removeEventListener('pointerdown', onPointerDown)
    $root.removeEventListener('pointerup', onPointerUp)
    $root.removeEventListener('pointerleave', onPointerUp)
    $root.removeEventListener('pointermove', onPointerMove)
  }
}

// TODO when zoom is large, panning isn't as smooth because the steps between numbers become very large (e.g. zoom = 8192 then panning moves 10px or more)

/**
 * Use zoom functionality.
 */
export function useZoom({
  initialZoom = 1,
  onZoomChange = () => {},
}: {
  onZoomChange?: (zoom: number, pointerOffset:Point) => void
  initialZoom?: number
} = {}): CleanUp {
  const minZoom = 0.1
  const maxZoom = 2 ** 11
  const zoomFactor = 1.3
  let zoom = initialZoom
  domMatrix.a = zoom
  domMatrix.d = zoom
  applyTransform()
  function handleWheel(event: WheelEvent): void {
    const direction = event.deltaY < 0 ? 'up' : 'down'
    const currentZoomFactor = direction === 'up' ? zoomFactor : 1 / zoomFactor
    if (
      (direction === 'up' && zoom >= maxZoom) ||
      (direction === 'down' && zoom < minZoom)
    ) {
      console.log('max zoom')
      return
    }
    zoom *= currentZoomFactor
    domMatrix = new DOMMatrix()
    .translateSelf(event.clientX, event.clientY)
    .scaleSelf(currentZoomFactor)
    .translateSelf(-event.clientX, -event.clientY)
    .multiplySelf(domMatrix)
    onZoomChange(zoom, {x:domMatrix.e, y:domMatrix.f})
    applyTransform()
  }
  $root.addEventListener('wheel', handleWheel, { passive: true })
  return () => {
    $root.removeEventListener('wheel', handleWheel)
  }
}
