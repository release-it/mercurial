const fs = require('fs');
const { Plugin } = require('release-it');
const prompts = require('./prompts');
const { CleanWorkingDirError } = require('./errors');

const defaults = {
  changelog: "hg log -r 'last(tagged())::' --template '* {desc} ({node|short})\n'",
  requireCleanWorkingDir: true,
  commit: true,
  commitMessage: 'Release ${version}',
  tag: true,
  tagName: '${version}',
  push: true
};

const r = { write: false };

class Mercurial extends Plugin {
  constructor(config) {
    const { namespace, options } = config;
    options[namespace] = Object.assign({}, defaults, options[namespace]);
    super(config);
    this.registerPrompts(prompts);
  }

  static isEnabled() {
    try {
      fs.accessSync('.hg');
      return true;
    } catch (err) {}
  }

  async init() {
    if (this.options.requireCleanWorkingDir && !(await this.isWorkingDirClean())) {
      throw new CleanWorkingDirError();
    }
    await this.fetch();
    const latestTagName = await this.getLatestTagName();
    this.setContext({ latestTagName });
  }

  getLatestVersion() {
    const { latestTagName } = this.getContext();
    return latestTagName ? latestTagName.replace(/^v/, '') : null;
  }

  async beforeBump() {
    const script = this.getContext('changelog');
    this.setContext({
      changelog: await this.exec(script)
    });
  }

  bump(version) {
    this.setContext({ version });
  }

  async beforeRelease() {
    if (this.options.commit) {
      const changeSet = await this.status();
      this.log.preview({ title: 'changeset', text: changeSet });
    }
  }

  async release() {
    const { commit, tag, push } = this.options;
    await this.step({ enabled: commit, task: () => this.commit(), label: 'Mercurial commit', prompt: 'commit' });
    await this.step({ enabled: tag, task: () => this.tag(), label: 'Mercurial tag', prompt: 'tag' });
    await this.step({ enabled: push, task: () => this.push(), label: 'Mercurial push', prompt: 'push' });
  }

  isWorkingDirClean() {
    return this.exec('hg diff', r).then(stdout => stdout === '');
  }

  fetch() {
    return this.exec('hg pull -u');
  }

  status() {
    return this.exec('hg status -q', r);
  }

  commit({ message = this.options.commitMessage } = {}) {
    return this.exec(`hg commit --message "${message}"`);
  }

  tag({ name = this.options.tagName } = {}) {
    return this.exec(`hg tag ${name}`);
  }

  getLatestTagName() {
    return this.exec('hg log -r "." --template "{latestTagName}"', r).then(stdout => stdout || null, () => null);
  }

  push() {
    return this.exec('hg push');
  }
}

module.exports = Mercurial;
