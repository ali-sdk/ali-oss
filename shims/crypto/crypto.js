
var Buffer = require('buffer').Buffer;
var sha = require('./sha');
var md5 = require('./md5');

var algorithms = {
  sha1: sha,
  md5: md5
};

var blocksize = 64;
var zeroBuffer = Buffer.alloc(blocksize);
zeroBuffer.fill(0);

function hmac(fn, key, data) {
  if(!Buffer.isBuffer(key)) key = Buffer.from(key);
  if(!Buffer.isBuffer(data)) data = Buffer.from(data);

  if(key.length > blocksize) {
    key = fn(key)
  } else if(key.length < blocksize) {
    key = Buffer.concat([key, zeroBuffer], blocksize)
  }

  var ipad = Buffer.alloc(blocksize), opad = Buffer.alloc(blocksize);
  for(var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  var hash = fn(Buffer.concat([ipad, data]))
  return fn(Buffer.concat([opad, hash]))
}

function hash(alg, key) {
  alg = alg || 'sha1';
  var fn = algorithms[alg];
  var bufs = [];
  var length = 0;
  if(!fn) error('algorithm:', alg, 'is not yet supported');
  return {
    update: function (data) {
      if(!Buffer.isBuffer(data)) data = Buffer.from(data);

      bufs.push(data);
      length += data.length;
      return this
    },
    digest: function (enc) {
      var buf = Buffer.concat(bufs);
      var r = key ? hmac(fn, key, buf) : fn(buf);
      bufs = null;
      return enc ? r.toString(enc) : r
    }
  }
}

function error () {
  var m = [].slice.call(arguments).join(' ')
  throw new Error([
    m,
    'we accept pull requests',
    'http://github.com/dominictarr/crypto-browserify'
  ].join('\n'))
}

exports.createHash = function (alg) { return hash(alg) };
exports.createHmac = function (alg, key) { return hash(alg, key) };

function each(a, f) {
  for(var i in a)
    f(a[i], i)
}

// the least I can do is make error messages for the rest of the node.js/crypto api.
each(['createCredentials'
  , 'createCipher'
  , 'createCipheriv'
  , 'createDecipher'
  , 'createDecipheriv'
  , 'createSign'
  , 'createVerify'
  , 'createDiffieHellman'
  , 'pbkdf2'], function (name) {
  exports[name] = function () {
    error('sorry,', name, 'is not implemented yet')
  }
});