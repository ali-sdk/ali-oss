import { Client } from "../../setConfig";

export function isCancel(this: Client) {
  return this.options.cancelFlag;
}
