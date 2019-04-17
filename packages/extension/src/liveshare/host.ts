import * as vsls from 'vsls/vscode'
import * as vscode from 'vscode'
import { liveShareServiceName } from '../constants'

export async function shareSession(vslsApi: vsls.LiveShare): Promise<void> {
  const service = await vslsApi.shareService(liveShareServiceName)
  if (!service) {
    vscode.window.showErrorMessage(
      '[Svg Preview] Could not create a shared service'
    )
    return
  }
  console.log('created service')
  service.onRequest('hello', () => 'world')
}
