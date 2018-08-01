const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const devMode = process.env.NODE_ENV !== 'production';

const plugins = [
  new MiniCssExtractPlugin({
    filename: '[name].css',
    chunkFilename: '[id].css',
  }),
  // load `moment/locale/ja.js` and `moment/locale/it.js`
  new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en/),
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': devMode || JSON.stringify('production')
    }
  })
];

module.exports = {
  mode: devMode ? 'development' : 'production',
  entry: {
    main: [
      'babel-polyfill',
      path.resolve(__dirname, 'src', 'index.js')
    ],
    'Workers/ResizeImage': path.resolve(__dirname, 'src', 'Workers', 'ResizeImage.js'),
    'Workers/AESEncryption': path.resolve(__dirname, 'src', 'Workers', 'AESEncryption.js')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins,
  resolve: {
    mainFields: ['svelte', 'browser', 'module', 'main']
  },
  module: {
    rules: [
      {
        test: /\.(html|svelte)$/,
        use: {
          loader: 'svelte-loader',
          options: {
            emitCss: true,
          }
        }
      },
      {
        test: /\.(s[ac]|c)ss$/,
        use: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              minimize: !devMode
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};
