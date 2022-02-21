import { append } from './append';
import { calculatePostSignature } from './calculatePostSignature';
import { copy } from './copy';
import { deleteObject } from './delete';
import { deleteMulti } from './deleteMulti';
import { deleteObjectTagging } from './deleteObjectTagging';
import { generateObjectUrl } from './generateObjectUrl';
import { get } from './get';
import { getACL } from './getACL';
import { getAsyncFetch } from './getAsyncFetch';
import { getBucketVersions } from './getBucketVersions';
import { getObjectMeta } from './getObjectMeta';
import { getObjectTagging } from './getObjectTagging';
import { getObjectUrl } from './getObjectUrl';
import { getSymlink } from './getSymlink';
import { head } from './head';
import { list } from './list';
import { listV2 } from './listV2';
import { postAsyncFetch } from './postAsyncFetch';
import { putACL } from './putACL';
import { putMeta } from './putMeta';
import { putObjectTagging } from './putObjectTagging';
import { putSymlink } from './putSymlink';
import { restore } from './restore';
import { signatureUrl } from './signatureUrl';
import { multipleObjectGet } from './multipleObjectGet';


export default {
  append,
  calculatePostSignature,
  copy,
  delete: deleteObject, // 兼容旧版本
  deleteObject,
  deleteMulti,
  deleteObjectTagging,
  generateObjectUrl,
  get,
  getACL,
  getAsyncFetch,
  getBucketVersions,
  listObjectVersions: getBucketVersions, // 兼容旧版本
  getObjectMeta,
  getObjectTagging,
  getObjectUrl,
  getSymlink,
  head,
  list,
  listV2,
  postAsyncFetch,
  putACL,
  putMeta,
  putObjectTagging,
  putSymlink,
  restore,
  signatureUrl,
  multipleObjectGet
};
