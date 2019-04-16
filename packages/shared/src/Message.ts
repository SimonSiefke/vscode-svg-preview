import { StyleConfiguration } from './StyleConfiguration'

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
  | {
      command: 'update.style'
      payload: StyleConfiguration
    }
  | {
      command: 'reset.panAndZoom'
    }
