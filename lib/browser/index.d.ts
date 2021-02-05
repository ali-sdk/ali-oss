import { OSS } from './core';
import * as object from './object';
import * as multipart from './multipart';
declare type IObject = typeof object;
declare type IMultipart = typeof multipart;
declare module './core' {
    interface OSS extends IObject, IMultipart {
    }
}
export default OSS;
