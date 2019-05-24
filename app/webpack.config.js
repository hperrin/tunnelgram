const webpack = require('webpack');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const devMode = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: devMode ? 'development' : 'production',
  optimization: {
    minimizer: [
      new TerserPlugin({
        sourceMap: true,
      }),
    ],
  },
  // devtool: devMode && 'source-map',
  devtool: 'source-map',
  entry: {
    main: path.resolve(__dirname, 'src', 'index.js'),
    showdown: path.resolve(__dirname, 'src', 'index.showdown.js'),
    '../ServiceWorker': path.resolve(
      __dirname,
      'src',
      'Workers',
      'ServiceWorker.js',
    ),
    'Workers/ResizeImage': path.resolve(
      __dirname,
      'src',
      'Workers',
      'ResizeImage.js',
    ),
    'Workers/AESEncryption': path.resolve(
      __dirname,
      'src',
      'Workers',
      'AESEncryption.js',
    ),
    'Workers/RSAEncryption': path.resolve(
      __dirname,
      'src',
      'Workers',
      'RSAEncryption.js',
    ),
  },
  output: {
    path: path.resolve(__dirname),
    filename: 'dist/[name].js',
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'dist/[name].css',
      chunkFilename: 'dist/[id].css',
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: devMode || JSON.stringify('production'),
      },
    }),
  ],
  resolve: {
    extensions: [
      '.wasm',
      '.mjs',
      '.js',
      '.json',
      '.svelte',
      '.html',
      '.css',
      '.sass',
      '.scss',
    ],
    mainFields: ['svelte', 'browser', 'module', 'main'],
  },
  module: {
    rules: [
      {
        test: /\/src\/Services\/Val\/.+\.js$/,
        use: {
          loader: 'val-loader',
        },
      },
      {
        test: /\.(html|svelte)$/,
        use: {
          loader: 'svelte-loader',
          options: {
            dev: devMode,
            emitCss: true,
          },
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
      {
        exclude: /\/node_modules\/localforage\//,
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              [
                '@babel/transform-classes',
                {
                  builtins: ['Error'],
                },
              ],
            ],
          },
        },
      },
    ],
  },
};
