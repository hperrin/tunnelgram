const path = require('path');
const { HotModuleReplacementPlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const analyze = process.env.WEBPACK_ANALYZE === 'true';
const devMode = process.env.NODE_ENV !== 'production';
const hotMode = process.env.WEBPACK_HOT === 'true';

const common = {
  mode: devMode ? 'development' : 'production',
  optimization: {
    minimizer: [
      new TerserPlugin({
        sourceMap: true,
        extractComments: 'some',
        terserOptions: {
          ecma: 8,
          compress: {
            passes: 3,
          },
          mangle: {
            module: true,
          },
          module: true,
        },
      }),
    ],
  },
  // devtool: devMode && 'source-map',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname),
    filename: 'dist/[name].js',
  },
  plugins: [
    ...(devMode
      ? []
      : [
          new MiniCssExtractPlugin({
            filename: 'dist/[name].css',
            chunkFilename: 'dist/[id].css',
          }),
        ]),
    ...(analyze ? [new BundleAnalyzerPlugin()] : []),
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
            // This will be enabled as soon as svelte-loader supports HMR for Svelte 3.
            hotReload: devMode && false,
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

module.exports = [
  {
    entry: {
      main: path.resolve(__dirname, 'src', 'index.js'),
    },
    ...common,
    plugins: [
      ...common.plugins,
      ...(hotMode ? [new HotModuleReplacementPlugin()] : []),
    ],
    devServer: {
      open: true,
      compress: true,
      port: 8083,
      proxy: {
        '/rest.php': 'http://localhost:8080',
        '/user/': 'http://localhost:8080',
      },
    },
  },
  {
    entry: {
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
    ...common,
  },
];
