// gf2Dim dimension of GF(2) vectors (length of CRC)
type uint64 = bigint;

const gf2Dim = 64;
// The ECMA polynomial, defined in ECMA 182.
const ECMA = BigInt('0xC96C5795D7870F42');

function gf2MatrixTimes(mat: uint64[], vec: uint64): uint64 {
  let sum = BigInt(0);
  let i = 0;
  while ((vec) !== BigInt(0)) {
    if ((vec & BigInt(1)) !== BigInt(0)) {
      sum ^= mat[i];
    }
    vec >>= BigInt(1);
    i++;
  }
  return sum;
}

function gf2MatrixSquare(square: uint64[], mat: uint64[]) {
  for (let n = 0; n < gf2Dim; n++) {
    square[n] = gf2MatrixTimes(mat, mat[n]);
  }
}

/** above Nodejs v10.4 */
export const SUPPORT_BIGINT = typeof BigInt === 'function';

// CRC64Combine combines CRC64
export function CRC64Combine(crc1: number | bigint | string, crc2: number | bigint | string, len2: number): string {
  // Degenerate case
  if (len2 === 0) {
    return (crc1).toString();
  }
  crc1 = BigInt(crc1);
  crc2 = BigInt(crc2);
  // Even-power-of-two zeros operator
  const even: uint64[] = new Array(gf2Dim).fill(BigInt(0));
  // Odd-power-of-two zeros operator
  const odd: uint64[] = new Array(gf2Dim).fill(BigInt(0));
  // Put operator for one zero bit in odd
  odd[0] = ECMA;
  let row = BigInt(1);
  for (let n = 1; n < gf2Dim; n++) {
    odd[n] = row;
    row <<= BigInt(1);
  }

  // Put operator for two zero bits in even
  gf2MatrixSquare(even, odd);

  // Put operator for four zero bits in odd
  gf2MatrixSquare(odd, even);

  // Apply len2 zeros to crc1, first square will put the operator for one zero byte, eight zero bits, in even
  while (true) {
    // Apply zeros operator for this bit of len2
    gf2MatrixSquare(even, odd);

    if ((len2 & 1) !== 0) {
      crc1 = gf2MatrixTimes(even, crc1);
    }

    len2 >>= 1

    // If no more bits set, then done
    if (len2 === 0) {
      break;
    }

    // Another iteration of the loop with odd and even swapped
    gf2MatrixSquare(odd, even);
    if ((len2 & 1) !== 0) {
      crc1 = gf2MatrixTimes(odd, crc1);
    }
    len2 >>= 1;

    // If no more bits set, then done
    if (len2 === 0) {
      break;
    }
  }

  // Return combined CRC
  crc1 ^= crc2;
  return (crc1).toString();
}
