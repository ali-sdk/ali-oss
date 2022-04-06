"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const append_1 = require("./append");
const calculatePostSignature_1 = require("./calculatePostSignature");
const copy_1 = require("./copy");
const delete_1 = require("./delete");
const deleteMulti_1 = require("./deleteMulti");
const deleteObjectTagging_1 = require("./deleteObjectTagging");
const generateObjectUrl_1 = require("./generateObjectUrl");
const get_1 = require("./get");
const getACL_1 = require("./getACL");
const getAsyncFetch_1 = require("./getAsyncFetch");
const getBucketVersions_1 = require("./getBucketVersions");
const getObjectMeta_1 = require("./getObjectMeta");
const getObjectTagging_1 = require("./getObjectTagging");
const getObjectUrl_1 = require("./getObjectUrl");
const getSymlink_1 = require("./getSymlink");
const head_1 = require("./head");
const list_1 = require("./list");
const listV2_1 = require("./listV2");
const postAsyncFetch_1 = require("./postAsyncFetch");
const putACL_1 = require("./putACL");
const putMeta_1 = require("./putMeta");
const putObjectTagging_1 = require("./putObjectTagging");
const putSymlink_1 = require("./putSymlink");
const restore_1 = require("./restore");
const signatureUrl_1 = require("./signatureUrl");
const selectObject_1 = require("./selectObject");
exports.default = {
    append: append_1.append,
    calculatePostSignature: calculatePostSignature_1.calculatePostSignature,
    copy: copy_1.copy,
    delete: delete_1.deleteObject,
    deleteObject: // 兼容旧版本
    delete_1.deleteObject,
    deleteMulti: deleteMulti_1.deleteMulti,
    deleteObjectTagging: deleteObjectTagging_1.deleteObjectTagging,
    generateObjectUrl: generateObjectUrl_1.generateObjectUrl,
    get: get_1.get,
    getACL: getACL_1.getACL,
    getAsyncFetch: getAsyncFetch_1.getAsyncFetch,
    getBucketVersions: getBucketVersions_1.getBucketVersions,
    listObjectVersions: getBucketVersions_1.getBucketVersions,
    getObjectMeta: // 兼容旧版本
    getObjectMeta_1.getObjectMeta,
    getObjectTagging: getObjectTagging_1.getObjectTagging,
    getObjectUrl: getObjectUrl_1.getObjectUrl,
    getSymlink: getSymlink_1.getSymlink,
    head: head_1.head,
    list: list_1.list,
    listV2: listV2_1.listV2,
    postAsyncFetch: postAsyncFetch_1.postAsyncFetch,
    putACL: putACL_1.putACL,
    putMeta: putMeta_1.putMeta,
    putObjectTagging: putObjectTagging_1.putObjectTagging,
    putSymlink: putSymlink_1.putSymlink,
    restore: restore_1.restore,
    signatureUrl: signatureUrl_1.signatureUrl,
    selectObject: selectObject_1.selectObject
};
