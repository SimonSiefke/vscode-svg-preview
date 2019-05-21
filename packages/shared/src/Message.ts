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
      command: 'update.pan'
      payload: { x: number; y: number }
    }
  | {
      command: 'update.zoom'
      payload: number
    }
  | {
      command: 'update.scaleToFit'
      payload: boolean
    }
