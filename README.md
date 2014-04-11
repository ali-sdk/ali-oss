ali-oss
=======
![travis-ci](https://api.travis-ci.org/node-modules/ali-oss.svg)

aliyun OSS(open storage service) node client. generator friendly.

a node.js wrapper for [OSS restful api](http://imgs-storage.cdn.aliyuncs.com/help/oss/OSS_API_20131015.pdf?spm=5176.383663.5.23.AHDSVr&file=OSS_API_20131015.pdf)

## Install

```
npm install ali-oss
```

## Usage

### Init

init a oss client, need `accessKeyId`, `accessKeySecret` and `bucket`

```js
var OSS = require('ali-oss');
var client = OSS.create({
  accessKeyId: 'id',
  accessKeySecret: 'xxx',
  bucket: 'test'
});
```

options:

 - accessKeyId
 - accessKeySecret
 - [host]: default to `oss.aliyuncs.com:8080`
 - [timeout]: default to '10s'

### Methods

#### upload, put

```
yield* client.upload(file, name, options);
```

options:

 - **file**: can be filepath, fileContent, stream
 - **name**: object name in oss
 - **options**:
    - timeout: request timeout
    - headers: custom headers, checkout the doc
    - mime: file mime type, will send to `mime.lookup`

#### download, get

```
yield* client.get(name, path, options);
```

options:

- **name**: object name in oss
- **path**: can be filepath and stream
- **options**:
  - timeout
  - headers

#### remove, delete

```
yield* client.remove(name, options);
```

options:

- **name**: object name in oss
- **options**:
  - timeout

## no generator support

if you do not use node v0.11+ or do not use `node --harmony`.
this module will use [regenerator](https://github.com/facebook/regenerator) to convert to es5 style.
so you only need to use co wrap the generator function into callback style:

```
var co = require('co');
var OSS = require('ali-oss');
var client = OSS.create({});

client.update = co(client.update);
client.get = co(client.get);
client.remove = co(client.remove);
```

then you use these APIs as common async callback APIs. checkout the [callback_example.js](callback_example.js).

## License

MIT
