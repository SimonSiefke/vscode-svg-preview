export type Command = 'update.content' | 'update.fsPath'

export interface Message {
  command: Command
  payload: string
}
