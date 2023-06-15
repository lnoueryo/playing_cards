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
        options: {
          configFile: 'static/script/tsconfig.json', // <- ここでtsconfig.jsonのパスを指定します
        },
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader'
        ]
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
