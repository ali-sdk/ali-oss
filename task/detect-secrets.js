const fs = require('fs');
const files = process.argv.slice(2);
const reg = /['"]([0-9a-z+/=]{16}|[0-9a-z+/=]{24}|[0-9a-z+/=]{30})['"]/gi;
files.forEach(val => {
  try {
    const data = fs.readFileSync(val, 'utf8');
    const res = data.match(reg);
    if (res && res.length > 0) {
      console.error("Don't push accessKeyId/accessKeySecret to repo! ------ File: " + val);
      res.forEach(item => console.log(item));
      process.exit(-1);
    }
  } catch (err) {
    console.error('check AK file error ----' + val);
    process.exit(-1);
  }
});
