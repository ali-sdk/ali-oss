import { buildCanonicalString, computeSignature } from './signUtils';

export function authorization(method, resource, subres, headers, config) {
  const stringToSign = buildCanonicalString(method.toUpperCase(), resource, {
    headers,
    parameters: subres
  });

  return `OSS ${config.accessKeyId}:${computeSignature(config.accessKeySecret, stringToSign)}`;
}
