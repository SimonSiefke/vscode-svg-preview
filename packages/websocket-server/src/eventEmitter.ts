type Arguments<T> = [T] extends [(...args: infer U) => any]
  ? U
  : [T] extends [void]
  ? []
  : [T]

export interface EventEmitter<Events> {
  readonly addListener: <E extends keyof Events>(
    event: E,
    callback: Events[E]
  ) => void
  readonly emit: <E extends keyof Events>(
    event: E,
    ...args: Arguments<Events[E]>
  ) => void
  readonly removeListener: <E extends keyof Events>(
    event: E,
    callback: Events[E]
  ) => void
  readonly removeAllListeners: () => void
}

export type AddListener<Events> = <E extends keyof Events>(
  event: E,
  callback: Events[E]
) => void

interface BaseEvents {
  [key: string]: Function
}

/**
 * Creates an event emitter.
 */
export function createEventEmitter<Events extends BaseEvents>(): EventEmitter<
  Events
> {
  let listeners: { [E in keyof Events]?: Set<Events[E]> } = {}
  return {
    addListener(event, callback) {
      if (!listeners[event]) {
        listeners[event] = new Set()
      }
      listeners[event].add(callback)
    },
    emit(event, ...args) {
      for (const listener of listeners[event]) {
        listener(...args)
      }
    },
    removeListener(event, callback) {
      listeners[event].delete(callback)
    },
    removeAllListeners() {
      listeners = undefined
    },
  }
}

// export function EventEmitter(): void {}
// export class EventEmitter{}
