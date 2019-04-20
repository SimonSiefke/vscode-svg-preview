import WebSocket from 'ws'
import { createEventEmitter } from './eventEmitter'

// eslint-disable-next-line @typescript-eslint/prefer-interface
type Events = {
  message: (
    message: string | Buffer | ArrayBuffer | Buffer[],
    websocket: WebSocket
  ) => void
}

interface ServerOptions {
  /**
   * The port of the server.
   */
  readonly port: number
}

interface ServerApi {
  /**
   * Send a message to all connected clients.
   */
  readonly broadcast: (message: any, { skip }?: { skip?: WebSocket }) => void
  /**
   * Start the websocket server.
   */
  readonly start: () => void
  /**
   * Stop the websocket server.
   */
  readonly stop: () => void
  /**
   * Add a listener to the websocket server.
   */
  readonly addListener: <E extends keyof Events>(
    event: E,
    callback: Events[E]
  ) => void
}

export interface Server {
  readonly options: ServerOptions
  readonly api: ServerApi
}

export function createWebSocketServer(): Server {
  let webSocketServer: WebSocket.Server
  let lastMessage: any
  const eventEmitter = createEventEmitter<Events>()
  const options: ServerOptions = {
    get port() {
      return webSocketServer.options.port
    },
  }
  const api: ServerApi = {
    addListener(event, callback) {
      eventEmitter.addListener(event, callback)
    },
    broadcast(message, { skip } = {}) {
      lastMessage = message
      for (const client of webSocketServer.clients) {
        if (skip !== client && client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      }
    },
    start() {
      webSocketServer = new WebSocket.Server({ port: 8080 })
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
  return {
    options,
    api,
  }
}
