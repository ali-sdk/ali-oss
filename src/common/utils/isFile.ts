export const isFile = (obj: any): obj is File => {
  return typeof (File) !== 'undefined' && obj instanceof File;
};
