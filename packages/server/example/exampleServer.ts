import http from 'http'
import * as fs from 'fs'
import * as path from 'path'
import { createWebSocketServer } from '../src/server'

const webSocketServer = createWebSocketServer()
webSocketServer.api.start()
webSocketServer.api.addListener('message', (message, websocket) => {
  webSocketServer.api.broadcast(message, { skip: websocket })
})

const httpServer = http.createServer((request, response) => {
  const relativePath = request.url.endsWith('/')
    ? `${request.url}index.html`
    : request.url
  try {
    const file = fs.readFileSync(path.join(__dirname, relativePath), 'utf-8')
    const modifiedFile = file.replace(
      'INSERT_PORT_HERE',
      `${webSocketServer.options.port}`
    )
    if (relativePath.endsWith('.html')) {
      response.writeHead(200, { 'Content-Type': 'text/html' })
    } else if (relativePath.endsWith('.js')) {
      response.writeHead(200, { 'Content-Type': 'application/javascript' })
    }
    response.end(modifiedFile)
  } catch {
    response.statusCode = 404
    response.end()
  }
})

httpServer.listen(3000)
