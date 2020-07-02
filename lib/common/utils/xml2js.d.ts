declare function xml2obj(html: any, options?: {
    explicitRoot: boolean;
    explicitArray: boolean;
}): any;
export declare function xml2objPromise(...args: any[]): Promise<unknown>;
export declare function parseString(str: any, options: any, cb: any): void;
declare const _default: {
    xml2obj: typeof xml2obj;
    xml2objPromise: typeof xml2objPromise;
    parseString: typeof parseString;
};
export default _default;
