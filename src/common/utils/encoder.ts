import { THeaderEncoding } from '../../types/experimental';

export function encoder(str: string, encoding: THeaderEncoding = 'utf-8') {
  if (encoding === 'utf-8') return str;
  return Buffer.from(str).toString('latin1');
}
