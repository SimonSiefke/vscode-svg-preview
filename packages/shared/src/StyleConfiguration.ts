export type StyleConfiguration = Partial<{
  body: {
    background: string
    'background-color': string
    'background-position': string
    'background-image': string
    'background-size': string
    'background-repeat':
      | 'repeat'
      | 'space'
      | 'round'
      | 'repeat-y'
      | 'repeat-x'
      | 'repeat no-repeat'
      | 'no-repeat'
    margin: string
    padding: string
    'place-items': 'center' | 'start center'
  }
  img: {
    border: string
    margin: string
    padding: string
  }
}>
