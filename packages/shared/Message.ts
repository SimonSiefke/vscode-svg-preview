type Command = 'update.content' | 'update.fsPath'

export interface Message {
  command: Command
  data: string
}
