'use strict';

const camelCaseKeys = require('camelcase-keys');
const debug = require('./debug')();
const path = require('path');
const yeoman = require('yeoman-environment');
const PREFIX = 'Angular:';
const fs = require('fs');
const chalk = require('chalk');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const exists = util.promisify(fs.exists);
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
    return;
  } else {
    if (originalCommand === "d" || originalCommand === "r" || originalCommand === "rm") {
      let modelToDel = args[1];
      if (fs.existsSync("src/models/" + modelToDel + ".model.ts")) {

        const directory = 'src/models/';
        let file = modelToDel + ".model.ts";

        fs.unlink(path.join(directory, file), err => {
          if (err) {
            throw err;
          } else {
            const indexFile = path.join(directory, 'index.ts');
            const storeFile = path.join(directory, 'store.ts');

            // let index = '';
            // let store = '';

            const indexExists =  exists(indexFile);
            const storeExists =  exists(storeFile);

            if (storeExists) {
            //  let  store =  readFile(storeFile);
// must be same like this
  let mapper = `\n\nSTORE.defineMapper('${modelToDel.toLowerCase()}', {
    endpoint: '${modelToDel}s',
    schema: dataModel.${modelToDel.charAt(0).toUpperCase()}${modelToDel.slice(1).toLowerCase()}Schema,
    relations: dataModel.${modelToDel.charAt(0).toUpperCase()}${modelToDel.slice(1).toLowerCase()}Relations,
  });`;
                fs.readFile(storeFile,String, function (err, data) {
                  if (err) throw err;
                  data = data.toString();
                  data =  data.replace(mapper, "");
                  fs.writeFile(storeFile, data, function (err) {
                    if (err) throw err;
                  });
                });
              
            } 

            if (indexExists) {
  const indexContent = `export * from './${modelToDel.toLowerCase()}.model';\n`;
              fs.readFile(indexFile,String, function (err, data) {
                if (err) throw err;
                data = data.toString();
                data =  data.replace(indexContent, "");
                fs.writeFile(indexFile, data, function (err) {
                  if (err) throw err;
                });
              });
            
            }
          }
        });
        console.log("Model removed ",
          chalk.green(
            'src/models/' +  modelToDel + ".model.ts",
          ),
        );
        return;
      } else {
        let error = modelToDel+ " model not exist!"
        if (modelToDel === undefined) {
          error = "Please specify the model name\n\nngdata d model 'model name' ";

        }
        console.log(
          chalk.red(
            error
          ),
        );

        return;
      }
    }
     

    if (!fs.existsSync("src/models") && fs.existsSync("src")){
      fs.mkdirSync("src/models");
      console.log("Models folder created at ",
        chalk.green(
          'src/models',
        ),
      );
    }
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
  env.register(path.join(__dirname, '../generators/model'), PREFIX + 'd');
  env.register(path.join(__dirname, '../generators/model'), PREFIX + 'r');
  env.register(path.join(__dirname, '../generators/model'), PREFIX + 'rm');
  return env;
}

function main(opts) {
  const env = setupGenerators();
  runCommand(env, opts);
}

module.exports = main;
