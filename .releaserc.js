module.exports = {
  verifyConditions: ['semantic-release-vsce', '@semantic-release/github'],
  prepare: [
    {
      path: 'semantic-release-vsce',
      packageVsix: 'extension.vsix',
    },
  ],
  publish: [
    'semantic-release-vsce',
    {
      path: '@semantic-release/github',
      assets: 'extension.vsix',
    },
  ],
}
