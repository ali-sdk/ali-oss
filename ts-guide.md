### Installation
```bash
yarn add ali-oss
# or
npm install ali-oss
```

### Quick start
```javascript
import { Client, put, get } from 'ali-oss/es'

const config = {
  accessKeyId: 'your access key id',
  accessKeySecret: 'your access key secret',
  bucket: 'your bucket',
  region: 'oss-cn-hangzhou'
}

// before use
Client.use(put, get);

const client = new Client(config);

const uploadName = 'test.txt'
const file =  new File(["foo"], "foo.txt", {
	type: "text/plain",
})

client.put(uploadName, file).then(
  client.get(uploadName).then(res => {
    console.log(res.content.toString) // foo
  })
)

```
### Support


```javascript
multipartUpload/putStream/put/abortBucketWorm/completeBucketWorm/deleteBucketLifecycle/deleteBucketCORS/deleteBucket/deleteBucketPolicy/deleteBucketEncryption/deleteBucketLogging/deleteBucketReferer/deleteBucketTags/extendBucketWorm/deleteBucketWebsite/getBucketACL/getBucketCORS/getBucketEncryption/getBucketInfo/getBucketLifecycle/getBucketPolicy/getBucketLogging/getBucketLocation/getBucketReferer/getBucketTags/getBucketRequestPayment/getBucketVersioning/getBucketWebsite/getBucketWorm/initiateBucketWorm/putBucketACL/listBuckets/putBucket/putBucketCORS/putBucketEncryption/putBucketPolicy/putBucketLifecycle/putBucketReferer/putBucketLogging/putBucketRequestPayment/putBucketVersioning/putBucketTags/putBucketWebsite/processObjectSave/abortMultipartUpload/handleUploadPart/listParts/completeMultipartUpload/listUploads/initMultipartUpload/multipartUploadCopy/resumeMultipart/uploadPart/uploadPartCopy/append/calculatePostSignature/copy/deleteMulti/deleteObject/deleteObjectTagging/generateObjectUrl/getACL/get/getAsyncFetch/getBucketVersions/getObjectMeta/getObjectTagging/getObjectUrl/getSymlink/head/list/postAsyncFetch/putACL/putMeta/putObjectTagging/restore/putSymlink/signatureUrl
```
