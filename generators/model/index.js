
'use strict';

const modelDiscoverer = require('../../lib/model-discoverer');

const ArtifactGenerator = require('../../lib/artifact-generator');
const debug = require('../../lib/debug')('model-generator');
const inspect = require('util').inspect;
const utils = require('../../lib/utils');
const chalk = require('chalk');
const path = require('path');

const PROMPT_BASE_MODEL_CLASS = 'Please select the model base class';
const ERROR_NO_MODELS_FOUND = 'Model was not found in';

const BASE_MODELS = ['Entity', 'Model'];
const CLI_BASE_MODELS = [
  {
    name: `Entity ${chalk.gray('(A persisted model with an ID)')}`,
    value: 'Entity',
  },
  {name: `Model ${chalk.gray('(A business domain object)')}`, value: 'Model'},
  {type: 'separator', line: '----- Custom Models -----'},
];
const MODEL_TEMPLATE_PATH = 'model.ts.ejs';

/**
 * Model Generator
 *
 * Prompts for a Model name and model properties and creates the model class.
 * Currently properties can only be added once to each model using the CLI (at
 * creation).
 *
 * Will prompt for properties to add to the Model till a blank property name is
 * entered. Will also ask if a property is required, the default value for the
 * property, if it's the ID (unless one has been selected), etc.
 */
module.exports = class ModelGenerator extends ArtifactGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  _setupGenerator() {
    this.artifactInfo = {
      type: 'model',
      rootDir: utils.sourceRootDir,
    };

    this.artifactInfo.outDir = path.resolve(
      this.artifactInfo.rootDir,
      utils.modelsDir,
    );

    // Model Property Types
    this.typeChoices = [
      'string',
      'number',
      'boolean',
      'object',
      'date',
      'any',
    ];

    this.artifactInfo.properties = {};
    this.artifactInfo.modelSettings = {};

    this.artifactInfo.modelDir = path.resolve(
      this.artifactInfo.rootDir,
      utils.modelsDir,
    );

    this.option('base', {
      type: String,
      required: false,
      description: 'A valid based model',
    });

    // The base class can be specified:
    // 1. From the prompt
    // 2. using the --base flag
    // 3. in the json when using the --config flag
    // This flag is to indicate whether the base class has been validated.
    this.isBaseClassChecked = false;

    this.option('dataSource', {
      type: String,
      required: false,
      description:
        'The name of the dataSource which contains this model and suppots model discovery',
    });

    this.option('table', {
      type: String,
      required: false,
      description:
        'If discovering a model from a dataSource, specify the name of its table/view',
    });

    this.option('schema', {
      type: String,
      required: false,
      description:
        'If discovering a model from a dataSource, specify the schema which contains it',
    });

    return super._setupGenerator();
  }

  setOptions() {
    return super.setOptions();
  }

  checkLoopBackProject() {
    if (this.shouldExit()) return;
    return super.checkLoopBackProject();
  }

  async getDataSource() {
    if (!this.options.dataSource) {
      debug('Not loading any dataSources because none specified');
      return;
    }

    this.artifactInfo.dataSource = modelDiscoverer.loadDataSourceByName(
      this.options.dataSource,
    );

    if (!this.artifactInfo.dataSource) {
      const s = `Could not find dataSource ${this.options.dataSource}`;
      debug(s);
      return this.exit(
        new Error(
          `${s}.${chalk.yellow(
            'Please visit jsd-data.io for information on how models are discovered',
          )}`,
        ),
      );
    }
  }

  // Use the dataSource to discover model properties
  async discoverModelPropertiesWithDatasource() {
    if (this.shouldExit()) return false;
    if (!this.options.dataSource) return;
    if (!this.artifactInfo.dataSource) return;

    const schemaDef = await modelDiscoverer.discoverSingleModel(
      this.artifactInfo.dataSource,
      this.options.table,
      {
        schema: this.options.schema,
        views: true,
      },
    );

    if (!schemaDef) {
      this.exit(
        new Error(
          `Could not locate table: ${this.options.table} in schema: ${
            this.options.schema
          }
          ${chalk.yellow(
            'Please visit js-data.io for information on how models are discovered',
          )}`,
        ),
      );
    }

    Object.assign(this.artifactInfo, schemaDef);
    this.artifactInfo.defaultName = this.artifactInfo.name;
    delete this.artifactInfo.name;
  }

  // Prompt a user for Model Name
  async promptArtifactName() {
    if (this.shouldExit()) return;
    await super.promptArtifactName();
    this.artifactInfo.className = utils.toClassName(this.artifactInfo.name);
    // Prompt warning msg for the name
    super.promptWarningMsgForName();
  }

  // Ask for Model base class
  async promptModelBaseClassName() {
    if (this.shouldExit()) return;
    const availableModelBaseClasses = [];

    availableModelBaseClasses.push(...CLI_BASE_MODELS);

    try {
      debug(`model list dir ${this.artifactInfo.modelDir}`);
      const modelList = await utils.getArtifactList(
        this.artifactInfo.modelDir,
        'model',
      );
      debug(`modelist ${modelList}`);

      if (modelList && modelList.length > 0) {
        availableModelBaseClasses.push(...modelList);
        debug(`availableModelBaseClasses ${availableModelBaseClasses}`);
      }
    } catch (err) {
      debug(`error ${err}`);
      return this.exit(err);
    }

    if (this.options.base) {
      this.isBaseClassChecked = true;
      if (
        this.isValidBaseClass(
          availableModelBaseClasses,
          this.options.base,
          true,
        )
      ) {
        this.artifactInfo.modelBaseClass = utils.toClassName(this.options.base);
      } else {
        return this.exit(
          new Error(
            `${ERROR_NO_MODELS_FOUND} ${
              this.artifactInfo.modelDir
            }.${chalk.yellow(
              'Please visit js-data.io for information on how models are discovered',
            )}`,
          ),
        );
      }
    }
    let typeOfModel = { modelBaseClass: 'Model' };
    return Object.assign(this.artifactInfo, typeOfModel);
    

        
    //     debug(`props after model base class prompt: ${inspect(props)}`);
    //     return props;
    //   })
    //   .catch(err => {
    //     debug(`Error during model base class prompt: ${err}`);
    //     return this.exit(err);
    //   });
  }

  async promptStrictMode() {
    if (this.shouldExit()) return false;

    let setting = { allowAdditionalProperties: false };
    super.promptClassFileName(
      'model',
      'models',
      this.artifactInfo.className,
      );
      
      this.log(
        `Let's add a property to ${chalk.yellow(
          this.artifactInfo.className,
          )}`,
      );
    
    return   Object.assign(this.artifactInfo, setting);
  }

  // Check whether the base class name is a valid one.
  // It is either one of the predefined base classes,
  // or an existing user defined class
  // @isClassNameNullable - true if it is valid to have classname as null
  isValidBaseClass(availableModelBaseClasses, classname, isClassNameNullable) {
    if (!classname && !isClassNameNullable) return false;

    for (const i in availableModelBaseClasses) {
      let baseClass = '';
      if (typeof availableModelBaseClasses[i] == 'object')
        baseClass = availableModelBaseClasses[i].value;
      else baseClass = availableModelBaseClasses[i];

      if (classname === baseClass) {
        return true;
      }
    }
    return false;
  }

  // Prompt for a Property Name
  async promptPropertyName() {
    if (this.shouldExit()) return false;

    this.log(`Enter an empty property name when done`);
    this.log();

    // This function can be called repeatedly so this deletes the previous
    // property name if one was set.
    delete this.propName;

    const prompts = [
      {
        name: 'propName',
        message: 'Enter the property name:',
        validate: function(val) {
          if (val) {
            return utils.checkPropertyName(val);
          } else {
            return true;
          }
        },
      },
    ];

    const answers = await this.prompt(prompts);
    debug(`propName => ${JSON.stringify(answers)}`);
    if (answers.propName) {
      this.artifactInfo.properties[answers.propName] = {};
      this.propName = answers.propName;
    }
    return this._promptPropertyInfo();
  }

  // Internal Method. Called when a new property is entered.
  // Prompts the user for more information about the property to be added.
  async _promptPropertyInfo() {
    if (!this.propName) {
      return true;
    } else {
      const prompts = [
        {
          name: 'type',
          message: 'Property type:',
          type: 'list',
          choices: this.typeChoices,
        },
        {
          name: 'itemType',
          message: 'Type of array items:',
          type: 'list',
          choices: this.typeChoices.filter(choice => {
            return choice !== 'array';
          }),
          when: answers => {
            return answers.type === 'array';
          },
        }
      ];

      const answers = await this.prompt(prompts);
      debug(`propertyInfo => ${JSON.stringify(answers)}`);

      // Yeoman sets the default to `''` so we remove it unless the user entered
      // a different value
      if (answers.default === '') {
        delete answers.default;
      }

      Object.assign(this.artifactInfo.properties[this.propName], answers);

      // We prompt for `id` only once per model using idFieldSet flag.
      if (answers.id) {
        this.idFieldSet = true;
      }

      this.log();
      this.log(
        `Let's add another property to ${chalk.yellow(
          this.artifactInfo.className,
        )}`,
      );
      return this.promptPropertyName();
    }
  }

  scaffold() {
    if (this.shouldExit()) return false;

    debug('scaffolding');

    Object.entries(this.artifactInfo.properties).forEach(([k, v]) =>
      modelDiscoverer.sanitizeProperty(v),
    );

    // Data for templates
    this.artifactInfo.outFile = utils.getModelFileName(this.artifactInfo.name);

    // Resolved Output Path
    const tsPath = this.destinationPath(
      this.artifactInfo.outDir,
      this.artifactInfo.outFile,
    );

    this.artifactInfo.isModelBaseBuiltin = BASE_MODELS.includes(
      this.artifactInfo.modelBaseClass,
    );

    // Set up types for Templating
    const TS_TYPES = ['string', 'number', 'object', 'boolean', 'any'];
    const NON_TS_TYPES = ['geopoint', 'date'];
    Object.values(this.artifactInfo.properties).forEach(val => {
      // Default tsType is the type property
      val.tsType = val.type;

      // Override tsType based on certain type values
      if (val.type === 'array') {
        if (TS_TYPES.includes(val.itemType)) {
          val.tsType = `${val.itemType}[]`;
        } else if (val.type === 'buffer') {
          val.tsType = 'Buffer[]';
        } else {
          val.tsType = 'string[]';
        }
      } else if (val.type === 'buffer') {
        val.tsType = 'Buffer';
      }

      if (NON_TS_TYPES.includes(val.tsType)) {
        val.tsType = 'string';
      }

      if (
        val.defaultValue &&
        NON_TS_TYPES.concat(['string', 'any']).includes(val.type)
      ) {
        val.defaultValue = `'${val.defaultValue}'`;
      }

      // Convert Type to include '' for template
      val.type = `'${val.type}'`;
      if (val.itemType) {
        val.itemType = `'${val.itemType}'`;
      }

      // If required is false, we can delete it as that's the default assumption
      // for this field if not present. This helps to avoid polluting the
      // decorator with redundant properties.
      if (!val.required) {
        delete val.required;
      }

      // We only care about marking the `id` field as `id` and not fields that
      // are not the id so if this is false we delete it similar to `required`.
      if (!val.id) {
        delete val.id;
      }
    });

    if (this.artifactInfo.modelSettings) {
      this.artifactInfo.modelSettings = utils.stringifyModelSettings(
        this.artifactInfo.modelSettings,
      );
    }

    this.copyTemplatedFiles(
      this.templatePath(MODEL_TEMPLATE_PATH),
      tsPath,
      this.artifactInfo,
    );
  }

  async end() {
    await super.end();
  }
};
