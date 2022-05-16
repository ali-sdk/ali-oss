import { obj2xml } from '../utils/obj2xml';
import { Base64 } from 'js-base64';
import unpackFrame from '../utils/unpackFrame';

type InputCSV = {
  FileHeaderInfo?: string;
  FieldDelimiter?: string;
  RecordDelimiter?: string;
  QuoteCharacter?: string;
  CommentCharacter?: string;
  Range?: string;
  AllowQuotedRecordDelimiter?: boolean;
};
type OutputCSV = {
  RecordDelimiter?: string;
  FieldDelimiter?: string;
};

type InputJSON = {
  Type?: string;
  Range?: string;
  ParseJsonNumberAsString?: boolean;
};

type OutputJSON = {
  RecordDelimiter?: string;
};

type InputSerialization = {
  CompressionType?: string;
  CSV?: InputCSV;
  JSON?: InputJSON;
};

type OutputSerialization = {
  CSV?: OutputCSV;
  JSON?: OutputJSON;
  OutputRawData?: boolean;
  KeepAllColumns?: boolean;
  EnablePayloadCrc?: boolean;
  OutputHeader?: boolean;
};

type Other = {
  SkipPartialDataRecord?: boolean;
  MaxSkippedRecordsAllowed?: number;
};

type SelectRequest = {
  Expression?: string;
  InputSerialization?: InputSerialization;
  OutputSerialization?: OutputSerialization;
  Options?: Other;
};

type ParamsXMLObj = {
  SelectRequest: SelectRequest;
};

const needToEncode: string[] = ['RecordDelimiter', 'FieldDelimiter', 'QuoteCharacter', 'CommentCharacter'];

export async function selectObject(this: any, name: string, expression: string, grammar: string, options: any) {
  if (!['json', 'csv'].includes(grammar.toLocaleLowerCase())) {
    throw new Error('grammar must be json or csv');
  }
  const opts = Object.assign({}, options);

  opts.subres = Object.assign({ 'x-oss-process': `${grammar}/select` });

  let InputSerialization: InputSerialization;
  let OutputSerialization: OutputSerialization;
  let Options: Other;

  const paramsXMLObj: ParamsXMLObj = {
    SelectRequest: {
      Expression: Base64.encode(expression)
    }
  };

  // CompressionType
  if (opts.InputSerialization) {
    opts.InputSerialization.CompressionType = opts.InputSerialization.CompressionType
      ? opts.InputSerialization.CompressionType
      : 'None';
  }

  // CSV
  if (grammar.toLocaleLowerCase() === 'csv') {
    // inputSerialization
    if (opts.InputSerialization && opts.InputSerialization.CSV) {
      Object.keys(opts.InputSerialization.CSV).forEach(i => {
        if (needToEncode.includes(i)) {
          opts.InputSerialization.CSV[i] = Base64.encode(opts.InputSerialization.CSV[i]);
        }
      });
    }
    InputSerialization = Object.assign({}, opts.InputSerialization);
    paramsXMLObj.SelectRequest.InputSerialization = InputSerialization;

    // OutputSerialization
    if (opts.OutputSerialization && opts.OutputSerialization.CSV) {
      Object.keys(opts.OutputSerialization.CSV).forEach(i => {
        if (needToEncode.includes(i)) {
          opts.OutputSerialization.CSV[i] = Base64.encode(opts.OutputSerialization.CSV[i]);
        }
      });
    }
    OutputSerialization = Object.assign({}, opts.OutputSerialization);
    paramsXMLObj.SelectRequest.OutputSerialization = OutputSerialization;
  }

  // JSON
  if (grammar.toLowerCase() === 'json') {
    // InputSerialization
    if (opts.InputSerialization && opts.InputSerialization.JSON) {
      opts.InputSerialization.JSON.Type = opts.InputSerialization.JSON.Type
        ? opts.InputSerialization.JSON.Type.toUpperCase()
        : 'DOCUMENT';

      opts.InputSerialization.JSON = Object.assign({}, opts.inputSerialization.JSON);
    }
    InputSerialization = Object.assign({}, opts.InputSerialization);
    paramsXMLObj.SelectRequest.InputSerialization = InputSerialization;

    // OutputSerialization
    if (opts.OutputSerialization && opts.OutputSerialization.JSON) {
      if (opts.OutputSerialization.JSON.RecordDelimiter) {
        opts.OutputSerialization.JSON.RecordDelimiter = Base64.encode(opts.OutputSerialization.JSON.RecordDelimiter);
      }
    }
    OutputSerialization = Object.assign({}, opts.OutputSerialization);
    paramsXMLObj.SelectRequest.OutputSerialization = OutputSerialization;
  }

  // Options
  if (opts.Other) {
    Options = Object.assign({}, opts.Other);
    paramsXMLObj.SelectRequest.Options = Options;
  }

  const params = this._objectRequestParams('POST', name, opts);
  params.content = obj2xml(paramsXMLObj);
  params.mime = 'xml';
  params.successStatuses = [206];

  const result = await this.request(params);
  if (result.res.headers['x-oss-select-output-raw'] !== 'true') {
    result.data = unpackFrame(result.data);
  } else {
    result.data = result.data.toString();
  }

  return {
    res: result.res,
    data: result.data
  };
}
