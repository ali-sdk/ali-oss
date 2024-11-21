interface IRestoreInfo {
  /**
   * Whether the restoration is ongoing
   * If a RestoreObject request is sent but the restoration is not complete, the value is true.
   * If a RestoreObject request is sent and the restoration is complete, the value is false.
   */
  ongoingRequest: boolean;
  /**
   * The time before which the restored object can be read.
   * If a RestoreObject request is sent but the restoration is not complete, the value is undefined.
   * If a RestoreObject request is sent and the restoration is complete, the value is Date.
   */
  expiryDate?: Date;
}
export declare const parseRestoreInfo: (originalRestoreInfo?: string | undefined) => IRestoreInfo | undefined;
export {};
