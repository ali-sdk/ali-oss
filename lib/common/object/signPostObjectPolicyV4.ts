import dateFormat from 'dateformat';

import { getStandardRegion } from '../utils/getStandardRegion';
import { policy2Str } from '../utils/policy2Str';
import { getSignatureV4 } from '../signUtils';

export function signPostObjectPolicyV4(this: any, policy: string | object, date: Date): string {
  const policyStr = Buffer.from(policy2Str(policy), 'utf8').toString('base64');
  const formattedDate = dateFormat(date, "UTC:yyyymmdd'T'HHMMss'Z'");
  const onlyDate = formattedDate.split('T')[0];

  const signature = getSignatureV4(
    this.options.accessKeySecret,
    onlyDate,
    getStandardRegion(this.options.region),
    policyStr
  );

  return signature;
}
