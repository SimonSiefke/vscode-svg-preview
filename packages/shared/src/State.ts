/**
 * State of the preview panel.
 */
export interface State {
  /**
   * File system path of the currently previewed file.
   */
  fsPath?: string
  /**
   * Content of the currently previewed file.
   */
  content?: string
}
