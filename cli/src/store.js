'use strict';
// Local state for the tasknull CLI. Lives in ~/.tasknull (override with the
// TASKNULL_HOME env var). Holds the identity (secret + keys) and the set of
// spent nullifiers used to demonstrate double-claim prevention locally.
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOME = process.env.TASKNULL_HOME || path.join(os.homedir(), '.tasknull');
const IDENTITY = path.join(HOME, 'identity.json');
const SPENT = path.join(HOME, 'spent.json');

function ensure() {
  fs.mkdirSync(HOME, { recursive: true });
}

function hasIdentity() {
  return fs.existsSync(IDENTITY);
}

function loadIdentity() {
  if (!hasIdentity()) {
    const e = new Error('no identity found — run `tasknull init` first');
    e.user = true;
    throw e;
  }
  return JSON.parse(fs.readFileSync(IDENTITY, 'utf8'));
}

function saveIdentity(obj) {
  ensure();
  fs.writeFileSync(IDENTITY, JSON.stringify(obj, null, 2), { mode: 0o600 });
}

function loadSpent() {
  if (!fs.existsSync(SPENT)) return {};
  try {
    return JSON.parse(fs.readFileSync(SPENT, 'utf8'));
  } catch (_) {
    return {};
  }
}

function isSpent(nul) {
  return Boolean(loadSpent()[nul]);
}

function markSpent(nul, meta) {
  ensure();
  const s = loadSpent();
  s[nul] = meta || { at: new Date().toISOString() };
  fs.writeFileSync(SPENT, JSON.stringify(s, null, 2));
}

module.exports = {
  HOME, IDENTITY, SPENT,
  ensure, hasIdentity, loadIdentity, saveIdentity, loadSpent, isSpent, markSpent,
};
