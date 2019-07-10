import * as vscode from 'vscode'
import { context } from './extension'
import { StyleConfiguration } from '../../shared/src/StyleConfiguration'

/**
 * Options - should match with `contributes.configuration` in `package.json`.
 */
interface Options {
  readonly autoOpen: boolean
  readonly scaleToFit: boolean
  readonly style: StyleConfiguration
}

type GetConfiguration = ((key: 'autoOpen', resource: vscode.Uri) => boolean) &
  ((key: 'scaleToFit', resource: vscode.Uri) => boolean) &
  ((key: 'style', resource: vscode.Uri) => StyleConfiguration)

export interface ConfigurationChangeEvent {
  affectsConfiguration: (key: keyof Options, resource: vscode.Uri) => boolean
}

interface Configuration extends vscode.Disposable {
  /**
   * Get the configuration for a property from the vscode workspace settings.
   */
  get: GetConfiguration

  /**
   * Add a configuration change listener.
   */
  addChangeListener(callback: (event: ConfigurationChangeEvent) => void): void
}

/**
 * An array of callback functions that are executed when the configuration changes.
 */
let listeners: Set<(event: vscode.ConfigurationChangeEvent) => void>

export const configuration: Configuration = {
  addChangeListener(callback) {
    if (!listeners) {
      listeners = new Set()
      context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(event => {
          if (!event.affectsConfiguration('svgPreview')) {
            return
          }
          const typedEvent: ConfigurationChangeEvent = {
            affectsConfiguration(key, resource) {
              return event.affectsConfiguration(`svgPreview.${key}`, resource)
            },
          }
          for (const listener of listeners) {
            listener(typedEvent)
          }
        })
      )
    }
    listeners.add(callback)
  },
  get(key, resource) {
    return vscode.workspace
      .getConfiguration('svgPreview', resource)
      .get<any>(key)
  },
  dispose() {
    listeners = undefined
  },
}
