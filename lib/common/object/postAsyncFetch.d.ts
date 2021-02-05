import { postAsyncFetchOptions } from '../../types/params';
import { Client } from '../../setConfig';
export declare function postAsyncFetch(this: Client, object: string, url: string, options?: postAsyncFetchOptions): Promise<object>;
