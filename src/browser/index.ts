import { Buffer } from 'buffer';
import { Client } from '../setConfig';
import { version } from './version';

import commonObject from '../common/object';
import commonMultipart from '../common/multipart';
import commonUtils from '../common/utils';
import commonImage from '../common/image';
import commonBucket from '../common/bucket';
import commonClient from '../common/client';

import object from './object';
import client from './client';
import multipart from './multipart';

function initClientProto(protos) {
  Object.keys(protos).forEach(prop => {
    Client.prototype[prop] = protos[prop];
  });
}

const OSS: any = Client;
OSS.urllib = require('../../shims/xhr');
OSS.version = version;
OSS.Buffer = Buffer;

initClientProto(commonObject);
initClientProto(commonMultipart);
initClientProto(commonUtils);
initClientProto(commonImage);
initClientProto(commonBucket);
initClientProto(commonClient);

initClientProto(object);
initClientProto(client);
initClientProto(multipart);

module.exports = OSS;
