// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  // preset: 'ts-jest', // Removed as next/jest handles this
  moduleNameMapper: {
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1', // Specific alias
    '^@/(.*)$': '<rootDir>/src/$1',         // General alias for src content
    // Note: component and pages aliases might need to be updated if they are under src too
    // e.g. '^@/components/(.*)$': '<rootDir>/src/components/$1',
    // Removed CJS path mappings for jose, @panva/hkdf, uuid
  },
  // The issue with jose/hkdf/uuid seems to be a deeper problem with their ESM versions and Jest/SWC.
  // Attempting to specifically un-ignore them for transformation.
  // Adding 'next-auth' itself to the list of modules to transform.
  transformIgnorePatterns: [
    '/node_modules/(?!(next-auth|jose|@panva/hkdf|uuid|next|@babel/runtime|@next-auth/oauth-provider)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
