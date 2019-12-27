const fs = require('fs');
const files = process.argv.slice(2)
const reg = /['"]([A-Za-z0-9+/=]{16}|[A-Za-z0-9+/=]{24}|[A-Za-z0-9+/=]{30})['"]/;
files.forEach((val, index) => {
  try {
    const data = fs.readFileSync(val, 'utf8');
    if(reg.test(data)) {
      console.error("Don't push accessKeyId/accessKeySecret to repo! ------ File: " + val);
      process.exit(-1);
    };
  }
  catch (err) {
    console.error("file error ----" + val);
    process.exit(-1);
  }
});
