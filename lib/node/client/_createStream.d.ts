/// <reference types="node" />
import { Readable } from 'stream';
export declare function _createStream(file: Readable | File | Buffer | string, start: number, end: number): Promise<Readable>;
