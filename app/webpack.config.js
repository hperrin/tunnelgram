const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const devMode = process.env.NODE_ENV !== 'production';

const plugins = [
  new MiniCssExtractPlugin({
    filename: '[name].css',
    chunkFilename: '[id].css',
  }),
  new CopyWebpackPlugin([
    {
      from: 'src/Workers',
      to: 'Workers'
    }
  ]),
  // load `moment/locale/ja.js` and `moment/locale/it.js`
  new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en/),
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': devMode || JSON.stringify('production')
    }
  })
];

if (!devMode) {
  plugins.push(new UglifyJsPlugin());
}

module.exports = {
  mode: devMode ? 'development' : 'production',
  entry: ['babel-polyfill', path.resolve(__dirname, 'src', 'index.js')],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
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
