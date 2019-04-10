module.exports = {
  rules: {
    'import/no-unresolved': ['error', { ignore: ['^vscode$'] }],
  },
  globals: {
    DEVELOPMENT: true,
    ROOT: true,
  },
}
