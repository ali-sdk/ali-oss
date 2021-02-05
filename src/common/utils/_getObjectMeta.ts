import { Client } from '../../setConfig';
import { MultiVersionCommonOptions } from '../../types/params';
import { setBucket } from '../client';
import { head } from '../object/head';

/**
 * Get Object Meta
 * @param {String} bucket  bucket name
 * @param {String} name   object name
 * @param {Object} options
 */
export async function _getObjectMeta(
  this: Client,
  bucket: string,
  name: string,
  options: MultiVersionCommonOptions = {}
) {
  const currentBucket = this.options.bucket;
  setBucket.call(this, bucket);
  try {
    const data = await head.call(this, name, options);
    setBucket.call(this, currentBucket);
    return data;
  } catch (error) {
    setBucket.call(this, currentBucket);
    throw error;
  }
}
