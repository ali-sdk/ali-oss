import { Client } from "../../setConfig";

export function resetCancelFlag(this: Client) {
  this.options.cancelFlag = false;
}
