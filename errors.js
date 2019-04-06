const { EOL } = require('os');

class ReleaseItError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, this.constructor);
  }
}

class CleanWorkingDirError extends ReleaseItError {
  constructor() {
    super(
      'Working dir must be clean.' +
        EOL +
        'Please stage and commit your changes.' +
        EOL +
        'Alternatively, use `--no-mercurial.requireCleanWorkingDir` to include the changes in the release commit' +
        ' (or save `"mercurial.requireCleanWorkingDir": false` in the configuration).'
    );
  }
}

module.exports = { CleanWorkingDirError };
