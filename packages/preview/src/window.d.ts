type State = import('../../shared/src/State').State

interface VSCodeApi {
  getState(): State
  setState(state: State): void
  postMessage(message: any): void
}

declare function acquireVsCodeApi(): VSCodeApi

interface Window {
  acquireVsCodeApi: () => VSCodeApi
}
