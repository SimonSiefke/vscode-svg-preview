const base = require('../../jest.config.base.js')
// @ts-ignore TODO:
const pkg = require('./package.json')

module.exports = {
  ...base,
  displayName: pkg.name,
  name: pkg.name,
  rootDir: '../..',
  testMatch: [`<rootDir>/packages/${pkg.name}/src/**/*.spec.ts`],
}
