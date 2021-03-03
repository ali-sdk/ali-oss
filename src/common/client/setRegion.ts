import { Client } from '../../setConfig';
import { checkValidRegion } from '../utils/checkValid';
import { getActualEndpointByRegion } from './initOptions';

export function setRegion(this: Client, region: string) {
  checkValidRegion(region);
  this.options.region = region;
  this.options.endpoint = getActualEndpointByRegion(region, this.options.internal, this.options.secure);
  return this;
}
