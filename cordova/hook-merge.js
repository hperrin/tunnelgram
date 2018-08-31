module.exports = function() {
  var path = require('path');
  var copy = require('recursive-copy');

  copy(path.resolve(__dirname, 'platforms-static'), path.resolve(__dirname, 'platforms'), {overwrite: true});
};
