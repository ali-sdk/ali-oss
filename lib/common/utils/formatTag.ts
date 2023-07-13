import { isObject } from './isObject';

export function formatTag(obj) {
  if (obj.Tagging !== undefined) {
    obj = obj.Tagging.TagSet.Tag;
  } else if (obj.TagSet !== undefined) {
    obj = obj.TagSet.Tag;
  } else if (obj.Tag !== undefined) {
    obj = obj.Tag;
  }

  obj = obj && isObject(obj) ? [obj] : obj || [];

  const tag = {};
  obj.forEach(item => {
    tag[item.Key] = item.Value;
  });

  return tag;
}
