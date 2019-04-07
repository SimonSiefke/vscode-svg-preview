module.exports = {
  roots: ['<rootDir>'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: '.*.spec.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
}
