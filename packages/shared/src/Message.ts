export type Command = 'update.content' | 'update.fsPath'

/**
 * Message that can be send from the extension to the preview panel.
 */
export interface Message {
  command: Command
  payload: string
}
