export function isAsync(func: Function): boolean {
  return func.constructor.name === 'AsyncFunction';
}
