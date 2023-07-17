# OSS in Browser

Play with OSS right in the browser!

<image src="https://img.alicdn.com/tfs/TB1tE5mvTtYBeNjy1XdXXXXyVXa-2538-1386.png" width="1000" height="500"/>

## Browser support

- IE >= 10 & Edge
- Major versions of Chrome/Firefox/Safari
- Major versions of Android/iOS/WP

## Setup

### Bucket setup

As browser-side javascript involves CORS operations. You need to setup
your bucket CORS rules to allow CORS operations:

- set allowed origins to '\*'
- allowed methods to 'PUT, GET, POST, DELETE, HEAD'
- set allowed headers to '\*'
- expose 'ETag' in expose headers

### STS setup

As we don't want to expose the accessKeyId/accessKeySecret in the
browser, a [common practice][oss-sts] is to use STS to grant temporary
access.

### App setup

Fill in your bucket name and region in `main.js`: (Note: ensure port 9000 is not used)

```js
var bucket = '<your bucket name>';
var region = 'oss-cn-hangzhou';
```

Start the server

```
cross-env \
ALI_SDK_STS_ID={your sts accessKeyId} \
ALI_SDK_STS_SECRET={your sts accessKeySecret} \
ALI_SDK_STS_ROLE={your rolearn} \
npm run start
```

Open the `http://localhost:3000` in browser

[node-sts-app-server]: https://github.com/rockuw/node-sts-app-server
[oss-sts]: https://help.aliyun.com/document_detail/oss/practice/ram_guide.html
