declare type queueOptionsType = {
    retry: number;
    limit: number;
};
/**
 * @param {any[]} argList - the arugments list for customFunc
 * @param {Function} customFunc - customFunc
 * @param {Object} options - retry default 3 limit default5
 *
 */
export declare function queueTask(argList: any[], customFunc: Function, options?: queueOptionsType): {
    sucessList: any[];
    errorList: any[];
};
export {};
