# oss-wx

oss wechat miniprogram sdk

## use:

copy dist/oss-wx.js to your project

```javascript
import MultipartUploader from './oss-wx';
```

## Summary

- [multipartUpload](#MultipartUploaderfilePath-bucketName-ak-sk-func-options)

### MultipartUploader(filePath, bucketName, ak, sk, func[, options])

parameters:

- filePath {String} upload tempfile path
- bucketName {String} your target bucket
- ak {String} your access key
- sk {String} your secret key
- func {Function} upload successful will excute
- [options] {Object}
  - [maxConcurrency] {Number} default is 5, must be less than 10
  - [chunkSize] {Number} default 5x1024x1024 bytes
  - [timeout] {Number} default 10000 ms

```javascript
import MultipartUploader from './oss-wx';
wx.chooseMessageFile({
  count: 1,
  success: res => {
    // init
    const uploader = new MultipartUploader(
      res.tempFiles[0],
      'your bucket',
      'region',
      'ak',
      'sk',
      //  upload is successful will excute the func
      r => {
        console.log(r);
      }
    );
    // upload
    uploader.multipartUpload();
  },
  fail: err => {
    console.log(err);
  }
});
```

TODO

- [ ] test case
- [ ] retry
- [ ] abort multipart
- [ ] resume upload
