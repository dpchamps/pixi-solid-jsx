const baseConfig = require("../../.releaserc.base.cjs");

module.exports = {
  ...baseConfig,
  tagFormat: "sylph-jsx-v${version}",
};
