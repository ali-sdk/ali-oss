export function policy2Str(policy: string | object) {
  let policyStr;
  if (policy) {
    if (typeof policy === 'string') {
      try {
        policyStr = JSON.stringify(JSON.parse(policy));
      } catch (err) {
        throw new Error(`Policy string is not a valid JSON: ${err.message}`);
      }
    } else {
      policyStr = JSON.stringify(policy);
    }
  }
  return policyStr;
}
