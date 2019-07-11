'use strict';

const camelCaseKeys = require('camelcase-keys');
const debug = require('./debug')();
const path = require('path');
const yeoman = require('yeoman-environment');
const PREFIX = 'loopback4:';

/**
 * Parse arguments and run corresponding command
 * @param env - Yeoman env
 * @param {*} opts Command options
 */
function runCommand(env, opts) {
  const args = opts._;
  const originalCommand = args.shift();
  let command = PREFIX + (originalCommand || 'app');
  const supportedCommands = env.getGeneratorsMeta();
  if (!(command in supportedCommands)) {
    console.log("bad Command");
  } else {
    args.unshift(command);
  }
  debug('invoking generator', args);
  // `yo` is adding flags converted to CamelCase
  const options = camelCaseKeys(opts, {exclude: ['--', /^\w$/, 'argv']});
  Object.assign(options, opts);
  debug('env.run %j %j', args, options);
    env.run(args, options);
 
}

/**
 * Set up yeoman generators
 */
function setupGenerators() {
  const env = yeoman.createEnv();
  env.register(path.join(__dirname, '../generators/model'), PREFIX + 'model');
  return env;
}

function main(opts) {
  const env = setupGenerators();
  runCommand(env, opts);
}

module.exports = main;
