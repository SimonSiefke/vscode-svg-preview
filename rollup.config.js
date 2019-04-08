import importAlias from 'rollup-plugin-import-alias'
import nodeResolve from 'rollup-plugin-node-resolve'
import typescriptPlugin from 'rollup-plugin-typescript2'
import copy from 'rollup-plugin-copy-glob'
import { terser } from 'rollup-plugin-terser'
import replace from 'rollup-plugin-replace'

const DEV = process.env.NODE_ENV === 'development'

const terserPlugin = terser({
  ecma: 9,
  toplevel: true,
  mangle: false, // keep output readable
  output: {
    inline_script: false,
  },
})

/** @type {import('rollup').RollupOptions} */
const extensionConfig = {
  external: ['vscode', 'path', 'util', 'fs', 'http'],
  input: 'packages/extension/src/extension.ts',
  output: {
    dir: 'packages/extension/dist',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [
    // @ts-ignore
    nodeResolve(),
    // @ts-ignore
    importAlias({
      '@': './packages/extension/src',
    }),
    typescriptPlugin({
      tsconfig: './packages/extension/tsconfig.json',
    }),
  ],
}

/** @type {import('rollup').RollupOptions} */
const previewConfig = {
  external: [],
  input: 'packages/preview/src/index.ts',
  output: {
    dir: 'packages/preview/dist',
    format: 'esm',
    sourcemap: true,
    globals: {
      vscode: 'acquireVsCodeApi',
    },
  },
  plugins: [
    copy(
      [
        {
          files: 'packages/preview/src/*.{html,css}',
          dest: 'packages/preview/dist',
        },
      ],
      { watch: DEV }
    ),
    // @ts-ignore
    nodeResolve(),
    // @ts-ignore
    importAlias({
      '@': './packages/preview/src',
    }),
    typescriptPlugin({
      tsconfig: './packages/preview/tsconfig.json',
    }),
  ],
}

/** @type {import('rollup').RollupOptions[]} */
const configs = [extensionConfig, previewConfig]

if (!DEV) {
  for (const config of configs) {
    config.plugins.push(terserPlugin)
  }
}

for (const config of configs) {
  // Set NODE_ENV
  config.plugins.unshift(
    replace({
      DEVELOPMENT: process.env.NODE_ENV === 'development',
    })
  )
  // Disable circular dependency warnings
  config.onwarn = warning => {
    if (typeof warning === 'string') {
      console.warn(warning)
      return
    }
    if (warning.code !== 'CIRCULAR_DEPENDENCY') {
      console.warn(`(!) ${warning.message}`)
    }
  }
}
export default configs
