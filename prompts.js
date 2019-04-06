const { format } = require('release-it/lib/util');

module.exports = {
  commit: {
    type: 'confirm',
    message: context => `Commit (${format(context.mercurial.commitMessage, context)})?`,
    default: true
  },
  tag: {
    type: 'confirm',
    message: context => `Tag (${format(context.mercurial.tagName, context)})?`,
    default: true
  },
  push: {
    type: 'confirm',
    message: () => 'Push?',
    default: true
  }
};
