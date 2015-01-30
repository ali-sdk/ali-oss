/*!
 * ali-oss - test/client.test.js
 * Copyright(c) 2014 dead_horse <dead_horse@qq.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var OSS = require('..');
var path = require('path');
var fs = require('fs');
var urllib = require('urllib');

var client;
var filepath = path.join(__dirname, '..', 'README.md');
var savePath = path.join(__dirname, 'README.md');
var fileBuffer = fs.readFileSync(filepath);
var fileStream = fs.createReadStream(filepath);
var objectName = 'README.md';

describe('test/client.test.js', function () {
  before(function () {
    client = OSS.create({
      bucket: 'node-ali-oss',
      accessKeyId: 'iAeyzYXtZAdM8V2V',
      accessKeySecret: 'AmieMAD5ZYuevL3UNrkeORzQ0cvqrO',
      supportSignatureUrl: true
    });
  });

  describe('upload()', function () {
    afterEach(function *() {
      (yield client.get(objectName)).length.should.equal(fileBuffer.length);
      yield client.remove(objectName);
    });

    it('should upload file ok', function* () {
      yield client.upload(filepath, objectName);
    });

    it('should upload buffer ok', function* () {
      yield client.upload(fileBuffer, objectName);
    });

    it('should upload stream ok', function* () {
      yield client.upload(fileStream, objectName);
    });

    it('should upload with mime ok', function* () {
      yield client.upload(fileBuffer, objectName, {
        mime: 'md'
      });
    });
  });

  describe('get()', function () {
    before(function* () {
      yield client.upload(filepath, objectName);
    });
    after(function* () {
      yield client.remove(objectName);
    });

    afterEach(function () {
      try {
        fs.unlinkSync(savePath);
      } catch (err) {

      }
    });

    it('should get file ok', function* () {
      yield client.get(objectName, savePath);
      fs.statSync(savePath).size.should.equal(fileBuffer.length);
    });

    it('should get stream ok', function* () {
      var stream = fs.createWriteStream(savePath);
      yield client.get(objectName, stream);
      fs.statSync(savePath).size.should.equal(fileBuffer.length);
    });

    it('should get buffer ok', function* () {
      (yield client.get(objectName)).length.should.equal(fileBuffer.length);
    });
  });

  describe('signatureUrl()', function () {
    before(function* () {
      yield client.upload(filepath, objectName);
    });
    after(function* () {
      yield client.remove(objectName);
    });

    it('should get object with signature url', function* () {
      var url = client.signatureUrl(objectName);
      url.should.be.a.String;
      var r = yield urllib.request(url);
      r.status.should.equal(200);
      r.data.toString().should.containEql('ali-oss');
    });
  });
});
