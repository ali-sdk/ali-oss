import { checkBucketName } from './checkBucketName';
import { objectName } from './objectName';

export function getSourceName(sourceName, bucketName, configBucket) {
  if (typeof bucketName === 'string') {
    sourceName = objectName(sourceName);
  } else if (sourceName[0] !== '/') {
    bucketName = configBucket;
  } else {
    bucketName = sourceName.replace(/\/(.+?)(\/.*)/, '$1');
    sourceName = sourceName.replace(/(\/.+?\/)(.*)/, '$2');
  }

  checkBucketName(bucketName, false);

  sourceName = encodeURIComponent(sourceName);

  sourceName = `/${bucketName}/${sourceName}`;
  return sourceName;
}
