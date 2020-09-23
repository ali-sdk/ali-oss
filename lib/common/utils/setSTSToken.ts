import { formatObjKey } from './formatObjKey';

export async function setSTSToken(this: any) {
  if (!this.options) this.options = {};
  let credentials = await this.options.refreshSTSToken();
  credentials = formatObjKey(credentials, 'firstLowerCase');
  if (credentials.securityToken) {
    credentials.stsToken = credentials.securityToken;
  }
  Object.assign(this.options, credentials);
}
