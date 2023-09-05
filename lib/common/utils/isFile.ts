export const isFile = obj => {
  return typeof File !== 'undefined' && obj instanceof File;
};
