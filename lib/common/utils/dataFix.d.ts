interface Rename {
    [propName: string]: string;
}
interface Config {
    lowerFirst?: boolean;
    rename?: Rename;
    remove?: string[];
    camel?: string[];
    bool?: string[];
}
export declare function dataFix(o: object, conf: Config, finalKill?: Function): typeof dataFix | undefined;
export {};
