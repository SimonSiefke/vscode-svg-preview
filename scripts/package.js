/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const path = require('path')
const fs = require('fs-extra')
const { exec } = require('child_process')

const root = path.join(__dirname, '..')

if (!fs.existsSync(path.join(root, 'dist'))) {
  fs.mkdirSync(path.join(root, 'dist'))
}

// @ts-ignore
const pkg = require('../packages/extension/package.json')

pkg.main = './packages/extension/dist/extension.js'

for (const d in pkg.dependencies) {
  if (!d.includes('vscode')) {
    delete pkg.dependencies[d]
  }
}
for (const d in pkg.devDependencies) {
  if (!d.includes('vscode')) {
    delete pkg.devDependencies[d]
  }
}
delete pkg.enableProposedApi
fs.writeFileSync(
  path.join(root, 'dist/package.json'),
  `${JSON.stringify(pkg, null, 2)}\n`
)

for (const file of ['icon.png', 'package.nls.json']) {
  fs.copySync(path.join(root, `packages/extension/${file}`), `dist/${file}`)
}

fs.copySync(
  path.join(root, `packages/extension/dist`),
  `dist/packages/extension/dist`
)
fs.copySync(
  path.join(root, `packages/preview/dist`),
  `dist/packages/preview/dist`
)

exec('cd dist && npm install', err => {
  if (err) {
    console.error(`exec error: ${err}`)
    process.exit(1)
  }
})
