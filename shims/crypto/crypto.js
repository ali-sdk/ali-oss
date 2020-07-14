
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

exports.createCredentials = () => {
  error('sorry,createCredentials is not implemented yet');
};
exports.createCipher = () => {
  error('sorry,createCipher is not implemented yet');
};
exports.createCipheriv = () => {
  error('sorry,createCipheriv is not implemented yet');
};
exports.createDecipher = () => {
  error('sorry,createDecipher is not implemented yet');
};
exports.createDecipheriv = () => {
  error('sorry,createDecipheriv is not implemented yet');
};
exports.createSign = () => {
  error('sorry,createSign is not implemented yet');
};
exports.createVerify = () => {
  error('sorry,createVerify is not implemented yet');
};
exports.createDiffieHellman = () => {
  error('sorry,createDiffieHellman is not implemented yet');
};
exports.pbkdf2 = () => {
  error('sorry,pbkdf2 is not implemented yet');
};
