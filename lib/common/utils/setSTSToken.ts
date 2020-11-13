import { formatObjKey } from './formatObjKey';

export async function setSTSToken(this: any) {
  if (!this.options) this.options = {};
  let credentials = await this.options.refreshSTSToken();
  credentials = formatObjKey(credentials, 'firstLowerCase');
  if (credentials.securityToken) {
    credentials.stsToken = credentials.securityToken;
  }
  checkCredentials(credentials);
  Object.assign(this.options, credentials);
}

function checkCredentials(obj) {
  const stsTokenKey = ['accessKeySecret', 'accessKeyId', 'stsToken'];
  const objKeys = Object.keys(obj);
  stsTokenKey.forEach(_ => {
    if (!objKeys.find(key => key === _)) {
      throw Error(`refreshSTSToken must return contains ${_}`);
    }
  });
}
