export type StyleConfiguration = Partial<{
  html: {
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
  }
  img: {
    border: string
    margin: string
    padding: string
  }
}>
