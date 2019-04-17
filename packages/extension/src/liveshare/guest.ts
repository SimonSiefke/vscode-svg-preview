import * as vsls from 'vsls/vscode'
import * as vscode from 'vscode'
import { liveShareServiceName } from '../constants'

export async function joinSession(vslsApi: vsls.LiveShare): Promise<void> {
  const service = await vslsApi.getSharedService(liveShareServiceName)
  if (!service) {
    console.log(
      "Host doesn't have the Svg Preview extension installed, skipping initialization"
    )
    return
  }
  const response = await service.request('hello', [])
  vscode.window.showInformationMessage(response)
}
