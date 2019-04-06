interface VSCodeApi {
  getState(): any
  setState(state: any): void
  postMessage(message: any): void
}

declare function acquireVsCodeApi(): VSCodeApi

interface Window {
  acquireVsCodeApi: () => VSCodeApi
}
