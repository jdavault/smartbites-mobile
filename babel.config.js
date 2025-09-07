module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: `.env.${process.env.EXPO_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development'}`,
          safe: false,
          allowUndefined: true,
          verbose: false,
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
