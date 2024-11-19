interface IRestoreInfo {
  ongoingRequest: boolean;
  expiryDate?: Date;
}

export const parseRestoreInfo = (originalRestoreInfo?: string): IRestoreInfo | undefined => {
  let tempRestoreInfo: IRestoreInfo | undefined;

  if (originalRestoreInfo) {
    tempRestoreInfo = {
      ongoingRequest: originalRestoreInfo.includes('true')
    };

    if (!tempRestoreInfo.ongoingRequest) {
      const matchArray = originalRestoreInfo.match(/expiry-date="(.*)"/);

      if (matchArray && matchArray[1]) {
        tempRestoreInfo.expiryDate = new Date(matchArray[1]);
      }
    }
  }

  return tempRestoreInfo;
};
