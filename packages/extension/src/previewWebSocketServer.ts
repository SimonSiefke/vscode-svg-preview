import { createWebSocketServer } from '../../websocket-server/src/createWebsocketServer'
import { Message } from '../../shared/src/Message'

export type PreviewWebsocketServer = Readonly<{
  start: () => void
  stop: () => void
  broadcast: (messages: Message[]) => void
  port: number
}>

const webSocketServer = createWebSocketServer()

export const previewWebSocketServer: PreviewWebsocketServer = {
  get port() {
    return webSocketServer.port
  },
  broadcast(messages) {
    webSocketServer.broadcast(messages)
  },
  start() {
    webSocketServer.start(4994)
    webSocketServer.addListener('message', (message, websocket) => {
      webSocketServer.broadcast(message, { skip: websocket })
    })
  },
  stop() {
    webSocketServer.stop()
  },
}
