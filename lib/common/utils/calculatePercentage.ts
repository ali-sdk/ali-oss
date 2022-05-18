export const calculatePercentage = (fileSize: number, partList: any) => {
  const result = { percentage: 0, loaded: 0, total: fileSize };
  Object.keys(partList).forEach(i => {
    result.loaded += partList[i].loaded;
  });
  result.percentage = (result.loaded / fileSize) * 100;
  return result;
};
