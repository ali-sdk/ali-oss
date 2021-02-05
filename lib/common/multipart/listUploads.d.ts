import { Client } from '../../setConfig';
import { ObjectListUploadsReturnType } from '../../types/object';
import { ListUploadsQuery, RequestOptions } from '../../types/params';
/**
 * List the on-going multipart uploads
 * https://help.aliyun.com/document_detail/31997.html
 * @param {Object} options
 * @return {Array} the multipart uploads
 */
export declare function listUploads(this: Client, query?: ListUploadsQuery, options?: RequestOptions): Promise<ObjectListUploadsReturnType>;
