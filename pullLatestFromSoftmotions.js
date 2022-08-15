#!/usr/bin/env node

const util = require('util');
const fs = require('fs');
const exec = util.promisify(require('node:child_process').exec);

async function main () {
  const { stdout, stderr } = await exec(
    `git ls-remote https://github.com/Softmotions/ejdb.git HEAD | awk '{ print $1}'`
  );

  const latestSoftmotionsHead = stdout.trim();

  if (stderr.trim().length > 0) {
    throw new Error('git ls-remote failed:', stderr);
  }

  console.log('softmotions/ejdb head:', latestSoftmotionsHead);
  if (latestSoftmotionsHead.length !== 40) {
    throw new Error(`Latest head from SoftMotions was not the expected length`);
  }

  const installSourceData = await fs.promises.readFile('./installSource.sh', 'utf8');
  const newInstallSourceData = [
    'LATEST_SOFTMOTIONS_HEAD=' + latestSoftmotionsHead,
    ...installSourceData.split('\n').slice(1)
  ].join('\n');
  
  await fs.promises.writeFile('./installSource.sh', newInstallSourceData);
}

main();
