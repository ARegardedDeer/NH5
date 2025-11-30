module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', { moduleName: '@env', allowUndefined: true }],
    'react-native-reanimated/plugin', // Must be last!
  ],
};
