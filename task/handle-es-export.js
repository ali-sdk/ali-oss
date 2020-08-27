// 导出es下所有接口
const fs = require('fs'); //引用文件系统模块

const exportMap = {
  'delete.js': 'deleteObject',
  'version.js': 'version',
  'setConfig.js': 'Client',
};

function readFileList(path, filesList) {
  const files = fs.readdirSync(path);
  files.forEach(function (itm, index) {
    const stat = fs.statSync(path + itm);
    if (stat.isDirectory()) {
      //递归读取文件
      readFileList(path + itm + '/', filesList);
    } else {
      const obj = {}; //定义一个对象存放文件的路径和名字
      obj.path = path; //路径
      obj.filename = itm; //名字
      obj.fullPath = path + itm; // 全路径
      if (path.endsWith('/es/')) obj.is_es_file = true; // 记录es子目录下所有文件
      filesList.push(obj);
    }
  });
}

function getFileList(path) {
  const filesList = [];
  readFileList(path, filesList);
  return filesList;
}

function handleESExport() {
  //获取es文件夹下的所有文件
  const es_path = `${__dirname.replace('task', 'es/')}`;
  let fileList = getFileList(es_path);

  // 删除原有文件
  const needSaveFiles = ['setConfig.js', 'setConfig.d.ts'];
  deleteFiles = fileList.filter(
    _ => _.is_es_file && !needSaveFiles.includes(_.filename)
  );
  deleteFiles.forEach(_ => fs.unlinkSync(_.fullPath));

  fileList = fileList.filter(
    _ =>
      _.filename !== 'index.d.ts' &&
      _.filename !== 'index.js' &&
      !_.filename.endsWith('d.ts') &&
      !_.path.endsWith('/utils/') &&
      !_.path.endsWith('es/types/') &&
      !_.is_es_file
  );

  // 导出Client
  fileList.push({
    path: es_path,
    filename: 'setConfig.js',
    fullPath: `${es_path}setConfig.js`,
  });

  const writeStream = fs.createWriteStream(`${es_path}index.js`);
  fileList.forEach(async (_, i) => {
    const isValid = await checkExport(_.fullPath, _.filename);
    if (!isValid) {
      if (!exportMap[_.filename]) {
        writeStream.end();
        throw `${_.filename.replace('.js', '')} is not exported in ${
          _.fullPath
        }`;
      }
      _.filename = exportMap[_.filename];
    }

    writeStream.write(
      `export { ${_.filename.replace('.js', '')} } from './${_.fullPath.replace(
        es_path,
        ''
      )}';`
    );
    writeStream.write('\n');
    writeStream.write('\n');
  });
}

async function checkExport(filePath, filename) {
  const stream = fs.createReadStream(filePath);
  return new Promise(res => {
    stream.on('data', chunk => {
      // 检测导出函数名是否是文件名
      const exportStrReg = new RegExp(
        `export\\s*(async)?\\s*function\\s*${filename.replace(
          '.js',
          ''
        )}\\s*\\(`
      );
      if (!exportStrReg.test(chunk.toString())) {
        res(false);
      }
      res(true);
    });
  });
}

handleESExport();
