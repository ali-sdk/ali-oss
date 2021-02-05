import { Client } from "../../setConfig";

export function setSLDEnabled(this: Client, enable: boolean) {
  this.options.sldEnable = !!enable;
  return this;
}
