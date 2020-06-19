import { head } from "../object/head";

/**
 * Get Object Meta
 * @param {String} bucket  bucket name
 * @param {String} name   object name
 * @param {Object} options
 */
export async function _getObjectMeta(this: any, bucket: string, name: string, options: any = {}) {
  const currentBucket = this.options.bucket;
  this.setBucket(bucket);
  try {
    const data = await head.call(this, name, options);
    this.setBucket(currentBucket);
    return data;
  } catch (error) {
    this.setBucket(currentBucket);
    throw error;
  };
};