module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/.*/__tests__/([^./])*.utils.ts'],
  setupFilesAfterEnv: ['jest-extended'],
};
