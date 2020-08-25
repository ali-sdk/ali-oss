import { GetObjectOptions } from '../../types/params';
/**
 * get
 * @param {String} name - object name
 * @param {String | Stream} file
 * @param {Object} options
 * @param {{res}}
 */
export declare function get(this: any, name: string, file: any, options?: GetObjectOptions): Promise<{
    res: any;
    content: any;
}>;
