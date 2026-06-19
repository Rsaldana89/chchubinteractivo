const crypto = require('crypto');

const DEFAULT_PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64');
  const hash = crypto.scryptSync(password, salt, DEFAULT_PARAMS.keylen, {
    N: DEFAULT_PARAMS.N,
    r: DEFAULT_PARAMS.r,
    p: DEFAULT_PARAMS.p,
    maxmem: 64 * 1024 * 1024
  }).toString('base64');
  return `scrypt$${DEFAULT_PARAMS.N}$${DEFAULT_PARAMS.r}$${DEFAULT_PARAMS.p}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, NText, rText, pText, salt, expectedBase64] = parts;
  const N = Number(NText);
  const r = Number(rText);
  const p = Number(pText);
  const expected = Buffer.from(expectedBase64, 'base64');
  const actual = crypto.scryptSync(password, salt, expected.length, {
    N,
    r,
    p,
    maxmem: 64 * 1024 * 1024
  });

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = { hashPassword, verifyPassword };
