declare type queueOptionsType = {
    limit: number;
};
/**
 * @param {any[]} argList - the arugments list for customFunc
 * @param {Function} customFunc - customFunc
 * @param {Object} options -  limit default5
 */
export declare function queueTask(this: any, argList: any[], customFunc: Function, options?: queueOptionsType): Promise<unknown>;
export {};
