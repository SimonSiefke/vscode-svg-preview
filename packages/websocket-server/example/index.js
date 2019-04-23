// @ts-ignore
const ws = new WebSocket(`ws://localhost:${window.PORT}`)

const $div = document.createElement('div')
document.body.append($div)
ws.addEventListener('open', () => {
  console.log('open')
  $div.style.position = 'absolute'
  $div.style.width = '10px'
  $div.style.height = '10px'
  $div.style.background = 'green'
  $div.style.top = `0`
  $div.style.left = `0`
  window.addEventListener('mousemove', event => {
    console.log('mousemove')
    const x = event.clientX
    const y = event.clientY
    $div.style.left = `${x}px`
    $div.style.top = `${y}px`
    ws.send(JSON.stringify({ x, y }, null, 2))
  })
})

ws.addEventListener('message', evt => {
  const message = JSON.parse(evt.data)
  $div.style.left = `${message.x}px`
  $div.style.top = `${message.y}px`
})

ws.onclose = () => {
  // websocket is closed.
  console.log('Connection is closed...')
}
