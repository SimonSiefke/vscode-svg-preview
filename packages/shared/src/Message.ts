/**
 * Message that can be send from the extension to the preview panel.
 */
export type Message =
  | {
      command: 'update.content'
      payload: string
    }
  | {
      command: 'update.fsPath'
      payload: string
    }
