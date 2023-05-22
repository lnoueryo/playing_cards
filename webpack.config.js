const path = require('path');

const { VueLoaderPlugin } = require('vue-loader');


module.exports = {
  mode: 'development',
  entry: './static/script/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'public/script'),
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm-bundler.js'
    },
    extensions: ['.ts', '.tsx', '.js'],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    }
  },
  plugins: [
    new VueLoaderPlugin()
  ]
};
