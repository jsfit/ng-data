

const debug = require('debug');


module.exports = function(scope) {
  return debug(`Angular:cli${scope ? `:${scope}` : ''}`);
};
