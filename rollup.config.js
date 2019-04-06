import importAlias from 'rollup-plugin-import-alias'
import nodeResolve from 'rollup-plugin-node-resolve'
import typescriptPlugin from 'rollup-plugin-typescript2'
import copy from 'rollup-plugin-copy-glob'

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
      { watch: true }
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

export default configs
