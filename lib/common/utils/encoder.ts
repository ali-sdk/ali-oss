export function encoder(str: string, encoding = 'utf-8') {
  if (encoding === 'utf-8') return str;
  return Buffer.from(str).toString('latin1');
}