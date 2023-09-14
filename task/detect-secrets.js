const process = require('process');
const fs = require('fs');
const readline = require('readline-sync');

const { execSync } = require('child_process');

const getCommandValue = command => {
  return execSync(command).toString('utf8').trim();
};

const whiteFiles = ['package-lock.json'];
// Get the list of file names to be submitted
const filenames = getCommandValue('git diff --cached --name-only')
  .split('\n')
  .filter(item => !!item && !whiteFiles.some(wh => wh === item));
if (filenames.length === 0) {
  console.error('No files to submit');
  process.exit(-1);
}

const list = [];
filenames.forEach(file => {
  if (fs.existsSync(file)) {
    const txt = fs.readFileSync(file).toString('utf-8');
    const reg = /([0-9a-z+=]{16}|[0-9a-z+=]{24}|[0-9a-z+=]{30})/gi;
    const res = txt.match(reg);
    if (res) {
      const whiteList = ['peerDependencies', 'hasInstallScript'];
      const aks = res.filter(item => !whiteList.some(wh => wh === item));
      if (aks.length > 0) {
        list.push(file); // Check if the code contains AK
        aks.forEach(item => console.log(item));
      }
    }
  }
});
if (list.length > 0) {
  console.error('Please check if AK is included in the following files\n');
  list.forEach(item => console.error(item + '\n'));

  const input = readline.question(`Do you want to continue submitting？（y|n）`);
  if (/n/i.test(input)) process.exit(-1);
}
