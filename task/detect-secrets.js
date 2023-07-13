const fs = require('fs');
const files = process.argv.slice(2);
const reg = /['"]LT([A-Za-z0-9+/=]{14}|LT[A-Za-z0-9+/=]{22}|LT[A-Za-z0-9+/=]{28})['"]/;
files.forEach((val, index) => {
  try {
    const data = fs.readFileSync(val, 'utf8');
    if (reg.test(data)) {
      console.error("Don't push accessKeyId/accessKeySecret to repo! ------ File: " + val);
      process.exit(-1);
    }
  } catch (err) {
    console.error('file error ----' + val);
    process.exit(-1);
  }
});
