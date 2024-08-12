/// <reference types="node" />
declare type frameData = {
    payload: payloadType;
    version: number;
    frameType: number;
    payloadLength: number;
    headerCheckSum: number;
    payloadCheckSum: number;
};
declare type payloadType = {
    offset: number;
    frameType: string;
    data?: string;
    totalScannedBytes?: number;
    httpStatusCode?: number;
    errorMessage?: string;
};
declare const _default: (data: Buffer) => frameData;
export default _default;
