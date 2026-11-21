module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/test/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@panelada/allergen-rules/rules$': '<rootDir>/../../packages/allergen-rules/src/rules.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
};
