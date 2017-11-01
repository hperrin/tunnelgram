const webpack = require("webpack");

module.exports = {
    entry: "./src/index.jsx",
    output: {
      library: "TodoApp",
      path: __dirname,
      filename: "build/TodoApp.js"
    },
    module: {
      loaders: [
        { test: /\.jsx?$/, exclude: /node_modules/, loader: "babel-loader"}
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx']
    },
    externals: {
      "react": "React",
      "react-dom": "ReactDOM",
      "prop-types": "PropTypes",
      "react-redux": "ReactRedux",
      "redux": "Redux",
      "Nymph": "Nymph",
      "Todo": "Todo"
    },
    plugins: [
      new webpack.ProvidePlugin({
        React: "react",
        "window.React": "react"
      }),
      new webpack.ProvidePlugin({
        ReactDOM: "react-dom",
        "window.ReactDOM": "react-dom"
      }),
      new webpack.ProvidePlugin({
        PropTypes: "prop-types",
        "window.PropTypes": "prop-types"
      }),
      new webpack.ProvidePlugin({
        ReactRedux: "react-redux",
        "window.ReactRedux": "react-redux"
      }),
      new webpack.ProvidePlugin({
        Redux: "redux",
        "window.Redux": "redux"
      }),
      new webpack.ProvidePlugin({
        Nymph: "Nymph",
        "window.Nymph": "Nymph"
      }),
      new webpack.ProvidePlugin({
        Todo: "Todo",
        "window.Todo": "Todo"
      })
    ]
};
