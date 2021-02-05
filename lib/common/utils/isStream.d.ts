/// <reference types="node" />
import { Duplex, Readable, Writable } from 'stream';
export declare function isReadable(obj: any): obj is Readable;
export declare function isWritable(obj: any): obj is Writable;
export declare function isDuplex(obj: any): obj is Duplex;
