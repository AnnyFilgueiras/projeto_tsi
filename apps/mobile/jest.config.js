module.exports = {
  preset: 'jest-expo',
  // The first render in each screen suite transforms the whole shared/ui + expo-router tree cold;
  // on the 2-core CI runner that alone can pass Jest's 5 s default.
  testTimeout: 20000,
  setupFilesAfterEnv: ['<rootDir>/test/support/setup-matchers.ts'],
  testMatch: ['<rootDir>/test/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/test/support/svg-mock.tsx',
    '^@panelada/allergen-rules/rules$': '<rootDir>/../../packages/allergen-rules/src/rules.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
};
