var fs = require("fs");
const proto = exports;

/**
 * @param {String} name object name
 * @param {Object} options
 * {Number} options.chunkSize
 * {Number} options.parallel
 * {Number} options.startIndex
 * {Boolean} options.reload
 */

proto.multipartDownload = async function multipartDownload(name, options) {
  if (!name) {
    throw new Error("Invalid name");
  }
  const that = this;
  const startTime = new Date();
  const _options = {
    chunkSize: 10 * 1024 * 1024, // 10MB
    parallel: 1,
    startIndex: 0,
    reload: options.startIndex ? false : true
  };
  let stats = {};

  options = Object.assign(_options, options);

  try {
    function uploadPartJob(partNo) {
      return new Promise(async (resolve, reject) => {
        try {
          const pi = partOffs[partNo - 1];
          const data = {
            start: pi.start,
            end: pi.end
          };

          await that._downLoadPart(name, partNo, data);
          resolve();
        } catch (err) {
          err.partNum = partNo;
          reject(err);
        }
      });
    }

    var res = await this.head(name);
    var contentLength = res.res.headers["content-length"];
    if (contentLength == stats.size && !options.reload) {
      return;
    }
    var partOffs = this._divideParts(contentLength, options.chunkSize);
    const numParts = partOffs.length;
    const doneParts = [];
    const all = Array.from(new Array(numParts), (x, i) => i + 1);
    const doneArr = doneParts.map(p => p.number);
    const todo = all.filter(p => doneArr.indexOf(p) < 0);

    getFile();

    await this._parallel(
      todo,
      options.parallel,
      value =>
        new Promise((resolve, reject) => {
          uploadPartJob(value)
            .then(result => {
              resolve();
            })
            .catch(err => {
              reject(err);
            });
        })
    );

    console.log("finish");
  } catch (e) {
    console.log("error", e);
  }

  function getFile() {
    if (!fs.existsSync(name)) {
      fs.openSync(name, "w");
    } else if (options.reload === false) {
      stats = fs.statSync(name);
      options.startIndex = Math.floor(stats.size / options.chunkSize);
    }
  }
};

proto._downLoadPart = async function _downLoadPart(name, partNo, data) {
  const opt = {};
  opt.headers = {
    Range: `bytes=${data.start}-${data.end - 1}`
  };
  var stream = fs.createWriteStream(name, {
    start: data.start,
    flags: "r+",
    autoClose: true
  });
  await this.get(name, stream, opt);
  stream.destroy();
  stream = null;
  return true;
};
