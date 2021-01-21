declare module 'is-type-of' {
  import { Readable, Writable } from 'stream';

  export function string(p: any): p is string;
  export function readableStream(p: any): p is Readable;
  export function writableStream(p: any): p is Writable;
  export function array(p: any): p is any[];
}
