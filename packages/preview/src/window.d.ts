type PreviewState = import('../../shared/src/PreviewState').PreviewState

interface VSCodeApi {
  getState(): PreviewState
  setState(state: PreviewState): void
  postMessage(message: any): void
}

declare function acquireVsCodeApi(): VSCodeApi

interface Window {
  acquireVsCodeApi: () => VSCodeApi
}
