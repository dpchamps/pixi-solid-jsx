const baseConfig = require('../../.releaserc.base.js');

module.exports = {
  ...baseConfig,
  tagFormat: 'sylph-jsx-v${version}',
};