/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Map deep contract imports so jest resolves them from project root
  moduleNameMapper: {
    '^../../../contracts/(.*)$': '<rootDir>/contracts/$1',
    '^../../../../contracts/(.*)$': '<rootDir>/contracts/$1',
  },
  // ts-jest config: use project tsconfig and disable type-check for speed
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { strict: false } }],
  },
};

module.exports = config;
