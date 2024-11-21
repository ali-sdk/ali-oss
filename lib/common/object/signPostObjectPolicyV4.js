'use strict';

const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.signPostObjectPolicyV4 = void 0;
const dateformat_1 = __importDefault(require('dateformat'));
const getStandardRegion_1 = require('../utils/getStandardRegion');
const policy2Str_1 = require('../utils/policy2Str');
const signUtils_1 = require('../signUtils');

function signPostObjectPolicyV4(policy, date) {
  const policyStr = Buffer.from(policy2Str_1.policy2Str(policy), 'utf8').toString('base64');
  const formattedDate = dateformat_1.default(date, "UTC:yyyymmdd'T'HHMMss'Z'");
  const onlyDate = formattedDate.split('T')[0];
  const signature = signUtils_1.getSignatureV4(
    this.options.accessKeySecret,
    onlyDate,
    getStandardRegion_1.getStandardRegion(this.options.region),
    policyStr
  );
  return signature;
}
exports.signPostObjectPolicyV4 = signPostObjectPolicyV4;
