# OSS in Browser

Play with OSS right in the browser!

![Demo](screenshot.png?raw=true "OSS in Browser")

## Browser support

- IE >= 10 & Edge
- Major versions of Chrome/Firefox/Safari
- Major versions of Android/iOS/WP

## Setup

### Bucket setup

As browser-side javascript involves CORS operations. You need to setup
your bucket CORS rules to allow CORS operations:

- set allowed origins to '*'
- allowed methods to 'PUT, GET, POST, DELETE, HEAD'
- set allowed headers to '*'
- expose 'ETag' in expose headers

### STS setup

As we don't want to expose the accessKeyId/accessKeySecret in the
browser, a [common practice][oss-sts] is to use STS to grant temporary
access.

### App setup

Fill in your appServer address and bucket name in `app.js`:

```js
var appServer = '<your STS app server>';
var bucket = '<your bucket name>';
var region = 'oss-cn-hangzhou';
```

Build the JS file

```
    npm install && webpack
``` 


Then set env and start the server

```
   ALI_SDK_STS_ID={your sts accessKeyId} ALI_SDK_STS_SECRET={your sts accessKeySecret} ALI_SDK_STS_ROLE={your rolearn} node server/app.js
```

Open the `http://localhost:3000` in browser


[node-sts-app-server]: https://github.com/rockuw/node-sts-app-server
[oss-sts]: https://help.aliyun.com/document_detail/oss/practice/ram_guide.html
