type frameData = {
  payload: payloadType;
  version: number;
  frameType: number;
  payloadLength: number;
  headerCheckSum: number;
  payloadCheckSum: number;
};

type payloadType = {
  offset: number;
  frameType: string;
  data?: string;
  totalScannedBytes?: number;
  httpStatusCode?: number;
  errorMessage?: string;
};

// all integers in Frame are encoded in big endian and Version is currently 1.
export default (data: Buffer): frameData => {
  const payload: payloadType = { frameType: '', offset: 0 };

  const version = data.readUIntBE(0, 1);
  const frameType = data.readUIntBE(1, 3);
  const payloadLength = data.readUIntBE(4, 4);
  const headerCheckSum = data.readUIntBE(8, 4);
  const payloadCheckSum = data.readUIntBE(data.length - 4, 4);

  // payload offset
  payload.offset = parseInt(data.slice(12, 20).toString('hex'), 16);

  /**
   *  Frame Type
   *  8388609 - Data Frame
   *  8388612 - Continuous Frame
   *  8388613 - End Frame
   */
  if (frameType === 8388609) {
    payload.frameType = 'DataFrame';
    payload.data = data.slice(20, 12 + payloadLength).toString();
  } else if (frameType === 8388612) {
    payload.frameType = 'ContinuousFrame';
  } else if (frameType === 8388613) {
    payload.frameType = 'End Frame';
    payload.totalScannedBytes = data.readUIntBE(20, 8);
    payload.httpStatusCode = data.readUIntBE(28, 4);
    payload.errorMessage = data.slice(32, data.length - 4).toString();
  }

  return {
    payload,
    version,
    frameType,
    payloadCheckSum,
    payloadLength,
    headerCheckSum
  };
};
