const fs = require('fs');
const crypto = require('crypto');
const pkg = require('./package.json');

exports.checkDist = function checkDist(filePath) {
  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    throw new Error('dist file size is 0');
  }
  const data = fs.readFileSync(filePath, 'utf8');
  const arr = data.split('\n')[0].split(' ');
  const distVer = arr[arr.length - 1];
  console.log('pkgVer', `v${pkg.version}`);
  console.log('distVer', distVer);
  if (distVer !== `v${pkg.version}`) {
    throw new Error('version is not match');
  }
};

exports.checkCDNFile = async (object, store) => {
  const result = await store.head(object);
  if (result.status !== 200 || result.res.headers['content-length'] === '0') {
    await store.delete(object);
    throw new Error('CDN file is incorrect or size is 0');
  }
};

exports.caculateFileMd5 = function (filePath) {
  return new Promise((resolve, reject) => {
    const rs = fs.createReadStream(filePath);

    const hash = crypto.createHash('md5');
    rs.on('data', hash.update.bind(hash));
    rs.on('error', err => {
      reject(err);
    });
    rs.on('end', () => {
      const md5Content = hash.digest('base64');
      resolve(md5Content);
    });
  });
};
