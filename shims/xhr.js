'use strict';

var util = require('util');
var urlutil = require('url');
var http = require('http');
var https = require('https');
var debug = require('debug')('urllib');
var ms = require('humanize-ms');

var _Promise;

var REQUEST_ID = 0;
var MAX_VALUE = Math.pow(2, 31) - 10;
var PROTO_RE = /^https?:\/\//i;

function getAgent(agent, defaultAgent) {
  return agent === undefined ? defaultAgent : agent;
}

function makeCallback(resolve, reject) {
  return function (err, data, res) {
    if (err) {
      return reject(err);
    }
    resolve({
      data: data,
      status: res.statusCode,
      headers: res.headers,
      res: res
    });
  };
}

// exports.TIMEOUT = ms('5s');
exports.TIMEOUTS = [ms('300s'), ms('300s')];

var TEXT_DATA_TYPES = [
  'json',
  'text'
];

exports.request = function request(url, args, callback) {
  // request(url, callback)
  if (arguments.length === 2 && typeof args === 'function') {
    callback = args;
    args = null;
  }
  if (typeof callback === 'function') {
    return exports.requestWithCallback(url, args, callback);
  }

  // Promise
  if (!_Promise) {
    _Promise = require('any-promise');
  }
  return new _Promise(function (resolve, reject) {
    exports.requestWithCallback(url, args, makeCallback(resolve, reject));
  });
};


exports.requestWithCallback = function requestWithCallback(url, args, callback) {
  // requestWithCallback(url, callback)
  if (!url || (typeof url !== 'string' && typeof url !== 'object')) {
    var msg = util.format('expect request url to be a string or a http request options, but got %j', url);
    throw new Error(msg);
  }

  if (arguments.length === 2 && typeof args === 'function') {
    callback = args;
    args = null;
  }

  args = args || {};
  if (REQUEST_ID >= MAX_VALUE) {
    REQUEST_ID = 0;
  }
  var reqId = ++REQUEST_ID;

  args.requestUrls = args.requestUrls || [];

  var reqMeta = {
    requestId: reqId,
    url: url,
    args: args,
    ctx: args.ctx,
  };
  if (args.emitter) {
    args.emitter.emit('request', reqMeta);
  }

  args.timeout = args.timeout || exports.TIMEOUTS;
  args.maxRedirects = args.maxRedirects || 10;
  args.streaming = args.streaming || args.customResponse;
  var requestStartTime = Date.now();
  var parsedUrl;

  if (typeof url === 'string') {
    if (!PROTO_RE.test(url)) {
      // Support `request('www.server.com')`
      url = 'http://' + url;
    }
    parsedUrl = urlutil.parse(url);
  } else {
    parsedUrl = url;
  }

  var method = (args.type || args.method || parsedUrl.method || 'GET').toUpperCase();
  var port = parsedUrl.port || 80;
  var httplib = http;
  var agent = getAgent(args.agent, exports.agent);
  var fixJSONCtlChars = args.fixJSONCtlChars;

  if (parsedUrl.protocol === 'https:') {
    httplib = https;
    agent = getAgent(args.httpsAgent, exports.httpsAgent);

    if (!parsedUrl.port) {
      port = 443;
    }
  }

  // request through proxy tunnel
  // var proxyTunnelAgent = detectProxyAgent(parsedUrl, args);
  // if (proxyTunnelAgent) {
  //   agent = proxyTunnelAgent;
  // }

  var options = {
    host: parsedUrl.hostname || parsedUrl.host || 'localhost',
    path: parsedUrl.path || '/',
    method: method,
    port: port,
    agent: agent,
    headers: args.headers || {},
    // default is dns.lookup
    // https://github.com/nodejs/node/blob/master/lib/net.js#L986
    // custom dnslookup require node >= 4.0.0
    // https://github.com/nodejs/node/blob/archived-io.js-v0.12/lib/net.js#L952
    lookup: args.lookup,
  };

  if (Array.isArray(args.timeout)) {
    options.requestTimeout = args.timeout[args.timeout.length - 1];
  } else if (typeof args.timeout !== 'undefined') {
    options.requestTimeout = args.timeout;
  }

  var sslNames = [
    'pfx',
    'key',
    'passphrase',
    'cert',
    'ca',
    'ciphers',
    'rejectUnauthorized',
    'secureProtocol',
    'secureOptions',
  ];
  for (var i = 0; i < sslNames.length; i++) {
    var name = sslNames[i];
    if (args.hasOwnProperty(name)) {
      options[name] = args[name];
    }
  }

  // don't check ssl
  if (options.rejectUnauthorized === false && !options.hasOwnProperty('secureOptions')) {
    options.secureOptions = require('constants').SSL_OP_NO_TLSv1_2;
  }

  var auth = args.auth || parsedUrl.auth;
  if (auth) {
    options.auth = auth;
  }

  var body = args.content || args.data;
  var dataAsQueryString = method === 'GET' || method === 'HEAD' || args.dataAsQueryString;
  if (!args.content) {
    if (body && !(typeof body === 'string' || Buffer.isBuffer(body))) {
      if (dataAsQueryString) {
        // read: GET, HEAD, use query string
        body = args.nestedQuerystring ? qs.stringify(body) : querystring.stringify(body);
      } else {
        var contentType = options.headers['Content-Type'] || options.headers['content-type'];
        // auto add application/x-www-form-urlencoded when using urlencode form request
        if (!contentType) {
          if (args.contentType === 'json') {
            contentType = 'application/json';
          } else {
            contentType = 'application/x-www-form-urlencoded';
          }
          options.headers['Content-Type'] = contentType;
        }

        if (parseContentType(contentType).type === 'application/json') {
          body = JSON.stringify(body);
        } else {
          // 'application/x-www-form-urlencoded'
          body = args.nestedQuerystring ? qs.stringify(body) : querystring.stringify(body);
        }
      }
    }
  }

  // if it's a GET or HEAD request, data should be sent as query string
  if (dataAsQueryString && body) {
    options.path += (parsedUrl.query ? '&' : '?') + body;
    body = null;
  }

  var requestSize = 0;
  if (body) {
    var length = body.length;
    if (!Buffer.isBuffer(body)) {
      length = Buffer.byteLength(body);
    }
    requestSize = options.headers['Content-Length'] = length;
  }

  if (args.dataType === 'json') {
    options.headers.Accept = 'application/json';
  }

  if (typeof args.beforeRequest === 'function') {
    // you can use this hook to change every thing.
    args.beforeRequest(options);
  }
  var connectTimer = null;
  var responseTimer = null;
  var __err = null;
  var connected = false; // socket connected or not
  var keepAliveSocket = false; // request with keepalive socket
  var responseSize = 0;
  var statusCode = -1;
  var responseAborted = false;
  var remoteAddress = '';
  var remotePort = '';
  var timing = null;
  if (args.timing) {
    timing = {
      // socket assigned
      queuing: 0,
      // dns lookup time
      dnslookup: 0,
      // socket connected
      connected: 0,
      // request sent
      requestSent: 0,
      // Time to first byte (TTFB)
      waiting: 0,
      contentDownload: 0,
    };
  }

  function cancelConnectTimer() {
    if (connectTimer) {
      clearTimeout(connectTimer);
      connectTimer = null;
    }
  }
  function cancelResponseTimer() {
    if (responseTimer) {
      clearTimeout(responseTimer);
      responseTimer = null;
    }
  }

  function done(err, data, res) {
    cancelResponseTimer();
    if (!callback) {
      console.warn('[urllib:warn] [%s] [%s] [worker:%s] %s %s callback twice!!!',
        Date(), reqId, process.pid, options.method, url);
      // https://github.com/node-modules/urllib/pull/30
      if (err) {
        console.warn('[urllib:warn] [%s] [%s] [worker:%s] %s: %s\nstack: %s',
          Date(), reqId, process.pid, err.name, err.message, err.stack);
      }
      return;
    }
    var cb = callback;
    callback = null;
    var headers = {};
    if (res) {
      statusCode = res.statusCode;
      headers = res.headers;
    }

    // handle digest auth
    if (statusCode === 401 && headers['www-authenticate']
      && (!args.headers || !args.headers.Authorization) && args.digestAuth) {
      var authenticate = headers['www-authenticate'];
      if (authenticate.indexOf('Digest ') >= 0) {
        debug('Request#%d %s: got digest auth header WWW-Authenticate: %s', reqId, url, authenticate);
        args.headers = args.headers || {};
        args.headers.Authorization = digestAuthHeader(options.method, options.path, authenticate, args.digestAuth);
        debug('Request#%d %s: auth with digest header: %s', reqId, url, args.headers.Authorization);
        if (res.headers['set-cookie']) {
          args.headers.Cookie = res.headers['set-cookie'].join(';');
        }
        return exports.requestWithCallback(url, args, cb);
      }
    }

    var requestUseTime = Date.now() - requestStartTime;
    if (timing) {
      timing.contentDownload = requestUseTime;
    }

    debug('[%sms] done, %s bytes HTTP %s %s %s %s, keepAliveSocket: %s, timing: %j',
      requestUseTime, responseSize, statusCode, options.method, options.host, options.path,
      keepAliveSocket, timing);

    var response = {
      status: statusCode,
      statusCode: statusCode,
      headers: headers,
      size: responseSize,
      aborted: responseAborted,
      rt: requestUseTime,
      keepAliveSocket: keepAliveSocket,
      data: data,
      requestUrls: args.requestUrls,
      timing: timing,
      remoteAddress: remoteAddress,
      remotePort: remotePort,
    };

    if (err) {
      var agentStatus = '';
      if (agent && typeof agent.getCurrentStatus === 'function') {
        // add current agent status to error message for logging and debug
        agentStatus = ', agent status: ' + JSON.stringify(agent.getCurrentStatus());
      }
      err.message += ', ' + options.method + ' ' + url + ' ' + statusCode
        + ' (connected: ' + connected + ', keepalive socket: ' + keepAliveSocket + agentStatus + ')'
        + '\nheaders: ' + JSON.stringify(headers);
      err.data = data;
      err.path = options.path;
      err.status = statusCode;
      err.headers = headers;
      err.res = response;
    }

    cb(err, data, args.streaming ? res : response);

    if (args.emitter) {
      // keep to use the same reqMeta object on request event before
      reqMeta.url = url;
      reqMeta.socket = req && req.connection;
      reqMeta.options = options;
      reqMeta.size = requestSize;

      args.emitter.emit('response', {
        requestId: reqId,
        error: err,
        ctx: args.ctx,
        req: reqMeta,
        res: response,
      });
    }
  }

  function handleRedirect(res) {
    var err = null;
    if (args.followRedirect && statuses.redirect[res.statusCode]) {  // handle redirect
      args._followRedirectCount = (args._followRedirectCount || 0) + 1;
      var location = res.headers.location;
      if (!location) {
        err = new Error('Got statusCode ' + res.statusCode + ' but cannot resolve next location from headers');
        err.name = 'FollowRedirectError';
      } else if (args._followRedirectCount > args.maxRedirects) {
        err = new Error('Exceeded maxRedirects. Probably stuck in a redirect loop ' + url);
        err.name = 'MaxRedirectError';
      } else {
        var newUrl = args.formatRedirectUrl ? args.formatRedirectUrl(url, location) : urlutil.resolve(url, location);
        debug('Request#%d %s: `redirected` from %s to %s', reqId, options.path, url, newUrl);
        // make sure timer stop
        cancelResponseTimer();
        // should clean up headers.Host on `location: http://other-domain/url`
        if (args.headers && args.headers.Host && PROTO_RE.test(location)) {
          args.headers.Host = null;
        }
        // avoid done will be execute in the future change.
        var cb = callback;
        callback = null;
        exports.requestWithCallback(newUrl, args, cb);
        return {
          redirect: true,
          error: null
        };
      }
    }
    return {
      redirect: false,
      error: err
    };
  }

  // set user-agent
  if (!options.headers['User-Agent'] && !options.headers['user-agent']) {
    options.headers['User-Agent'] = navigator.userAgent;
  }

  if (args.gzip) {
    if (!options.headers['Accept-Encoding'] && !options.headers['accept-encoding']) {
      options.headers['Accept-Encoding'] = 'gzip';
    }
  }

  function decodeContent(res, body, cb) {
    var encoding = res.headers['content-encoding'];
    // if (body.length === 0) {
    //   return cb(null, body, encoding);
    // }

    // if (!encoding || encoding.toLowerCase() !== 'gzip') {
      return cb(null, body, encoding);
    // }

    // debug('gunzip %d length body', body.length);
    // zlib.gunzip(body, cb);
  }

  var writeStream = args.writeStream;

  debug('Request#%d %s %s with headers %j, options.path: %s',
    reqId, method, url, options.headers, options.path);

  args.requestUrls.push(url);

  function onResponse(res) {
    if (timing) {
      timing.waiting = Date.now() - requestStartTime;
    }
    debug('Request#%d %s `req response` event emit: status %d, headers: %j',
      reqId, url, res.statusCode, res.headers);

    if (args.streaming) {
      var result = handleRedirect(res);
      if (result.redirect) {
        res.resume();
        return;
      }
      if (result.error) {
        res.resume();
        return done(result.error, null, res);
      }

      return done(null, null, res);
    }

    res.on('close', function () {
      debug('Request#%d %s: `res close` event emit, total size %d',
        reqId, url, responseSize);
    });

    res.on('error', function () {
      debug('Request#%d %s: `res error` event emit, total size %d',
        reqId, url, responseSize);
    });

    res.on('aborted', function () {
      responseAborted = true;
      debug('Request#%d %s: `res aborted` event emit, total size %d',
        reqId, url, responseSize);
    });

    if (writeStream) {
      // If there's a writable stream to recieve the response data, just pipe the
      // response stream to that writable stream and call the callback when it has
      // finished writing.
      //
      // NOTE that when the response stream `res` emits an 'end' event it just
      // means that it has finished piping data to another stream. In the
      // meanwhile that writable stream may still writing data to the disk until
      // it emits a 'close' event.
      //
      // That means that we should not apply callback until the 'close' of the
      // writable stream is emited.
      //
      // See also:
      // - https://github.com/TBEDP/urllib/commit/959ac3365821e0e028c231a5e8efca6af410eabb
      // - http://nodejs.org/api/stream.html#stream_event_end
      // - http://nodejs.org/api/stream.html#stream_event_close_1
      var result = handleRedirect(res);
      if (result.redirect) {
        res.resume();
        return;
      }
      if (result.error) {
        res.resume();
        // end ths stream first
        writeStream.end();
        return done(result.error, null, res);
      }
      // you can set consumeWriteStream false that only wait response end
      if (args.consumeWriteStream === false) {
        res.on('end', done.bind(null, null, null, res));
      } else {
        // node 0.10, 0.12: only emit res aborted, writeStream close not fired
        if (isNode010 || isNode012) {
          first([
            [ writeStream, 'close' ],
            [ res, 'aborted' ],
          ], function(_, stream, event) {
            debug('Request#%d %s: writeStream or res %s event emitted', reqId, url, event);
            done(__err || null, null, res);
          });
        } else {
          writeStream.on('close', function() {
            debug('Request#%d %s: writeStream close event emitted', reqId, url);
            done(__err || null, null, res);
          });
        }
      }
      return res.pipe(writeStream);
    }

    // Otherwise, just concat those buffers.
    //
    // NOTE that the `chunk` is not a String but a Buffer. It means that if
    // you simply concat two chunk with `+` you're actually converting both
    // Buffers into Strings before concating them. It'll cause problems when
    // dealing with multi-byte characters.
    //
    // The solution is to store each chunk in an array and concat them with
    // 'buffer-concat' when all chunks is recieved.
    //
    // See also:
    // http://cnodejs.org/topic/4faf65852e8fb5bc65113403

    var chunks = [];

    res.on('data', function (chunk) {
      debug('Request#%d %s: `res data` event emit, size %d', reqId, url, chunk.length);
      responseSize += chunk.length;
      chunks.push(chunk);
    });

    res.on('end', function () {
      var body = Buffer.concat(chunks, responseSize);
      debug('Request#%d %s: `res end` event emit, total size %d, _dumped: %s',
        reqId, url, responseSize, res._dumped);

      if (__err) {
        // req.abort() after `res data` event emit.
        return done(__err, body, res);
      }

      var result = handleRedirect(res);
      if (result.error) {
        return done(result.error, body, res);
      }
      if (result.redirect) {
        return;
      }

      decodeContent(res, body, function (err, data, encoding) {
        if (err) {
          return done(err, body, res);
        }
        // if body not decode, dont touch it
        if (!encoding && TEXT_DATA_TYPES.indexOf(args.dataType) >= 0) {
          // try to decode charset
          try {
            data = decodeBodyByCharset(data, res);
          } catch (e) {
            debug('decodeBodyByCharset error: %s', e);
            // if error, dont touch it
            return done(null, data, res);
          }

          if (args.dataType === 'json') {
            if (responseSize === 0) {
              data = null;
            } else {
              var r = parseJSON(data, fixJSONCtlChars);
              if (r.error) {
                err = r.error;
              } else {
                data = r.data;
              }
            }
          }
        }

        if (responseAborted) {
          // err = new Error('Remote socket was terminated before `response.end()` was called');
          // err.name = 'RemoteSocketClosedError';
          debug('Request#%d %s: Remote socket was terminated before `response.end()` was called', reqId, url);
        }

        done(err, data, res);
      });
    });
  }

  var connectTimeout, responseTimeout;
  if (Array.isArray(args.timeout)) {
    connectTimeout = ms(args.timeout[0]);
    responseTimeout = ms(args.timeout[1]);
  } else {  // set both timeout equal
    connectTimeout = responseTimeout = ms(args.timeout);
  }
  debug('ConnectTimeout: %d, ResponseTimeout: %d', connectTimeout, responseTimeout);

  function startConnectTimer() {
    debug('Connect timer ticking, timeout: %d', connectTimeout);
    connectTimer = setTimeout(function () {
      connectTimer = null;
      if (statusCode === -1) {
        statusCode = -2;
      }
      var msg = 'Connect timeout for ' + connectTimeout + 'ms';
      var errorName = 'ConnectionTimeoutError';
      if (!req.socket) {
        errorName = 'SocketAssignTimeoutError';
        msg += ', working sockets is full';
      }
      __err = new Error(msg);
      __err.name = errorName;
      __err.requestId = reqId;
      debug('ConnectTimeout: Request#%d %s %s: %s, connected: %s', reqId, url, __err.name, msg, connected);
      abortRequest();
    }, connectTimeout);
  }

  function startResposneTimer() {
    debug('Response timer ticking, timeout: %d', responseTimeout);
    responseTimer = setTimeout(function () {
      responseTimer = null;
      var msg = 'Response timeout for ' + responseTimeout + 'ms';
      var errorName = 'ResponseTimeoutError';
      __err = new Error(msg);
      __err.name = errorName;
      __err.requestId = reqId;
      debug('ResponseTimeout: Request#%d %s %s: %s, connected: %s', reqId, url, __err.name, msg, connected);
      abortRequest();
    }, responseTimeout);
  }

  var req;
  // request headers checker will throw error
  try {
    req = httplib.request(options, onResponse);
  } catch (err) {
    return done(err);
  }

  // environment detection: browser or nodejs
  if (typeof(window) === 'undefined') {
    // start connect timer just after `request` return, and just in nodejs environment
    startConnectTimer();
  } else {
    req.on('requestTimeout', function () {
      if (statusCode === -1) {
        statusCode = -2;
      }
      var msg = 'Connect timeout for ' + connectTimeout + 'ms';
      var errorName = 'ConnectionTimeoutError';
      __err = new Error(msg);
      __err.name = errorName;
      __err.requestId = reqId;
      abortRequest();
    });
  }

  function abortRequest() {
    debug('Request#%d %s abort, connected: %s', reqId, url, connected);
    // it wont case error event when req haven't been assigned a socket yet.
    if (!req.socket) {
      __err.noSocket = true;
      done(__err);
    }
    req.abort();
  }

  if (timing) {
    // request sent
    req.on('finish', function() {
      timing.requestSent = Date.now() - requestStartTime;
    });
  }

  req.once('socket', function (socket) {
    if (timing) {
      // socket queuing time
      timing.queuing = Date.now() - requestStartTime;
    }

    // https://github.com/nodejs/node/blob/master/lib/net.js#L377
    // https://github.com/nodejs/node/blob/v0.10.40-release/lib/net.js#L352
    // should use socket.socket on 0.10.x
    if (isNode010 && socket.socket) {
      socket = socket.socket;
    }

    var readyState = socket.readyState;
    if (readyState === 'opening') {
      socket.once('lookup', function(err, ip, addressType) {
        debug('Request#%d %s lookup: %s, %s, %s', reqId, url, err, ip, addressType);
        if (timing) {
          timing.dnslookup = Date.now() - requestStartTime;
        }
        if (ip) {
          remoteAddress = ip;
        }
      });
      socket.once('connect', function() {
        if (timing) {
          // socket connected
          timing.connected = Date.now() - requestStartTime;
        }

        // cancel socket timer at first and start tick for TTFB
        cancelConnectTimer();
        startResposneTimer();

        debug('Request#%d %s new socket connected', reqId, url);
        connected = true;
        if (!remoteAddress) {
          remoteAddress = socket.remoteAddress;
        }
        remotePort = socket.remotePort;
      });
      return;
    }

    debug('Request#%d %s reuse socket connected, readyState: %s', reqId, url, readyState);
    connected = true;
    keepAliveSocket = true;
    if (!remoteAddress) {
      remoteAddress = socket.remoteAddress;
    }
    remotePort = socket.remotePort;

    // reuse socket, timer should be canceled.
    cancelConnectTimer();
    startResposneTimer();
  });

  req.on('error', function (err) {
    //TypeError for browser fetch api, Error for browser xmlhttprequest api
    if (err.name === 'Error' || err.name === 'TypeError') {
      err.name = connected ? 'ResponseError' : 'RequestError';
    }
    err.message += ' (req "error")';
    debug('Request#%d %s `req error` event emit, %s: %s', reqId, url, err.name, err.message);
    done(__err || err);
  });

  if (writeStream) {
    writeStream.once('error', function (err) {
      err.message += ' (writeStream "error")';
      __err = err;
      debug('Request#%d %s `writeStream error` event emit, %s: %s', reqId, url, err.name, err.message);
      abortRequest();
    });
  }

  if (args.stream) {
    args.stream.pipe(req);
    args.stream.once('error', function (err) {
      err.message += ' (stream "error")';
      __err = err;
      debug('Request#%d %s `readStream error` event emit, %s: %s', reqId, url, err.name, err.message);
      abortRequest();
    });
  } else {
    req.end(body);
  }

  req.requestId = reqId;
  return req;
};