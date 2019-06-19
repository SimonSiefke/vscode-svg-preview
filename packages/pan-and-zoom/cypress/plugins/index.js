/* eslint-disable import/no-commonjs */
const cypressTypeScriptPreprocessor = require('./cy-ts-preprocessor')

module.exports = on => {
  on('file:preprocessor', cypressTypeScriptPreprocessor)
}
