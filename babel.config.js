module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', { allowUndefined: true }],
    'react-native-reanimated/plugin', // Must be last!
  ],
};
