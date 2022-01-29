const crypto = require("crypto-js");
const XML = require("fast-xml-parser");
const config = require("./config");

class MultipartUploader {
  //xml parser
  constructor(file, bucketName, region, ak, sk, func, option = {}) {
    if (option.maxConcurrency && option.maxConcurrency >= 10)
      throw new Error("Max concurrency must less 10");

    this._fileManager = wx.getFileSystemManager();
    this._parser = new XML.XMLParser();
    this._build = new XML.XMLBuilder({
      arrayNodeName: "Part",
    });
    this.customFunc = func;
    this._file = file;
    this._tempFilePath = file.path;
    this._bucketName = bucketName;
    this._region = region;
    this._objectName = file.name;
    this._ak = ak;
    this._sk = sk;
    this._date = new Date().toUTCString();
    this._config = Object.assign(config, option);
    this._chunkQueue = [];
    this._completeMultipartUploadList = [];
    this._concurrency = [];
    this._chunkQueueLength = 0;
  }

  _initId() {
    return new Promise((resolve, reject) => {
      //initUploadId
      wx.request({
        url: `https://${this._bucketName}.${this._region}.aliyuncs.com/${this._objectName}?uploads`,
        timeout: this._config.timeout,
        method: "POST",
        header: {
          "content-type": "\n",
          "x-oss-date": this._date,
          authorization: this._computeSignature(
            "POST",
            this._bucketName,
            this._objectName,
            "",
            "",
            "uploads"
          ),
          date: this._date,
        },
        success: (res) => {
          resolve(
            this._parser.parse(res.data).InitiateMultipartUploadResult.UploadId
          );
        },
        fail: (error) => {
          console.log(error);
          reject(error);
        },
      });
    });
  }

  async _queueControll() {
    if (this._chunkQueue.length === 0) return;

    while (this._chunkQueue.length) {
      if (this._concurrency.length > this._config.maxConcurrency) break;
      this._concurrency.push(this._chunkQueue.shift());
    }

    if (
      this._config.chunkSize * this._concurrency.length >
      this._config.maxMemory
    ) {
      throw new Error(
        "Adjust the block size or concurrency, wechat miniprogram file memory must less than 100MB"
      );
    }

    await this._upload();
    this._queueControll();
  }

  _upload() {
    if (this._concurrency.length === 0) return;
    let i = this._concurrency.shift();

    return new Promise((resolve, reject) => {
      this._fileManager.readFile({
        filePath: this._tempFilePath,
        ...i,
        success: async (res) => {
          resolve(this._request(res.data, i.partNumber));
          await this._upload();
        },
        fail: (error) => {
          reject(error);
          console.log(error);
        },
      });
    });
  }

  async multipartUpload() {
    console.log(this._file);
    this._calculateChunkQueue(this._file);
    this._uploadId = await this._initId();
    await this._queueControll();

    const completeUpload = setInterval(() => {
      if (this._completeMultipartUploadList.length === this._chunkQueueLength) {
        this._completeUpload(
          `<CompleteMultipartUpload>${this._build.build(
            this._completeMultipartUploadList.sort(
              (a, b) => a.PartNumber - b.PartNumber
            )
          )}</CompleteMultipartUpload>`
        );
        clearInterval(completeUpload);
      }
    }, 2000);
  }

  _calculateChunkQueue(file) {
    if (file.size < this._config.chunkSize) {
      this._chunkQueue.push({ position: 0, length: file.size, partNumber: 1 });
      return;
    }

    for (let i = 0, k = 1; i < file.size; i += this._config.chunkSize, k++) {
      if (file.size - i >= this._config.chunkSize) {
        this._chunkQueue.push({
          position: i,
          length: this._config.chunkSize,
          partNumber: k,
        });
      } else {
        this._chunkQueue.push({
          position: i,
          length: file.size - i,
          partNumber: k,
        });
      }
    }
    this._chunkQueueLength = this._chunkQueue.length;
  }

  _request(chunk, partNumber) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://${this._bucketName}.${this._region}.aliyuncs.com/${this._objectName}?partNumber=${partNumber}&uploadId=${this._uploadId}`,
        timeout: this._config.timeout,
        method: "PUT",
        data: chunk,
        header: {
          "content-type": "\n",
          "x-oss-date": this._date,
          authorization: this._computeSignature(
            "PUT",
            this._bucketName,
            this._objectName,
            "",
            "",
            `partNumber=${partNumber}&uploadId=${this._uploadId}`
          ),
          date: this._date,
        },
        success: (res) => {
          resolve(
            this._completeMultipartUploadList.push({
              PartNumber: partNumber,
              ETag: res.header.ETag.replace(/\"/g, ""),
            })
          );
        },
        fail: (error) => {
          reject(console.log(error));
        },
      });
    });
  }

  _completeUpload(data) {
    wx.request({
      url: `https://${this._bucketName}.${this._region}.aliyuncs.com/${this._objectName}?uploadId=${this._uploadId}`,
      timeout: this._config.timeout,
      method: "POST",
      data,
      header: {
        "content-type": "application/xml",
        "x-oss-date": this._date,
        authorization: this._computeSignature(
          "POST",
          this._bucketName,
          this._objectName,
          "",
          "application/xml",
          `uploadId=${this._uploadId}`
        ),
        date: this._date,
      },
      success: (res) => {
        this.customFunc(res);
      },
      fail: (error) => {
        console.log(error);
      },
    });
  }

  _computeSignature(method, bucketName, objectName, MD5, contentType, action) {
    return `OSS ${this._ak}:${crypto.enc.Base64.stringify(
      crypto.HmacSHA1(
        this._createCanonicalString(
          method,
          bucketName,
          objectName,
          MD5,
          contentType,
          action
        ),
        this._sk
      )
    )}`;
  }

  _createCanonicalString(
    method,
    bucketName,
    objectName,
    MD5,
    contentType,
    action = undefined
  ) {
    let res = `/${bucketName}/${objectName}`;
    if (!MD5) MD5 = "";
    if (!contentType) contentType = "";
    if (action) res = `/${bucketName}/${objectName}?${action}`;
    return `${method}
${MD5}
${contentType}
${this._date}
x-oss-date:${this._date}
${res}`;
  }
}

module.exports = MultipartUploader;
