module.exports = ({ config }) => {
  const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  if (!androidGoogleMapsApiKey) return config;

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: { apiKey: androidGoogleMapsApiKey }
      }
    },
    plugins: [
      ...(config.plugins || []),
      ['react-native-maps', { androidGoogleMapsApiKey }]
    ]
  };
};
