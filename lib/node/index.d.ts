/// <reference types="node" />
import { Readable } from 'stream';
import { Client } from '../setConfig';
import object from './object';
import multipart from './multipart';
import rtmp from './rtmp';
import sts from './sts';
declare class OSS extends Client {
    static STS: typeof sts;
    static ClusterClient: (this: any, options: any) => void;
    multipartUploadStreams: Readable[];
    protected sendToWormhole: any;
}
declare type IObject = typeof object;
declare type IMultipart = typeof multipart;
declare type IRtmp = typeof rtmp;
interface OSS extends IObject, IMultipart, IRtmp {
}
export default OSS;
