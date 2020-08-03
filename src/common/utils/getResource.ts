import { encoder } from './encoder';

export function getResource(params, headerEncoding) {
  let resource = '/';
  if (params.bucket) resource += `${params.bucket}/`;
  if (params.object) resource += encoder(params.object, headerEncoding);

  return resource;
}
