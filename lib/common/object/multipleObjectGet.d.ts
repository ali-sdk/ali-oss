declare type MultipleObjectGetOptions = {
    parallel: number;
    path: string;
};
export declare function multipleObjectGet(this: any, objects: string[], options: MultipleObjectGetOptions): Promise<any>;
export {};
