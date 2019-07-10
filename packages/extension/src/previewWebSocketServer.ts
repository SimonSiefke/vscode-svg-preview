import getPort from 'get-port'
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
  async start() {
    const port = await getPort()
    webSocketServer.start(port)
    webSocketServer.addListener('message', (message, websocket) => {
      webSocketServer.broadcast(message, { skip: websocket })
    })
  },
  stop() {
    console.log('stopped')
    webSocketServer.stop()
  },
}
