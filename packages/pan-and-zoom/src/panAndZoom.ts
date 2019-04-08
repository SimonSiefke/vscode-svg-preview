import { Transform, createTransform } from './createTransform/createTransform'

type CleanUp = () => void

/**
 * The current zoom
 */
let zoom = 1

let width = window.innerWidth
let widthAfterResize = width

/**
 *  This variable will contain the original coordinates when the user start pressing the mouse or touching the screen.
 */
const pointerOrigin = new DOMPoint()

/**
 * Current pan offset.
 */
const pointerOffset = new DOMPoint()

/**
 * Use pan functionality.
 */
export function usePan(): CleanUp {
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
    const scale = widthAfterResize / width
    width = widthAfterResize
    console.log(scale)
    // pointerOrigin.x *= scale
    // pointerOrigin.y *= scale
    // pointerOffset.x *= scale
    // pointerOffset.y *= scale

    pointerOrigin.x = event.clientX
    pointerOrigin.y = event.clientY
  }

  /**
   * Function called by the event listeners when user start moving/dragging.
   */
  function onPointerMove(event: PointerEvent): void {
    // Only run this function if the pointer is down
    if (!isPointerDown) {
      return
    }
    // This prevent user to do a selection on the page
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
    // compute the pan offset
    pointerOffset.x += event.clientX - pointerOrigin.x
    pointerOffset.y += event.clientY - pointerOrigin.y
  }

  function onResize(): void {
    widthAfterResize = window.innerWidth
  }

  document.documentElement.addEventListener('pointerdown', onPointerDown) // Pointer is pressed
  document.documentElement.addEventListener('pointerup', onPointerUp) // Releasing the pointer
  document.documentElement.addEventListener('pointerleave', onPointerUp) // Pointer gets out of the document.documentElement area
  document.documentElement.addEventListener('pointermove', onPointerMove) // Pointer is moving

  window.addEventListener('resize', onResize)

  return () => {
    document.documentElement.removeEventListener('pointerdown', onPointerDown)
    document.documentElement.removeEventListener('pointerup', onPointerUp)
    document.documentElement.removeEventListener('pointerleave', onPointerUp)
    document.documentElement.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('resize', onResize)
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
