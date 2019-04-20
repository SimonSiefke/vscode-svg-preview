module.exports = {
  extends: 'bitworkers',
  globals: {
    DEVELOPMENT: true,
  },
  rules: {
    'import/no-unresolved': ['error', { ignore: ['^vscode$'] }],
  },
}
