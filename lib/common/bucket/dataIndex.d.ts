export declare function openMetaQuery(
  this: any,
  bucketName: string,
  options?: {}
): Promise<{
  res: any;
  status: any;
}>;
export declare function getMetaQueryStatus(
  this: any,
  bucketName: string,
  options?: {}
): Promise<{
  res: any;
  status: any;
  phase: any;
  state: any;
  createTime: any;
  updateTime: any;
}>;
interface ISubQuerie {
  field?: string;
  value?: string;
  operation: string;
  subQueries?: ISubQuerie[];
}
interface IAggregation {
  field: string;
  operation: string;
}
interface IMetaQuery {
  nextToken?: string;
  maxResults?: number;
  query: ISubQuerie;
  sort?: string;
  order?: 'asc' | 'desc';
  aggregations?: IAggregation[];
}
export declare function doMetaQuery(
  this: any,
  bucketName: string,
  queryParam: IMetaQuery,
  options?: {}
): Promise<{
  res: any;
  status: any;
  nextToken: any;
  files: any;
  aggregations: any;
}>;
export declare function closeMetaQuery(
  this: any,
  bucketName: string,
  options?: {}
): Promise<{
  res: any;
  status: any;
}>;
export {};
