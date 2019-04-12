module.exports = {
  roots: ['<rootDir>'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testPathIgnorePatterns: ['node_modules', 'dist', 'cypress'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
}
