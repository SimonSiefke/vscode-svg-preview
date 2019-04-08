/**
 * State of the preview panel.
 */
export interface PreviewState {
  /**
   * File system path of the currently previewed file.
   */
  fsPath?: string
  /**
   * Content of the currently previewed file.
   */
  content?: string
  /**
   * Whether or not panning is enabled
   */
  // panningEnabled?: boolean
  /**
   * Whether or not zooming is enabled
   */
  // zoomingEnabled?: boolean

  /**
   * The Pointer offset during panning
   */
  pointerOffset?: {
    x: number
    y: number
  }
}
