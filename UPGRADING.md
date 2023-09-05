# @!title Upgrading Notes (5.x to 6.x)

# Upgrading Notes (5.x to 6.x)

No matter how it changes, the api will never change. In order to give developers a better experience, we just change the way that the client use. This document captures breaking changes from 5.x versions to the first
stable 6.x (non-RC) release of the Aliyun SDK for JavaScript.

## 1. Remove Region Param for All Bucket Operations

For all the bucket operation ,including putBucket、deleteBucket、getBucketInfo、 getBucketLoaction、
putBucketACL、gitBucketACL、 putBucketLogging、 getBucketLogging、 deleteBucketLogging、 putBucketWebsite、
getBucketWebsite、deleteBucketWebsite putBucketReferer getBucketReferer etc.

Upgrading example

The following 1.x code, eg deleteBucket

```
const OSS = require('ali-oss');

const Client = new OSS(...);

Client.deleteBucket(bucket,region);
```

Should be changed to the following:

```
const OSS = require('ali-oss');

const Client = new OSS(...);

Client.deleteBucket(bucket);
```

## 2. `Async Await` instead of `generator` Operation In Internal Code

We use `Async Await` to refactor all api 、test case etc to instead of `co generator`。
it can optimize our code to maintain and provide with a better development experience for developers

## 3. Dropped `OSS.Wrapper` When Init Client

Before in async opearion we use `OSS.Wrapper` ,but now we just use `new OSS()` ,it will return Promise like `OSS.Wrapper`,please remove `Wrapper`.

Upgrading example

The following 5.x code:

```
const OSS = require('ali-oss');
const client = new OSS.Wrapper({
  accessKeyId: xxx,
  accessKeySecret: xxx,
  region: xxx
  bucket: bucketName
})

client.operation(...).then(...).catch(...);
```

Should be changed to the following:

```
const OSS = require('ali-oss');

const client = new OSS({
  accessKeyId: xxx,
  accessKeySecret: xxx,
  region: xxx
  bucket: bucketName
})

client.operation(...).then(...).catch(...);
```

## 4.Support Cancel Operion For Node SDK When Upload File

Should be used like:

```
cosnt OSS = require('ali-oss');

const client = new OSS({
  accessKeyId: xxx,
  accessKeySecret: xxx,
  region: 'xxx',
  bucket: bucketName
});

// use bucket
client.useBucket(bucketName);

// progress
const progress = async function progress(p, checkpoint) {
  console.log(p);
};

const filePath = './resource/X.zip';

const options = {
  progress,
  partSize: 100 * 1024,
  meta: {
    year: 2017,
    people: 'test',
  },
};
//upload local file
async function upload() {
  try {
    const result = await client.multipartUpload('bilibili/hahhh', filePath, options);
  } catch (e) {
    if (client.isCancel()) {
      console.log('canceled!');
      // do
    } else {
      // do
    }
  }
}
upload();
// after 3s cancel
setTimeout(() => {
  client.cancel();
}, 3000);
```
