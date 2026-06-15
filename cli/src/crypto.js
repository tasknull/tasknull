'use strict';
// Core cryptography for the tasknull CLI — Node's standard `crypto` only, no deps.
// Ed25519 keys (Solana's signature scheme), SHA-256 commitments/nullifiers, and
// base58-encoded public keys (Solana address format).
const crypto = require('crypto');
const fs = require('fs');

const DOMAIN = 'tasknull-v1';
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function sha256(...parts) {
  const h = crypto.createHash('sha256');
  for (const p of parts) h.update(Buffer.isBuffer(p) ? p : Buffer.from(String(p)));
  return h.digest('hex');
}

// ---- base58 (Bitcoin / Solana alphabet) ----
function b58encode(buf) {
  const digits = [0];
  for (let i = 0; i < buf.length; i++) {
    let carry = buf[i];
    for (let j = 0; j < digits.length; j++) { carry += digits[j] << 8; digits[j] = carry % 58; carry = (carry / 58) | 0; }
    while (carry) { digits.push(carry % 58); carry = (carry / 58) | 0; }
  }
  let str = '';
  for (let i = 0; i < buf.length && buf[i] === 0; i++) str += '1';
  for (let i = digits.length - 1; i >= 0; i--) str += B58[digits[i]];
  return str;
}
function b58decode(str) {
  const bytes = [0];
  for (let i = 0; i < str.length; i++) {
    const val = B58.indexOf(str[i]);
    if (val < 0) throw new Error('invalid base58 character');
    let carry = val;
    for (let j = 0; j < bytes.length; j++) { carry += bytes[j] * 58; bytes[j] = carry & 0xff; carry >>= 8; }
    while (carry) { bytes.push(carry & 0xff); carry >>= 8; }
  }
  for (let i = 0; i < str.length && str[i] === '1'; i++) bytes.push(0);
  return Buffer.from(bytes.reverse());
}

// 32-byte identity secret — never leaves the machine, never goes on-chain.
function newSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// Ed25519 keypair. Returns the private key (PEM, for signing) and the public key
// as a base58 Solana address (the 32-byte Ed25519 pubkey, base58-encoded).
function newKeypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const raw = Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url');
  return {
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    address: b58encode(raw),
  };
}

// Rebuild an Ed25519 public key object from a base58 Solana address.
function pubFromAddress(addr) {
  const x = b58decode(addr).toString('base64url');
  return crypto.createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x }, format: 'jwk' });
}

// Validate a Solana address: base58 that decodes to a 32-byte key.
function isAddress(s) {
  try { return typeof s === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s) && b58decode(s).length === 32; }
  catch (_) { return false; }
}

// One-way nullifier: deterministic per (secret, bounty); reveals nothing about the secret.
function nullifier(secretHex, bounty) {
  return sha256(DOMAIN + ':NUL', Buffer.from(secretHex, 'hex'), bounty);
}

// Hiding commitment binding a solution to a bounty under your secret.
function commitment(secretHex, bounty, solutionHashHex) {
  return sha256(DOMAIN + ':COM', bounty, Buffer.from(solutionHashHex, 'hex'), Buffer.from(secretHex, 'hex'));
}

function hashFile(path) {
  return sha256(fs.readFileSync(path));
}

function sign(privateKeyPem, message) {
  const key = crypto.createPrivateKey(privateKeyPem);
  return crypto.sign(null, Buffer.from(message), key).toString('base64');
}

function verifySig(address, message, signatureB64) {
  try {
    return crypto.verify(null, Buffer.from(message), pubFromAddress(address), Buffer.from(signatureB64, 'base64'));
  } catch (_) {
    return false;
  }
}

module.exports = {
  DOMAIN, sha256, b58encode, b58decode, newSecret, newKeypair, pubFromAddress,
  isAddress, nullifier, commitment, hashFile, sign, verifySig,
};
