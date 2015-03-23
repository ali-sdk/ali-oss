ali-oss
=======

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![David deps][david-image]][david-url]
[![iojs version][iojs-image]][iojs-url]
[![node version][node-image]][node-url]
[![Gittip][gittip-image]][gittip-url]

[npm-image]: https://img.shields.io/npm/v/ali-oss.svg?style=flat-square
[npm-url]: https://npmjs.org/package/ali-oss
[travis-image]: https://img.shields.io/travis/ali-sdk/ali-oss.svg?style=flat-square
[travis-url]: https://travis-ci.org/ali-sdk/ali-oss
[david-image]: https://img.shields.io/david/ali-sdk/ali-oss.svg?style=flat-square
[david-url]: https://david-dm.org/ali-sdk/ali-oss
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.11-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[iojs-image]: https://img.shields.io/badge/io.js-%3E=_1.0-green.svg?style=flat-square
[iojs-url]: http://iojs.org/
[gittip-image]: https://img.shields.io/gittip/dead-horse.svg?style=flat-square
[gittip-url]: https://www.gittip.com/dead-horse/

aliyun OSS(open storage service) node client.

Sub module of [ali-sdk](https://github.com/ali-sdk/ali-sdk).

## Install

```bash
npm install ali-oss --save
```

## Usage

@see [OSS Usage on ali-sdk](https://github.com/ali-sdk/ali-sdk/blob/master/docs/oss.md)

## TODO

- Bucket
  - Base
    - [x] listBuckets*
    - [x] putBucket*
    - [x] deleteBucket*
  - ACL
    - [x] putBucketACL*
    - [x] getBucketACL*
  - Logging
    - [x] putBucketLogging*
    - [x] getBucketLogging*
    - [x] deleteBucketLogging*
  - Website
    - [x] putBucketWebsite*
    - [x] getBucketWebsite*
    - [x] deleteBucketWebsite*
  - Referer
    - [x] putBucketReferer*
    - [x] getBucketReferer*
    - [x] deleteBucketReferer*
  - Lifecycle
    - [x] putBucketLifecycle*
    - [x] getBucketLifecycle*
    - [x] deleteBucketLifecycle*
- Object
 - [x] put*
 - [x] putMeta*
 - [x] get*
 - [x] getStream*
 - [x] head*
 - [x] copy*
 - [x] delete*
 - [x] deleteMulti*
 - [ ] post*
 - [x] list*

## License

[MIT](LICENSE)
