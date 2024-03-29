#!/usr/bin/env node

import util from 'util';
import fs from 'fs';
import childProcess from 'node:child_process';
const exec = util.promisify(childProcess.exec);

async function main () {
  const { stdout, stderr } = await exec(
    `git ls-remote https://github.com/Softmotions/ejdb.git HEAD | awk '{ print $1}'`
  );

  const latestSoftmotionsHead = stdout.trim();

  if (stderr.trim().length > 0) {
    throw new Error('git ls-remote failed:', stderr);
  }

  console.log('softmotions/ejdb head:\n  ', latestSoftmotionsHead + '\n');
  if (latestSoftmotionsHead.length !== 40) {
    throw new Error(`Latest head from SoftMotions was not the expected length`);
  }

  const installSourceData = await fs.promises.readFile('./installSource.sh', 'utf8');
  const newInstallSourceData = [
    'SOFTMOTIONS_BRANCH=' + latestSoftmotionsHead,
    ...installSourceData.split('\n').slice(1)
  ].join('\n');

  await fs.promises.writeFile('./installSource.sh', newInstallSourceData);

  const currentSoftmotionsHead = installSourceData.split('\n')[0].split('=')[1];

  console.log('markwylde/node-ejdb-lite using:\n  ', currentSoftmotionsHead + '\n');

  if (currentSoftmotionsHead === latestSoftmotionsHead) {
    console.log('No changes since last update');
    process.exit(0);
  }

  {
    if (!fs.existsSync('ejdb')) {
      await exec('git clone --recursive https://github.com/Softmotions/ejdb.git');
    }
  }

  {
    const { error, stdout, stderr } = await exec(`
      git diff --name-only HEAD ${currentSoftmotionsHead}
    `, { cwd: 'ejdb' });

    console.log('Differences since current release:')
    console.log(stdout.split('\n').slice(0, -1).map(i => `   - ${i}`).join('\n'));
  }

  const { stdout: masterPackageJson } = await exec('git show master:package.json');
  const masterPackage = JSON.parse(masterPackageJson);
  await exec(`npm vers --allow-same-version --no-git-tag-version ${masterPackage.version}`);
  await exec('npm vers patch --no-git-tag-version');
  await exec('npm install --ignore-scripts');
}

main();
