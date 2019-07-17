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
   *  This variable will be used later for move events to check if pointer is down or not.
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

  function move({ x = 0, y = 0 }: { x?: number; y?: number }): void {
    // Update the transform coordinates with the distance from origin and current position
    domMatrix.e += x
    domMatrix.f += y
    applyTransform()
  }

  /**
   * Function called by the event listeners when user starts moving/dragging.
   */
  function onPointerMove(event: PointerEvent): void {
    // Only run this function if the pointer is down
    if (!isPointerDown) {
      return
    }
    move({
      x: event.clientX - pointerOffset.x,
      y: event.clientY - pointerOffset.y,
    })
    pointerOffset.x = event.clientX
    pointerOffset.y = event.clientY
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

  let animationFrame: number
  let moving = false
  let arrowLeftDown = false
  let arrowRightDown = false
  let arrowUpDown = false
  let arrowDownDown = false

  function startMoving(): void {
    const speed = Math.ceil(window.innerWidth / 200)
    let x = 0
    let y = 0
    if (arrowLeftDown && !arrowRightDown) {
      x = -speed
    } else if (!arrowLeftDown && arrowRightDown) {
      x = speed
    }
    if (arrowUpDown && !arrowDownDown) {
      y = -speed
    } else if (!arrowUpDown && arrowDownDown) {
      y = speed
    }
    move({ x, y })
    animationFrame = requestAnimationFrame(startMoving)
  }

  function stopMoving(): void {
    cancelAnimationFrame(animationFrame)
    moving = false
  }

  function onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        arrowLeftDown = true
        if (!moving) {
          moving = true
          startMoving()
        }
        break
      case 'ArrowUp':
        arrowUpDown = true
        if (!moving) {
          moving = true
          startMoving()
        }
        break
      case 'ArrowRight':
        arrowRightDown = true
        if (!moving) {
          moving = true
          startMoving()
        }
        break
      case 'ArrowDown':
        arrowDownDown = true
        if (!moving) {
          moving = true
          startMoving()
        }
        break
      default:
        break
    }
  }

  function onKeyUp(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        arrowLeftDown = false
        break
      case 'ArrowUp':
        arrowUpDown = false
        break
      case 'ArrowRight':
        arrowRightDown = false
        break
      case 'ArrowDown':
        arrowDownDown = false
        break
      default:
        break
    }
    if (
      [arrowLeftDown, arrowUpDown, arrowRightDown, arrowDownDown].every(
        keyDown => !keyDown
      )
    ) {
      stopMoving()
    }
  }

  $root.addEventListener('pointerdown', onPointerDown) // Pointer is pressed
  $root.addEventListener('pointerup', onPointerUp) // Releasing the pointer
  $root.addEventListener('pointerleave', onPointerUp) // Pointer gets out of the $root area
  $root.addEventListener('pointermove', onPointerMove) // Pointer is moving
  $root.addEventListener('keydown', onKeyDown) // for navigating with arrow keys
  $root.addEventListener('keyup', onKeyUp)
  return () => {
    $root.removeEventListener('pointerdown', onPointerDown)
    $root.removeEventListener('pointerup', onPointerUp)
    $root.removeEventListener('pointerleave', onPointerUp)
    $root.removeEventListener('pointermove', onPointerMove)
    $root.removeEventListener('keydown', onKeyDown)
    $root.removeEventListener('keyup', onKeyUp)
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
  onZoomChange?: (zoom: number, pointerOffset: Point) => void
  initialZoom?: number
} = {}): CleanUp {
  const minZoom = 0.1
  const maxZoom = 2 ** 16
  let zoom = initialZoom
  domMatrix.a = zoom
  domMatrix.d = zoom
  applyTransform()
  function handleWheel(event: WheelEvent): void {
    if (event.deltaY === 0) {
      // ignore horizontal scroll events
      return
    }
    const direction = event.deltaY < 0 ? 'up' : 'down'
    const normalizedDeltaY = 1 + Math.abs(event.deltaY) / 200
    const currentZoomFactor =
      direction === 'up' ? normalizedDeltaY : 1 / normalizedDeltaY
    const previousZoom = zoom
    zoom *= currentZoomFactor
    // if larger than maxZoom, stay at previousZoom
    if (zoom > maxZoom) {
      zoom = previousZoom
    }
    // if smaller than minZoom, stay at previous zoom
    if (zoom < minZoom) {
      zoom = previousZoom
    }
    if (zoom === previousZoom) {
      return
    }
    domMatrix = new DOMMatrix()
      .translateSelf(event.clientX, event.clientY)
      .scaleSelf(currentZoomFactor)
      .translateSelf(-event.clientX, -event.clientY)
      .multiplySelf(domMatrix)
    onZoomChange(zoom, { x: domMatrix.e, y: domMatrix.f })
    applyTransform()
  }
  $root.addEventListener('wheel', handleWheel, { passive: true })
  return () => {
    $root.removeEventListener('wheel', handleWheel)
  }
}
