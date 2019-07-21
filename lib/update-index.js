
const debug = require('./debug')('update-index');

const path = require('path');
const util = require('util');
const fs = require('fs');
const appendFile = util.promisify(fs.appendFile);
const readFile = util.promisify(fs.readFile);
const exists = util.promisify(fs.exists);

/**
 *
 * @param {String} dir The directory in which index.ts is to be updated/created
 * @param {*} file The new file to be exported from index.ts
 */
module.exports = async function(dir, file) {
  debug(`Updating index ${path.join(dir, file)}`);
  const indexFile = path.join(dir, 'index.ts');
  const storeFile = path.join(dir, 'store.ts');
  if (!file.endsWith('.ts')) {
    throw new Error(`${file} must be a TypeScript (.ts) file`);
  }
  let modelName = file.slice(0, -9);
  let index = '';
  let store = '';

  const indexExists = await exists(indexFile);
  const storeExists = await exists(storeFile);
  
  if (storeExists) {
    store = await readFile(storeFile);
  } else {
    let initContent = `import { DataStore } from 'js-data';\nimport { HttpAdapter } from 'js-data-http';\nimport * as dataModel from './index'\n\nexport const STORE = new DataStore({});\nexport const adapter = new HttpAdapter({\n    basePath: 'https://example.com/api'\n});\n\nSTORE.registerAdapter('http', adapter, { default: true });`
    await appendFile(storeFile, initContent);
  }
  if (indexExists) {
    index = await readFile(indexFile);
  } 
  const content = `export * from './${modelName}.model';\n`;
  if (!index.includes(content)) {
    await appendFile(indexFile, content);
  }

  let mapper = `\n\nSTORE.defineMapper('${modelName}', {
    endpoint: '${modelName}s',
    schema: dataModel.${modelName.charAt(0).toUpperCase()}${modelName.slice(1)}Schema,
    relations: dataModel.${modelName.charAt(0).toUpperCase()}${modelName.slice(1)}Relations,
  });`;
  if (!store.includes(mapper)) {
    await appendFile(storeFile, mapper);
  }
};
