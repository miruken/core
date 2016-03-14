var path = require('path');
var paths = require('./paths');

module.exports = {
  filename: '',
  filenameRelative: '',
  sourceMap: true,
  sourceMapTarget: '',
  sourceRoot: '',
  moduleRoot: path.resolve('src').replace(/\\/g, '/'),
  comments: false,
  compact: false,
  code:true,
  presets: ['es2015']
};
