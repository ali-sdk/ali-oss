interface Config {
    exclude?: string[];
}
declare type FormatObjKeyType = 'firstUpperCase' | 'firstLowerCase';
export declare function formatObjKey(obj: any, type: FormatObjKeyType, options?: Config): any;
export {};
