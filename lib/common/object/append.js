"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.append = void 0;
/**
 * append an object from String(file path)/Buffer/ReadableStream
 * @param {String} name the object key
 * @param {Mixed} file String(file path)/Buffer/ReadableStream
 * @param {Object} options
 * @return {Object}
 */
async function append(name, file, options = {}) {
    const { put } = this;
    if (typeof put !== 'function') {
        throw 'please set put in options, put path is browser/object/put';
    }
    if (options.position === undefined)
        options.position = '0';
    options.subres = {
        append: '',
        position: options.position,
    };
    const result = await put.call(this, name, file, Object.assign({ method: 'POST' }, options));
    return Object.assign(result, { nextAppendPosition: result.res.headers['x-oss-next-append-position'] });
}
exports.append = append;
