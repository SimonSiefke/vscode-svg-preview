import { terser } from 'rollup-plugin-terser'
import configs from './rollup.config'
import copy from 'rollup-plugin-copy-glob'

const terserPlugin = terser({
  ecma: 9,
  toplevel: true,
  mangle: false, // keep output readable
  output: {
    inline_script: false,
  },
})

// override copy plugin to disable watch mode
configs[1].plugins[0] = copy(
  [
    {
      files: 'packages/preview/src/*.{html,css}',
      dest: 'packages/preview/dist',
    },
  ],
  { watch: false }
)

for (const config of configs) {
  config.plugins.push(terserPlugin)
}

export default configs
