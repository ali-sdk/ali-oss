import { Client } from '../../setConfig';

export function _stop(this: Client) {
  this.options.cancelFlag = true;
}
