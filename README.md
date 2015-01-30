ali-oss
=======
[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![David deps][david-image]][david-url]
[![node version][node-image]][node-url]
[![Gittip][gittip-image]][gittip-url]

[npm-image]: https://img.shields.io/npm/v/ali-oss.svg?style=flat-square
[npm-url]: https://npmjs.org/package/ali-oss
[travis-image]: https://img.shields.io/travis/alibaba/ali-oss.svg?style=flat-square
[travis-url]: https://travis-ci.org/alibaba/ali-oss
[david-image]: https://img.shields.io/david/alibaba/ali-oss.svg?style=flat-square
[david-url]: https://david-dm.org/alibaba/ali-oss
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.11-red.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[gittip-image]: https://img.shields.io/gittip/dead-horse.svg?style=flat-square
[gittip-url]: https://www.gittip.com/dead-horse/

aliyun OSS(open storage service) node client. generator friendly.

a node.js wrapper for [OSS restful api](http://docs.aliyun.com/#/oss/api-reference/abstract)

## Install

```bash
npm install ali-oss --save
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

```js
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

```js
yield* client.get(name, path, options);
```

options:

- **name**: object name in oss
- **path**: can be filepath and stream
- **options**:
  - timeout
  - headers

#### remove, delete

```js
yield* client.remove(name, options);
```

options:

- **name**: object name in oss
- **options**:
  - timeout

#### signatureUrl

```js
var downloadUrl = client.signatureUrl(name);
// http://oss.aliyuncs.com/oss-api.pdf?OSSAccessKeyId=xxxx&Expires=1141889120&Signature=vjbyPxybdZaNmGa%2ByT272YEAiv4%3D
```

options:

- **name**: object name in oss

## backward compatibility

if you do not use node v0.11+ or do not use `node --harmony`.
this module will use [regenerator](https://github.com/facebook/regenerator) to convert to es5 style.
so you only need to use co wrap the generator function into callback style:

```js
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
