
'use strict';
const BaseGenerator = require('./base-generator');
const debug = require('./debug')('artifact-generator');
const utils = require('./utils');
const updateIndex = require('./update-index');
const path = require('path');
const chalk = require('chalk');

module.exports = class ArtifactGenerator extends BaseGenerator {
  // Note: arguments and options should be defined in the constructor.
  constructor(args, opts) {
    super(args, opts);
  }

  _setupGenerator() {
    debug('Setting up generator');
    super._setupGenerator();
    this.argument('name', {
      type: String,
      required: false,
      description: 'Name for the ' + this.artifactInfo.type,
    });
  }

  setOptions() {
    // argument validation
    const name = this.options.name;
    if (name) {
      const validationMsg = utils.validateClassName(name);
      if (typeof validationMsg === 'string') throw new Error(validationMsg);
    }
    this.artifactInfo.name = name;
    this.artifactInfo.relPath = path.relative(
      this.destinationPath(),
      this.artifactInfo.outDir,
    );
    return super.setOptions();
  }

  promptArtifactName() {
    debug('Prompting for artifact name');
    if (this.shouldExit()) return false;
    const prompts = [
      {
        type: 'input',
        name: 'name',
        // capitalization
        message: utils.toClassName(this.artifactInfo.type) + ' class name:',
        when: this.artifactInfo.name === undefined,
        default: this.artifactInfo.defaultName,
        validate: utils.validateClassName,
      },
    ];

    return this.prompt(prompts).then(props => {
      Object.assign(this.artifactInfo, props);
      return props;
    });
  }

  /**
   * remind user the input might get changed if it contains _ or accented char
   **/
  promptWarningMsgForName() {
    if (this.artifactInfo.name.includes('_')) {
      this.log(
        chalk.red('>>> ') +
          `Underscores _ in the class name will get removed: ${this.artifactInfo.name}`,
      );
    }
    if (this.artifactInfo.name.match(/[\u00C0-\u024F\u1E00-\u1EFF]/)) {
      this.log(
        chalk.red('>>> ') +
          `Accented chars in the class name will get replaced: ${this.artifactInfo.name}`,
      );
    }
  }

  /**
   * Inform user what model/file names will be created
   *
   * e.g: promptClassFileName('model', 'models', 'MyModel');
   * >> Model MyModel will be created in src/models/my-model.model.ts
   **/
  promptClassFileName(type, typePlural, name) {
    this.log(
      `${utils.toClassName(type)} ${chalk.yellow(
        name,
      )} will be created in src/${typePlural}/${chalk.yellow(
        utils.toFileName(name) + '.' + `${type}.ts`,
      )}`,
    );
    this.log();
  }

  scaffold() {
    debug('Scaffolding artifact(s)');
    if (this.shouldExit()) return false;
    // Capitalize class name
    this.artifactInfo.name = utils.toClassName(this.artifactInfo.name);

    // Copy template files from ./templates
    // Renaming of the files should be done in the generator inheriting from this one
    this.copyTemplatedFiles(
      this.templatePath('**/*'),
      this.destinationPath(),
      this.artifactInfo,
    );
  }

  async end() {
    if (this.shouldExit()) {
      await super.end();
      return;
    }

    // Check all files being generated to ensure they succeeded
    const generationStatus = !!Object.entries(
      this.conflicter.generationStatus,
    ).find(([key, val]) => {
      // If a file was modified, update the indexes and say stuff about it
      return val !== 'skip' && val !== 'identical';
    });
    debug(`Generation status: ${generationStatus}`);

    if (generationStatus) {
      await this._updateIndexFiles();

      // User Output
      this.log();
      this.log(
        utils.toClassName(this.artifactInfo.type),
        chalk.yellow(utils.toClassName(this.artifactInfo.name)),
        'was created in',
        `${this.artifactInfo.relPath}/`,
      );
      this.log();
    }

    await super.end();
  }

  /**
   * Update the index.ts in this.artifactInfo.outDir. Creates it if it
   * doesn't exist.
   * this.artifactInfo.outFile is what is exported from the file.
   *
   * Both those properties must be present for this to happen. Optionally,
   * this can be disabled even if the properties are present by setting:
   * this.artifactInfo.disableIndexUpdate = true;
   *
   * Multiple indexes / files can be updated by providing an array of
   * index update objects as follows:
   * this.artifactInfo.indexesToBeUpdated = [{
   *   dir: 'directory in which to update index.ts',
   *   file: 'file to add to index.ts',
   * }, {dir: '...', file: '...'}]
   */
  async _updateIndexFiles() {
    debug(`Indexes to be updated ${this.artifactInfo.indexesToBeUpdated}`);
    // Index Update Disabled
    if (this.artifactInfo.disableIndexUpdate) return;

    if (!this.artifactInfo.indexesToBeUpdated) {
      this.artifactInfo.indexesToBeUpdated = [];
    }

    // No Array given for Index Update, Create default array
    if (
      this.artifactInfo.outDir &&
      this.artifactInfo.outFile &&
      this.artifactInfo.indexesToBeUpdated.length === 0
    ) {
      this.artifactInfo.indexesToBeUpdated = [
        {dir: this.artifactInfo.outDir, file: this.artifactInfo.outFile},
      ];
    }

    for (const idx of this.artifactInfo.indexesToBeUpdated) {
      await updateIndex(idx.dir, idx.file);
      // Output for users
      const updateDirRelPath = path.relative(
        this.artifactInfo.relPath,
        idx.dir,
      );

      const outPath = path.join(
        this.artifactInfo.relPath,
        updateDirRelPath,
        'index.ts',
      );

      this.log(chalk.green('   update'), `${outPath}`);
    }
  }
};
