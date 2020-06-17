/// <reference types="node" />
import { Readable } from 'stream';
export declare class WebFileReadStream extends Readable {
    private file;
    private reader;
    private start;
    private finish;
    private fileBuffer;
    constructor(file: any, options?: {});
    readFileAndPush(size: any): void;
    _read(size: any): void;
}
