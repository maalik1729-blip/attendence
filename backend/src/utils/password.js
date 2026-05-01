const crypto = require('crypto');

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*';
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function pick(set) {
  return set[crypto.randomInt(0, set.length)];
}

/**
 * Cryptographically-strong random password.
 * Guarantees at least one of each category.
 */
function generatePassword(length = 12) {
  if (length < 8) length = 8;
  const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  const rest = Array.from({ length: length - required.length }, () => pick(ALL));
  const arr = [...required, ...rest];
  // Fisher–Yates shuffle using crypto
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

module.exports = { generatePassword };
