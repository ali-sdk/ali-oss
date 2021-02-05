import { Client } from "../../setConfig";

export function getBucket(this: Client) {
  return this.options.bucket;
}
