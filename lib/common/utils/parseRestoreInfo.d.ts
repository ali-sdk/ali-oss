interface IRestoreInfo {
  ongoingRequest: boolean;
  expiryDate?: Date;
}
export declare const parseRestoreInfo: (originalRestoreInfo?: string | undefined) => IRestoreInfo | undefined;
export {};
