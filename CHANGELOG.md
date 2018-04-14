# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="4.15.0"></a>
# [4.15.0](https://github.com/aliyun/oss-nodejs-sdk/compare/4.14.2...4.15.0) (2018-04-14)


### Features

* cluster mode support acl ([#440](https://github.com/aliyun/oss-nodejs-sdk/issues/440)) ([558e543](https://github.com/aliyun/oss-nodejs-sdk/commit/558e543))



<a name="4.13.2"></a>
## [4.13.2](https://github.com/aliyun/oss-nodejs-sdk/compare/v4.13.1...v4.13.2) (2018-03-13)


### Bug Fixes

* change timeout default value to 60s ([fcb8847](https://github.com/aliyun/oss-nodejs-sdk/commit/fcb8847))



<a name="4.13.1"></a>
## [4.13.1](https://github.com/aliyun/oss-nodejs-sdk/compare/v4.13.0...v4.13.1) (2018-03-11)


### Bug Fixes

* fix bug about value of requestTimeout! ([#383](https://github.com/aliyun/oss-nodejs-sdk/issues/383)) ([a3653a7](https://github.com/aliyun/oss-nodejs-sdk/commit/a3653a7))



<a name="4.13.0"></a>
# [4.13.0](https://github.com/aliyun/oss-nodejs-sdk/compare/4.12.1...4.13.0) (2018-03-07)


### Bug Fixes

* add any-promise dependencies ([#381](https://github.com/aliyun/oss-nodejs-sdk/issues/381)) ([366257a](https://github.com/aliyun/oss-nodejs-sdk/commit/366257a))
* move 'stream-http' to devDependencies ([7c4f330](https://github.com/aliyun/oss-nodejs-sdk/commit/7c4f330))
* userAgent with alpha and beta ([#373](https://github.com/aliyun/oss-nodejs-sdk/issues/373)) ([367521b](https://github.com/aliyun/oss-nodejs-sdk/commit/367521b))


### Features

* add options doc and multipart options-progress doc ([#370](https://github.com/aliyun/oss-nodejs-sdk/issues/370)) ([2086bd3](https://github.com/aliyun/oss-nodejs-sdk/commit/2086bd3))
* example with build in es6 ([#363](https://github.com/aliyun/oss-nodejs-sdk/issues/363)) ([a00e26e](https://github.com/aliyun/oss-nodejs-sdk/commit/a00e26e))
* multipart copy support ([#371](https://github.com/aliyun/oss-nodejs-sdk/issues/371)) ([e42a534](https://github.com/aliyun/oss-nodejs-sdk/commit/e42a534))
* rtmp api  ([#359](https://github.com/aliyun/oss-nodejs-sdk/issues/359)) ([b4f9434](https://github.com/aliyun/oss-nodejs-sdk/commit/b4f9434)), closes [#345](https://github.com/aliyun/oss-nodejs-sdk/issues/345)
* support callback options for put and multipartUpload ([#379](https://github.com/aliyun/oss-nodejs-sdk/issues/379)) ([46c8dec](https://github.com/aliyun/oss-nodejs-sdk/commit/46c8dec)), closes [#85](https://github.com/aliyun/oss-nodejs-sdk/issues/85)

4.12.2 / 2018-02-01
==================

**fix**
  * move 'stream-http' to devDependencies (饶培泽 <<peizerao@gmail.com>>)

**others**
  * chore: update version to 4.12.2 (饶培泽 <<peizerao@gmail.com>>)


4.12.1 / 2018-01-29
==================

**features**
  * [[`b7c5daaf812`](https://github.com/ali-sdk/ali-oss/commit/b7c5daaf812ae9a9d46ffdccd008158b7fbcffd5)] - feat: add local protocol check for web (#347) (binghaiwang <<binghaiwang@gmail.com>>)
  * [[`02f9ba7ed87935`](https://github.com/ali-sdk/ali-oss/commit/02f9ba7ed8793573e3a16e4534b7b10d92e8b6b9)] - feat: cancel multipartUpload (#356) (binghaiwang <<binghaiwang@gmail.com>>)

**fixs**
  * [[`b62bd2eea`](https://github.com/ali-sdk/ali-oss/commit/b62bd2eea0e52b64257c2d1b60f0c8b02243fc2c)] - fix: multipartUpload small file upload by callback data (#358) (binghaiwang <<binghaiwang@gmail.com>>)

**others**
  * chore: update version to 4.11.5 (饶培泽 <<peizerao@gmail.com>>)
  * docs: add timeout doc about multipart (#353) (binghaiwang <<binghaiwang@gmail.com>>)

4.11.5 / 2018-01-17
==================

**fixes**
  * [[`dda7ff6`](https://github.com/ali-sdk/ali-oss/commit/dda7ff6f9b30affadccff389995d29841266abf7)] - fix: safari blob fail case (#346) (binghaiwang <<binghaiwang@gmail.com>>)
  * [[`ed68ba3d7c9`](https://github.com/ali-sdk/ali-oss/commit/ed68ba3d7c9bc251584c0c9189a5eba0704f94a4)] - fix: RequestTimeTooSkewed(#341) (binghaiwang <<binghaiwang@gmail.com>>)

**others**
  * chore: update version to 4.11.5 (饶培泽 <<peizerao@gmail.com>>)

4.11.4 / 2018-01-09
==================

**fixes**
  * [[`2021661`](https://github.com/ali-sdk/ali-oss/commit/2021661a259f66516e51549ce2158fca55b51b05)] - feat: add net error code (#332) (binghaiwang <<binghaiwang@gmail.com>>)
  * [[`ceae401`](https://github.com/ali-sdk/ali-oss/commit/ceae401c3dd3d9e1f64fef172bcf42a291402dc6)] - feat: multipartUpload add the return parameter for resoponse (#335) (binghaiwang <<binghaiwang@gmail.com>>)

**others**
  * chore: update version to 4.11.4 (饶培泽 <<peizerao@gmail.com>>)

4.11.3 / 2017-12-21
==================

**fixes**
  * [[`12a4271`](http://github.com/ali-sdk/ali-oss/commit/12a427197ec29bd1bafb1d1286e3b5a7f86645c1)] - fix: add shims for browser (#316) (饶培泽 <<peizerao@gmail.com>>)

**others**
  * [[`060df98`](http://github.com/ali-sdk/ali-oss/commit/060df98d72d1ae8b85f9cca4e35c3222ef447c57)] - chore: update dist version to 4.11.2 (fengmk2 <<fengmk2@gmail.com>>)

4.11.2 / 2017-11-07
==================

**fixes**
  * [[`c062249`](http://github.com/ali-sdk/ali-oss/commit/c062249bb8c8570411dbb3912c3a312826d86027)] - fix: the multipartUpload return value has same structure (#306) (饶培泽 <<peizerao@gmail.com>>)

4.11.1 / 2017-11-07
==================

**fixes**
  * [[`029dcc2`](http://github.com/ali-sdk/ali-oss/commit/029dcc2374c1d4cbb1589a4b15bae1d3057228e0)] - fix: process the client's local time is skew (#314) (饶培泽 <<peizerao@gmail.com>>)

4.11.0 / 2017-10-25
==================

**features**
  * [[`c50cc9e`](http://github.com/ali-sdk/ali-oss/commit/c50cc9e83166f56c24455f84c72106e00e0bed13)] - feat: handle browser compatibility alone (饶培泽 <<peizerao@gmail.com>>)

4.10.2 / 2017-10-20
==================

**fixes**
  * [[`22fbad2`](http://github.com/ali-sdk/ali-oss/commit/22fbad2664f75c70c52e2db1ded31e762abf43d4)] - fix: getStream support options.process (#304) (饶培泽 <<peizerao@gmail.com>>)

**others**
  * [[`fc3cd7f`](http://github.com/ali-sdk/ali-oss/commit/fc3cd7fc394de5cbc98aada7bf95e7344451d505)] - docs: update the full name of OSS (#297) (David Chen <<tianniu_chen@163.com>>)

4.10.1 / 2017-08-30
==================

  * fix issue #288: startsWith not support by ie11 (#289)
  * fix: add 4.10.0 dist

4.10.0 / 2017-08-07
==================

**features**
  * [[`8b176d6`](http://github.com/ali-sdk/ali-oss/commit/8b176d6d53f204310230b4495fc15a24be6f3370)] - feat: manage cors for bucket (#279) (Haoliang Gao <<sakura9515@gmail.com>>)

**fixes**
  * [[`915b196`](http://github.com/ali-sdk/ali-oss/commit/915b196380da8c8fd31bcf5fd69bae99aea08361)] - fix: add missing dist (fengmk2 <<fengmk2@gmail.com>>)

4.9.0 / 2017-07-28
==================

  * feat: support oss.append  (#275)
  * test: add node 8
  * test: skip callbackurl test cases
  * test: set default platform on user-agent
  * docs: Document `secure` option when creating bucket store. (#252)
  * chore: add dist build files

4.8.0 / 2017-01-19
==================

  * feat: support VPC region #181 (#183)
  * fix comment typo and add object check to avoid call properties of null object (#176)

4.7.3 / 2017-01-06
==================

  * update dist

4.7.2 / 2017-01-06
==================

  * update dist

4.7.1 / 2017-01-06
==================

  * :bug: fix bowser dependency (#174)

4.7.0 / 2017-01-05
==================

  * fix: the copy object api bug which can not use non-English source object name (#166)
  * feat: add process params to signatureUrl and get api for image process (#170)
  * fix: multipartUpload can not work with IE10 bug (#167)

4.6.3 / 2016-12-20
==================

  * fix request stream bug of the multipart upload feature (#155)
  * chore(package): update dateformat to version 2.0.0 (#156)
  * doc: param "file" of `*get` method is optional (#158)

4.6.2 / 2016-10-28
==================

  * Fix browserify transform with co-gather (#150)

4.6.0 / 2016-10-27
==================

  * feat: implement parallel uploading for multipartUpload (#149)

4.5.0 / 2016-10-13
==================

  * feat: add options.ctx for every request params (#144)
  * chore(package): update urllib to version 2.16.1 (#146)
  * chore(package): update uglify-js to version 2.7.1
  * chore(package): update should to version 11.0.0
  * chore(package): update mocha to version 3.0.0
  * chore(package): update mm to version 2.0.0
  * chore(package): update mm to version 1.5.1
  * chore(package): update should to version 10.0.0 (#125)
  * doc: Update API doc for .multipartUpload
  * chore(package): update should to version 9.0.2

4.4.4 / 2016-06-04
==================

  * deps: use ^
  * Fix isGeneratorFunction and Date format problems in IE10 (#118)
  * chore(package): update humanize-ms to version 1.2.0

4.4.3 / 2016-05-17
==================

  * fix: memory leak in multipart (#113) (#114)
  * chore(package): update utility to version 1.8.0
  * chore(package): update urllib to version 2.9.1 (#111)

4.4.2 / 2016-05-05
==================

  * fix: support node 6 (#109)

4.4.1 / 2016-05-04
==================

  * fix: Correctly parse Put/MultipartUpload response when using upload callback (#104)
  * chore(package): update babel-plugin-transform-runtime to version 6.8.0 (#103)

4.4.0 / 2016-04-28
==================

  * add options.ignoreStatusFile to ignore put status file for status check (#100)

4.3.0 / 2016-04-14
==================

  * deps: uglify-js
  * Add a wrapper to return Promise (#95)

4.2.2 / 2016-04-12
==================

  * Rework browser build to reduce dist size (#94)
  * chore(package): update babel-plugin-transform-runtime to version 6.7.5
  * test: add update exists object headers test case

4.2.1 / 2016-04-07
==================

  * fix: add getObjectUrl on cluster client

4.2.0 / 2016-04-07
==================

  * feat: introduce getObjectUrl method

4.1.7 / 2016-03-30
==================

  * Trim access key id/secret

4.1.6 / 2016-03-16
==================

  * Replace babel-polyfill with babel-runtime to avoid conflict with react
  * chore(package): update sdk-base to version 2.0.1
  * chore(package): update sdk-base to version 2.0.0

4.1.5 / 2016-03-02
==================

  * add README for multipart
  * provide checkpoint in multipart upload progress
  * allow more HTTP methods in signatureUrl
  * allow config expires in signatureUrl
  * ignore image-client coverage
  * stop check leaks in test, work around #74
  * chore(package): update urllib to version 2.8.0
  * fix post-release

4.1.4 / 2016-01-28
==================

  * improve user-agent test
  * use platform to detect browser user agent
  * add script to publish dist/ to cdn after each release

4.1.3 / 2016-01-27
==================

  * chore: update README
  * add user-agent in header

4.1.2 / 2016-01-27
==================

  * update dist

4.1.1 / 2016-01-27
==================

  * deps: update dependencies
  * update dist
  * add build-dist script

4.1.0 / 2016-01-26
==================

  * refine put/putStream interfaces
  * add putACL & getACL
  * fix bug when endpoint is IP with port

4.0.1 / 2016-01-25
==================

  * fix IE10 compatibility and refine test

4.0.0 / 2016-01-22
==================

  * build: only test on 4&5
  * Merge pull request #55 from rockuw/master
  * add .babelrc
  * use readAsArrayBuffer for IE11 doesn't support readAsBinaryString
  * reduce putBucketACL() case
  * avoid putBucketACL() timeout
  * sleep logger in bucket.test.js
  * add node 5 and tidy .travis.yml
  * use ms to tidy code
  * Wait some time in test for bucket meta sync
  * make region configurable
  * test travis ci
  * Set sts client default timeout to 60s
  * test travis ci
  * handle policy string in STS
  * Merge pull request #57 from ali-sdk/greenkeeper-autod-2.4.2
  * fix cdn addr
  * use utility.escape
  * chore(package): update autod to version 2.4.2
  * refine as review comments
  * add object key encoding test
  * refine bucket test
  * add content type test
  * add browser usage in README
  * signatureUrl() supports STS
  * refine as review comments
  * Merge pull request #56 from ali-sdk/greenkeeper-merge-descriptors-1.0.1
  * chore(package): update merge-descriptors to version 1.0.1
  * add policy to STS assumeRole
  * correct author & cont. remove indent tabs
  * expose .putData as public function
  * remove indent tabs
  * add comments to browser.js
  * add browser.js and change 'let' to 'var'
  * move multipart into a separate file
  * refine subres
  * rich multipart test
  * support STS in oss client
  * add STS client, test pass
  * fix bug in uploadPart, and refine multipart test
  * support generator progress callback
  * add progress callback
  * browser multipartUpload test pass
  * multipart for server test pass
  * fix object url
  * pass all tests
  * refine client constructor to handle endpoint/ip/cname/region
  * Change 'Date' header to 'x-oss-date' for browser compatibility

3.1.3 / 2015-12-18
==================

  * fix(object): custom content-type support lower case
  * deps: update dependencies

3.1.2 / 2015-10-26
==================

  * feat: support custom Content-Type

3.1.1 / 2015-10-23
==================

 * fix(cluster): simplify cluster config

3.1.0 / 2015-10-23
==================

 * feat: support custom urllib client
 * chore: add node required on package.json

3.0.3 / 2015-10-03
==================

  * feat: change check status file path

3.0.2 / 2015-10-01
==================

  * feat: make chooseAvailable public

3.0.1 / 2015-09-30
==================

  * deps: urllib@2.5.0

3.0.0 / 2015-09-30
==================

  * refactor: change signatureUrl to normal function
  * feat: add available checking

2.8.0 / 2015-09-29
==================

 * test: cluster store to two different bucket
 * feat: support signatureUrl
 * feat: add clusterClient

2.7.0 / 2015-09-22
==================

 * feat: support cname and object url

2.6.1 / 2015-09-09
==================

 * add endpoint into readme
 * chore: fix codecov link

2.6.0 / 2015-09-07
==================

 * test: skip image upload
 * docs: add putStream doc
 * test: use codecov
 * feat: put object support streaming

2.5.1 / 2015-08-24
==================

 * fix: remove unnecessary decode
 * fix: signature url
 * fix: escape resource

2.5.0 / 2015-08-22
==================

 * chore: travis use sudo: false
 * feat: request error add params info

2.4.0 / 2015-08-15
==================

  * feat(createRequest): expose create request method
  * deps upgrade

2.3.0 / 2015-07-25
==================

 * feature: support custom agent by options.agent

2.2.0 / 2015-04-02
==================

 * Image service API (@zensh)

2.1.0 / 2015-03-23
==================

 * feat: add getStream*() api

2.0.0 / 2015-02-28
==================

  * fix get not exists object TypeError
  * transfer to ali-sdk/ali-oss
  * feat(object): support streaming put
  * refactor object operations with successStatuses and xmpResponse
  * finish bucket operations
  * ensure tmp dir exists
  * add appveyor.yml
  * add bucket operations
  * support deleteMulti
  * support copy and updateMeta
  * support get object
  * support delete object
  * totally refactor according to ali-sdk

1.1.0 / 2015-01-30
==================

 * feat: support signature url

1.0.0 / 2014-10-26
==================

  * use urllib replace of co-urllib
  * fix readme
  * ocd
  * update examples

0.0.3 / 2014-04-11
==================

  * update co-urllib, add mime, add alias

0.0.2 / 2014-04-10
==================

  * fix 404 error handler
  * Merge branch 'master' of github.com:node-modules/ali-oss
  * add istanbul
  * Merge pull request #1 from chunpu/patch-1
  * fix regenerator url

0.0.1 / 2014-04-08
==================

  * fix readme
  * add travis-ci
  * use renegerator
  * update readme
  * add callback example
  * add test
  * finish get and remove
  * complete upload
  * Initial commit
