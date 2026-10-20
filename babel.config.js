module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // expo-router support is built into babel-preset-expo (SDK 50+).
    // reanimated/plugin must stay LAST.
    plugins: ['react-native-reanimated/plugin'],
  };
};
