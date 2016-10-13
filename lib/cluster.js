'use strict';

const co = require('co');
const defer = require('co-defer');
const Base = require('sdk-base');
const util = require('util');
const utility = require('utility');
const ready = require('get-ready');
const copy = require('copy-to');
const currentIP = require('address').ip();

const RR = 'roundRobin';
const MS = 'masterSlave';

module.exports = function (OssClient) {
  function Client(options) {
    if (!(this instanceof Client)) {
      return new Client(options);
    }

    if (!options || !Array.isArray(options.cluster)) {
      throw new Error('require options.cluster to be an array');
    }

    Base.call(this);

    this.clients = [];
    this.availables = {};

    for (var i = 0; i < options.cluster.length; i++) {
      var opt = options.cluster[i];
      copy(options).pick('timeout', 'agent', 'urllib').to(opt);
      this.clients.push(new OssClient(opt));
      this.availables[i] = true;
    }

    this.schedule = options.schedule || RR;
    this.index = 0;

    const heartbeatInterval = options.heartbeatInterval || 10000;
    this._checkAvailableLock = false;
    this._timerId = defer.setInterval(this._checkAvailable.bind(this, true), heartbeatInterval);
    this._ignoreStatusFile = options.ignoreStatusFile || false;
    this._init();
  }

  util.inherits(Client, Base);
  const proto = Client.prototype;
  ready.mixin(proto);

  const GET_METHODS = [
    'head',
    'get',
    'getStream',
    'list',
  ];

  const PUT_METHODS = [
    'put',
    'putStream',
    'delete',
    'deleteMulti',
    'copy',
    'putMeta',
  ];

  GET_METHODS.forEach(function (method) {
    proto[method] = function* () {
      const args = utility.argumentsToArray(arguments);
      var client = this.chooseAvailable();
      var lastError;
      try {
        return yield client[method].apply(client, args);
      } catch (err) {
        if (err.status && err.status >= 200 && err.status < 500) {
          // 200 ~ 499 belong to normal response, don't try again
          throw err;
        }
        // < 200 || >= 500 need to retry from other cluser node
        lastError = err;
      }

      for (var i = 0; i < this.clients.length; i++) {
        var c = this.clients[i];
        if (c === client) {
          continue;
        }
        try {
          return yield c[method].apply(client, args);
        } catch (err){
          if (err.status && err.status >= 200 && err.status < 500) {
            // 200 ~ 499 belong to normal response, don't try again
            throw err;
          }
          // < 200 || >= 500 need to retry from other cluser node
          lastError = err;
        }
      }

      lastError.message += ' (all clients are down)';
      throw lastError;
    };
  });

  // must cluster node write success
  PUT_METHODS.forEach(function (method) {
    proto[method] = function* () {
      var args = utility.argumentsToArray(arguments);
      var res = yield this.clients.map(function (client) {
        return client[method].apply(client, args);
      });
      return res[0];
    };
  });

  proto.signatureUrl = function signatureUrl(/* name */) {
    var args = utility.argumentsToArray(arguments);
    var client = this.chooseAvailable();
    return client.signatureUrl.apply(client, args);
  };

  proto.getObjectUrl = function getObjectUrl(/* name, baseUrl */) {
    var args = utility.argumentsToArray(arguments);
    var client = this.chooseAvailable();
    return client.getObjectUrl.apply(client, args);
  };

  proto._init = function _init() {
    const that = this;
    co(function*() {
      yield that._checkAvailable(that._ignoreStatusFile);
      that.ready(true);
    }).catch(function(err) {
      that.emit('error', err);
    });
  };

  proto._checkAvailable = function* _checkAvailable(ignoreStatusFile) {
    const name = '._ali-oss/check.status.' + currentIP + '.txt';
    if (!ignoreStatusFile) {
      // only start will try to write the file
      yield this.put(name, new Buffer('check available started at ' + Date()));
    }

    if (this._checkAvailableLock) {
      return;
    }
    this._checkAvailableLock = true;
    var downStatusFiles = [];
    for (var i = 0; i < this.clients.length; i++) {
      var client = this.clients[i];
      // check 3 times
      var available = yield this._checkStatus(client, name);
      if (!available) {
        // check again
        available = yield this._checkStatus(client, name);
      }
      if (!available) {
        // check again
        available = yield this._checkStatus(client, name);
        if (!available) {
          downStatusFiles.push(client._objectUrl(name));
        }
      }
      this.availables[i] = available;
    }
    this._checkAvailableLock = false;

    if (downStatusFiles.length > 0) {
      const err = new Error(downStatusFiles.length + ' data node down, please check status file: ' + downStatusFiles.join(', '));
      err.name = 'CheckAvailableError';
      this.emit('error', err);
    }
  };

  proto._checkStatus = function* _checkStatus(client, name) {
    var available = true;
    try {
      yield client.head(name);
    } catch (err) {
      // 404 will be available too
      if (!err.status || err.status >= 500 || err.status < 200) {
        available = false;
      }
    }
    return available;
  };

  proto.chooseAvailable = function chooseAvailable() {
    if (this.schedule === MS) {
      for (var i = 0; i < this.clients.length; i++) {
        if (this.availables[i]) {
          return this.clients[i];
        }
      }
      // all down, try to use this first one
      return this.clients[0];
    }

    // RR
    var n = this.clients.length;
    while (n > 0) {
      var i = this._nextRRIndex();
      if (this.availables[i]) {
        return this.clients[i];
      }
      n--;
    }
    // all down, try to use this first one
    return this.clients[0];
  };

  proto._nextRRIndex = function _nextRRIndex() {
    var index = this.index++;
    if (this.index >= this.clients.length) {
      this.index = 0;
    }
    return index;
  };

  proto.close = function close() {
    clearInterval(this._timerId);
    this._timerId = null;
  };

  return Client;
};
