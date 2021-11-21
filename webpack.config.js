const path = require('path');

module.exports = {
  target: "webworker",
  entry: './src/index.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'worker'),
    filename: 'worker.js',
  }
}