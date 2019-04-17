import * as vsls from 'vsls/vscode'
import { context } from '../extension'

function log(message: string): void {
  console.log(`[Svg Preview (Live share)]: ${message}`)
}

/**
 * Configure the extension for usage with VSCode Live Share.
 */
export async function configureLiveShare(): Promise<void> {
  const liveShare = await vsls.getApi()
  if (!liveShare) {
    // live share extension isn't installed
    return
  }
  // wait until live share is started
  await new Promise(resolve => {
    if (liveShare.session.id) {
      resolve()
    } else {
      context.subscriptions.push(
        liveShare.onDidChangeSession(event => {
          if (event.session.id) {
            resolve()
          }
        })
      )
    }
  })
  switch (liveShare.session.role) {
    case vsls.Role.Host:
      log('Initializing host service')
      const { shareSession } = await import('./host')
      await shareSession(liveShare)
      break
    case vsls.Role.Guest:
      log('Initializing guest service')
      const { joinSession } = await import('./guest')
      await joinSession(liveShare)
      break
    default:
      throw new Error('[Svg Preview] invalid state')
  }
}
