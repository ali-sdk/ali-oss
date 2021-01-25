import { NormalSuccessResponse } from './params';

export interface RTMPGetLiveChannelStatReturnType extends NormalSuccessResponse {
  data: {
    Status: 'Disabled' | 'Idle'
  } | {
    Status: 'Live';
    ConnectedTime: string;
    RemoteAddr: string;
    Video: {
      Width: string;
      Heigth: string;
      FrameRate: string;
      Bandwidth: string;
      Codec: string;
    };
    Audio: {
      SampleRate: string;
      Bandwidth: string;
      Codec: string;
    }
  }
}

export interface RTMPListLiveChannelReturnType extends NormalSuccessResponse {
  channels: Array<{
    Name: string;
    Description: string;
    Status: string;
    LastModified: string;
    PublishUrls: string[];
    PlayUrls: string[];
  }>,
  nextMarker: string | null,
  isTruncated: boolean,
}
