import { obj2xml } from '../utils/obj2xml';
import { base64encode } from 'utility';

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

export async function selectObject(
  this: any,
  name: string,
  expression: string,
  process: string,
  options: any
) {
  if (!['json', 'csv'].includes(process.toLocaleLowerCase())) {
    throw new Error('process must be json or csv');
  }
  const opts = Object.assign({}, options);

  opts.subres = `x-oss-process=${process}/select`;
  console.log('expression', expression);
  console.log('opt', opts);
  const needToEncode = ['RecordDelimiter', 'FieldDelimiter', 'QuoteCharacter', 'CommentCharacter'];

  let InputSerialization: InputSerialization = {};
  let OutputSerialization: OutputSerialization = {};
  let Options: Other = {};

  // CompressionType
  if (opts.InputSerialization && opts.InputSerialization.CompressionType) {
    InputSerialization.CompressionType = opts.InputSerialization.CompressionType;
  } else {
    InputSerialization.CompressionType = 'None';
  }

  // CSV
  if (process.toLocaleLowerCase() === 'csv') {
    //inputSerialization
    if (opts.InputSerialization && opts.InputSerialization.CSV) {
      Object.keys(opts.InputSerialization.CSV).forEach(i => {
        if (needToEncode.includes(i)) {
          opts.InputSerialization.CSV[i] = base64encode(opts.InputSerialization.CSV[i]);
        }
      });
      InputSerialization = Object.assign({}, opts.InputSerialization);
    }

    //OutputSerialization
    if (opts.OutputSerialization && opts.OutputSerialization.CSV) {
      Object.keys(opts.OutputSerialization.CSV).forEach(i => {
        if (needToEncode.includes(i)) {
          opts.OutputSerialization.CSV[i] = base64encode(opts.OutputSerialization.CSV[i]);
        }
      });
      OutputSerialization = Object.assign(
        { EnablePayloadCrc: true, OutputHeader: false },
        opts.OutputSerialization
      );
    }
  }

  //JSON
  if (process.toLowerCase() === 'json') {
    //InputSerialization
    if (opts.InputSerialization && opts.InputSerialization.JSON) {
      opts.InputSerialization.JSON.Type = opts.InputSerialization.JSON.Type
        ? opts.InputSerialization.JSON.Type.toUpperCase()
        : 'DOCUMENT';

      opts.InputSerialization.JSON = Object.assign(
        { ParseJsonNumberAsString: false, EnablePayloadCrc: true },
        opts.inputSerialization.JSON
      );
    }
    InputSerialization = Object.assign({}, opts.InputSerialization);

    //OutputSerialization
    if (opts.OutputSerialization && opts.OutputSerialization.JSON) {
      if (opts.OutputSerialization.JSON.RecordDelimiter) {
        opts.OutputSerialization.JSON.RecordDelimiter = base64encode(
          opts.OutputSerialization.JSON.RecordDelimiter
        );
      }
    }
    OutputSerialization = Object.assign({ OutputRawData: false }, opts.OutputSerialization);
  }

  //Options
  if (opts.Other) {
    Options = Object.assign(
      { SkipPartialDataRecord: false, MaxSkippedRecordsAllowed: 0 },
      opts.Other
    );
  }

  const paramsXMLObj = {
    SelectRequest: {
      Expression: base64encode(expression),
      InputSerialization,
      OutputSerialization,
      Options
    }
  };

  const params = this._objectRequestParams('POST', name, opts);
  params.content = obj2xml(paramsXMLObj);
  console.log(params.content);

  // await this.request(params);
}
