
const Base = require('sdk-base');
const util = require('util');
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

    for (let i = 0; i < options.cluster.length; i++) {
      const opt = options.cluster[i];
      copy(options).pick('timeout', 'agent', 'urllib').to(opt);
      this.clients.push(new OssClient(opt));
      this.availables[i] = true;
    }

    this.schedule = options.schedule || RR;
    // only read from master, default is false
    this.masterOnly = !!options.masterOnly;
    this.index = 0;

    const heartbeatInterval = options.heartbeatInterval || 10000;
    this._checkAvailableLock = false;
    this._timerId = this._deferInterval(this._checkAvailable.bind(this, true), heartbeatInterval);
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
    'getACL'
  ];

  const PUT_METHODS = [
    'put',
    'putStream',
    'delete',
    'deleteMulti',
    'copy',
    'putMeta',
    'putACL'
  ];

  GET_METHODS.forEach((method) => {
    proto[method] = async function (...args) {
      const client = this.chooseAvailable();
      let lastError;
      try {
        return await client[method](...args);
      } catch (err) {
        if (err.status && err.status >= 200 && err.status < 500) {
          // 200 ~ 499 belong to normal response, don't try again
          throw err;
        }
        // < 200 || >= 500 need to retry from other cluser node
        lastError = err;
      }

      for (let i = 0; i < this.clients.length; i++) {
        const c = this.clients[i];
        if (c !== client) {
          try {
            return await c[method].apply(client, args);
          } catch (err) {
            if (err.status && err.status >= 200 && err.status < 500) {
              // 200 ~ 499 belong to normal response, don't try again
              throw err;
            }
            // < 200 || >= 500 need to retry from other cluser node
            lastError = err;
          }
        }
      }

      lastError.message += ' (all clients are down)';
      throw lastError;
    };
  });

  // must cluster node write success
  PUT_METHODS.forEach((method) => {
    proto[method] = async function (...args) {
      const res = await Promise.all(this.clients.map(client => client[method](...args)));
      return res[0];
    };
  });

  proto.signatureUrl = function signatureUrl(/* name */...args) {
    const client = this.chooseAvailable();
    return client.signatureUrl(...args);
  };

  proto.getObjectUrl = function getObjectUrl(/* name, baseUrl */...args) {
    const client = this.chooseAvailable();
    return client.getObjectUrl(...args);
  };

  proto._init = function _init() {
    const that = this;
    (async () => {
      await that._checkAvailable(that._ignoreStatusFile);
      that.ready(true);
    })().catch((err) => {
      that.emit('error', err);
    });
  };

  proto._checkAvailable = async function _checkAvailable(ignoreStatusFile) {
    const name = `._ali-oss/check.status.${currentIP}.txt`;
    if (!ignoreStatusFile) {
      // only start will try to write the file
      await this.put(name, new Buffer(`check available started at ${Date()}`));
    }

    if (this._checkAvailableLock) {
      return;
    }
    this._checkAvailableLock = true;
    const downStatusFiles = [];
    for (let i = 0; i < this.clients.length; i++) {
      const client = this.clients[i];
      // check 3 times
      let available = await this._checkStatus(client, name);
      if (!available) {
        // check again
        available = await this._checkStatus(client, name);
      }
      if (!available) {
        // check again
        /* eslint no-await-in-loop: [0] */
        available = await this._checkStatus(client, name);
        if (!available) {
          downStatusFiles.push(client._objectUrl(name));
        }
      }
      this.availables[i] = available;
    }
    this._checkAvailableLock = false;

    if (downStatusFiles.length > 0) {
      const err = new Error(`${downStatusFiles.length} data node down, please check status file: ${downStatusFiles.join(', ')}`);
      err.name = 'CheckAvailableError';
      this.emit('error', err);
    }
  };

  proto._checkStatus = async function _checkStatus(client, name) {
    let available = true;
    try {
      await client.head(name);
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
      // only read from master
      if (this.masterOnly) {
        return this.clients[0];
      }
      for (let i = 0; i < this.clients.length; i++) {
        if (this.availables[i]) {
          return this.clients[i];
        }
      }
      // all down, try to use this first one
      return this.clients[0];
    }

    // RR
    let n = this.clients.length;
    while (n > 0) {
      const i = this._nextRRIndex();
      if (this.availables[i]) {
        return this.clients[i];
      }
      n--;
    }
    // all down, try to use this first one
    return this.clients[0];
  };

  proto._nextRRIndex = function _nextRRIndex() {
    const index = this.index++;
    if (this.index >= this.clients.length) {
      this.index = 0;
    }
    return index;
  };

  proto._error = function error(err) {
    if (err) throw err;
  };

  proto._createCallback = function _createCallback(ctx, gen, cb) {
    return () => {
      cb = cb || this._error;
      gen.call(ctx).then(() => {
        cb();
      }, cb);
    };
  };
  proto._deferInterval = function _deferInterval(gen, timeout, cb) {
    return setInterval(this._createCallback(this, gen, cb), timeout);
  };

  proto.close = function close() {
    clearInterval(this._timerId);
    this._timerId = null;
  };

  return Client;
};
