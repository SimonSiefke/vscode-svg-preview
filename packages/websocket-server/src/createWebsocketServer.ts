import WebSocket from 'ws'
import { createEventEmitter, AddListener } from './eventEmitter'

// eslint-disable-next-line @typescript-eslint/prefer-interface
type Events = {
  message: (
    message: string | Buffer | ArrayBuffer | Buffer[],
    websocket: WebSocket
  ) => void
}

export interface WebSocketServer {
  /**
   * The port of the server.
   */
  readonly port: number

  /**
   * Add a listener to the websocket server.
   */
  readonly addListener: AddListener<Events>
  /**
   * Send a message to all connected clients.
   */
  readonly broadcast: (message: any, { skip }?: { skip?: WebSocket }) => void
  /**
   * Start the websocket server.
   */
  readonly start: (port?: number) => void
  /**
   * Stop the websocket server.
   */
  readonly stop: () => void
}

export function createWebSocketServer(): WebSocketServer {
  let webSocketServer: WebSocket.Server
  let lastMessage: any
  const eventEmitter = createEventEmitter<Events>()
  return {
    get port() {
      return webSocketServer.options.port
    },
    addListener: eventEmitter.addListener,
    broadcast(message, { skip } = {}) {
      const stringifiedMessage = JSON.stringify(message)
      lastMessage = stringifiedMessage
      for (const client of webSocketServer.clients) {
        if (skip !== client && client.readyState === WebSocket.OPEN) {
          client.send(stringifiedMessage)
        }
      }
    },
    start(port = 3000) {
      webSocketServer = new WebSocket.Server({ port })
      webSocketServer.on('connection', websocket => {
        if (lastMessage) {
          websocket.send(lastMessage)
        }
        websocket.on('message', message => {
          eventEmitter.emit('message', message, websocket)
        })
      })
    },
    stop() {
      eventEmitter.removeAllListeners()
      webSocketServer.close()
    },
  }
}
