export interface Transform {
  translate: (x?: number, y?: number) => Transform
  scale: (value: number) => Transform
  toString: () => string
}

export function createTransform(): Transform {
  const values: string[] = []
  return {
    translate(x = 0, y = 0) {
      values.push(`translate(${x}px, ${y}px)`)
      return this
    },
    scale(x = 1, y = x) {
      values.push(`scale(${x}, ${y})`)
      return this
    },
    toString() {
      return values.join(' ')
    },
  }
}
