oss-js-sdk
=======

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![coverage][cov-image]][cov-url]
[![David deps][david-image]][david-url]

[npm-image]: https://img.shields.io/npm/v/ali-oss.svg?style=flat-square
[npm-url]: https://npmjs.org/package/ali-oss
[travis-image]: https://img.shields.io/travis/ali-sdk/ali-oss/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/ali-sdk/ali-oss.svg?branch=master
[cov-image]: http://codecov.io/github/ali-sdk/ali-oss/coverage.svg?branch=master
[cov-url]: http://codecov.io/github/ali-sdk/ali-oss?branch=master
[david-image]: https://img.shields.io/david/ali-sdk/ali-oss.svg?style=flat-square
[david-url]: https://david-dm.org/ali-sdk/ali-oss

aliyun OSS(object storage service) js client for Node and Browser env.

`NOTE`： For SDK `5.X` document, please go to [README.md](https://github.com/ali-sdk/ali-oss/blob/5.x/README.md)

## Install

```bash
npm install ali-oss --save
```

## Compatibility

### Node
Node.js >= 8.0.0 required. You can use 4.x in Node.js < 8.

### Browser

- IE >= 10 & Edge
- Major versions of Chrome/Firefox/Safari
- Major versions of Android/iOS/WP

## License

[MIT](LICENSE)

# OSS Usage

OSS, Object Storage Service. Equal to well known Amazon [S3](http://aws.amazon.com/s3/).

All operation use es7 async/await to implement. All api is async function.

## Summary

- [Node Usage](#node-usage)
- [Browser Usage](#browser-usage)
- [Data Regions](#data-regions)
- [Create Account](#create-acount)
- [Create A Bucket Instance](#create-a-bucket-instance)
  - [#oss(options)](#ossoptions)
- [Bucket Operations](#bucket-operations)
  - Base
    - [.listBuckets(query[, options])](#listbucketsquery-options)
    - [.putBucket(name[, options])](#putbucketname-options)
    - [.useBucket(name)](#usebucketname)
    - [.deleteBucket(name[, options])](#deletebucketname-options)
    - [.getBucketInfo(name)](#getbucketinfoname)
    - [.getBucketLocation(name)](#getbucketlocationname)
  - ACL
    - [.putBucketACL(name, acl[, options])](#putbucketaclname-acl-options)
    - [.getBucketACL(name[, options])](#getbucketaclname-options)
  - Logging
    - [.putBucketLogging(name, prefix[, options])](#putbucketloggingname-prefix-options)
    - [.getBucketLogging(name[, options])](#getbucketloggingname-options)
    - [.deleteBucketLogging(name[, options])](#deletebucketloggingname-options)
  - Website
    - [.putBucketWebsite(name, config[, options])](#putbucketwebsitename-config-options)
    - [.getBucketWebsite(name[, options])](#getbucketwebsitename-options)
    - [.deleteBucketWebsite(name, region[, options])](#deletebucketwebsitename-options)
  - Referer
    - [.putBucketReferer(name, allowEmpty, referers[, options])](#putbucketreferername-allowempty-referers-options)
    - [.getBucketReferer(name[, options])](#getbucketreferername-options)
    - [.deleteBucketReferer(name[, options])](#deletebucketreferername-options)
  - Lifecycle
    - [.putBucketLifecycle(name, rules[, options])](#putbucketlifecyclename-rules-options)
    - [.getBucketLifecycle(name[, options])](#getbucketlifecyclename-options)
    - [.deleteBucketLifecycle(name[, options])](#deletebucketlifecyclename-options)
  - CORS
    - [.putBucketCORS(name, rules[, options])](#putbucketcorsname-rules-options)
    - [.getBucketCORS(name[, options])](#getbucketcorsname-options)
    - [.deleteBucketCORS(name[, options])](#deletebucketcorsname-options)
- [Object Operations](#object-operations)
  - [.list(query[, options])](#listquery-options)
  - [.put(name, file[, options])](#putname-file-options)
  - [.putStream(name, stream[, options])](#putstreamname-stream-options)
  - [.append(name, file[, options])](#apendname-file-options)
  - [.getObjectUrl(name[, baseUrl])](#getobjecturlname-baseurl)
  - [.generateObjectUrl(name[, baseUrl])](#generateobjecturlname-baseurl)
  - [.head(name[, options])](#headname-options)
  - [.get(name, file[, options])](#getname-file-options)
  - [.getStream(name[, options])](#getstreamname-options)
  - [.delete(name[, options])](#deletename-options)
  - [.copy(name, sourceName[, options])](#copyname-sourcename-options)
  - [.putMeta(name, meta[, options])](#putmetaname-meta-options)
  - [.deleteMulti(names[, options])](#deletemultinames-options)
  - [.signatureUrl(name[, options])](#signatureurlname-options)
  - [.putACL(name, acl[, options])](#putaclname-acl-options)
  - [.getACL(name[, options])](#getaclname-options)
  - [.restore(name[, options])](#restorename-options)
  - [.initMultipartUpload(name[, options])](#initmultipartuploadname-options)
  - [.uploadPart(name, uploadId, partNo, file, start, end[, options])](#uploadpartname-uploadid-partno-file-start-end-options)
  - [.uploadPartCopy(name, uploadId, partNo, range, sourceData[, options])](#uploadpartcopyname-uploadid-partno-range-sourcedata-options)
  - [.completeMultipartUpload(name, uploadId, parts[, options])](#completemultipartuploadname-uploadid-parts-options)
  - [.multipartUpload(name, file[, options])](#multipartuploadname-file-options)
  - [.multipartUploadCopy(name, sourceData[, options])](#multipartuploadcopyname-sourcedata-options)
  - [.listParts(name, uploadId[, query, options])](#listparts-name-uploadid-query-options)
  - [.listUploads(query[, options])](#listuploadsquery-options)
  - [.abortMultipartUpload(name, uploadId[, options])](#abortmultipartuploadname-uploadid-options)
- [RTMP Operations](#rtmp-operations)
  - [.putChannel(id, conf[, options])](#putchannelid-conf-options)
  - [.getChannel(id[, options])](#getchannelid-options)
  - [.deleteChannel(id[, options])](#deletechannelid-options)
  - [.putChannelStatus(id, status[, options])](#putchannelstatusid-status-options)
  - [.getChannelStatus(id[, options])](#getchannelstatusid-options)
  - [.listChannels(query[, options])](#listchannelsquery-options)
  - [.getChannelHistory(id[, options])](#getchannelhistoryid-options)
  - [.createVod(id, name, time[, options])](#createvodid-name-time-options)
  - [.getRtmpUrl(channelId[, options])](#getrtmpurlchannelid-options)
- [Create A Image Service Instance](#create-a-image-service-instance)
  - [#oss.ImageClient(options)](#ossimageclientoptions)
- [Image Operations](#image-operations)
  - [imgClient.get(name, file[, options])](#imgclientgetname-file-options)
  - [imgClient.getStream(name[, options])](#imgclientgetstreamname-options)
  - [imgClient.getExif(name[, options])](#imgclientgetexifname-options)
  - [imgClient.getInfo(name[, options])](#imgclientgetinfoname-options)
  - [imgClient.putStyle(name, style[, options])](#imgclientputstylename-style-options)
  - [imgClient.getStyle(name[, options])](#imgclientgetstylename-options)
  - [imgClient.listStyle([options])](#imgclientliststyleoptions)
  - [imgClient.deleteStyle(name[, options])](#imgclientdeletestylename-options)
  - [imgClient.signatureUrl(name)](#imgclientsignatureurlname)
- [Known Errors](#known-errors)

## Node Usage

### Compatibility
- Node: >= 8.0.0

### Basic usage
1.install SDK using npm
```
npm install ali-oss --save
```
2.for example:
```js
const OSS = require('ali-oss');
const client = new OSS({
  region: '<oss region>',
  accessKeyId: '<Your accessKeyId>',
  accessKeySecret: '<Your accessKeySecret>',
  bucket: '<Your bucket name>'
});
```
## Browser Usage

You can use most of the functionalities of `ali-oss` in browser with
some exceptions:

- put object with streaming: no chunked encoding, we use multipart
  upload instead
- get object to local file: we cannot manipulate file system in
  browser, we provide signed object url for downloading needs
- bucket operations(listBuckets, putBucketLogging, etc) will fail: OSS
  server currently do not support CORS requests for bucket operations
  (will probably be fixed later)

### Compatibility

- IE >= 10 & Edge
- Major versions of Chrome/Firefox/Safari
- Major versions of Android/iOS/WP
    >Note: Because some browsers do not support promises, you need to introduce promise compatible libraries.<br>
    For example: IE10 and IE11 need to introduce a promise-polyfill.

### Setup

#### Bucket setup

As browser-side javascript involves CORS operations. You need to setup
your bucket CORS rules to allow CORS operations:

- set allowed origins to '\*'
- allowed methods to 'PUT, GET, POST, DELETE, HEAD'
- set allowed headers to '\*'
- expose 'ETag' in expose headers

#### STS setup

As we don't want to expose the accessKeyId/accessKeySecret in the
browser, a [common practice][oss-sts] is to use STS to grant temporary
access.

### Basic usage

Include the sdk lib in the `<script>` tag and you have `OSS` available
for creating client. 

```html
 // x.x.x The specific version number represented 
 // we recommend introducing offline resources, because the usability of online resources depends on the stability of the cdn server. 
 <!-- Introducing online resources -->
 <script src="http://gosspublic.alicdn.com/aliyun-oss-sdk-x.x.x.min.js"></script>
 <!-- Introducing offline resources -->
 <script src="./aliyun-oss-sdk-x.x.x.min.js"></script>

<script type="text/javascript">
  const client = new OSS({
    region: 'oss-cn-hangzhou',
    accessKeyId: '<access-key-id>',
    accessKeySecret: '<access-key-secret>',
    bucket: '<bucket-name>'
  });

  client.list().then((result) => {
    console.log('objects: %j', result.objects);
    return client.put('my-obj', new OSS.Buffer('hello world'));
  }).then((result) => {
    console.log('put result: %j', result);
    return client.get('my-obj');
  }).then((result) => {
    console.log('get result: %j', result.content.toString());
  });
</script>
```
The full sample can be found [here][browser-sample].

### How to build

```bash
npm run build-dist
```

And see the build artifacts under `dist/`.


## Data Regions

[OSS current data regions](https://help.aliyun.com/document_detail/oss/user_guide/endpoint_region.html).

region | country | city | endpoint | internal endpoint
---  | ---     | ---  | --- | ---
oss-cn-hangzhou | China | HangZhou | oss-cn-hangzhou.aliyuncs.com | oss-cn-hangzhou-internal.aliyuncs.com
oss-cn-shanghai | China | ShangHai | oss-cn-shanghai.aliyuncs.com | oss-cn-shanghai-internal.aliyuncs.com
oss-cn-qingdao | China | QingDao | oss-cn-qingdao.aliyuncs.com | oss-cn-qingdao-internal.aliyuncs.com
oss-cn-beijing | China | BeiJing | oss-cn-beijing.aliyuncs.com | oss-cn-beijing-internal.aliyuncs.com
oss-cn-shenzhen | China | ShenZhen | oss-cn-shenzhen.aliyuncs.com | oss-cn-shenzhen-internal.aliyuncs.com
oss-cn-hongkong | China | HongKong | oss-cn-hongkong.aliyuncs.com | oss-cn-hongkong-internal.aliyuncs.com
oss-us-west-1 | US | Silicon Valley | oss-us-west-1.aliyuncs.com | oss-us-west-1-internal.aliyuncs.com
oss-ap-southeast-1 | Singapore | Singapore | oss-ap-southeast-1.aliyuncs.com | oss-ap-southeast-1-internal.aliyuncs.com

## Create Account

Go to [OSS website](http://www.aliyun.com/product/oss/?lang=en), create a new account for new user.

After account created, you can create the OSS instance and get the `accessKeyId` and `accessKeySecret`.

## Create A Bucket Instance

Each OSS instance required `accessKeyId`, `accessKeySecret` and `bucket`.

## oss(options)

Create a Bucket store instance.

options:

- accessKeyId {String} access key you create on aliyun console website
- accessKeySecret {String} access secret you create
- [stsToken] {String} used by temporary authorization, detail [see](https://www.alibabacloud.com/help/doc-detail/32077.htm)
- [bucket] {String} the default bucket you want to access
  If you don't have any bucket, please use `putBucket()` create one first.
- [endpoint] {String} oss region domain. It takes priority over `region`.
- [region] {String} the bucket data region location, please see [Data Regions](#data-regions),
  default is `oss-cn-hangzhou`.
- [internal] {Boolean} access OSS with aliyun internal network or not, default is `false`.
  If your servers are running on aliyun too, you can set `true` to save lot of money.
- [secure] {Boolean} instruct OSS client to use HTTPS (secure: true) or HTTP (secure: false) protocol.
- [timeout] {String|Number} instance level timeout for all operations, default is `60s`

example:

```js
const oss = require('ali-oss');

const store = oss({
  accessKeyId: 'your access key',
  accessKeySecret: 'your access secret',
  bucket: 'your bucket name',
  region: 'oss-cn-hangzhou'
});
```

## Bucket Operations

### .listBuckets(query[, options])

List buckets in this account.

parameters:

- [query] {Object} query parameters, default is `null`
  - [prefix] {String} search buckets using `prefix` key
  - [marker] {String} search start from `marker`, including `marker` key
  - [max-keys] {String|Number} max buckets, default is `100`, limit to `1000`
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return buckets list on `buckets` properties.

- buckets {Array<BucketMeta>} bucket meta info list
  Each `BucketMeta` will contains blow properties:
    - name {String} bucket name
    - region {String} bucket store data region, e.g.: `oss-cn-hangzhou-a`
    - creationDate {String} bucket create GMT date, e.g.: `2015-02-19T08:39:44.000Z`
- owner {Object} object owner, including `id` and `displayName`
- isTruncated {Boolean} truncate or not
- nextMarker {String} next marker string
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- List top 10 buckets

```js
store.listBuckets({
  "max-keys": 10
}).then((result) => {
  console.log(result);
});

```

### .putBucket(name[, options])

Create a new bucket.

parameters:

- name {String} bucket name
  If bucket exists and not belong to current account, will throw BucketAlreadyExistsError.
  If bucket not exists, will create a new bucket and set it's ACL.
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout
  - [StorageClass] {String} the storeage type include (Standard,IA,Archive)

Success will return the bucket name on `bucket` properties.

- bucket {String} bucket name
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- Create a bucket name `helloworld` location on HongKong

```js
store.putBucket('helloworld').then((result) => {
  // use it by default
  store.useBucket('helloworld');
});
```

- Create a bucket name `helloworld` location on HongKong StorageClass `Archive`

```js
await store.putBucket('helloworld', { StorageClass: 'Archive' });
// use it by default
store.useBucket('helloworld');
```

### .deleteBucket(name[, options])

Delete an empty bucket.

parameters:

- name {String} bucket name
  If bucket is not empty, will throw BucketNotEmptyError.
  If bucket is not exists, will throw NoSuchBucketError.
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- Delete the exists 'helloworld' bucket on 'oss-cn-hongkong'

```js
store.deleteBucket('helloworld').then((result) => {});
```

### .useBucket(name)

Use the bucket.

parameters:

- name {String} bucket name

example:

- Use `helloworld` as the default bucket

```js
store.useBucket('helloworld');
```

### .getBucketInfo(name)

Get bucket information,include CreationDate、ExtranetEndpoint、IntranetEndpoint、Location、Name、StorageClass、
Owner、AccessControlList

parameters:

- name {String} bucket name

example:

- Use `helloworld` as the default bucket

```js
store.getBucketInfo('helloworld').then( (res) => {
  console.log(res.bucket)
})
```

### .getBucketLocation(name)

Get bucket location

parameters:

- name {String} bucket name

example:

- Use `helloworld` as the default bucket

```js
store.getBucketLocation('helloworld').then( (res) => {
  console.log(res.location)
})
```

---

### .putBucketACL(name, acl[, options])

Update the bucket ACL.

parameters:

- name {String} bucket name
- acl {String} access control list, current available: `public-read-write`, `public-read` and `private`
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- Set bucket `helloworld` to `public-read-write`

```js
store.putBucketACL('helloworld', 'public-read-write').then((result) => {
});
```

### .getBucketACL(name[, options])

Get the bucket ACL.

parameters:

- name {String} bucket name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- acl {String} acl settiongs string
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- Get bucket `helloworld`

```js
store.getBucketACL('helloworld').then((result) => {
  console.log(result.acl);
});
```

---

### .putBucketLogging(name, prefix[, options])

Update the bucket logging settings.
Log file will create every one hour and name format: `<prefix><bucket>-YYYY-mm-DD-HH-MM-SS-UniqueString`.

parameters:

- name {String} bucket name
- [prefix] {String} prefix path name to store the log files
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- Enable bucket `helloworld` logging and save with prefix `logs/`

```js
store.putBucketLogging('helloworld', 'logs/').then((result) => {
});
```

### .getBucketLogging(name[, options])

Get the bucket logging settings.

parameters:

- name {String} bucket name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- enable {Boolean} enable logging or not
- prefix {String} prefix path name to store the log files, maybe `null`
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- Get bucket `helloworld` logging settings

```js
store.getBucketLogging('helloworld').then((result) => {
  console.log(result.enable, result.prefix);
});
```

### .deleteBucketLogging(name[, options])

Delete the bucket logging settings.

parameters:

- name {String} bucket name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

---

### .putBucketWebsite(name, config[, options])

Set the bucket as a static website.

parameters:

- name {String} bucket name
- config {Object} website config, contains blow properties:
  - index {String} default page, e.g.: `index.html`
  - [error] {String} error page, e.g.: 'error.html'
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

```js
store.putBucketWebsite('hello', {
  index: 'index.html'
}).then((result) => {
});
```

### .getBucketWebsite(name[, options])

Get the bucket website config.

parameters:

- name {String} bucket name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- index {String} index page
- error {String} error page, maybe `null`
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

### .deleteBucketWebsite(name[, options])

Delete the bucket website config.

parameters:

- name {String} bucket name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

---

### .putBucketReferer(name, allowEmpty, referers[, options])

Set the bucket request `Referer` white list.

parameters:

- name {String} bucket name
- allowEmpty {Boolean} allow empty request referer or not
- referers {Array<String>} `Referer` white list, e.g.:
  ```js
  [
    'https://npm.taobao.org',
    'http://cnpmjs.org'
  ]
  ```
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

```js
store.putBucketReferer('hello', false, [
  'https://npm.taobao.org',
  'http://cnpmjs.org'
]).then((result) => {
});
```

### .getBucketReferer(name[, options])

Get the bucket request `Referer` white list.

parameters:

- name {String} bucket name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- allowEmpty {Boolean} allow empty request referer or not
- referers {Array<String>} `Referer` white list
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

### .deleteBucketReferer(name[, options])

Delete the bucket request `Referer` white list.

parameters:

- name {String} bucket name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

---

### .putBucketLifecycle(name, rules[, options])

Set the bucket object lifecycle.

parameters:

- name {String} bucket name
- rules {Array<Rule>} rule config list, each `Rule` will contains blow properties:
  - [id] {String} rule id, if not set, OSS will auto create it with random string.
  - prefix {String} store prefix
  - status {String} rule status, allow values: `Enabled` or `Disabled`
  - [days] {Number|String} expire after the `days`
  - [date] {String} expire date, e.g.: `2022-10-11T00:00:00.000Z`
    `date` and `days` only set one.
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

```js
store.putBucketLifecycle('hello', [
  {
    id: 'delete after one day',
    prefix: 'logs/',
    status: 'Enabled',
    days: 1
  },
  {
    prefix: 'logs2/',
    status: 'Disabled',
    date: '2022-10-11T00:00:00.000Z'
  }
]).then((result) => {});
```

### .getBucketLifecycle(name[, options])

Get the bucket object lifecycle.

parameters:

- name {String} bucket name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- rules {Array<Rule>} the lifecycle rule list
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

### .deleteBucketLifecycle(name[, options])

Delete the bucket object lifecycle.

parameters:

- name {String} bucket name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

---

### .putBucketCORS(name, rules[, options])

Set CORS rules of the bucket object

parameters:

- name {String} bucket name
- rules {Array<Rule>} rule config list, each `Rule` will contains below properties:
  - allowedOrigin {String/Array} configure for Access-Control-Allow-Origin header
  - allowedMethod {String/Array} configure for Access-Control-Allow-Methods header
  - [allowedHeader] {String/Array} configure for Access-Control-Allow-Headers header
  - [exposeHeader] {String/Array} configure for Access-Control-Expose-Headers header
  - [maxAgeSeconds] {String} configure for Access-Control-Max-Age header
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

```js
store.putBucketCORS('hello', [
  {
    allowedOrigin: '*',
    allowedMethod: [
      'GET',
      'HEAD',
    ],
  }
]).then((result) => {});
```

### .getBucketCORS(name[, options])

Get CORS rules of the bucket object.

parameters:

- name {String} bucket name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- rules {Array<Rule>} the CORS rule list
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

### .deleteBucketCORS(name[, options])

Delete CORS rules of the bucket object.

parameters:

- name {String} bucket name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

---

## Object Operations

All operations function return Promise, except `signatureUrl`.

### .put(name, file[, options])

Add an object to the bucket.

parameters:

- name {String} object name store on OSS
- file {String|Buffer|ReadStream|File(only support Browser)|Blob(only support Browser)} object local path, content buffer or ReadStream content instance use in Node, Blob and html5 File
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout
  - [mime] {String} custom mime, will send with `Content-Type` entity header
  - [meta] {Object} user meta, will send with `x-oss-meta-` prefix string
    e.g.: `{ uid: 123, pid: 110 }`
  - [callback] {Object} The callback parameter is composed of a JSON string encoded in Base64,detail [see](https://www.alibabacloud.com/help/doc-detail/31989.htm)<br>
    - url {String} After a file is uploaded successfully, the OSS sends a callback request to this URL.
    - [host] {String} The host header value for initiating callback requests.
    - body {String} The value of the request body when a callback is initiated, for example, key=$(key)&etag=$(etag)&my_var=$(x:my_var).
    - [contentType] {String} The Content-Type of the callback requests initiatiated, It supports application/x-www-form-urlencoded and application/json, and the former is the default value.
    - [customValue] {Object} Custom parameters are a map of key-values<br>
         e.g.:
        ```js
           var customValue = {var1: 'value1', var2: 'value2'}
        ```
  - [headers] {Object} extra headers, detail see [RFC 2616](http://www.w3.org/Protocols/rfc2616/rfc2616.html)
    - 'Cache-Control' cache control for download, e.g.: `Cache-Control: public, no-cache`
    - 'Content-Disposition' object name for download, e.g.: `Content-Disposition: somename`
    - 'Content-Encoding' object content encoding for download, e.g.: `Content-Encoding: gzip`
    - 'Expires' expires time (milliseconds) for download, e.g.: `Expires: 3600000`

Success will return the object information.

object:

- name {String} object name
- data {Object} callback server response data, sdk use JSON.parse() return
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- Add an object through local file path

```js
const filepath = '/home/ossdemo/demo.txt';
store.put('ossdemo/demo.txt', filepath).then((result) => {
  console.log(result);
});

{
  name: 'ossdemo/demo.txt',
  res: {
    status: 200,
    headers: {
      date: 'Tue, 17 Feb 2015 13:28:17 GMT',
      'content-length': '0',
      connection: 'close',
      etag: '"BF7A03DA01440845BC5D487B369BC168"',
      server: 'AliyunOSS',
      'x-oss-request-id': '54E341F1707AA0275E829244'
    },
    size: 0,
    rt: 92
  }
}
```

- Add an object through content buffer

```js
store.put('ossdemo/buffer', new Buffer('foo content')).then((result) => {
  console.log(result);
});

{
  name: 'ossdemo/buffer',
  url: 'http://demo.oss-cn-hangzhou.aliyuncs.com/ossdemo/buffer',
  res: {
    status: 200,
    headers: {
      date: 'Tue, 17 Feb 2015 13:28:17 GMT',
      'content-length': '0',
      connection: 'close',
      etag: '"xxx"',
      server: 'AliyunOSS',
      'x-oss-request-id': '54E341F1707AA0275E829243'
    },
    size: 0,
    rt: 92
  }
}
```

- Add an object through readstream

```js
const filepath = '/home/ossdemo/demo.txt';
store.put('ossdemo/readstream.txt', fs.createReadStream(filepath)).then((result) => {
  console.log(result);
});

{
  name: 'ossdemo/readstream.txt',
  url: 'http://demo.oss-cn-hangzhou.aliyuncs.com/ossdemo/readstream.txt',
  res: {
    status: 200,
    headers: {
      date: 'Tue, 17 Feb 2015 13:28:17 GMT',
      'content-length': '0',
      connection: 'close',
      etag: '"BF7A03DA01440845BC5D487B369BC168"',
      server: 'AliyunOSS',
      'x-oss-request-id': '54E341F1707AA0275E829242'
    },
    size: 0,
    rt: 92
  }
}
```

### .putStream(name, stream[, options])

Add a stream object to the bucket.

parameters:

- name {String} object name store on OSS
- stream {ReadStream} object ReadStream content instance
- [options] {Object} optional parameters
  - [contentLength] {Number} the stream length, `chunked encoding` will be used if absent
  - [timeout] {Number} the operation timeout
  - [mime] {String} custom mime, will send with `Content-Type` entity header
  - [meta] {Object} user meta, will send with `x-oss-meta-` prefix string
    e.g.: `{ uid: 123, pid: 110 }`
  - [callback] {Object} The callback parameter is composed of a JSON string encoded in Base64,detail [see](https://www.alibabacloud.com/help/doc-detail/31989.htm)<br>
    - url {String} After a file is uploaded successfully, the OSS sends a callback request to this URL.
    - [host] {String} The host header value for initiating callback requests.
    - body {String} The value of the request body when a callback is initiated, for example, key=$(key)&etag=$(etag)&my_var=$(x:my_var).
    - [contentType] {String} The Content-Type of the callback requests initiatiated, It supports application/x-www-form-urlencoded and application/json, and the former is the default value.
    - [customValue] {Object} Custom parameters are a map of key-values<br>
         e.g.:
        ```js
           var customValue = {var1: 'value1', var2: 'value2'}
        ```
  - [headers] {Object} extra headers, detail see [RFC 2616](http://www.w3.org/Protocols/rfc2616/rfc2616.html)
    - 'Cache-Control' cache control for download, e.g.: `Cache-Control: public, no-cache`
    - 'Content-Disposition' object name for download, e.g.: `Content-Disposition: somename`
    - 'Content-Encoding' object content encoding for download, e.g.: `Content-Encoding: gzip`
    - 'Expires' expires time (milliseconds) for download, e.g.: `Expires: 3600000`

Success will return the object information.

object:

- name {String} object name
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- Add an object through readstream

```js
const filepath = '/home/ossdemo/demo.txt';
store.putStream('ossdemo/readstream.txt', fs.createReadStream(filepath)).then((result) => {
  console.log(result);
});

{
  name: 'ossdemo/readstream.txt',
  url: 'http://demo.oss-cn-hangzhou.aliyuncs.com/ossdemo/readstream.txt',
  res: {
    status: 200,
    headers: {
      date: 'Tue, 17 Feb 2015 13:28:17 GMT',
      'content-length': '0',
      connection: 'close',
      etag: '"BF7A03DA01440845BC5D487B369BC168"',
      server: 'AliyunOSS',
      'x-oss-request-id': '54E341F1707AA0275E829242'
    },
    size: 0,
    rt: 92
  }
}
```

### .append(name, file[, options])

Append an object to the bucket, it's almost same as put, but it can add content to existing object rather than override it.

All parameters are same as put except for options.position

- name {String} object name store on OSS
- file {String|Buffer|ReadStream} object local path, content buffer or ReadStream content instance
- [options] {Object} optional parameters
  - [position] {String} specify the position which is the content length of the latest object
  - [timeout] {Number} the operation timeout
  - [mime] {String} custom mime, will send with `Content-Type` entity header
  - [meta] {Object} user meta, will send with `x-oss-meta-` prefix string
    e.g.: `{ uid: 123, pid: 110 }`
  - [headers] {Object} extra headers, detail see [RFC 2616](http://www.w3.org/Protocols/rfc2616/rfc2616.html)
    - 'Cache-Control' cache control for download, e.g.: `Cache-Control: public, no-cache`
    - 'Content-Disposition' object name for download, e.g.: `Content-Disposition: somename`
    - 'Content-Encoding' object content encoding for download, e.g.: `Content-Encoding: gzip`
    - 'Expires' expires time (milliseconds) for download, e.g.: `Expires: 3600000`

object:

- name {String} object name
- url {String} the url of oss
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)
- nextAppendPosition {String} the next position

example:

```js
let object = await store.apend('ossdemo/buffer', new Buffer('foo'));

// append content to the existing object
object = await store.apend('ossdemo/buffer', new Buffer('bar'), {
  position: object.nextAppendPosition,
});
```

### .getObjectUrl(name[, baseUrl])

Get the Object url.
If provide `baseUrl`, will use `baseUrl` instead the default `endpoint`.

e.g.:

```js
const cdnUrl = client.getObjectUrl('foo/bar.jpg', 'https://mycdn.domian.com');
// cdnUrl should be `https://mycdn.domian.com/foo/bar.jpg`
```

### .generateObjectUrl(name[, baseUrl])

Get the Object url.
If provide `baseUrl`, will use `baseUrl` instead the default `bucket and endpoint `.
Suggest use generateObjectUrl instead of getObjectUrl.

e.g.:

```js
const url = client.generateObjectUrl('foo/bar.jpg');
// cdnUrl should be `https://${bucketname}.${endpotint}foo/bar.jpg`

const cdnUrl = client.generateObjectUrl('foo/bar.jpg', 'https://mycdn.domian.com');
// cdnUrl should be `https://mycdn.domian.com/foo/bar.jpg`
```

### .head(name[, options])

Head an object and get the meta info.

parameters:

- name {String} object name store on OSS
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout
  - [headers] {Object} extra headers, detail see [RFC 2616](http://www.w3.org/Protocols/rfc2616/rfc2616.html)
    - 'If-Modified-Since' object modified after this time will return 200 and object meta,
        otherwise return 304 not modified
    - 'If-Unmodified-Since' object modified before this time will return 200 and object meta,
        otherwise throw PreconditionFailedError
    - 'If-Match' object etag equal this will return 200 and object meta,
        otherwise throw PreconditionFailedError
    - 'If-None-Match' object etag not equal this will return 200 and object meta,
        otherwise return 304 not modified

Success will return the object's meta information.

object:

- status {Number} response status, maybe 200 or 304
- meta {Object} object user meta, if not set on `put()`, will return null.
    If return status 304, meta will be null too
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- Head an exists object and get user meta

```js
await this.store.put('ossdemo/head-meta', new Buffer('foo'), {
  meta: {
    uid: 1,
    path: 'foo/demo.txt'
  }
});
const object = await this.store.head('ossdemo/head-meta');
console.log(object);

{
  status: 200,
  meta: {
    uid: '1',
    path: 'foo/demo.txt'
  },
  res: { ... }
}
```

- Head a not exists object

```js
const object = await this.store.head('ossdemo/head-meta');
// will throw NoSuchKeyError
```

### .get(name[, file, options])

Get an object from the bucket.

parameters:

- name {String} object name store on OSS
- [file] {String|WriteStream} file path or WriteStream instance to store the content
  If `file` is null or ignore this parameter, function will return info contains `content` property.
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout
  - [process] {String} image process params, will send with `x-oss-process`
    e.g.: `{process: 'image/resize,w_200'}`
  - [headers] {Object} extra headers, detail see [RFC 2616](http://www.w3.org/Protocols/rfc2616/rfc2616.html)
    - 'Range' get specifying range bytes content, e.g.: `Range: bytes=0-9`
    - 'If-Modified-Since' object modified after this time will return 200 and object meta,
        otherwise return 304 not modified
    - 'If-Unmodified-Since' object modified before this time will return 200 and object meta,
        otherwise throw PreconditionFailedError
    - 'If-Match' object etag equal this will return 200 and object meta,
        otherwise throw PreconditionFailedError
    - 'If-None-Match' object etag not equal this will return 200 and object meta,
        otherwise return 304 not modified

Success will return the info contains response.

object:

- [content] {Buffer} file content buffer if `file` parameter is null or ignore
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

If object not exists, will throw NoSuchKeyError.

example:

- Get an exists object and store it to the local file

```js
const filepath = '/home/ossdemo/demo.txt';
await store.get('ossdemo/demo.txt', filepath);
```

_ Store object to a writestream

```js
await store.get('ossdemo/demo.txt', somestream);
```

- Get an object content buffer

```js
const result = await store.get('ossdemo/demo.txt');
console.log(Buffer.isBuffer(result.content));
```

- Get a processed image and store it to the local file

```js
const filepath = '/home/ossdemo/demo.png';
await store.get('ossdemo/demo.png', filepath, {process: 'image/resize,w_200'});
```

- Get a not exists object

```js
const filepath = '/home/ossdemo/demo.txt';
await store.get('ossdemo/not-exists-demo.txt', filepath);
// will throw NoSuchKeyError
```

### .getStream(name[, options])

Get an object read stream.

parameters:

- name {String} object name store on OSS
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout
  - [process] {String} image process params, will send with `x-oss-process`
  - [headers] {Object} extra headers
    - 'If-Modified-Since' object modified after this time will return 200 and object meta,
        otherwise return 304 not modified
    - 'If-Unmodified-Since' object modified before this time will return 200 and object meta,
        otherwise throw PreconditionFailedError
    - 'If-Match' object etag equal this will return 200 and object meta,
        otherwise throw PreconditionFailedError
    - 'If-None-Match' object etag not equal this will return 200 and object meta,
        otherwise return 304 not modified

Success will return the stream instance and response info.

object:

- stream {ReadStream} readable stream instance
    if response status is not 200, stream will be `null`.
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

If object not exists, will throw NoSuchKeyError.

example:

- Get an exists object stream

```js
const result = await store.getStream('ossdemo/demo.txt');
result.stream.pipe(fs.createWriteStream('some file.txt'));
```

### .delete(name[, options])

Delete an object from the bucket.

parameters:

- name {String} object name store on OSS
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the info contains response.

object:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

If delete object not exists, will also delete success.

example:

- Delete an exists object

```js
await store.delete('ossdemo/someobject');
```

- Delete a not exists object

```js
await store.delete('ossdemo/some-not-exists-object');
```

### .copy(name, sourceName[, options])

Copy an object from `sourceName` to `name`.

parameters:

- name {String} object name store on OSS
- sourceName {String} source object name
  If `sourceName` start with `/`, meaning it's a full name contains the bucket name.
  e.g.: `/otherbucket/logo.png` meaning copy `otherbucket` logn.png object to current bucket.
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout
  - [meta] {Object} user meta, will send with `x-oss-meta-` prefix string
    e.g.: `{ uid: 123, pid: 110 }`
    If the `meta` set, will override the source object meta.
  - [headers] {Object} extra headers
    - 'If-Match' do copy if source object etag equal this,
      otherwise throw PreconditionFailedError
    - 'If-None-Match' do copy if source object etag not equal this,
      otherwise throw PreconditionFailedError
    - 'If-Modified-Since' do copy if source object modified after this time,
        otherwise throw PreconditionFailedError
    - 'If-Unmodified-Since' do copy if source object modified before this time,
        otherwise throw PreconditionFailedError

Success will return the copy result in `data` property.

object:

- data {Object} copy result
  - lastModified {String} object last modified GMT string
  - etag {String} object etag contains `"`, e.g.: `"5B3C1A2E053D763E1B002CC607C5A0FE"`
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

If source object not exists, will throw NoSuchKeyError.

example:

- Copy same bucket object

```js
store.copy('newName', 'oldName').then((result) => {
  console.log(result);
});
```

- Copy other bucket object

```js
store.copy('logo.png', '/other-bucket/logo.png').then((result) => {
  console.log(result);
});
```

### .putMeta(name, meta[, options])

Set an exists object meta.

parameters:

- name {String} object name store on OSS
- meta {Object} user meta, will send with `x-oss-meta-` prefix string
  e.g.: `{ uid: 123, pid: 110 }`
  If `meta: null`, will clean up the exists meta
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the copy result in `data` property.

- data {Object} copy result
  - lastModified {String} object last modified GMT date, e.g.: `2015-02-19T08:39:44.000Z`
  - etag {String} object etag contains `"`, e.g.: `"5B3C1A2E053D763E1B002CC607C5A0FE"`
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

If object not exists, will throw NoSuchKeyError.

example:

- Update exists object meta

```js
const result = await store.putMeta('ossdemo.txt', {
  uid: 1, pid: 'p123'
});
console.log(result);
```

- Clean up object meta

```js
await store.putMeta('ossdemo.txt', null);
```

### .deleteMulti(names[, options])

Delete multi objects in one request.

parameters:

- names {Array<String>} object names, max 1000 objects in once.
- [options] {Object} optional parameters
  - [quiet] {Boolean} quiet mode or verbose mode, default is `false`, verbose mode
    quiet mode: if all objects delete succes, return emtpy response.
      otherwise return delete error object results.
    verbose mode: return all object delete results.
  - [timeout] {Number} the operation timeout

Success will return delete success objects in `deleted` property.

- [deleted] {Array<String>} deleted object names list
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- Delete multi objects in quiet mode

```js
const result = await store.deleteMulti(['obj1', 'obj2', 'obj3'], {
  quiet: true
});
```

- Delete multi objects in verbose mode

```js
const result = await store.deleteMulti(['obj1', 'obj2', 'obj3']);
```

### .list(query[, options])

List objects in the bucket.

parameters:

- [query] {Object} query parameters, default is `null`
  - [prefix] {String} search object using `prefix` key
  - [marker] {String} search start from `marker`, including `marker` key
  - [delimiter] {String} delimiter search scope
    e.g. `/` only search current dir, not including subdir
  - [max-keys] {String|Number} max objects, default is `100`, limit to `1000`
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return objects list on `objects` properties.

- objects {Array<ObjectMeta>} object meta info list
  Each `ObjectMeta` will contains blow properties:
    - name {String} object name on oss
    - lastModified {String} object last modified GMT date, e.g.: `2015-02-19T08:39:44.000Z`
    - etag {String} object etag contains `"`, e.g.: `"5B3C1A2E053D763E1B002CC607C5A0FE"`
    - type {String} object type, e.g.: `Normal`
    - size {Number} object size, e.g.: `344606`
    - storageClass {String} storage class type, e.g.: `Standard`
    - owner {Object} object owner, including `id` and `displayName`
- prefixes {Array<String>} prefix list
- isTruncated {Boolean} truncate or not
- nextMarker {String} next marker string
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- List top 10 objects

```js
const result = await store.list();
console.log(result.objects);
```

- List `fun/` dir including subdirs objects

```js
const result = await store.list({
  prefix: 'fun/'
});
console.log(result.objects);
```

- List `fun/` dir objects, not including subdirs

```js
const result = await store.list({
  prefix: 'fun/',
  delimiter: '/'
});
console.log(result.objects);
```

### .signatureUrl(name[, options])

Create a signature url for download or upload object.

parameters:

- name {String} object name store on OSS
- [options] {Object} optional parameters
  - [expires] {Number} after expires seconds, the url will become invalid, default is `1800`
  - [method] {String} the HTTP method, default is 'GET'
  - [process] {String} image process params, will send with `x-oss-process`
    e.g.: `{process: 'image/resize,w_200'}`
  - [response] {Object} set the response headers for download
    - [content-type] {String} set the response content type
    - [content-disposition] {String} set the response content disposition
    - [cache-control] {String} set the response cache control
    - See more: https://help.aliyun.com/document_detail/oss/api-reference/object/GetObject.html
  - [callback] {Object} set the callback for the operation
    - url {String} set the url for callback
    - [host] {String} set the host for callback
    - body {String} set the body for callback
    - [contentType] {String} set the type for body
    - [customValue] {Object} set the custom value for callback,eg. {var1: value1,var2:value2}

Success will return signature url.

example:

- Get signature url for object

```js
const url = store.signatureUrl('ossdemo.txt');
console.log(url);
// --------------------------------------------------
const url = store.signatureUrl('ossdemo.txt', {
  expires: 3600,
  method: 'PUT'
});
console.log(url);
// --------------------------------------------------
const url = store.signatureUrl('ossdemo.txt', {
  expires: 3600,
  response: {
    'content-type': 'text/custom',
    'content-disposition': 'attachment'
  }
});
console.log(url);
```

- Get a signature url for a processed image

```js
const url = store.signatureUrl('ossdemo.png', {
  process: 'image/resize,w_200'
});
console.log(url);
// --------------------------------------------------
const url = store.signatureUrl('ossdemo.png', {
  expires: 3600,
  process: 'image/resize,w_200'
});
console.log(url);
```

### .putACL(name, acl[, options])

Set object's ACL.

parameters:

- name {String} object name
- acl {String} acl (private/public-read/public-read-write)
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- Set an object's ACL

```js
await store.putACL('ossdemo.txt', 'public-read');
```

### .getACL(name[, options])

Get object's ACL.

parameters:

- name {String} object name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- acl {String} acl settiongs string
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- Get an object's ACL

```js
const result = await store.getACL('ossdemo.txt');
console.log(result.acl);
```

### .restore(name[, options])

Restore Object.

parameters:

- name {String} object name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

example:

- Restore an object

```js
const result = await store.restore('ossdemo.txt');
console.log(result.status);
```

### .initMultipartUpload(name[, options])
Before transmitting data in the Multipart Upload mode,
you must call the Initiate Multipart Upload interface to notify the OSS to initiate a Multipart Upload event.
The Initiate Multipart Upload interface returns a globally unique Upload ID created by the OSS server to identify this Multipart Upload event.

parameters:

- name {String} object name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout
  - [mime] Mime file type e.g.: application/octet-stream
  - [meta] {Object} user meta, will send with `x-oss-meta-` prefix string
  - [headers] {Object} extra headers, detail see [RFC 2616](http://www.w3.org/Protocols/rfc2616/rfc2616.html)
    - 'Cache-Control' cache control for download, e.g.: `Cache-Control: public, no-cache`
    - 'Content-Disposition' object name for download, e.g.: `Content-Disposition: somename`
    - 'Content-Encoding' object content encoding for download, e.g.: `Content-Encoding: gzip`
    - 'Expires' expires time (milliseconds) for download, e.g.: `Expires: 3600000`
    - [x-oss-server-side-encryption]
    Specify the server-side encryption algorithm used to upload each part of this object,Type: string, Valid value: AES256 `x-oss-server-side-encryption: AES256`<br>
    if use in browser you should be set cors expose header x-oss-server-side-encryption

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
    - [x-oss-server-side-encryption] if set request header x-oss-server-side-encryption, will return
  - size {Number} response size
  - rt {Number} request total use time (ms)
- bucket {String} bucket name
- name {String} object name store on OSS
- uploadId {String} upload id, use for uploadPart, completeMultipart

example:

```js
  const result = await store.initMultipartUpload('object');
  console.log(result);
```

### .uploadPart(name, uploadId, partNo, file, start, end[, options])
After initiating a Multipart Upload event, you can upload data in parts based on the specified object name and Upload ID.

parameters:

- name {String} object name
- uploadId {String} get by initMultipartUpload api
- partNo {Number} range is 1-10000, If this range is exceeded, OSS returns the InvalidArgument's error code.
- file {File|String}  is File or FileName, the whole file<br>
 Multipart Upload requires that the size of any Part other than the last Part is greater than 100KB. <br>
 In Node you can use File or FileName, but in browser you only can use File.
- start {Number} part start bytes  e.g: 102400
- end {Number} part end bytes  e.g: 204800
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)
- name {String} object name store on OSS
- etag {String} object etag contains ", e.g.: "5B3C1A2E053D763E1B002CC607C5A0FE"

example:

```js
  const name = 'object';
  const result = await store.initMultipartUpload(name);
  const uploadId = result.uploadId;
  const file; //the data you want to upload, is a File or FileName(only in node)
  //if file part is 10  
  const partSize = 100 * 1024;
  const fileSize = 10 * partSize;//you need to calculate
  const dones = [];
  for (let i = 1; i <= 10; i++) {
    const start = partSize * (i -1);
    const end = Math.min(start + partSize, fileSize);
    const part = await store.uploadPart(name, uploadId, i, file, start, end);
    dones.push({
      number: i,
      etag: part.etag
    });
    console.log(part);
  }

  //end need to call completeMultipartUpload api
```

### .uploadPartCopy(name, uploadId, partNo, range, sourceData[, options])
Using Upload Part Copy, you can copy data from an existing object and upload a part of the data.
When copying a file larger than 1 GB, you must use the Upload Part Copy method. If you want to copy a file smaller than 1 GB, see Copy Object.

parameters:

- name {String} object name
- uploadId {String} get by initMultipartUpload api
- partNo {Number} range is 1-10000, If this range is exceeded, OSS returns the InvalidArgument's error code.
- range {String} Multipart Upload requires that the size of any Part other than the last Part is greater than 100KB, range value like `0-102400`
- sourceData {Object}
  - sourceKey {String} the source object name
  - sourceBucketName {String} the source bucket name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout
  - [headers] {Object} The following request header is used for the source objects specified by x-oss-copy-source.
    - [x-oss-copy-source-if-match]  default none<br>
    If the ETAG value of the source object is equal to the ETAG value provided by the user, the system performs the Copy Object operation; otherwise, the system returns the 412 Precondition Failed message.
    - [x-oss-copy-source-if-none-match]   default none<br>
    If the source object has not been modified since the time specified by the user, the system performs the Copy Object operation; otherwise, the system returns the 412 Precondition Failed message.
    - [x-oss-copy-source-if-unmodified-since]   default none<br>
    If the time specified by the received parameter is the same as or later than the modification time of the file, the system transfers the file normally, and returns 200 OK; otherwise, the system returns 412 Precondition Failed.
    - [x-oss-copy-source-if-modified-since]   default none<br>
    If the source object has been modified since the time specified by the user, the system performs the Copy Object operation; otherwise, the system returns the 412 Precondition Failed message.

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)
- name {String} object name store on OSS
- etag {String} object etag contains ", e.g.: "5B3C1A2E053D763E1B002CC607C5A0FE"

example:

```js
  const name = 'object';
  const result = await store.initMultipartUpload(name);
 
  const partSize = 100 * 1024;//100kb 
  //if file part is 10
  for (let i = 1; i <= 10; i++) {
    const start = partSize * (i -1);
    const end = Math.min(start + partSize, fileSize);
    const range = start + '-' + (end - 1);
    const part = await store.uploadPartCopy(name, result.uploadId, i, range, {
      sourceKey: 'sourceKey',
      sourceBucketName: 'sourceBucketName'
    });
    console.log(part);
  }

  //end need complete api
```

### .completeMultipartUpload(name, uploadId, parts[, options])
After uploading all data parts, you must call the Complete Multipart Upload API to complete Multipart Upload for the entire file.

parameters:

- name {String} object name
- uploadId {String} get by initMultipartUpload api
- parts {Array} more part {Object} from uploadPartCopy, , each in the structure:
  - number {Number} partNo
  - etag {String} object etag contains ", e.g.: "5B3C1A2E053D763E1B002CC607C5A0FE"
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout
  - [callback] {Object} The callback parameter is composed of a JSON string encoded in Base64,detail [see](https://www.alibabacloud.com/help/doc-detail/31989.htm)<br>
    - url {String} After a file is uploaded successfully, the OSS sends a callback request to this URL.
    - [host] {String} The host header value for initiating callback requests.
    - body {String} The value of the request body when a callback is initiated, for example, key=$(key)&etag=$(etag)&my_var=$(x:my_var).
    - [contentType] {String} The Content-Type of the callback requests initiatiated, It supports application/x-www-form-urlencoded and application/json, and the former is the default value.
    - [customValue] {Object} Custom parameters are a map of key-values<br>
         e.g.:
        ```js
           var customValue = {var1: 'value1', var2: 'value2'}
        ```
  - [headers] {Object} extra headers, detail see [RFC 2616](http://www.w3.org/Protocols/rfc2616/rfc2616.html)


Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)
- bucket {String} bucket name
- name {String} object name store on OSS
- etag {String} object etag contains ", e.g.: "5B3C1A2E053D763E1B002CC607C5A0FE"
- data {Object} callback server response data , sdk use JSON.parse() return

example:

```js

  //init multipart
  const name = 'object';
  const result = await store.initMultipartUpload(name);
 
  //upload part
  const file; //the data you want to upload, this example size is 10 * 100 * 1024
  const fileSize;//you need to calculate
  const partSize = 100 * 1024;//100kb 
  const done = [];
  //if file part is 10
  for (let i = 1; i <= 10; i++) {
    const start = partSize * (i -1);
    const end = Math.min(start + partSize, fileSize);
    const data = file.slice(start, end);
    const part = yield store.uploadPart(name, result.uploadId, i, data);
    console.log(part);
    done.push({
          number: i,
          etag: part.res.headers.etag
        });
  }

  //complete
  const completeData = await store.completeMultipartUpload(name, result.uploadId, done);
  console.log(completeData);
```


### .multipartUpload(name, file[, options])

Upload file with [OSS multipart][oss-multipart].<br>
this function contains initMultipartUpload, uploadPart, completeMultipartUpload.

parameters:

- name {String} object name
- file {String|File(only support Browser)|Blob(only support Browser)} file path or HTML5 Web File or web Blob
- [options] {Object} optional args
  - [parallel] {Number} the number of parts to be uploaded in parallel
  - [partSize] {Number} the suggested size for each part
  - [progress] {Function} function | async | Promise, the progress callback called after each
    successful upload of one part, it will be given three parameters:
    (percentage {Number}, checkpoint {Object}, res {Object})
  - [checkpoint] {Object} the checkpoint to resume upload, if this is
    provided, it will continue the upload from where interrupted,
    otherwise a new multipart upload will be created.
    - file {File} The file object selected by the user, if the browser is restarted, it needs the user to manually trigger the settings
    - name {String} object key
    - fileSize {Number} file size
    - partSize {Number} part size
    - uploadId {String} upload id
    - doneParts {Array} An array of pieces that have been completed, including the object structure as follows
       - number {Number} part number
       - etag {String} part etag
  - [meta] {Object} user meta, will send with `x-oss-meta-` prefix string
  - [mime] {String} custom mime , will send with `Content-Type` entity header
  - [callback] {Object} The callback parameter is composed of a JSON string encoded in Base64,detail [see](https://www.alibabacloud.com/help/doc-detail/31989.htm)<br>
    - url {String} After a file is uploaded successfully, the OSS sends a callback request to this URL.
    - [host] {String} The host header value for initiating callback requests.
    - body {String} The value of the request body when a callback is initiated, for example, key=$(key)&etag=$(etag)&my_var=$(x:my_var).
    - [contentType] {String} The Content-Type of the callback requests initiatiated, It supports application/x-www-form-urlencoded and application/json, and the former is the default value.
    - [customValue] {Object} Custom parameters are a map of key-values<br>
          e.g.:
         ```js
           var customValue = {var1: 'value1', var2: 'value2'}
         ```
  - [headers] {Object} extra headers, detail see [RFC 2616](http://www.w3.org/Protocols/rfc2616/rfc2616.html)
    - 'Cache-Control' cache control for download, e.g.: `Cache-Control: public, no-cache`
    - 'Content-Disposition' object name for download, e.g.: `Content-Disposition: somename`
    - 'Content-Encoding' object content encoding for download, e.g.: `Content-Encoding: gzip`
    - 'Expires' expires time (milliseconds) for download, e.g.: `Expires: 3600000`
    - **NOTE**: Some headers are [disabled in browser][disabled-browser-headers]
  - [timeout] {Number} Milliseconds before a request is considered to be timed out

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)
- bucket {String} bucket name
- name name {String} object name store on OSS
- etag {String} object etag contains ", e.g.: "5B3C1A2E053D763E1B002CC607C5A0FE"
- data {Object} callback server response data, sdk use JSON.parse() return

example:

- Upload using multipart

```js
const result = await store.multipartUpload('object', '/tmp/file');
console.log(result);

const result = await store.multipartUpload('object', '/tmp/file', {
  parallel: 4,
  partSize: 1024 * 1024,
  progress: function (p, cpt, res) {
    console.log(p);
    console.log(cpt);
    console.log(res.headers['x-oss-request-id']);
  }
});

const result = await store.multipartUpload('object', '/tmp/file', {
  checkpoint: savedCpt,
  progress: function (p, cpt, res) { //progress is generator
    console.log(p);
    console.log(cpt);
    console.log(res.headers['x-oss-request-id']);
  }
});

```

- multipartUpload progress example

```js

//async function 
async function asyncProgress(p, cpt, res) {
    console.log(p);
    console.log(cpt);
    console.log(res.headers['x-oss-request-id']);
}

const result1 = await store.multipartUpload('object', '/tmp/file', {
  progress: asyncProgress
});

//function 
function progress(p, cpt, res) {
    console.log(p);
    console.log(cpt);
    console.log(res.headers['x-oss-request-id']);
}

const result2 = await store.multipartUpload('object', '/tmp/file', {
  progress: progress
});

```

- multipartUpload with cancel

>tips: cancel multipartUpload, now only support browser.

```js

//start upload
try {
  const result = await store.multipartUpload('object', '/tmp/file', {
    checkpoint: savedCpt,
    progress: function (p, cpt, res) {
      console.log(p);
      console.log(cpt);
      console.log(res.headers['x-oss-request-id']);
    }
  });
} catch (err) {
  //if cancel will catch cancel event
  if (store.isCancel()) {
    //do something
  }
}

//the other event to cancel, for example: click event
//to cancel upload must use the same client instance
store.cancel();

```

### .multipartUploadCopy(name, sourceData[, options])

Copy file with [OSS multipart][oss-multipart]. <br>
this function contains head, initMultipartUpload, uploadPartCopy, completeMultipartUpload.<br>
When copying a file larger than 1 GB, you should use the Upload Part Copy method. If you want to copy a file smaller than 1 GB, see Copy Object.

parameters:

- name {String} object name
- file {String|File} file path or HTML5 Web File
- [options] {Object} optional args
  - [timeout] {Number} Milliseconds before a request is considered to be timed out
  - [parallel] {Number} the number of parts to be uploaded in parallel
  - [partSize] {Number} the suggested size for each part
  - [progress] {Function} function | async | Promise, the progress callback called after each
    successful upload of one part, it will be given three parameters:
    (percentage {Number}, checkpoint {Object}, res {Object})
  - [checkpoint] {Object} the checkpoint to resume upload, if this is
    provided, it will continue the upload from where interrupted,
    otherwise a new multipart upload will be created.
  - [headers] {Object} extra headers, detail see [RFC 2616](http://www.w3.org/Protocols/rfc2616/rfc2616.html)
    - 'Cache-Control' cache control for download, e.g.: `Cache-Control: public, no-cache`
    - 'Content-Disposition' object name for download, e.g.: `Content-Disposition: somename`
    - 'Content-Encoding' object content encoding for download, e.g.: `Content-Encoding: gzip`
    - 'Expires' expires time (milliseconds) for download, e.g.: `Expires: 3600000`
    - **NOTE**: Some headers are [disabled in browser][disabled-browser-headers]
  - [copyheaders] {Object} only uploadPartCopy api used, detail [see](https://www.alibabacloud.com/help/doc-detail/31994.htm)
    - [x-oss-copy-source-if-match]  only uploadPartCopy api used, default none<br>
    If the ETAG value of the source object is equal to the ETAG value provided by the user, the system performs the Copy Object operation; otherwise, the system returns the 412 Precondition Failed message.
    - [x-oss-copy-source-if-none-match]  only uploadPartCopy api used, default none<br>
    If the source object has not been modified since the time specified by the user, the system performs the Copy Object operation; otherwise, the system returns the 412 Precondition Failed message.
    - [x-oss-copy-source-if-unmodified-since]  only uploadPartCopy api used, default none<br>
    If the time specified by the received parameter is the same as or later than the modification time of the file, the system transfers the file normally, and returns 200 OK; otherwise, the system returns 412 Precondition Failed.
    - [x-oss-copy-source-if-modified-since] only uploadPartCopy api used, default none<br>
    If the source object has been modified since the time specified by the user, the system performs the Copy Object operation; otherwise, the system returns the 412 Precondition Failed message.

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)
- bucket {String} bucket name
- name name {String} object name store on OSS
- etag {String} object etag contains ", e.g.: "5B3C1A2E053D763E1B002CC607C5A0FE"

example:

- Copy using multipart

```js
const result = await store.multipartUploadCopy('object', {
  sourceKey: 'sourceKey',
  sourceBucketName: 'sourceBucketName'
});
console.log(result);

const result = await store.multipartUploadCopy('object', {
  sourceKey: 'sourceKey',
  sourceBucketName: 'sourceBucketName'
}, {
  parallel: 4,
  partSize: 1024 * 1024,
  progress: function (p, cpt, res) {
    console.log(p);
    console.log(cpt);
    console.log(res.headers['x-oss-request-id']);
  }
});

console.log(result);

const result = await store.multipartUploadCopy('object', {
  sourceKey: 'sourceKey',
  sourceBucketName: 'sourceBucketName'
}, {
  checkpoint: savedCpt,
  progress: function (p, cpt, res) {
    console.log(p);
    console.log(cpt);
    console.log(res.headers['x-oss-request-id']);
  }
});

console.log(result);

```
- multipartUploadCopy with cancel

```js

//start upload
try {
  const result = await store.multipartUploadCopy('object', {
    sourceKey: 'sourceKey',
    sourceBucketName: 'sourceBucketName'
  }, {
    checkpoint: savedCpt,
    progress: function (p, cpt, res) {
      console.log(p);
      console.log(cpt);
      console.log(res.headers['x-oss-request-id']);
    }
  });
} catch (err) {
  //if cancel will catch cancel event
  if (store.isCancel()) {
    //do something
  }
}

//the other event to cancel, for example: click event
//to cancel upload must use the same client instance
store.cancel();

```

### .listParts(name, uploadId[, query, options])

The ListParts command can be used to list all successfully uploaded parts mapped to a specific upload ID, i.e.: those not completed and not
aborted.

parameters:

- name {String} object key
- uploadId {String} upload ID from initMultipartUpload api
- [query] {Object} query parameters
  - [max-parts] {Number} The maximum part number in the response of the OSS. default value: 1000.
  - [part-number-marker] {Number} Starting position of a specific list. A part is listed only when the part number is greater than the value of this parameter.
  - [encoding-type] {String} Specify the encoding of the returned content and the encoding type. Optional value: url
- [options] {Object} optional args
  - [timeout] {Number} the operation timeout

Success will return:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)
- uploadId {String} upload ID
- bucket {String} Specify the bucket name.
- name {String} object name
- PartNumberMarker {Number} Starting position of the part numbers in the listing result.
- nextPartNumberMarker {Number} If not all results are returned this time, the response request includes the NextPartNumberMarker element to indicate the value of PartNumberMarker in the next request.
- maxParts {Number} upload ID
- isTruncated {Boolean} Whether the returned result list for List Parts is truncated. The “true” indicates that not all results are returned; “false” indicates that all results are returned.
- parts {Array} The container that saves part information, each in the structure:
  - PartNumber {Number} Part number.
  - LastModified {Date} Time when a part is uploaded.
  - ETag {String} ETag value in the content of the uploaded part.
  - Size {Number} Size of the uploaded part.

example:

- List uploaded part

```js

const result = await store.listParts('objcet', 'uploadId', {
  'max-parts': 1000
});
console.log(result);
```

### .listUploads(query[, options])

List on-going multipart uploads, i.e.: those not completed and not
aborted.

parameters:

- query {Object} query parameters
  - [prefix] {String} the object key prefix
  - [max-uploads] {Number} the max uploads to return
  - [key-marker] {String} the object key marker, if `upload-id-marker`
    is not provided, return uploads with `key > marker`, otherwise
    return uploads with `key >= marker && uploadId > id-marker`
  - [upload-id-marker] {String} the upload id marker, must be used
    **WITH** `key-marker`
- [options] {Object} optional args
  - [timeout] {Number} the operation timeout

example:

- List on-going multipart uploads

```js

const result = await store.listUploads({
  'max-uploads': 100,
  'key-marker': 'my-object',
  'upload-id-marker': 'upload-id'
});
console.log(result);
```

### .abortMultipartUpload(name, uploadId[, options])

Abort a multipart upload for object.

parameters:

- name {String} the object name
- uploadId {String} the upload id
- [options] {Object} optional args
  - [timeout] {Number} the operation timeout

example:

- Abort a multipart upload

```js
const result = await store.abortMultipartUpload('object', 'upload-id');
console.log(result);
```

## RTMP Operations

All operations function is [async], except `getRtmpUrl`.

async function format: `async functionName(...)`.

### .putChannel(id, conf[, options])

Create a live channel.

parameters:

- id {String} the channel id
- conf {Object} the channel config
  - [Description] {String} the channel description
  - [Status] {String} the channel status: 'enabled' or 'disabled'
  - [Target] {Object}
    - [Type] {String} the data type for the channel, only 'HLS' is supported now
    - [FragDuration] {Number} duration of a 'ts' segment
    - [FragCount] {Number} the number of 'ts' segments in a 'm3u8'
    - [PlaylistName] {String} the 'm3u8' name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the channel information.

object:

- publishUrls {Array} the publish urls
- playUrls {Array} the play urls
- res {Object} response info

example:

- Create a live channel

```js
const cid = 'my-channel';
const conf = {
  Description: 'this is channel 1',
  Status: 'enabled',
  Target: {
    Type: 'HLS',
    FragDuration: '10',
    FragCount: '5',
    PlaylistName: 'playlist.m3u8'
  }
};

const r = await this.store.putChannel(cid, conf);
console.log(r);
```

### .getChannel(id[, options])

Get live channel info.

parameters:

- id {String} the channel id
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the channel information.

object:

- data {Object} channel info, same as conf in [.putChannel](#putchannelid-conf-options)
- res {Object} response info

example:

- Get live channel info

```js
const cid = 'my-channel';

const r = await this.store.getChannel(cid);
console.log(r);
```

### .deleteChannel(id[, options])

Delete a live channel.

parameters:

- id {String} the channel id
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the response infomation.

object:

- res {Object} response info

example:

- Delete a live channel

```js
const cid = 'my-channel';

const r = await this.store.deleteChannel(cid);
console.log(r);
```

### .putChannelStatus(id, status[, options])

Change the live channel status.

parameters:

- id {String} the channel id
- status {String} the status: 'enabled' or 'disabled'
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the response information.

object:

- res {Object} response info

example:

- Disable a live channel

```js
const cid = 'my-channel';

const r = await this.store.putChannelStatus(cid, 'disabled');
console.log(r);
```

### .getChannelStatus(id[, options])

Get the live channel status.

parameters:

- id {String} the channel id
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the channel status information.

object:

- data {Object}
  - Status {String} the channel status: 'Live' or 'Idle'
  - [ConnectedTime] {String} the connected time of rtmp pushing
  - [RemoteAddr] {String} the remote addr of rtmp pushing
  - [Video] {Object} the video parameters (Width/Height/FrameRate/Bandwidth/Codec)
  - [Audio] {Object} the audio parameters (Bandwidth/SampleRate/Codec)
- res {Object} response info

example:

- Get a live channel status

```js
const cid = 'my-channel';

const r = await this.store.getChannelStatus(cid);
console.log(r);

// { Status: 'Live',
//   ConnectedTime: '2016-04-12T11:51:03.000Z',
//   RemoteAddr: '42.120.74.98:53931',
//   Video:
//   { Width: '672',
//     Height: '378',
//     FrameRate: '29',
//     Bandwidth: '60951',
//     Codec: 'H264' },
//   Audio: { Bandwidth: '5959', SampleRate: '22050', Codec: 'AAC' }
// }
```

### .listChannels(query[, options])

List channels.

parameters:

- query {Object} parameters for list
  - prefix {String}: the channel id prefix (returns channels with this prefix)
  - marker {String}: the channle id marker (returns channels after this id)
  - max-keys {Number}: max number of channels to return
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the channel list.

object:

- channels {Array} the channels, each in the structure:
  - Name {String} the channel id
  - Description {String} the channel description
  - Status {String} the channel status
  - LastModified {String} the last modification time of the channel
  - PublishUrls {Array} the publish urls for the channel
  - PlayUrls {Array} the play urls for the channel
- nextMarker: result.data.NextMarker || null,
- isTruncated: result.data.IsTruncated === 'true'
- res {Object} response info

example:

- List live channels

```js
const r = await this.store.listChannels({
  prefix: 'my-channel',
  'max-keys': 3
});
console.log(r);
```

### .getChannelHistory(id[, options])

Get the live channel history.

parameters:

- id {String} the channel id
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the history information.

object:

- records {Object} the pushing records, each in the structure:
  - StartTime {String} the start time
  - EndTime {String} the end time
  - RemoteAddr {String} the remote addr
- res {Object} response info

example:

- Get the live channel history

```js
const cid = 'my-channel';

const r = await this.store.getChannelHistory(cid);
console.log(r);
```

### .createVod(id, name, time[, options])

Create a VOD playlist for the channel.

parameters:

- id {String} the channel id
- name {String} the playlist name
- time {Object} the duration time
  - startTime {Number} the start time in epoch seconds
  - endTime {Number} the end time in epoch seconds
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the response information.

object:

- res {Object} response info

example:

- Create a vod playlist of a live channel

```js
const cid = 'my-channel';

const r = await this.store.createVod(cid, 're-play', {
  startTime: 1460464870,
  endTime: 1460465877
});
console.log(r);
```

### .getRtmpUrl(channelId[, options])

Get signatured rtmp url for publishing.

parameters:

- channelId {String} the channel id
- [options] {Object} optional parameters
  - [expires] {Number} the expire time in seconds of the url
  - [params] {Object} the additional paramters for url, e.g.: {playlistName: 'play.m3u8'}
  - [timeout] {Number} the operation timeout

Success will return the rtmp url.

example:

- Get a rtmp url.

```js
const cid = 'my-channel';

const url = this.store.getRtmpUrl(this.cid, {
  params: {
    playlistName: 'play.m3u8'
  },
  expires: 3600
});
console.log(url);
// rtmp://ossliveshow.oss-cn-hangzhou.aliyuncs.com/live/tl-channel?OSSAccessKeyId=T0cqQWBk2ThfRS6m&Expires=1460466188&Signature=%2BnzTtpyxUWDuQn924jdS6b51vT8%3D
```

## Create A Image Service Instance

Each Image Service instance required `accessKeyId`, `accessKeySecret`, `bucket` and `imageHost`.

### oss.ImageClient(options)

Create a Image service instance.

options:
- imageHost {String} your image service domain that binding to a OSS bucket
- accessKeyId {String} access key you create on aliyun console website
- accessKeySecret {String} access secret you create
- bucket {String} the default bucket you want to access
  If you don't have any bucket, please use `putBucket()` create one first.
- [region] {String} the bucket data region location, please see [Data Regions](#data-regions),
  default is `oss-cn-hangzhou`
  Current available: `oss-cn-hangzhou`, `oss-cn-qingdao`, `oss-cn-beijing`, `oss-cn-hongkong` and `oss-cn-shenzhen`
- [internal] {Boolean} access OSS with aliyun internal network or not, default is `false`
  If your servers are running on aliyun too, you can set `true` to save lot of money.
- [timeout] {String|Number} instance level timeout for all operations, default is `60s`

example:

```js
const oss = require('ali-oss');

const imgClient = oss.ImageClient({
  accessKeyId: 'your access key',
  accessKeySecret: 'your access secret',
  bucket: 'my_image_bucket'
  imageHost: 'thumbnail.myimageservice.com'
});
```

## Image Operations

All operations function is [async], except `imgClient.signatureUrl`.

async function format: `async functionName(...)`.

### imgClient.get(name, file[, options])

Get an image from the image channel.

parameters:

- name {String} image object name with operation style store on OSS
- [file] {String|WriteStream} file path or WriteStream instance to store the image
  If `file` is null or ignore this parameter, function will return info contains `content` property.
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout
  - [headers] {Object} extra headers, detail see [RFC 2616](http://www.w3.org/Protocols/rfc2616/rfc2616.html)
    - 'If-Modified-Since' object modified after this time will return 200 and object meta,
        otherwise return 304 not modified
    - 'If-Unmodified-Since' object modified before this time will return 200 and object meta,
        otherwise throw PreconditionFailedError
    - 'If-Match' object etag equal this will return 200 and object meta,
        otherwise throw PreconditionFailedError
    - 'If-None-Match' object etag not equal this will return 200 and object meta,
        otherwise return 304 not modified

Success will return the info contains response.

object:

- [content] {Buffer} file content buffer if `file` parameter is null or ignore
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

If object not exists, will throw NoSuchKeyError.

example:

- Get an exists image with a style and store it to the local file

```js
const imagepath = '/home/ossdemo/demo.jpg';
await imgClient.get('ossdemo/demo.jpg@200w_200h', filepath);
```

_ Store image to a writestream

```js
await imgClient.get('ossdemo/demo.jpg@200w_200h', somestream);
```

- Get an image content buffer

```js
const result = await imgClient.get('ossdemo/demo.jpg@200w_200h');
console.log(Buffer.isBuffer(result.content));
```

- Get a not exists object or a not image object

```js
const imagepath = '/home/ossdemo/demo.jpg';
await imgClient.get('ossdemo/not-exists-demo.jpg@200w_200h', filepath);
// will throw NoSuchKeyError
```

### imgClient.getStream(name[, options])

Get an image read stream.

parameters:

- name {String} image object name with operation style store on OSS
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout
  - [headers] {Object} extra headers
    - 'If-Modified-Since' object modified after this time will return 200 and object meta,
        otherwise return 304 not modified
    - 'If-Unmodified-Since' object modified before this time will return 200 and object meta,
        otherwise throw PreconditionFailedError
    - 'If-Match' object etag equal this will return 200 and object meta,
        otherwise throw PreconditionFailedError
    - 'If-None-Match' object etag not equal this will return 200 and object meta,
        otherwise return 304 not modified

Success will return the stream instance and response info.

object:

- stream {ReadStream} readable stream instance
    if response status is not 200, stream will be `null`.
- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)

If object not exists, will throw NoSuchKeyError.

example:

- Get an exists image object stream

```js
const result = await imgClient.getStream('ossdemo/demo.jpg@200w_200h');
result.stream.pipe(fs.createWriteStream('some demo.jpg'));
```

### imgClient.getExif(name[, options])

Get a image exif info by image object name from the image channel.

parameters:
- name {String} image object name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the info contains response.

object:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)
- data {Object} image exif object

If object don't have exif, will throw 400 BadRequest.

example:

```js
const result = await imgClient.getExif('demo.jpg');
// resut:
// {
//   res: {
//     status: 200,
//     statusCode: 200,
//     headers: {
//       server: "Tengine",
//       content - type: "application/json",
//       content - length: "148",
//       connection: "keep-alive",
//       date: "Tue, 31 Mar 2015 11:06:32 GMT",
//       "last-modified": "Mon, 30 Mar 2015 10:46:35 GMT"
//     },
//     size: 148,
//     aborted: false,
//     rt: 461,
//     keepAliveSocket: false
//   },
//   data: {
//     FileSize: 343683,
//     ImageHeight: 1200,
//     ImageWidth: 1600,
//     Orientation: 1
//   }
// }

```

### imgClient.getInfo(name[, options])

Get a image info and exif info by image object name from the image channel.

parameters:
- name {String} image object name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the info contains response.

object:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)
- data {Object} image exif object

example:

```js
const result = await imgClient.getInfo('demo.jpg');
// resut:
// {
//   res: {
//     status: 200,
//     statusCode: 200,
//     headers: {
//       server: "Tengine",
//       content - type: "application/json",
//       content - length: "148",
//       connection: "keep-alive",
//       date: "Tue, 31 Mar 2015 11:06:32 GMT",
//       "last-modified": "Mon, 30 Mar 2015 10:46:35 GMT"
//     },
//     size: 148,
//     aborted: false,
//     rt: 461,
//     keepAliveSocket: false
//   },
//   data: {
//     FileSize: 343683,
//     Format: "jpg",
//     ImageHeight: 1200,
//     ImageWidth: 1600,
//     Orientation: 1
//   }
// }

```


### imgClient.putStyle(name, style[, options])
// TODO

### imgClient.getStyle(name[, options])

Get a style by name from the image channel.

parameters:
- name {String} image style name
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the info contains response.

object:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)
- data {Object} styles object
  - Name {String} style name
  - Content {String} style content
  - CreateTime {String} style create time
  - LastModifyTime {String} style last modify time

example:

```js
const result = await imgClient.getStyle('400');
// resut:
// {
//   res: {
//     status: 200,
//     statusCode: 200,
//     headers: {
//       server: "Tengine",
//       content - type: "application/xml",
//       content - length: "234",
//       connection: "keep-alive",
//       date: "Tue, 31 Mar 2015 10:58:20 GMT"
//     },
//     size: 234,
//     aborted: false,
//     rt: 398,
//     keepAliveSocket: false
//   },
//   data: {
//     Name: "400",
//     Content: "400w_90Q_1x.jpg",
//     CreateTime: "Thu, 19 Mar 2015 08:34:21 GMT",
//     LastModifyTime: "Thu, 19 Mar 2015 08:34:21 GMT"
//   }
// }
```

### imgClient.listStyle([options])

Get all styles from the image channel.

parameters:
- [options] {Object} optional parameters
  - [timeout] {Number} the operation timeout

Success will return the info contains response.

object:

- res {Object} response info, including
  - status {Number} response status
  - headers {Object} response headers
  - size {Number} response size
  - rt {Number} request total use time (ms)
- data {Array} styles array, a style object:
  - Name {String} style name
  - Content {String} style content
  - CreateTime {String} style create time
  - LastModifyTime {String} style last modify time

example:

```js
const result = await imgClient.listStyle();
// resut:
// {
//   res: {
//     status: 200,
//     statusCode: 200,
//     headers: {
//       server: "Tengine",
//       content - type: "application/xml",
//       content - length: "913",
//       connection: "keep-alive",
//       date: "Tue, 31 Mar 2015 10:47:32 GMT"
//     },
//     size: 913,
//     aborted: false,
//     rt: 1911,
//     keepAliveSocket: false
//   },
//   data: [{
//     Name: "200-200",
//     Content: "0e_200w_200h_0c_0i_0o_90Q_1x.jpg",
//     CreateTime: "Thu, 19 Mar 2015 08:28:08 GMT",
//     LastModifyTime: "Thu, 19 Mar 2015 08:28:08 GMT"
//   }, {
//     Name: "800",
//     Content: "800w_90Q_1x.jpg",
//     CreateTime: "Thu, 19 Mar 2015 08:29:15 GMT",
//     LastModifyTime: "Thu, 19 Mar 2015 08:29:15 GMT"
//   }, {
//     Name: "400",
//     Content: "400w_90Q_1x.jpg",
//     CreateTime: "Thu, 19 Mar 2015 08:34:21 GMT",
//     LastModifyTime: "Thu, 19 Mar 2015 08:34:21 GMT"
//   }, {
//     Name: "600",
//     Content: "600w_90Q_1x.jpg",
//     CreateTime: "Thu, 19 Mar 2015 08:35:02 GMT",
//     LastModifyTime: "Thu, 19 Mar 2015 08:35:02 GMT"
//   }]
// }
```

### imgClient.deleteStyle(name[, options])
// TODO

### imgClient.signatureUrl(name)

Create a signature url for directly download.

parameters:

- name {String} image object name with operation style store on OSS
- [options] {Object} optional parameters
  - [expires] {Number} after expires seconds, the url will become invalid, default is `1800`
  - [timeout] {Number} the operation timeout

Success will return full signature url.

example:

```js
const url = imgClient.signatureUrl('
');
// http://thumbnail.myimageservice.com/demo.jpg@200w_200h?OSSAccessKeyId=uZxyLARzYZtGwHKY&Expires=1427803849&Signature=JSPRe06%2FjQpQSj5zlx2ld1V%2B35I%3D
```

## Cluster Mode

Cluster mode now only support object operations.

```js
const Cluster = require('ali-oss').ClusterClient;

const client = Cluster({
  cluster: [{
    host: 'host1',
    accessKeyId: 'id1',
    accessKeySecret: 'secret1'
  }, {
    host: 'host2',
    accessKeyId: 'id2',
    accessKeySecret: 'secret2'
  }],
  schedule: 'masterSlave', //default is `roundRobin`
});

// listen error event to logging error
client.on('error', function(err) {
  console.error(err.stack);
});

// client init ready
client.ready(function() {
  console.log('cluster client init ready, go ahead!');
});
```

### Get Methods

Will choose an alive client by schedule(`masterSlave` or `roundRobin`).

- `client.get()`
- `client.head()`
- `client.getStream()`
- `client.list()`
- `client.signatureUrl()`
- `client.chooseAvailable()` - choose an available client by schedule.
- `client.getACL()`

### Put Methods

Will put to all clients.

- `client.put()`
- `client.putStream()`
- `client.delete()`
- `client.deleteMulti()`
- `client.copy()`
- `client.putMeta()`
- `client.putACL()`
- `client.restore()`

## Known Errors

Each error return by OSS server will contains these properties:

- name {String} error name
- message {String} error message
- requestId {String} uuid for this request, if you meet some unhandled problem,
    you can send this request id to OSS engineer to find out what's happend.
- hostId {String} OSS cluster name for this request

name | code | status | message | message in Chinese
---  | ---  | --- | ---     | ---
AccessDeniedError | AccessDenied | 403 | Access Denied | 拒绝访问
BucketAlreadyExistsError | BucketAlreadyExists | 409 | Bucket already exists | Bucket 已经存在
BucketNotEmptyError | BucketNotEmpty | 409 | Bucket is not empty | Bucket 不为空
RestoreAlreadyInProgressError | RestoreAlreadyInProgress | 409 | The restore operation is in progress. | restore 操作正在进行中
OperationNotSupportedError | OperationNotSupported | 400 | The operation is not supported for this resource | 该资源暂不支持restore操作
EntityTooLargeError | EntityTooLarge | 400 | Entity too large | 实体过大
EntityTooSmallError | EntityTooSmall | 400 | Entity too small | 实体过小
FileGroupTooLargeError | FileGroupTooLarge | 400 | File group too large | 文件组过大
InvalidLinkNameError | InvalidLinkName | 400 | Link name can't be the same as the object name | Object Link 与指向的 Object 同名
LinkPartNotExistError | LinkPartNotExist | 400 | Can't link to not exists object | Object Link 中指向的 Object 不存在
ObjectLinkTooLargeError | ObjectLinkTooLarge | 400 | Too many links to this object | Object Link 中 Object 个数过多
FieldItemTooLongError | FieldItemTooLong | 400 | Post form fields items too large | Post 请求中表单域过大
FilePartInterityError | FilePartInterity | 400 | File part has changed | 文件 Part 已改变
FilePartNotExistError | FilePartNotExist | 400 | File part not exists | 文件 Part 不存在
FilePartStaleError | FilePartStale| 400 | File part stale | 文件 Part 过时
IncorrectNumberOfFilesInPOSTRequestError | IncorrectNumberOfFilesInPOSTRequest | 400 | Post request contains invalid number of files | Post 请求中文件个数非法
InvalidArgumentError | InvalidArgument | 400 | Invalid format argument | 参数格式错误
InvalidAccessKeyIdError | InvalidAccessKeyId | 400 | Access key id not exists | Access Key ID 不存在
InvalidBucketNameError | InvalidBucketName | 400 | Invalid bucket name | 无效的 Bucket 名字
InvalidDigestError | InvalidDigest | 400 | Invalid digest | 无效的摘要
InvalidEncryptionAlgorithmError | InvalidEncryptionAlgorithm | 400 | Invalid encryption algorithm | 指定的熵编码加密算法错误
InvalidObjectNameError | InvalidObjectName | 400 | Invalid object name | 无效的 Object 名字
InvalidPartError | InvalidPart | 400 | Invalid part | 无效的 Part
InvalidPartOrderError | InvalidPartOrder | 400 | Invalid part order | 无效的 part 顺序
InvalidPolicyDocumentError | InvalidPolicyDocument | 400 | Invalid policy document | 无效的 Policy 文档
InvalidTargetBucketForLoggingError | InvalidTargetBucketForLogging | 400 | Invalid bucket on logging operation | Logging 操作中有无效的目标 bucket
InternalError | Internal | 500 | OSS server internal error | OSS 内部发生错误
MalformedXMLError | MalformedXML | 400 | Malformed XML format | XML 格式非法
MalformedPOSTRequestError | MalformedPOSTRequest | 400 | Invalid post body format | Post 请求的 body 格式非法
MaxPOSTPreDataLengthExceededError | MaxPOSTPreDataLengthExceeded | 400 | Post extra data too large | Post 请求上传文件内容之外的 body 过大
MethodNotAllowedError | MethodNotAllowed | 405 | Not allowed method | 不支持的方法
MissingArgumentError | MissingArgument | 411 | Missing argument | 缺少参数
MissingContentLengthError | MissingContentLength | 411 | Missing `Content-Length` header | 缺少内容长度
NoSuchBucketError | NoSuchBucket | 404 | Bucket not exists | Bucket 不存在
NoSuchKeyError | NoSuchKey | 404 | Object not exists | 文件不存在
NoSuchUploadError | NoSuchUpload | 404 | Multipart upload id not exists | Multipart Upload ID 不存在
NotImplementedError | NotImplemented | 501 | Not implemented | 无法处理的方法
PreconditionFailedError | PreconditionFailed | 412 | Pre condition failed | 预处理错误
RequestTimeTooSkewedError | RequestTimeTooSkewed | 403 | Request time exceeds 15 minutes to server time | 发起请求的时间和服务器时间超出 15 分钟
RequestTimeoutError | RequestTimeout | 400 | Request timeout | 请求超时
RequestIsNotMultiPartContentError | RequestIsNotMultiPartContent | 400 | Invalid post content-type | Post 请求 content-type 非法
SignatureDoesNotMatchError | SignatureDoesNotMatch | 403 | Invalid signature | 签名错误
TooManyBucketsError | TooManyBuckets | 400 | Too many buckets on this user | 用户的 Bucket 数目超过限制
RequestError | RequestError | -1 | network error | 网络出现中断或异常
ConnectionTimeoutError | ConnectionTimeoutError | -2 | request connect timeout | 请求连接超时
SecurityTokenExpiredError | SecurityTokenExpired | 403 | sts Security Token Expired | sts Security Token 超时失效

[generator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*
[oss-sts]: https://help.aliyun.com/document_detail/oss/practice/ram_guide.html
[browser-sample]: https://github.com/rockuw/oss-in-browser
[oss-multipart]: https://help.aliyun.com/document_detail/oss/api-reference/multipart-upload/InitiateMultipartUpload.html
[disabled-browser-headers]: https://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader%28%29-method
