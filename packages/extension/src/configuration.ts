/* eslint-disable import/export */
import * as vscode from 'vscode'
import { context } from './extension'

/**
 * Options - should match with `contributes.configuration` in `package.json`
 */
interface Options {
  readonly autoOpen: boolean
  readonly panningEnabled: boolean
  readonly zoomingEnabled: boolean
}

type GetConfiguration = ((key: 'autoOpen', resource: vscode.Uri) => boolean) &
  ((key: 'panningEnabled', resource: vscode.Uri) => boolean) &
  ((key: 'zoomingEnabled', resource: vscode.Uri) => boolean)

interface ConfigurationChangeEvent {
  affectsConfiguration: (key: keyof Options, resource?: vscode.Uri) => boolean
}

interface Configuration {
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
 * An array of callback functions that are executed when the configuration changes
 */
let listeners: ((event: vscode.ConfigurationChangeEvent) => void)[]

export const configuration: Configuration = {
  addChangeListener(callback) {
    if (!listeners) {
      listeners = []
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
    listeners.push(callback)
  },
  get(key, resource) {
    console.log('get')
    console.log(context)
    return vscode.workspace
      .getConfiguration('svgPreview', resource)
      .get<any>(key)
  },
}
