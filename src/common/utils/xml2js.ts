
import { isArray } from './isArray';
import { isObject } from './isObject';

const ncname = '[a-zA-Z_][\\w\\-\\.]*';
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`);
const startTagClose = /^\s*>/;
const startTagSelfClose = /^\s*\/>/;
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
const headLine = /<?.*version=.*?>/;
const decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t',
  '&#39;': "'"
};
const encodedAttr = /&(?:lt|gt|quot|amp|#39);/g;
const encodedAttr1 = /&#([0-9]?[0-9]?[0-9]);/g;

function decodeAttr(value) {
  return value
    .replace(encodedAttr, (match) => decodingMap[match])
    .replace(encodedAttr1, (match) =>
      String.fromCharCode(match.replace(/[^0-9]/g, '')));
}

function unique(arr) {
  if (!isArray(arr)) {
    return arr;
  }
  const uniqueArr: any = [];
  arr.forEach((item) => {
    const hasTag = uniqueArr.find(_ => _.tag === item.tag);
    if (hasTag && hasTag.children) {
      const index = Object.keys(hasTag).filter(_ => _.startsWith('children')).length;
      hasTag[`children${index}`] = item.children;
    } else {
      uniqueArr.push(item);
    }
  });
  return uniqueArr;
}

function formatObj(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  let o: any = {};
  if (isObject(obj)) {
    if (obj.children) {
      obj.children = unique(obj.children);
    }
    const children = Object.entries(obj).filter(_ => _[0].startsWith('children')).map(_ => _[1]);
    if (children.length > 1) {
      o[obj.tag] = children.map(_ => formatObj(_));
    } else {
      o[obj.tag] = formatObj(children[0]);
    }
  }
  if (isArray(obj)) {
    if (obj.length === 0) {
      return '';
    }
    if (obj.find(_ => !_.tag)) {
      o = [];
    }

    for (let i = 0; i < obj.length; i++) {
      const _ = obj[i];
      Object.keys(_).filter(key => key.startsWith('children')).forEach(key => {
        _[key] = unique(_[key]);
      });

      if (isArray(o)) {
        if (_.tag) {
          o.push({ [_.tag]: formatObj(_.children) });
        } else {
          o.push(formatObj(_));
        }
      } else {
        const children = Object.entries(_).filter(item => item[0].startsWith('children')).map(item => item[1]);
        if (children.length > 1) {
          o[_.tag] = children.map(item => formatObj(item));
        } else {
          o[_.tag] = formatObj(children[0]);
        }
      }
    }
  }

  return o;
}

function xml2obj(html, options = {
  explicitRoot: false,
  explicitArray: false
}) {
  const stack: any = [];
  const stackInner: any = [];
  let root;
  let currentParent;
  let index = 0;
  let last;

  if (typeof html !== 'string') {
    html = html.toString();
  }
  html = html.replace(headLine, '');

  if (root === undefined && html === '') {
    return null;
  }

  while (html) {
    last = html;
    const textEnd = html.indexOf('<');
    if (textEnd === 0) {
      // End tag:
      const endTagMatch = html.match(endTag);
      if (endTagMatch) {
        advance(endTagMatch[0].length);
        parseEndTag(endTagMatch[0], endTagMatch[1], index, index);
        continue;
      }

      // Start tag:
      const startTagMatch = parseStartTag();
      if (startTagMatch) {
        handleStartTag(startTagMatch);
        continue;
      }
    }

    let text = 0;
    if (textEnd > 0) {
      text = html.substring(0, textEnd);
      advance(textEnd);
    }

    if (textEnd < 0) {
      text = html;
      html = '';
    }

    if (handleChars && text) {
      handleChars(text);
    }

    if (html === last && handleChars) {
      handleChars(html);
      break;
    }
  }

  parseEndTag();

  root = formatObj(root);

  if (!options.explicitRoot) {
    root = root[Object.keys(root)[0]];
  }

  return root;

  function advance(n) {
    index += n;
    html = html.substring(n);
  }

  function parseStartTag() {
    const start = html.match(startTagOpen);
    if (start) {
      const match: any = {
        tagName: start[1],
        start: index
      };
      advance(start[0].length);
      const endSelf = html.match(startTagSelfClose);
      if (endSelf) {
        html = html.replace(startTagSelfClose, _ => _.replace('/>', `></${start[1]}>`));
      }
      const end = html.match(startTagClose);
      if (end) {
        advance(end[0].length);
        match.end = index;
        return match;
      }
    }
    return false;
  }

  function handleStartTag(match) {
    const { tagName } = match;
    stackInner.push({ tag: tagName });

    handleStart(tagName);
  }

  function parseEndTag(_tag?, tagName: string = '', start: any = null, end: any = null) {
    let pos;
    if (start == null) {
      start = index;
    }
    if (end == null) {
      end = index;
    }

    if (tagName) {
      const needle = tagName.toLowerCase();
      for (pos = stackInner.length - 1; pos >= 0; pos--) {
        if (stackInner[pos].tag.toLowerCase() === needle) {
          break;
        }
      }
    } else {
      pos = 0;
    }

    if (pos >= 0) {
      for (let i = stackInner.length - 1; i >= pos; i--) {
        handleEnd();
      }

      stackInner.length = pos;
    }
  }

  function handleStart(tag) {
    const element = {
      tag,
      children: []
    };

    if (!root) {
      root = element;
    }
    if (currentParent) {
      currentParent.children.push(element);
    }
    currentParent = element;
    stack.push(element);
  }

  function handleEnd() {
    stack.length -= 1;
    currentParent = stack[stack.length - 1];
  }

  function handleChars(text) {
    if (!currentParent) {
      return;
    }

    // text = text.trim();
    if (text.trim()) {
      currentParent.children = decodeAttr(text);
    }
  }
}

export function xml2objPromise(...args) {
  return new Promise((resolve, reject) => {
    try {
      const result = xml2obj(args);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

export function parseString(str, options, cb) {
  try {
    const result = xml2obj(str, options);
    cb(null, result)
  } catch (error) {
    cb(error, null)
  }
}


export default {
  xml2obj,
  xml2objPromise,
  parseString
}