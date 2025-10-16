// craco.config.js

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Menambahkan konfigurasi untuk mengabaikan source map warnings dari docx-preview
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map from '.*docx-preview.*'/,
      ];
      return webpackConfig;
    },
  },
};