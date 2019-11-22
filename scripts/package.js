/* eslint-disable no-continue */
/* eslint-disable import/no-commonjs */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const path = require('path')
const fs = require('fs-extra')

const root = path.join(__dirname, '..')

if (!fs.existsSync(path.join(root, 'dist'))) {
  fs.mkdirSync(path.join(root, 'dist'))
}

// @ts-ignore
const pkg = require('../packages/extension/package.json')

pkg.main = './packages/extension/dist/extension.js'

pkg.publisher = 'SimonSiefke'
pkg.name = 'svg-preview'
delete pkg.dependencies
delete pkg.devDependencies
delete pkg.enableProposedApi
fs.writeFileSync(
  path.join(root, 'dist/package.json'),
  `${JSON.stringify(pkg, null, 2)}\n`
)

fs.copySync(
  path.join(root, 'packages/extension/dist'),
  'dist/packages/extension/dist',
  {
    filter: file => !file.endsWith('.map'),
  }
)
fs.copySync(
  path.join(root, 'packages/preview/dist'),
  'dist/packages/preview/dist',
  {
    filter: file => !file.endsWith('.map'),
  }
)
for (const file of ['README.md', 'LICENSE', 'CHANGELOG.md']) {
  fs.copySync(path.join(root, file), `dist/${file}`)
}

for (const file of fs.readdirSync(
  path.join(root, 'packages/extension/images')
)) {
  if (
    [
      'icon.png',
      'bolt_original_darkgray_optimized.svg',
      'bolt_original_lightgray_optimized.svg',
      'refresh_dark.svg',
      'refresh_light.svg',
    ].includes(file)
  ) {
    fs.copySync(
      path.join(root, `packages/extension/images/${file}`),
      `dist/images/${file}`
    )
  } else if (
    [
      'bolt_original_yellow_optimized.svg',
      'bolt_original_red_optimized.svg',
    ].includes(file)
  ) {
    fs.copySync(
      path.join(root, `packages/extension/images/${file}`),
      `dist/packages/extension/images/${file}`
    )
  }
}
