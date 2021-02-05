import { Duplex, Readable, Stream, Writable } from 'stream';


function isStream(obj: any): obj is Stream {
  return obj instanceof Stream;
}


export function isReadable(obj: any): obj is Readable {
  return isStream(obj) && typeof (obj as any)._read === 'function' && typeof (obj as any)._readableState === 'object';
}


export function isWritable(obj: any): obj is Writable {
  return isStream(obj) && typeof (obj as any)._write === 'function' && typeof (obj as any)._writableState === 'object';
}


export function isDuplex(obj: any): obj is Duplex {
  return isReadable(obj) && isWritable(obj);
}