
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
