import nodeResolve from '@rollup/plugin-node-resolve'
import typescriptPlugin from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import replace from '@rollup/plugin-replace'
import postcss from 'rollup-plugin-postcss'
import autoprefixer from 'autoprefixer'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

const DEV = process.env.NODE_ENV === 'development'

const terserPlugin = terser({
  ecma: 9,
  toplevel: true,
  mangle: false, // keep output readable
  compress: {
    booleans_as_integers: true,
    // unsafe: true,
  },
  output: {
    inline_script: false,
  },
})

/** @type {import('rollup').RollupOptions} */
const extensionConfig = {
  external: [
    'vscode',
    'path',
    'util',
    'fs',
    'http',
    'https',
    'stream',
    'utf-8-validate',
    'zlib',
    'url',
    'tls',
    'crypto',
    'net',
    'events',
    'os',
  ],
  input: [
    'packages/extension/src/extension.ts',
    // 'packages/extension/src/liveshare/guest.ts',
    // 'packages/extension/src/liveshare/host.ts',
    'packages/extension/src/preview/styles/loadInlineStyles.ts',
  ],
  output: {
    dir: 'packages/extension/dist',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [
    // @ts-ignore
    json(),
    // @ts-ignore
    nodeResolve(),
    commonjs({
      ignore: ['bufferutil', 'utf-8-validate'], // optional dependencies of ws
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
    // @ts-ignore
    postcss({
      extract: true,
      plugins: [autoprefixer()],
    }),
    // @ts-ignore
    nodeResolve(),
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
      DEVELOPMENT: `${DEV}`,
      ROOT: DEV ? "'../../'" : "'./'",
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
