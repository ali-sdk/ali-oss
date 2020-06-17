
// const debug = require('debug')('ali-oss:object');
const utility = require('utility');
const fs = require('fs');
const urlutil = require('url');
const copy = require('copy-to');
const signHelper = require('../common/signUtils');
const merge = require('merge-descriptors');

// var assert = require('assert');


const proto = exports;



/**
 * generator request params
 * @return {Object} params
 *
 * @api private
 */

proto._objectRequestParams = function _objectRequestParams(method, name, options) {
  if (!this.options.bucket) {
    throw new Error('Please create a bucket first');
  }

  options = options || {};
  name = this._objectName(name);
  const params = {
    object: name,
    bucket: this.options.bucket,
    method,
    subres: options && options.subres,
    timeout: options && options.timeout,
    ctx: options && options.ctx
  };

  if (options.headers) {
    params.headers = {};
    copy(options.headers).to(params.headers);
  }
  return params;
};

proto._objectName = function _objectName(name) {
  return name.replace(/^\/+/, '');
};

