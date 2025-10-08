module.exports = api => {
  api.cache(true);

  const isTest = process.env.NODE_ENV === 'test';
  const plugins = [];
  if (!isTest) {
    plugins.push('nativewind/babel');
  }
  plugins.push([
    'module:react-native-dotenv',
    {
      moduleName: '@env',
      path: '.env',
      blocklist: null,
      allowlist: null,
      safe: false,
      allowUndefined: true,
    },
  ]);

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins,
  };
};
