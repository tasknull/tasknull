'use strict';
// Core cryptography for the tasknull CLI — built on Node's standard `crypto`
// module (no external dependencies). Ed25519 signatures + SHA-256 commitments
// and nullifiers.
const crypto = require('crypto');
const fs = require('fs');

const DOMAIN = 'tasknull-v1';

function sha256(...parts) {
  const h = crypto.createHash('sha256');
  for (const p of parts) h.update(Buffer.isBuffer(p) ? p : Buffer.from(String(p)));
  return h.digest('hex');
}

// 32-byte identity secret — never leaves the machine, never put on-chain.
function newSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// Ed25519 keypair used to sign completion proofs.
function newKeypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  return {
    publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  };
}

// One-way nullifier: deterministic for a given (secret, bounty). Proving the
// same bounty twice with the same identity yields the SAME nullifier, so the
// second claim collides and is rejected — without revealing the secret.
function nullifier(secretHex, bounty) {
  return sha256(DOMAIN + ':NUL', Buffer.from(secretHex, 'hex'), bounty);
}

// Hiding commitment that binds a solution to a bounty under your secret.
function commitment(secretHex, bounty, solutionHashHex) {
  return sha256(DOMAIN + ':COM', bounty, Buffer.from(solutionHashHex, 'hex'), Buffer.from(secretHex, 'hex'));
}

// Public identity commitment (safe to share) — does not reveal the secret.
function identityCommitment(publicKeyPem) {
  return sha256(DOMAIN + ':ID', publicKeyPem);
}

function hashFile(path) {
  return sha256(fs.readFileSync(path));
}

function sign(privateKeyPem, message) {
  const key = crypto.createPrivateKey(privateKeyPem);
  return crypto.sign(null, Buffer.from(message), key).toString('base64');
}

function verifySig(publicKeyPem, message, signatureB64) {
  try {
    const key = crypto.createPublicKey(publicKeyPem);
    return crypto.verify(null, Buffer.from(message), key, Buffer.from(signatureB64, 'base64'));
  } catch (_) {
    return false;
  }
}

module.exports = {
  DOMAIN, sha256, newSecret, newKeypair, nullifier, commitment,
  identityCommitment, hashFile, sign, verifySig,
};
